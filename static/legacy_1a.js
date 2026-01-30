// KoboWeb JavaScript - Legacy Version for S40/Old Browsers
// Using only ES3 features for maximum compatibility

// POLYFILLS are now loaded from polyfills.js
// This file contains the main logic adapted for legacy browsers

if(window.legacyErrors && window.legacyErrors.push) window.legacyErrors.push("INFO: Legacy script start");

// Modal System
var Modal = {
    overlay: null,
    content: null,
    buttons: null,
    currentCallback: null,
    
    init: function() {
        this.overlay = document.getElementById('modalOverlay');
        this.content = document.getElementById('modalContent');
        this.buttons = document.getElementById('modalButtons');
    },
    
    show: function(modalId, buttonsConfig, isDanger) {
        if (!this.overlay) {
            this.init();
        }
        
        // If modalId is provided, show that modal instead
        if (modalId && typeof modalId === 'string' && document.getElementById(modalId)) {
            var modal = document.getElementById(modalId);
            modal.style.display = 'block';
            return;
        }
        
        // Otherwise use the standard modal with message and buttons
        var message = modalId; // In this case, first param is the message
        
        // Set content
        this.content.innerHTML = escapeHtml(message);
        
        // Clear and create buttons
        this.buttons.innerHTML = '';
        
        for (var i = 0; i < buttonsConfig.length; i++) {
            var btnConfig = buttonsConfig[i];
            var btn = document.createElement('button');
            btn.className = 'modal-btn';
            
            if (btnConfig.primary) {
                btn.className += ' modal-btn-primary';
            }
            if (isDanger && btnConfig.primary) {
                btn.className += ' modal-btn-danger';
            }
            
            btn.innerHTML = btnConfig.text;
            btn.onclick = this.createClickHandler(btnConfig.callback);
            
            this.buttons.appendChild(btn);
        }
        
        // Show modal
        this.overlay.style.display = 'block';
    },
    
    createClickHandler: function(callback) {
        var self = this;
        return function() {
            self.hide();
            if (callback) {
                callback();
            }
        };
    },
    
    hide: function() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    },
    
    close: function() {
        // Close any open modal - use getElementById for better compatibility
        var composeModal = document.getElementById('composePostModal');
        if (composeModal) {
            composeModal.style.display = 'none';
        }
        this.hide();
    },
    
    alert: function(message, callback) {
        this.show(message, [
            { text: 'OK', primary: true, callback: callback }
        ], false);
    },
    
    confirm: function(message, onConfirm, onCancel) {
        this.show(message, [
            { text: 'Cancel', primary: false, callback: onCancel },
            { text: 'OK', primary: true, callback: onConfirm }
        ], false);
    },
    
    confirmDanger: function(message, onConfirm, onCancel) {
        this.show(message, [
            { text: 'Cancel', primary: false, callback: onCancel },
            { text: 'Confirm', primary: true, callback: onConfirm }
        ], true);
    },
    
    custom: function(title, content, onClose) {
        if (!this.overlay) {
            this.init();
        }
        
        var self = this;
        
        this.content.innerHTML = '<h3>' + escapeHtml(title) + '</h3>' + content;
        this.buttons.innerHTML = '';
        
        var closeBtn = document.createElement('button');
        closeBtn.className = 'modal-btn';
        closeBtn.innerHTML = 'Close';
        closeBtn.onclick = function() {
            self.close();
            if (onClose) {
                onClose();
            }
        };
        
        this.buttons.appendChild(closeBtn);
        this.overlay.style.display = 'block';
    }
};

// Account Manager - Centralized account storage and management
var AccountManager = {
    // Get all accounts
    getAllAccounts: function() {
        try {
            var accountsJson = SafeStorage.getItem('accounts');
            return accountsJson ? JSON.parse(accountsJson) : [];
        } catch (e) {
            console.log('Error loading accounts: ' + e.message);
            return [];
        }
    },
    
    // Get active account
    getActiveAccount: function() {
        try {
            var activeId = SafeStorage.getItem('activeAccountId');
            if (!activeId) return null;
            
            var accounts = this.getAllAccounts();
            for (var i = 0; i < accounts.length; i++) {
                if (accounts[i].id === activeId) {
                    return accounts[i];
                }
            }
            return null;
        } catch (e) {
            console.log('Error getting active account: ' + e.message);
            return null;
        }
    },
    
    // Add or update account
    saveAccount: function(service, username, token) {
        try {
            var accounts = this.getAllAccounts();
            var accountId = service + '_' + username;
            var found = false;
            
            // Update existing account
            for (var i = 0; i < accounts.length; i++) {
                if (accounts[i].id === accountId) {
                    accounts[i].token = token;
                    accounts[i].lastUsed = new Date().getTime();
                    found = true;
                    break;
                }
            }
            
            // Add new account
            if (!found) {
                accounts.push({
                    id: accountId,
                    service: service,
                    username: username,
                    token: token,
                    addedAt: new Date().getTime(),
                    lastUsed: new Date().getTime()
                });
            }
            
            SafeStorage.setItem('accounts', JSON.stringify(accounts));
            
            // Set as active if no active account exists
            if (!SafeStorage.getItem('activeAccountId')) {
                this.setActiveAccount(accountId);
            }
            
            return accountId;
        } catch (e) {
            console.log('Error saving account: ' + e.message);
            return null;
        }
    },
    
    // Remove account
    removeAccount: function(accountId) {
        try {
            var accounts = this.getAllAccounts();
            var filtered = [];
            
            for (var i = 0; i < accounts.length; i++) {
                if (accounts[i].id !== accountId) {
                    filtered.push(accounts[i]);
                }
            }
            
            SafeStorage.setItem('accounts', JSON.stringify(filtered));
            
            // If removed account was active, clear active or set to first account
            if (SafeStorage.getItem('activeAccountId') === accountId) {
                SafeStorage.removeItem('activeAccountId');
                if (filtered.length > 0) {
                    this.setActiveAccount(filtered[0].id);
                }
            }
            
            return true;
        } catch (e) {
            console.log('Error removing account: ' + e.message);
            return false;
        }
    },
    
    // Set active account
    setActiveAccount: function(accountId) {
        try {
            var accounts = this.getAllAccounts();
            for (var i = 0; i < accounts.length; i++) {
                if (accounts[i].id === accountId) {
                    SafeStorage.setItem('activeAccountId', accountId);
                    accounts[i].lastUsed = new Date().getTime();
                    SafeStorage.setItem('accounts', JSON.stringify(accounts));
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.log('Error setting active account: ' + e.message);
            return false;
        }
    },
    
    // Get accounts by service
    getAccountsByService: function(service) {
        var accounts = this.getAllAccounts();
        var filtered = [];
        for (var i = 0; i < accounts.length; i++) {
            if (accounts[i].service === service) {
                filtered.push(accounts[i]);
            }
        }
        return filtered;
    },
    
    // Migrate old localStorage data to new system
    migrateOldData: function() {
        try {
            var oldToken = SafeStorage.getItem('wotoken');
            var oldUsername = SafeStorage.getItem('wousername');
            
            if (oldToken && oldUsername) {
                var accounts = this.getAllAccounts();
                var hasAccount = false;
                
                for (var i = 0; i < accounts.length; i++) {
                    if (accounts[i].username === oldUsername && accounts[i].service === 'wasteof') {
                        hasAccount = true;
                        break;
                    }
                }
                
                if (!hasAccount) {
                    var accountId = this.saveAccount('wasteof', oldUsername, oldToken);
                    if (accountId) {
                        this.setActiveAccount(accountId);
                    }
                }
                
                // Clean up old data
                SafeStorage.removeItem('wotoken');
                SafeStorage.removeItem('wousername');
            }
        } catch (e) {
            console.log('Error migrating data: ' + e.message);
        }
    }
};

// Global state
var currentScreen = 'explore';
var currentUser = null;
var currentToken = null;
var currentPostId = null;
var currentProfileUser = null;
var currentProfilePage = 1;
var previousScreen = null;
var currentExploreTab = 'users';
var appOpen = false;
var notificationCheckInterval = null;

// Initialize on page load
window.onload = function() {
  try {
    if (window.legacyErrors && window.legacyErrors.length > 0) {
        var errDisplay = document.getElementById('debug-error');
        if (errDisplay) {
             errDisplay.innerHTML = window.legacyErrors.join('<br>');
             errDisplay.style.display = 'block';
        }
    }
    
    updateClock();
    setInterval(updateClock, 60000); // Update every minute (no seconds for e-ink)
    
    // Migrate old data if exists
    AccountManager.migrateOldData();
    
    // Check if user is logged in
    checkLoginStatus();
  } catch (e) {
    var msg = "Init Error: " + e.message;
    if (window.legacyErrors) window.legacyErrors.push(msg);
    var errDisplay = document.getElementById('debug-error');
    if (errDisplay) {
         errDisplay.innerHTML = msg;
         errDisplay.style.display = 'block';
    } else {
        alert(msg);
    }
  }
};

// App management
function openApp() {
    appOpen = true;
    document.getElementById('homeScreenMain').style.display = 'none';
    document.getElementById('nav').style.display = 'block';
    
    // Load explore page
    showScreen('explore');
    loadExplore();
}

function exitApp() {
    appOpen = false;
    
    // Hide all app screens
    var screens = document.getElementsByClassName('screen');
    for (var i = 0; i < screens.length; i++) {
        screens[i].style.display = 'none';
    }
    
    // Hide navigation
    document.getElementById('nav').style.display = 'none';
    
    // Show home screen
    document.getElementById('homeScreenMain').style.display = 'block';
    
    currentScreen = null;
}

// Settings management
function openSettings() {
    document.getElementById('homeScreenMain').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'block';
    
    // Load settings data
    loadSettingsData();
}

function exitSettings() {
    document.getElementById('settingsScreen').style.display = 'none';
    document.getElementById('homeScreenMain').style.display = 'block';
}

function loadSettingsData() {
    // Display user agent
    document.getElementById('userAgent').innerHTML = escapeHtml(navigator.userAgent);
    
    // Parse device information
    var deviceInfo = parseDeviceInfo(navigator.userAgent);
    displayDeviceInfo(deviceInfo);
    
    // Display all accounts (social + email)
    displayAccountsList();
}

function displayAccountsList() {
    var container = document.getElementById('accountsList');
    var accounts = AccountManager.getAllAccounts();
    var emails = EmailManager.getAllEmails();
    var activeAccount = AccountManager.getActiveAccount();
    var activeId = activeAccount ? activeAccount.id : null;
    
    if (accounts.length === 0 && emails.length === 0) {
        container.innerHTML = '<div class="settings-item">No accounts configured</div>';
        return;
    }
    
    var html = '';
    
    // Display wasteof accounts
    for (var i = 0; i < accounts.length; i++) {
        var account = accounts[i];
        var isActive = account.id === activeId;
        
        html += '<div class="account-card' + (isActive ? ' account-active' : '') + '">';
        html += '<div class="account-header">';
        html += '<div class="account-service">' + escapeHtml(account.service) + '.money</div>';
        html += '<div class="account-username">@' + escapeHtml(account.username) + '</div>';
        html += '</div>';
        html += '<div class="account-actions">';
        
        if (isActive) {
            html += '<button class="btn btn-small btn-active" disabled>In Use</button>';
        } else {
            html += '<button class="btn btn-small" onclick="switchToAccount(\'' + escapeHtml(account.id) + '\')">Use This One</button>';
        }
        
        html += '<button class="btn btn-small btn-danger" onclick="removeAccountConfirm(\'' + escapeHtml(account.id) + '\', \'' + escapeHtml(account.username) + '\')">Remove</button>';
        html += '</div>';
        html += '</div>';
    }
    
    // Display email accounts
    for (var i = 0; i < emails.length; i++) {
        var email = emails[i];
        
        html += '<div class="account-card">';
        html += '<div class="account-header">';
        html += '<div class="account-service"><i class="fa fa-envelope"></i> ' + escapeHtml(email.server) + '</div>';
        html += '<div class="account-username">' + escapeHtml(email.email) + '</div>';
        html += '</div>';
        html += '<div class="account-actions">';
        html += '<button class="btn btn-small btn-danger" onclick="removeEmailConfirm(\'' + escapeHtml(email.id) + '\', \'' + escapeHtml(email.email) + '\')">Remove</button>';
        html += '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function switchToAccount(accountId) {
    if (AccountManager.setActiveAccount(accountId)) {
        var account = AccountManager.getActiveAccount();
        if (account && account.service === 'wasteof') {
            currentToken = account.token;
            currentUser = account.username;
            updateLoginUI(true);
            displayAccountsList();
            
            Modal.alert('Switched to @' + account.username, function() {
                // Exit settings and go to home
                exitSettings();
                if (appOpen) {
                    showScreen('home');
                }
            });
        }
    } else {
        Modal.alert('Failed to switch account');
    }
}

function removeAccountConfirm(accountId, username) {
    Modal.confirmDanger('Remove account @' + username + '? This will log you out of this account.', function() {
        var wasActive = AccountManager.getActiveAccount() && AccountManager.getActiveAccount().id === accountId;
        
        if (AccountManager.removeAccount(accountId)) {
            displayAccountsList();
            
            // If removed account was active, update UI
            if (wasActive) {
                checkLoginStatus();
            }
            
            Modal.alert('Account removed');
        } else {
            Modal.alert('Failed to remove account');
        }
    });
}

function showAddAccountScreen() {
    document.getElementById('settingsScreen').style.display = 'none';
