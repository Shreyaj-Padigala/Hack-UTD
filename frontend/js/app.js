/**
 * Main Application Logic
 */

// Backend API URL is defined in api.js (which loads first)
// No need to redeclare it here - it's available globally

// Application State
const AppState = {
    scenarios: [],
    selectedScenarios: [],
    currentTab: 'overview',
};

// DOM Elements - will be initialized in init()
let elements = {};

// Initialize DOM elements
function initializeElements() {
    console.log('🔍 Initializing DOM elements...');
    
    elements = {
        newScenarioBtn: document.getElementById('new-scenario-btn'),
        emptyCreateBtn: document.getElementById('empty-create-btn'),
        scenarioCreator: document.getElementById('scenario-creator'),
        closeCreatorBtn: document.getElementById('close-creator-btn'),
        cancelFormBtn: document.getElementById('cancel-form-btn'),
        scenarioForm: document.getElementById('scenario-form'),
        addAssumptionBtn: document.getElementById('add-assumption-btn'),
        assumptionsContainer: document.getElementById('assumptions-container'),
        emptyState: document.getElementById('empty-state'),
        tabsNavigation: document.getElementById('tabs-navigation'),
        tabContent: document.getElementById('tab-content'),
        scenariosGrid: document.getElementById('scenarios-grid'),
        selectionBanner: document.getElementById('selection-banner'),
        selectionCount: document.getElementById('selection-count'),
        compareSelectedBtn: document.getElementById('compare-selected-btn'),
        clearSelectionBtn: document.getElementById('clear-selection-btn'),
        compareCount: document.getElementById('compare-count'),
        compareTab: document.getElementById('compare-tab'),
        loadingOverlay: document.getElementById('loading-overlay'),
    };
    
    const foundCount = Object.keys(elements).filter(k => elements[k] !== null).length;
    console.log(`✅ DOM elements initialized: ${foundCount}/${Object.keys(elements).length} found`);
    
    // Debug specific buttons
    if (elements.newScenarioBtn) {
        console.log('✅ newScenarioBtn found:', elements.newScenarioBtn);
    } else {
        console.error('❌ newScenarioBtn NOT FOUND in DOM!');
        // Try querySelector as fallback
        const btn = document.querySelector('#new-scenario-btn');
        if (btn) {
            console.log('Found via querySelector:', btn);
            elements.newScenarioBtn = btn;
        }
    }
    
    if (elements.emptyCreateBtn) {
        console.log('✅ emptyCreateBtn found:', elements.emptyCreateBtn);
    } else {
        console.error('❌ emptyCreateBtn NOT FOUND in DOM!');
        const btn = document.querySelector('#empty-create-btn');
        if (btn) {
            console.log('Found via querySelector:', btn);
            elements.emptyCreateBtn = btn;
        }
    }
    
    if (elements.scenarioCreator) {
        console.log('✅ scenarioCreator found:', elements.scenarioCreator);
    } else {
        console.error('❌ scenarioCreator NOT FOUND in DOM!');
    }
}

// Initialize the application
async function init() {
    // Initialize DOM elements first
    initializeElements();
    
    // Always set up event listeners first, regardless of backend status
    setupEventListeners();
    updateUI();
    
    // Check backend status asynchronously (don't block UI)
    checkBackendStatus().catch(err => {
        console.warn('Backend status check failed:', err);
    });
}

// Check backend status and show indicator
async function checkBackendStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            const health = await response.json();
            console.log('Backend health:', health);
            
            // Show status in UI if backend is connected
            if (health.llm_provider && health.llm_provider !== 'mock') {
                showBackendStatus('connected', `Connected to ${health.llm_provider} (${health.llm_model})`);
            } else {
                showBackendStatus('mock', 'Using mock data - Backend not configured');
            }
        }
    } catch (error) {
        console.warn('Backend not reachable:', error);
        showBackendStatus('disconnected', 'Backend not reachable - Using mock data');
    }
}

// Show backend status indicator
function showBackendStatus(status, message) {
    // Remove existing status if any
    const existing = document.getElementById('backend-status');
    if (existing) existing.remove();
    
    const statusEl = document.createElement('div');
    statusEl.id = 'backend-status';
    statusEl.className = `fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg text-sm z-50 ${
        status === 'connected' ? 'bg-green-100 text-green-800 border border-green-300' :
        status === 'mock' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
        'bg-red-100 text-red-800 border border-red-300'
    }`;
    statusEl.innerHTML = `
        <div class="flex items-center gap-2">
            <span>${status === 'connected' ? '✅' : status === 'mock' ? '⚠️' : '❌'}</span>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(statusEl);
    
    // Auto-hide after 5 seconds if connected
    if (status === 'connected') {
        setTimeout(() => {
            if (statusEl.parentNode) {
                statusEl.style.opacity = '0';
                statusEl.style.transition = 'opacity 0.5s';
                setTimeout(() => statusEl.remove(), 500);
            }
        }, 5000);
    }
}

// Setup all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    console.log('newScenarioBtn:', elements.newScenarioBtn);
    console.log('emptyCreateBtn:', elements.emptyCreateBtn);
    console.log('scenarioCreator:', elements.scenarioCreator);
    
    // Show/hide scenario creator
    if (elements.newScenarioBtn) {
        elements.newScenarioBtn.addEventListener('click', showCreator);
        console.log('✅ Added click listener to newScenarioBtn');
    } else {
        console.error('❌ newScenarioBtn not found!');
    }
    
    if (elements.emptyCreateBtn) {
        elements.emptyCreateBtn.addEventListener('click', showCreator);
        console.log('✅ Added click listener to emptyCreateBtn');
    } else {
        console.error('❌ emptyCreateBtn not found!');
    }
    if (elements.closeCreatorBtn) {
        elements.closeCreatorBtn.addEventListener('click', hideCreator);
    }
    if (elements.cancelFormBtn) {
        elements.cancelFormBtn.addEventListener('click', hideCreator);
    }

    // Form submission
    if (elements.scenarioForm) {
        elements.scenarioForm.addEventListener('submit', handleFormSubmit);
    }

    // Add assumption
    if (elements.addAssumptionBtn) {
        elements.addAssumptionBtn.addEventListener('click', addAssumptionInput);
    }

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(btn.dataset.tab);
        });
    });

    // Selection actions
    if (elements.compareSelectedBtn) {
        elements.compareSelectedBtn.addEventListener('click', () => switchTab('compare'));
    }
    if (elements.clearSelectionBtn) {
        elements.clearSelectionBtn.addEventListener('click', clearSelection);
    }

    // Delegate checkbox clicks
    if (elements.scenariosGrid) {
        elements.scenariosGrid.addEventListener('click', (e) => {
            const checkbox = e.target.closest('.custom-checkbox');
            if (checkbox) {
                const scenarioId = checkbox.dataset.scenarioId;
                toggleScenarioSelection(scenarioId);
            }
        });
    }
}

// Expose function globally IMMEDIATELY (before it's defined)
window.showCreatorForm = null; // Will be set below

// Show scenario creator
function showCreator(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    console.log('🎯 showCreator called');
    console.log('Event:', e);
    
    // Always search for the form element fresh (don't rely on cache)
    let form = document.getElementById('scenario-creator');
    
    if (!form) {
        console.log('⚠️ Not found by ID, trying querySelector...');
        form = document.querySelector('#scenario-creator');
    }
    
    if (!form) {
        console.error('❌ scenarioCreator element not found in DOM!');
        console.log('Available elements with "scenario" in ID:', 
            Array.from(document.querySelectorAll('[id*="scenario"]')).map(el => el.id));
        alert('Error: Could not find the scenario form. Please refresh the page.');
        return;
    }
    
    console.log('✅ Found form element:', form);
    console.log('Form classes before:', form.className);
    console.log('Form style.display before:', form.style.display);
    console.log('Form computed display:', window.getComputedStyle(form).display);
    
    // Remove hidden class
    form.classList.remove('hidden');
    
    // Force display styles
    form.style.display = 'block';
    form.style.visibility = 'visible';
    form.style.opacity = '1';
    
    // Update cache
    elements.scenarioCreator = form;
    
    console.log('Form classes after:', form.className);
    console.log('Form style.display after:', form.style.display);
    console.log('Form computed display after:', window.getComputedStyle(form).display);
    
    // Scroll to form after a brief delay to ensure it's visible
    setTimeout(() => {
        try {
            form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            console.log('✅ Scrolled to form');
        } catch (err) {
            console.warn('Scroll failed:', err);
        }
        
        // Double-check visibility
        const computed = window.getComputedStyle(form);
        console.log('Final computed styles:', {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity
        });
        
        if (computed.display === 'none' || computed.visibility === 'hidden') {
            console.error('⚠️ Form still hidden! Forcing visibility...');
            form.style.setProperty('display', 'block', 'important');
            form.style.setProperty('visibility', 'visible', 'important');
        }
    }, 100);
    
    console.log('✅ Form should now be visible');
}

// Expose function globally for inline onclick handlers
window.showCreatorForm = showCreator;

// Also expose it immediately when script loads
(function() {
    'use strict';
    window.showCreatorForm = function(e) {
        console.log('🎯 showCreatorForm called (global)');
        // Find form element
        let form = document.getElementById('scenario-creator');
        if (!form) {
            form = document.querySelector('#scenario-creator');
        }
        if (form) {
            console.log('✅ Found form, showing it');
            form.classList.remove('hidden');
            form.style.display = 'block';
            form.style.visibility = 'visible';
            form.style.opacity = '1';
            setTimeout(() => {
                form.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            console.error('Form not found!');
        }
    };
    console.log('✅ showCreatorForm exposed to window');
})();

// Hide scenario creator
function hideCreator() {
    if (elements.scenarioCreator) {
        elements.scenarioCreator.classList.add('hidden');
    }
    if (elements.scenarioForm) {
        elements.scenarioForm.reset();
    }
    // Reset assumptions to just one input
    if (elements.assumptionsContainer) {
        elements.assumptionsContainer.innerHTML = `
            <div class="assumption-input flex gap-2">
                <input type="text" class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent text-slate-900 bg-white"
                       placeholder="e.g., Users will adopt new feature within 30 days">
            </div>
        `;
    }
}

// Add assumption input field
function addAssumptionInput() {
    const newInput = document.createElement('div');
    newInput.className = 'assumption-input flex gap-2';
    newInput.innerHTML = `
        <input type="text" class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent text-slate-900 bg-white"
               placeholder="e.g., Users will adopt new feature within 30 days">
        <button type="button" class="remove-assumption px-3 text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    
    // Add remove listener
    newInput.querySelector('.remove-assumption').addEventListener('click', function() {
        newInput.remove();
    });
    
    elements.assumptionsContainer.appendChild(newInput);
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Gather form data
    const formData = {
        name: document.getElementById('scenario-name').value,
        description: document.getElementById('description').value,
        targetMarket: document.getElementById('target-market').value,
        timeline: document.getElementById('timeline').value,
        resources: document.getElementById('resources').value,
        assumptions: []
    };

    // Gather assumptions
    if (elements.assumptionsContainer) {
        const assumptionInputs = elements.assumptionsContainer.querySelectorAll('input');
        assumptionInputs.forEach(input => {
            if (input.value.trim()) {
                formData.assumptions.push(input.value.trim());
            }
        });
    }

    // Show loading
    if (elements.loadingOverlay) {
        elements.loadingOverlay.classList.remove('hidden');
    }

    try {
        // Call API to analyze scenario
        const scenario = await API.analyzeScenario(formData);
        
        // Add to state
        AppState.scenarios.unshift(scenario);
        
        // Hide creator and loading
        hideCreator();
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('hidden');
        }
        
        // Update UI
        updateUI();
        
        // Show success message
        if (UI && UI.showToast) {
            UI.showToast('Scenario created and analyzed successfully!', 'success');
        }
    } catch (error) {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.add('hidden');
        }
        if (UI && UI.showToast) {
            UI.showToast('Error creating scenario', 'error');
        }
        console.error('Error:', error);
    }
}

// Toggle scenario selection
function toggleScenarioSelection(scenarioId) {
    const index = AppState.selectedScenarios.indexOf(scenarioId);
    if (index > -1) {
        AppState.selectedScenarios.splice(index, 1);
    } else {
        AppState.selectedScenarios.push(scenarioId);
    }
    updateUI();
}

// Clear selection
function clearSelection() {
    AppState.selectedScenarios = [];
    updateUI();
}

// Switch tabs
function switchTab(tabName) {
    AppState.currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
    });
    
    const activeContent = document.getElementById(`${tabName}-content`);
    if (activeContent) {
        activeContent.classList.remove('hidden');
        activeContent.classList.add('active');
    }
    
    // Render appropriate content
    if (tabName === 'compare') {
        renderComparisonView();
    } else if (tabName === 'insights') {
        renderInsightsView();
    }
}

// Update the entire UI
function updateUI() {
    const hasScenarios = AppState.scenarios.length > 0;
    
    // Show/hide empty state
    if (elements.emptyState) {
        elements.emptyState.classList.toggle('hidden', hasScenarios);
    }
    if (elements.tabsNavigation) {
        elements.tabsNavigation.classList.toggle('hidden', !hasScenarios);
    }
    
    if (hasScenarios) {
        // Render scenarios
        renderScenarios();
        
        // Update selection UI
        updateSelectionUI();
        
        // Update current tab content
        if (AppState.currentTab === 'compare') {
            renderComparisonView();
        } else if (AppState.currentTab === 'insights') {
            renderInsightsView();
        }
    }
}

// Render scenarios grid
function renderScenarios() {
    if (elements.scenariosGrid) {
        elements.scenariosGrid.innerHTML = AppState.scenarios
            .map(scenario => UI.renderScenarioCard(
                scenario, 
                AppState.selectedScenarios.includes(scenario.id)
            ))
            .join('');
    }
}

// Update selection UI
function updateSelectionUI() {
    const count = AppState.selectedScenarios.length;
    
    // Update selection banner
    if (elements.selectionBanner) {
        elements.selectionBanner.classList.toggle('hidden', count === 0);
    }
    if (elements.selectionCount) {
        elements.selectionCount.textContent = count;
    }
    
    // Show/hide compare button
    if (elements.compareSelectedBtn) {
        elements.compareSelectedBtn.classList.toggle('hidden', count < 2);
    }
    
    // Update compare tab count
    if (elements.compareCount) {
        elements.compareCount.textContent = count;
    }
    
    // Enable/disable compare tab
    if (elements.compareTab) {
        elements.compareTab.disabled = count < 2;
        if (count < 2) {
            elements.compareTab.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            elements.compareTab.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

// Render comparison view
function renderComparisonView() {
    const selectedScenarioObjects = AppState.scenarios.filter(s => 
        AppState.selectedScenarios.includes(s.id)
    );
    
    const compareContent = document.getElementById('compare-content');
    if (compareContent) {
        compareContent.innerHTML = UI.renderComparisonView(selectedScenarioObjects);
    }
}

// Render insights view
function renderInsightsView() {
    const insightsContent = document.getElementById('insights-content');
    if (insightsContent) {
        insightsContent.innerHTML = UI.renderInsightsPanel(AppState.scenarios);
    }
}

// Start the application when DOM is ready
function startApp() {
    console.log('🚀 Starting app initialization...');
    console.log('Document ready state:', document.readyState);
    
    // Wait a tiny bit to ensure all scripts are loaded
    setTimeout(() => {
        try {
            init();
        } catch (error) {
            console.error('❌ Error during initialization:', error);
        }
    }, 100);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

// Also try event delegation as a fallback
document.addEventListener('click', function(e) {
    // Check if clicked element is one of our buttons
    const target = e.target.closest('#new-scenario-btn, #empty-create-btn');
    if (target) {
        console.log('Button clicked via event delegation:', target.id);
        e.preventDefault();
        e.stopPropagation();
        showCreator(e);
    }
});