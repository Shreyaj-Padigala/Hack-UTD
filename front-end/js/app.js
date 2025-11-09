/**
 * Main Application Logic
 */

// Application State
const AppState = {
    scenarios: [],
    selectedScenarios: [],
    currentTab: 'overview',
};

// DOM Elements
const elements = {
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

// Initialize the application
function init() {
    setupEventListeners();
    updateUI();
}

// Setup all event listeners
function setupEventListeners() {
    // Show/hide scenario creator
    elements.newScenarioBtn.addEventListener('click', showCreator);
    elements.emptyCreateBtn.addEventListener('click', showCreator);
    elements.closeCreatorBtn.addEventListener('click', hideCreator);
    elements.cancelFormBtn.addEventListener('click', hideCreator);

    // Form submission
    elements.scenarioForm.addEventListener('submit', handleFormSubmit);

    // Add assumption
    elements.addAssumptionBtn.addEventListener('click', addAssumptionInput);

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Selection actions
    elements.compareSelectedBtn.addEventListener('click', () => switchTab('compare'));
    elements.clearSelectionBtn.addEventListener('click', clearSelection);

    // Delegate checkbox clicks
    elements.scenariosGrid.addEventListener('click', (e) => {
        const checkbox = e.target.closest('.custom-checkbox');
        if (checkbox) {
            const scenarioId = checkbox.dataset.scenarioId;
            toggleScenarioSelection(scenarioId);
        }
    });
}

// Show scenario creator
function showCreator() {
    elements.scenarioCreator.classList.remove('hidden');
    elements.scenarioCreator.scrollIntoView({ behavior: 'smooth' });
}

// Hide scenario creator
function hideCreator() {
    elements.scenarioCreator.classList.add('hidden');
    elements.scenarioForm.reset();
    // Reset assumptions to just one input
    elements.assumptionsContainer.innerHTML = `
        <div class="assumption-input flex gap-2">
            <input type="text" class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent"
                   placeholder="e.g., Users will adopt new feature within 30 days">
        </div>
    `;
}

// Add assumption input field
function addAssumptionInput() {
    const newInput = document.createElement('div');
    newInput.className = 'assumption-input flex gap-2';
    newInput.innerHTML = `
        <input type="text" class="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent"
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
    const assumptionInputs = elements.assumptionsContainer.querySelectorAll('input');
    assumptionInputs.forEach(input => {
        if (input.value.trim()) {
            formData.assumptions.push(input.value.trim());
        }
    });

    // Show loading
    elements.loadingOverlay.classList.remove('hidden');

    try {
        // Call API to analyze scenario
        const scenario = await API.analyzeScenario(formData);
        
        // Add to state
        AppState.scenarios.unshift(scenario);
        
        // Hide creator and loading
        hideCreator();
        elements.loadingOverlay.classList.add('hidden');
        
        // Update UI
        updateUI();
        
        // Show success message
        UI.showToast('Scenario created and analyzed successfully!', 'success');
    } catch (error) {
        elements.loadingOverlay.classList.add('hidden');
        UI.showToast('Error creating scenario', 'error');
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
    elements.emptyState.classList.toggle('hidden', hasScenarios);
    elements.tabsNavigation.classList.toggle('hidden', !hasScenarios);
    
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
    elements.scenariosGrid.innerHTML = AppState.scenarios
        .map(scenario => UI.renderScenarioCard(
            scenario, 
            AppState.selectedScenarios.includes(scenario.id)
        ))
        .join('');
}

// Update selection UI
function updateSelectionUI() {
    const count = AppState.selectedScenarios.length;
    
    // Update selection banner
    elements.selectionBanner.classList.toggle('hidden', count === 0);
    elements.selectionCount.textContent = count;
    
    // Show/hide compare button
    elements.compareSelectedBtn.classList.toggle('hidden', count < 2);
    
    // Update compare tab count
    elements.compareCount.textContent = count;
    
    // Enable/disable compare tab
    elements.compareTab.disabled = count < 2;
    if (count < 2) {
        elements.compareTab.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        elements.compareTab.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

// Render comparison view
function renderComparisonView() {
    const selectedScenarioObjects = AppState.scenarios.filter(s => 
        AppState.selectedScenarios.includes(s.id)
    );
    
    const compareContent = document.getElementById('compare-content');
    compareContent.innerHTML = UI.renderComparisonView(selectedScenarioObjects);
}

// Render insights view
function renderInsightsView() {
    const insightsContent = document.getElementById('insights-content');
    insightsContent.innerHTML = UI.renderInsightsPanel(AppState.scenarios);
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
