// ============================================
// GLOBAL STATE
// ============================================
var userData = {
    name: 'User',
    budget: 1000,
    risk: 'medium',
    tradingBudget: 300,
    tradingPercent: 30
};

var currentTab = 'welcome';

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Crypto Copilot...');
    loadUserData();
    updateTradingBudgetPreview();
    console.log('Ready!');
});

// ============================================
// TAB SWITCHING
// ============================================
function switchTab(tabName) {
    console.log('Switching to:', tabName);
    
    if (currentTab === tabName) return;
    
    // Hide all tabs
    var allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(function(tab) {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    var allButtons = document.querySelectorAll('.nav-tab');
    allButtons.forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    var selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Activate button
    var selectedButton = document.querySelector('.nav-tab[data-tab="' + tabName + '"]');
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    currentTab = tabName;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// SAVE PROFILE
// ============================================
function saveProfile() {
    console.log('Saving profile...');
    
    var nameInput = document.getElementById('user-name-input');
    var budgetInput = document.getElementById('budget-input');
    var riskInput = document.getElementById('risk-input');
    
    if (!nameInput.value.trim()) {
        showNotification('Please enter your name', 'error');
        return;
    }
    
    if (budgetInput.value <= 0) {
        showNotification('Please enter a valid budget', 'error');
        return;
    }
    
    userData.name = nameInput.value.trim();
    userData.budget = parseFloat(budgetInput.value);
    userData.risk = riskInput.value;
    
    localStorage.setItem('cryptoCopilotUser', JSON.stringify(userData));
    
    document.getElementById('user-name').textContent = userData.name;
    document.getElementById('total-budget').textContent = '$' + userData.budget.toLocaleString();
    document.getElementById('risk-level').textContent = userData.risk.charAt(0).toUpperCase() + userData.risk.slice(1);
    
    showNotification('Profile saved successfully! ✓', 'success');
}

// ============================================
// LOAD USER DATA
// ============================================
function loadUserData() {
    var saved = localStorage.getItem('cryptoCopilotUser');
    if (saved) {
        userData = JSON.parse(saved);
        
        if (document.getElementById('user-name')) {
            document.getElementById('user-name').textContent = userData.name;
        }
        if (document.getElementById('user-name-input')) {
            document.getElementById('user-name-input').value = userData.name;
        }
        if (document.getElementById('budget-input')) {
            document.getElementById('budget-input').value = userData.budget;
        }
        if (document.getElementById('risk-input')) {
            document.getElementById('risk-input').value = userData.risk;
        }
        if (document.getElementById('total-budget')) {
            document.getElementById('total-budget').textContent = '$' + userData.budget.toLocaleString();
        }
        if (document.getElementById('risk-level')) {
            document.getElementById('risk-level').textContent = userData.risk.charAt(0).toUpperCase() + userData.risk.slice(1);
        }
        if (document.getElementById('total-budget-input')) {
            document.getElementById('total-budget-input').value = userData.budget;
        }
        if (document.getElementById('trading-percent-input')) {
            document.getElementById('trading-percent-input').value = userData.tradingPercent || 30;
        }
    }
}

// ============================================
// SENTIMENT ANALYSIS
// ============================================
function runSentimentAnalysis() {
    console.log('Running sentiment analysis...');
    
    var button = document.getElementById('sentiment-btn');
    var loadingDiv = document.getElementById('sentiment-loading');
    var resultsDiv = document.getElementById('sentiment-results');
    
    button.disabled = true;
    button.textContent = '⏳ Analyzing...';
    
    resultsDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');
    
    setTimeout(function() {
        var demoData = {
            overall_sentiment: 68,
            summary: 'Market showing positive momentum with increased institutional interest. Bitcoin leading the rally with strong technical indicators.',
            assets: {
                BTC: {
                    sentiment: 'bullish',
                    score: 78,
                    headlines: [
                        'Major institution announces $500M Bitcoin allocation',
                        'Network hash rate reaches new all-time high',
                        'Positive regulatory developments in European Union'
                    ]
                },
                ETH: {
                    sentiment: 'neutral',
                    score: 52,
                    headlines: [
                        'ETH staking yields remain stable at 3.5%',
                        'Layer 2 solutions see 40% increase in adoption',
                        'Developers preview Dencun upgrade features'
                    ]
                },
                SOL: {
                    sentiment: 'bullish',
                    score: 71,
                    headlines: [
                        'Network uptime reaches 99.9% milestone for Q4',
                        'DeFi TVL grows 25% month-over-month to $2.1B',
                        'Major DEX announces native Solana integration'
                    ]
                }
            }
        };
        
        displaySentimentResults(demoData);
        
        loadingDiv.classList.add('hidden');
        resultsDiv.classList.remove('hidden');
        
        button.disabled = false;
        button.textContent = '🔄 Refresh Analysis';
    }, 2500);
}

function displaySentimentResults(data) {
    var percentage = data.overall_sentiment || 65;
    document.getElementById('sentiment-percentage').textContent = percentage + '%';
    document.getElementById('sentiment-summary').textContent = data.summary;
    
    var meter = document.getElementById('sentiment-meter-fill');
    meter.style.width = percentage + '%';
    
    if (percentage >= 60) {
        meter.style.backgroundColor = '#4caf50';
    } else if (percentage >= 40) {
        meter.style.backgroundColor = '#ff9800';
    } else {
        meter.style.backgroundColor = '#f44336';
    }
    
    if (data.assets) {
        updateAsset('btc', data.assets.BTC);
        updateAsset('eth', data.assets.ETH);
        updateAsset('sol', data.assets.SOL);
    }
}

function updateAsset(asset, data) {
    var badge = document.getElementById(asset + '-badge');
    if (badge) {
        badge.textContent = data.sentiment.toUpperCase();
        badge.className = 'sentiment-badge ' + data.sentiment;
    }
    
    var scoreText = document.getElementById(asset + '-score');
    if (scoreText) {
        animateNumber(scoreText, 0, data.score, 1500);
    }
    
    var circle = document.getElementById(asset + '-circle');
    if (circle) {
        var circumference = 282.6;
        var offset = circumference - (circumference * data.score / 100);
        circle.style.strokeDashoffset = offset;
        
        if (data.score >= 65) {
            circle.style.stroke = '#4caf50';
        } else if (data.score >= 35) {
            circle.style.stroke = '#ff9800';
        } else {
            circle.style.stroke = '#f44336';
        }
    }
    
    var headlinesList = document.getElementById(asset + '-headlines');
    if (headlinesList && data.headlines) {
        headlinesList.innerHTML = '';
        data.headlines.forEach(function(headline) {
            var li = document.createElement('li');
            li.textContent = headline;
            headlinesList.appendChild(li);
        });
    }
}

// ============================================
// BUDGET PREVIEW
// ============================================
function updateTradingBudgetPreview() {
    var totalBudget = parseFloat(document.getElementById('total-budget-input').value) || 0;
    var tradingPercent = parseFloat(document.getElementById('trading-percent-input').value) || 0;
    
    var tradingBudget = totalBudget * (tradingPercent / 100);
    var savingsBudget = totalBudget - tradingBudget;
    
    document.getElementById('trading-percent-display').textContent = tradingPercent;
    
    var slider = document.getElementById('trading-percent-input');
    var gradient = 'linear-gradient(to right, #2962ff 0%, #2962ff ' + tradingPercent + '%, #1e2530 ' + tradingPercent + '%, #1e2530 100%)';
    slider.style.background = gradient;
    
    document.getElementById('preview-total').textContent = '$' + totalBudget.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('preview-trading').textContent = '$' + tradingBudget.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('preview-savings').textContent = '$' + savingsBudget.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// ============================================
// CALCULATE TRADING BUDGET
// ============================================
function calculateTradingBudget() {
    console.log('Calculating budget...');
    
    var totalBudget = parseFloat(document.getElementById('total-budget-input').value) || 0;
    var tradingPercent = parseFloat(document.getElementById('trading-percent-input').value) || 0;
    
    if (totalBudget <= 0) {
        showNotification('Please enter a valid budget', 'error');
        return;
    }
    
    var tradingBudget = totalBudget * (tradingPercent / 100);
    var savingsBudget = totalBudget - tradingBudget;
    
    userData.budget = totalBudget;
    userData.tradingBudget = tradingBudget;
    userData.tradingPercent = tradingPercent;
    localStorage.setItem('cryptoCopilotUser', JSON.stringify(userData));
    
    var button = document.getElementById('budget-btn');
    var loadingDiv = document.getElementById('budget-loading');
    var resultsDiv = document.getElementById('budget-results');
    
    button.disabled = true;
    button.textContent = '⏳ Calculating...';
    
    resultsDiv.classList.add('hidden');
    loadingDiv.classList.remove('hidden');
    
    setTimeout(function() {
        displayBudgetResults(totalBudget, tradingBudget, savingsBudget, tradingPercent);
        
        loadingDiv.classList.add('hidden');
        resultsDiv.classList.remove('hidden');
        
        button.disabled = false;
        button.textContent = '🔄 Recalculate Budget';
    }, 2500);
}

function displayBudgetResults(totalBudget, tradingBudget, savingsBudget, tradingPercent) {
    animateNumber(document.getElementById('result-total-budget'), 0, totalBudget, 1000, '$');
    animateNumber(document.getElementById('result-trading-budget'), 0, tradingBudget, 1000, '$');
    animateNumber(document.getElementById('result-savings-budget'), 0, savingsBudget, 1000, '$');
    
    document.getElementById('result-trading-percent').textContent = tradingPercent + '%';
    document.getElementById('result-savings-percent').textContent = (100 - tradingPercent) + '%';
    
    var spotPercent = 60;
    var lowLevPercent = 25;
    var highLevPercent = 5;
    var reservePercent = 10;
    
    if (userData.risk === 'low') {
        spotPercent = 70;
        lowLevPercent = 15;
        highLevPercent = 5;
    } else if (userData.risk === 'high') {
        spotPercent = 50;
        lowLevPercent = 30;
        highLevPercent = 10;
    }
    
    var spotAmount = tradingBudget * (spotPercent / 100);
    var lowLevAmount = tradingBudget * (lowLevPercent / 100);
    var highLevAmount = tradingBudget * (highLevPercent / 100);
    var reserveAmount = tradingBudget * (reservePercent / 100);
    
    setTimeout(function() {
        animateNumber(document.getElementById('spot-amount'), 0, spotAmount, 1500, '$');
        document.getElementById('spot-percentage').textContent = spotPercent + '%';
        animateNumber(document.getElementById('spot-btc'), 0, spotAmount * 0.4, 1000, '$');
        animateNumber(document.getElementById('spot-eth'), 0, spotAmount * 0.4, 1000, '$');
        animateNumber(document.getElementById('spot-sol'), 0, spotAmount * 0.2, 1000, '$');
    }, 500);
    
    setTimeout(function() {
        animateNumber(document.getElementById('low-leverage-amount'), 0, lowLevAmount, 1500, '$');
        document.getElementById('low-leverage-percentage').textContent = lowLevPercent + '%';
        animateNumber(document.getElementById('low-lev-max-position'), 0, lowLevAmount * 5, 1000, '$');
    }, 800);
    
    setTimeout(function() {
        animateNumber(document.getElementById('high-leverage-amount'), 0, highLevAmount, 1500, '$');
        document.getElementById('high-leverage-percentage').textContent = highLevPercent + '%';
        animateNumber(document.getElementById('high-lev-max-position'), 0, highLevAmount * 10, 1000, '$');
    }, 1100);
    
    setTimeout(function() {
        animateNumber(document.getElementById('reserve-amount'), 0, reserveAmount, 1500, '$');
        document.getElementById('reserve-percentage').textContent = reservePercent + '%';
    }, 1400);
}

// ============================================
// UTILITIES
// ============================================
function animateNumber(element, start, end, duration, prefix) {
    if (!element) return;
    prefix = prefix || '';
    
    var range = end - start;
    var increment = range / (duration / 16);
    var current = start;
    
    var timer = setInterval(function() {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = prefix + Math.round(current).toLocaleString();
    }, 16);
}

function showNotification(message, type) {
    var notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 1rem 1.5rem; background-color: ' + (type === 'success' ? '#1b5e20' : '#b71c1c') + '; color: white; border-radius: 8px; z-index: 1000; animation: slideIn 0.3s ease;';
    
    var style = document.createElement('style');
    style.textContent = '@keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }';
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(function() {
        notification.style.animation = 'slideOut 0.3s ease';
        style.textContent += '@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }';
        setTimeout(function() {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ============================================
// EXPOSE TO WINDOW
// ============================================
window.switchTab = switchTab;
window.saveProfile = saveProfile;
window.runSentimentAnalysis = runSentimentAnalysis;
window.updateTradingBudgetPreview = updateTradingBudgetPreview;
window.calculateTradingBudget = calculateTradingBudget;

console.log('App loaded!');
