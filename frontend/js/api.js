/**
 * API Client for backend communication
 */

// Define API_BASE_URL - this is the single source of truth
// Since api.js loads before app.js, this will be available
var API_BASE_URL = 'http://localhost:8000'; // FastAPI default port

// Test backend connection
async function testBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (response.ok) {
      console.log('✅ Backend is connected and running');
      const config = await fetch(`${API_BASE_URL}/config`).then(r => r.json());
      console.log('Backend config:', config);
      return true;
    }
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    console.error('Make sure the backend is running on port 8000');
    return false;
  }
}

// Test on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    testBackendConnection();
  });
}

// Helpers
function pct(n, fallback = 70) {
  const x = Number.isFinite(n) ? n : fallback;
  return Math.max(0, Math.min(100, Math.round(x)));
}

function buildScenarioText(d) {
  const parts = [
    `${d.name}: ${d.description}`,
    `Target market: ${d.targetMarket}`,
    `Timeline: ${d.timeline}`,
  ];
  if (d.resources) parts.push(`Resources: ${d.resources}`);
  if (Array.isArray(d.assumptions) && d.assumptions.length)
    parts.push(`Assumptions: ${d.assumptions.join('; ')}`);
  return parts.join('. ') + '.';
}

const API = {
  /**
   * Analyze a new scenario (calls FastAPI /simulate which calls Groq)
   */
  async analyzeScenario(scenarioData) {
    try {
      console.log('🚀 Sending scenario to backend:', scenarioData.name);
      
      const requestBody = {
        scenario: buildScenarioText(scenarioData),
        context: null,
      };

      console.log('📤 Request payload:', requestBody);

      const response = await fetch(`${API_BASE_URL}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        // Print the server text so we can see the actual backend error
        const text = await response.text();
        console.error('❌ API error body:', text);
        let errorDetail = text;
        try {
          const errorJson = JSON.parse(text);
          errorDetail = errorJson.detail || errorJson.error || text;
        } catch (e) {
          // Not JSON, use as-is
        }
        throw new Error(`Backend error (${response.status}): ${errorDetail}`);
      }

      const result = await response.json();
      console.log('✅ Received AI analysis from backend:', result);
      // Expected result shape from backend LLM:
      // {
      //   classification, scores:{risk, customer, competitive, cost, overall},
      //   reasons:{risk, customer, competitive, cost},
      //   impacts:{risk, customer, competitive, cost},
      //   top_risks: [{title, mitigation}], opportunities:[...],
      //   recommendation:{decision, rationale, next_actions, ...}
      // }

      const scores = result?.scores || {};
      const reasons = result?.reasons || {};
      const impacts = result?.impacts || {};
      const rec = result?.recommendation || {};
      const topRisks = Array.isArray(result?.top_risks) ? result.top_risks : [];
      const opps = Array.isArray(result?.opportunities) ? result.opportunities : [];

      // Map to UI model
      const feasibility = pct(scores.overall, 70);
      // Simple impact heuristic using customer + competitive signal
      const impact = pct((scores.customer ?? 0) + (scores.competitive ?? 0) + 50, 75);

      // Build readable risks/opportunities lists
      const riskList = [
        impacts.risk,
        impacts.customer,
        impacts.competitive,
        impacts.cost,
        ...topRisks.map(r => `${r.title} — Mitigation: ${r.mitigation}`),
      ].filter(Boolean);

      const oppList = [
        ...opps,
        // Add positive takes if present in impacts/reasons
        ...(reasons.competitive && /advantage|position|differentiation/i.test(reasons.competitive) ? [reasons.competitive] : []),
        ...(reasons.customer && /growth|upsell|benefit|retention/i.test(reasons.customer) ? [reasons.customer] : []),
      ].filter(Boolean).slice(0, 6);

      return {
        id: Date.now().toString(),
        name: scenarioData.name,
        description: scenarioData.description,
        targetMarket: scenarioData.targetMarket,
        timeline: scenarioData.timeline,
        resources: scenarioData.resources,
        assumptions: scenarioData.assumptions,
        createdAt: new Date().toISOString(),
        aiAnalysis: {
          feasibility,
          impact,
          risks: riskList,
          opportunities: oppList,
          recommendation: rec.rationale || '',
          keyMetrics: [
            {
              label: 'Feasibility Score',
              value: `${feasibility}%`,
              trend: feasibility >= 70 ? 'up' : feasibility >= 50 ? 'neutral' : 'down',
            },
            {
              label: 'Time to Market',
              value: scenarioData.timeline,
              trend: 'neutral',
            },
            {
              label: 'Risk Level',
              value: `${pct(scores.risk, 50)}%`,
              trend: (scores.risk ?? 50) > 70 ? 'down' : (scores.risk ?? 50) > 50 ? 'neutral' : 'up',
            },
            {
              label: 'Customer Impact',
              value: `${(scores.customer ?? 0) > 0 ? '+' : ''}${pct(scores.customer ?? 0, 0)}%`,
              trend: (scores.customer ?? 0) > 0 ? 'up' : (scores.customer ?? 0) < 0 ? 'down' : 'neutral',
            },
          ],

          // Expose full AI details so the UI can show “why”
          aiReasons: reasons,
          aiRecommendationFull: rec,
          aiRaw: result,
        },
      };
    } catch (error) {
      console.error('❌ Error analyzing scenario:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Show user-friendly error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.warn('⚠️ Backend not reachable. Using mock data. Make sure backend is running on port 8000.');
      }
      
      return this.getMockAnalysis(scenarioData);
    }
  },

  /** (Optional) These endpoints need backend routes if you want them */
  async getScenarios() {
    try {
      const response = await fetch(`${API_BASE_URL}/scenarios`);
      if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      return [];
    }
  },

  async deleteScenario(scenarioId) {
    try {
      const response = await fetch(`${API_BASE_URL}/scenarios/${scenarioId}`, { method: 'DELETE' });
      return response.ok;
    } catch (error) {
      console.error('Error deleting scenario:', error);
      return false;
    }
  },

  // Mock fallback
  getMockAnalysis(scenarioData) {
    const feasibility = Math.floor(Math.random() * 30) + 70;
    const impact = Math.floor(Math.random() * 30) + 70;
    return {
      id: Date.now().toString(),
      ...scenarioData,
      createdAt: new Date().toISOString(),
      aiAnalysis: {
        feasibility,
        impact,
        risks: [
          'Market adoption may be slower than anticipated',
          'Resource allocation conflicts with existing priorities',
          'Technical dependencies on third-party vendors',
          'Competitive response could accelerate timeline pressures',
        ],
        opportunities: [
          'First-mover advantage in emerging market segment',
          'Potential for strategic partnerships with key players',
          'Strong alignment with long-term company vision',
          'Opportunity to establish industry standards',
        ],
        recommendation:
          feasibility > 80 && impact > 80
            ? 'High priority - Recommend immediate execution with full resource allocation'
            : feasibility > 70
            ? 'Medium priority - Validate assumptions with user research before proceeding'
            : 'Low priority - Consider alternative approaches or defer until resources available',
        keyMetrics: [
          { label: 'Est. User Impact', value: `${Math.floor(Math.random() * 500 + 100)}K users`, trend: 'up' },
          { label: 'Time to Market', value: scenarioData.timeline, trend: 'neutral' },
          { label: 'Resource Efficiency', value: `${Math.floor(Math.random() * 30) + 70}%`, trend: 'up' },
          { label: 'Market Fit Score', value: `${Math.floor(Math.random() * 20) + 75}/100`, trend: 'up' },
        ],
      },
    };
  },
};

// Export for tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}
