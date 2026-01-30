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
    document.getElementById('addAccountScreen').style.display = 'block';
}

function exitAddAccountScreen() {
    document.getElementById('addAccountScreen').style.display = 'none';
    document.getElementById('settingsScreen').style.display = 'block';
    loadSettingsData();
}

function selectAccountType(service) {
    if (service === 'wasteof') {
        document.getElementById('addAccountScreen').style.display = 'none';
        document.getElementById('addWastefScreen').style.display = 'block';
    } else if (service === 'email') {
        document.getElementById('addAccountScreen').style.display = 'none';
        document.getElementById('addEmailScreen').style.display = 'block';
    }
}

function exitAddWastefScreen() {
    document.getElementById('addWastefScreen').style.display = 'none';
    document.getElementById('addAccountScreen').style.display = 'block';
    
    // Clear form
    document.getElementById('addWastefUsername').value = '';
    document.getElementById('addWastefPassword').value = '';
    document.getElementById('addWastefError').innerHTML = '';
}

function addWastefAccount(event) {
    event.preventDefault();
    
    var username = document.getElementById('addWastefUsername').value;
    var password = document.getElementById('addWastefPassword').value;
    var errorDiv = document.getElementById('addWastefError');
    
    errorDiv.innerHTML = 'Logging in...';
    errorDiv.className = 'loading';
    
    var data = JSON.stringify({
        username: username,
        password: password
    });
    
    proxyPost('https://api.wasteof.money/session', data, null, function(response) {
        try {
            var result = JSON.parse(response);
            if (result.token) {
                var accountId = AccountManager.saveAccount('wasteof', username, result.token);
                
                if (accountId) {
                    errorDiv.innerHTML = 'Account added!';
                    errorDiv.className = 'success';
                    
                    setTimeout(function() {
                        document.getElementById('addWastefScreen').style.display = 'none';
                        document.getElementById('settingsScreen').style.display = 'block';
                        loadSettingsData();
                        
                        // Clear form
                        document.getElementById('addWastefUsername').value = '';
                        document.getElementById('addWastefPassword').value = '';
                        errorDiv.innerHTML = '';
                    }, 1000);
                } else {
                    errorDiv.innerHTML = 'Failed to save account';
                    errorDiv.className = 'error';
                }
            } else {
                errorDiv.innerHTML = 'Login failed';
                errorDiv.className = 'error';
            }
        } catch (e) {
            errorDiv.innerHTML = 'Error: ' + e.message;
            errorDiv.className = 'error';
        }
    }, function(error) {
        errorDiv.innerHTML = 'Login failed: ' + error;
        errorDiv.className = 'error';
    });
}

function parseDeviceInfo(userAgent) {
    var info = {
        device: 'Unknown Device',
        screenResolution: 'Unknown',
        rotation: 'Unknown',
        androidVersion: null,
        webkitVersion: null,
        linuxKernel: null,
        darwinKernel: null,
        iosVersion: null,
        kindleGeneration: null
    };
    
    // Get screen resolution
    if (window.screen) {
        info.screenResolution = window.screen.width + 'x' + window.screen.height;
    }
    
    // Detect device type
    if (userAgent.indexOf('Kobo eReader') !== -1 || userAgent.indexOf('Kobo Touch') !== -1) {
        info.device = 'Kobo eReader';
    } else if (userAgent.indexOf('Kindle') !== -1) {
        info.device = 'Amazon Kindle';
    } else if (userAgent.indexOf('iPad') !== -1) {
        info.device = 'Apple iPad';
    } else if (userAgent.indexOf('iPhone') !== -1) {
        info.device = 'Apple iPhone';
    } else if (userAgent.indexOf('iPod') !== -1) {
        info.device = 'Apple iPod Touch';
    } else if (userAgent.indexOf('Android') !== -1) {
        info.device = 'Android Device';
    } else if (userAgent.indexOf('Macintosh') !== -1) {
        info.device = 'Mac';
    } else if (userAgent.indexOf('Windows') !== -1) {
        info.device = 'Windows PC';
    } else if (userAgent.indexOf('Linux') !== -1) {
        info.device = 'Linux PC';
    }
    
    // Parse rotation support from user agent (e.g., "screen 824x1200; rotate")
    var rotateMatch = userAgent.match(/\(screen (\d+x\d+); rotate\)/i);
    if (rotateMatch) {
        info.rotation = 'Supported (' + rotateMatch[1] + ')';
    } else if (window.screen && typeof window.orientation !== 'undefined') {
        info.rotation = 'Supported (orientation API)';
    } else if (window.screen) {
        info.rotation = 'Not detected';
    }
    
    // Parse Android version (e.g., "Android 2.0", "Android 4.4.2")
    var androidMatch = userAgent.match(/Android[\s\/]?([\d\.]+)/i);
    if (androidMatch) {
        info.androidVersion = androidMatch[1];
    }
    
    // Parse WebKit version (e.g., "AppleWebKit/538.1")
    var webkitMatch = userAgent.match(/AppleWebKit\/([\d\.]+)/i);
    if (webkitMatch) {
        info.webkitVersion = webkitMatch[1];
    }
    
    // Parse Linux kernel version (e.g., "Linux 2.6.35.7")
    var linuxMatch = userAgent.match(/Linux[\s]+([\d\.]+)/i);
    if (linuxMatch) {
        info.linuxKernel = linuxMatch[1];
    }
    
    // Parse Darwin kernel version (e.g., "Darwin/16.0.0")
    var darwinMatch = userAgent.match(/Darwin\/([\d\.]+)/i);
    if (darwinMatch) {
        info.darwinKernel = darwinMatch[1];
    }
    
    // Parse iOS version (e.g., "OS 10_3_3", "iPhone OS 7_0")
    var iosMatch = userAgent.match(/(?:iPhone )?OS[\s]+([\d_]+)/i);
    if (iosMatch) {
        info.iosVersion = iosMatch[1].replace(/_/g, '.');
    }
    
    // Parse Kindle generation (e.g., "Kindle/3.0")
    var kindleMatch = userAgent.match(/Kindle\/([\d\.]+)/i);
    if (kindleMatch) {
        info.kindleGeneration = kindleMatch[1];
    }
    
    return info;
}

function displayDeviceInfo(info) {
    var container = document.getElementById('deviceInfo');
    if (!container) {
        return;
    }
    
    var html = '';
    
    html += '<div class="settings-item">';
    html += '<div class="settings-label">Device Type:</div>';
    html += '<div class="settings-value">' + escapeHtml(info.device) + '</div>';
    html += '</div>';
    
    html += '<div class="settings-item">';
    html += '<div class="settings-label">Screen Resolution:</div>';
    html += '<div class="settings-value">' + escapeHtml(info.screenResolution) + '</div>';
    html += '</div>';
    
    if (info.rotation !== 'Unknown') {
        html += '<div class="settings-item">';
        html += '<div class="settings-label">Rotation Support:</div>';
        html += '<div class="settings-value">' + escapeHtml(info.rotation) + '</div>';
        html += '</div>';
    }
    
    if (info.androidVersion) {
        html += '<div class="settings-item">';
        html += '<div class="settings-label">Android Version:</div>';
        html += '<div class="settings-value">' + escapeHtml(info.androidVersion) + '</div>';
        html += '</div>';
    }
    
    if (info.webkitVersion) {
        html += '<div class="settings-item">';
        html += '<div class="settings-label">WebKit Version:</div>';
        html += '<div class="settings-value">' + escapeHtml(info.webkitVersion) + '</div>';
        html += '</div>';
    }
    
    if (info.linuxKernel) {
        html += '<div class="settings-item">';
        html += '<div class="settings-label">Linux Kernel:</div>';
        html += '<div class="settings-value">' + escapeHtml(info.linuxKernel) + '</div>';
        html += '</div>';
    }
    
    if (info.darwinKernel) {
        html += '<div class="settings-item">';
        html += '<div class="settings-label">Darwin Kernel:</div>';
        html += '<div class="settings-value">' + escapeHtml(info.darwinKernel) + '</div>';
        html += '</div>';
    }
    
    if (info.iosVersion) {
        html += '<div class="settings-item">';
        html += '<div class="settings-label">iOS Version:</div>';
        html += '<div class="settings-value">' + escapeHtml(info.iosVersion) + '</div>';
        html += '</div>';
    }
    
    if (info.kindleGeneration) {
        html += '<div class="settings-item">';
        html += '<div class="settings-label">Kindle Generation:</div>';
        html += '<div class="settings-value">' + escapeHtml(info.kindleGeneration) + '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function factoryReset() {
    Modal.confirmDanger('Are you sure you want to factory reset? This will log you out of all apps and clear all data.', function() {
        Modal.confirmDanger('This action cannot be undone. Continue?', function() {
            // Clear all localStorage data
            SafeStorage.clear();
            
            // Reset global state
            currentUser = null;
            currentToken = null;
            
            // Show success message
            Modal.alert('Factory reset complete. All data has been cleared.', function() {
                // Go back to home screen
                exitSettings();
            });
        });
    });
}

// Email Management
var EmailManager = {
    getAllEmails: function() {
        try {
            var emailsJson = SafeStorage.getItem('emailAccounts');
            return emailsJson ? JSON.parse(emailsJson) : [];
        } catch (e) {
            console.log('Error loading email accounts: ' + e.message);
            return [];
        }
    },
    
    getActiveEmail: function() {
        try {
            var activeId = SafeStorage.getItem('activeEmailId');
            if (!activeId) return null;
            
            var emails = this.getAllEmails();
            for (var i = 0; i < emails.length; i++) {
                if (emails[i].id === activeId) {
                    return emails[i];
                }
            }
            return null;
        } catch (e) {
            console.log('Error getting active email: ' + e.message);
            return null;
        }
    },
    
    saveEmail: function(email, password, server, port, useSSL) {
        try {
            var emails = this.getAllEmails();
            var emailId = 'email_' + email;
            var found = false;
            
            for (var i = 0; i < emails.length; i++) {
                if (emails[i].id === emailId) {
                    emails[i].password = password;
                    emails[i].server = server;
                    emails[i].port = port;
                    emails[i].ssl = useSSL;
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                emails.push({
                    id: emailId,
                    email: email,
                    password: password,
                    server: server,
                    port: port,
                    ssl: useSSL,
                    addedAt: new Date().getTime()
                });
            }
            
            SafeStorage.setItem('emailAccounts', JSON.stringify(emails));
            
            if (!SafeStorage.getItem('activeEmailId')) {
                this.setActiveEmail(emailId);
            }
            
            return emailId;
        } catch (e) {
            console.log('Error saving email: ' + e.message);
            return null;
        }
    },
    
    removeEmail: function(emailId) {
        try {
            var emails = this.getAllEmails();
            var filtered = [];
            
            for (var i = 0; i < emails.length; i++) {
                if (emails[i].id !== emailId) {
                    filtered.push(emails[i]);
                }
            }
            
            SafeStorage.setItem('emailAccounts', JSON.stringify(filtered));
            
            if (SafeStorage.getItem('activeEmailId') === emailId) {
                SafeStorage.removeItem('activeEmailId');
                if (filtered.length > 0) {
                    this.setActiveEmail(filtered[0].id);
                }
            }
            
            return true;
        } catch (e) {
            console.log('Error removing email: ' + e.message);
            return false;
        }
    },
    
    setActiveEmail: function(emailId) {
        try {
            SafeStorage.setItem('activeEmailId', emailId);
            return true;
        } catch (e) {
            console.log('Error setting active email: ' + e.message);
            return false;
        }
    }
};

// Global email state
var currentEmailAccount = null;
var currentFolder = 'INBOX';
var currentMessageId = null;

function removeEmailConfirm(emailId, emailAddr) {
    Modal.confirmDanger('Remove email account ' + emailAddr + '?', function() {
        if (EmailManager.removeEmail(emailId)) {
            displayAccountsList();
            Modal.alert('Email account removed');
        } else {
            Modal.alert('Failed to remove email account');
        }
    });
}

function exitAddEmailScreen() {
    document.getElementById('addEmailScreen').style.display = 'none';
    document.getElementById('addAccountScreen').style.display = 'block';
    
    document.getElementById('emailAddress').value = '';
    document.getElementById('emailPassword').value = '';
    document.getElementById('imapServer').value = '';
    document.getElementById('imapPort').value = '993';
    document.getElementById('imapSSL').checked = true;
    document.getElementById('addEmailError').innerHTML = '';
}

function addEmailAccount(event) {
    event.preventDefault();
    
    var email = document.getElementById('emailAddress').value;
    var password = document.getElementById('emailPassword').value;
    var server = document.getElementById('imapServer').value;
    var port = parseInt(document.getElementById('imapPort').value);
    var useSSL = document.getElementById('imapSSL').checked;
    var errorDiv = document.getElementById('addEmailError');
    
    errorDiv.innerHTML = 'Testing connection...';
    errorDiv.className = 'loading';
    
    var data = JSON.stringify({
        email: email,
        password: password,
        server: server,
        port: port,
        ssl: useSSL
    });
    
    imapPost('/api/imap/connect', data, function(response) {
        try {
            var result = JSON.parse(response);
            if (result.success) {
                var emailId = EmailManager.saveEmail(email, password, server, port, useSSL);
                
                if (emailId) {
                    errorDiv.innerHTML = 'Email account added!';
                    errorDiv.className = 'success';
                    
                    setTimeout(function() {
                        document.getElementById('addEmailScreen').style.display = 'none';
                        document.getElementById('settingsScreen').style.display = 'block';
                        loadSettingsData();
                        
                        // Clear form
                        document.getElementById('emailAddress').value = '';
                        document.getElementById('emailPassword').value = '';
                        document.getElementById('imapServer').value = '';
                        document.getElementById('imapPort').value = '993';
                        document.getElementById('imapSSL').checked = true;
                        document.getElementById('addEmailError').innerHTML = '';
                    }, 1000);
                } else {
                    errorDiv.innerHTML = 'Failed to save email account';
                    errorDiv.className = 'error';
                }
            } else {
                errorDiv.innerHTML = 'Connection failed: ' + (result.error || 'Unknown error');
                errorDiv.className = 'error';
            }
        } catch (e) {
            errorDiv.innerHTML = 'Error: ' + e.message;
            errorDiv.className = 'error';
        }
    }, function(error) {
        errorDiv.innerHTML = 'Connection failed: ' + error;
        errorDiv.className = 'error';
    });
}

function openEmailApp() {
    var emails = EmailManager.getAllEmails();
    
    if (emails.length === 0) {
        Modal.alert('No email accounts configured. Please add an email account in Settings.');
        return;
    }
    
    document.getElementById('homeScreenMain').style.display = 'none';
    document.getElementById('emailAppScreen').style.display = 'block';
    
    // Reset email screens - show account selector, hide others
    document.getElementById('emailAccountSelector').style.display = 'block';
    document.getElementById('emailFolderList').style.display = 'none';
    document.getElementById('emailMessageList').style.display = 'none';
    document.getElementById('emailMessageView').style.display = 'none';
    document.getElementById('emailComposeView').style.display = 'none';
    
    loadEmailAccountSelector();
}

function exitEmailApp() {
    document.getElementById('emailAppScreen').style.display = 'none';
    document.getElementById('homeScreenMain').style.display = 'block';
    
    document.getElementById('emailFolderList').style.display = 'none';
    document.getElementById('emailMessageList').style.display = 'none';
    document.getElementById('emailMessageView').style.display = 'none';
    document.getElementById('emailComposeView').style.display = 'none';
}

function loadEmailAccountSelector() {
    var container = document.getElementById('emailAccountSelector');
    var emails = EmailManager.getAllEmails();
    
    var html = '<h3>Select Email Account</h3>';
    
    for (var i = 0; i < emails.length; i++) {
        var email = emails[i];
        html += '<div class="account-card" onclick="selectEmailAccount(\'' + escapeHtml(email.id) + '\')">';
        html += '<div class="account-header">';
        html += '<div class="account-service">' + escapeHtml(email.server) + '</div>';
        html += '<div class="account-username">' + escapeHtml(email.email) + '</div>';
        html += '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function selectEmailAccount(emailId) {
    var emails = EmailManager.getAllEmails();
    
    for (var i = 0; i < emails.length; i++) {
        if (emails[i].id === emailId) {
            currentEmailAccount = emails[i];
            break;
        }
    }
    
    if (currentEmailAccount) {
        document.getElementById('emailAccountSelector').style.display = 'none';
        document.getElementById('emailNav').style.display = 'block';
        document.getElementById('emailFolderList').style.display = 'block';
        updateEmailNavButtons('folders');
        loadFolders();
    }
}

function showEmailView(view) {
    // Hide all views
    document.getElementById('emailFolderList').style.display = 'none';
    document.getElementById('emailMessageList').style.display = 'none';
    document.getElementById('emailMessageView').style.display = 'none';
    document.getElementById('emailComposeView').style.display = 'none';
    
    // Show requested view
    if (view === 'folders') {
        document.getElementById('emailFolderList').style.display = 'block';
        updateEmailNavButtons('folders');
    } else if (view === 'messages') {
        document.getElementById('emailMessageList').style.display = 'block';
        updateEmailNavButtons('messages');
    } else if (view === 'message') {
        document.getElementById('emailMessageView').style.display = 'block';
        updateEmailNavButtons('message');
    } else if (view === 'compose') {
        document.getElementById('emailComposeView').style.display = 'block';
        updateEmailNavButtons('compose');
    }
}

function updateEmailNavButtons(activeView) {
    var foldersBtn = document.getElementById('emailFoldersNavBtn');
    var composeBtn = document.getElementById('emailComposeNavBtn');
    
    if (foldersBtn) foldersBtn.className = 'app-nav-btn';
    if (composeBtn) composeBtn.className = 'app-nav-btn';
    
    if (activeView === 'folders' && foldersBtn) {
        foldersBtn.className = 'app-nav-btn active';
    } else if (activeView === 'compose' && composeBtn) {
        composeBtn.className = 'app-nav-btn active';
    }
}

function loadFolders() {
    var container = document.getElementById('foldersList');
    container.innerHTML = '<div class="loading">Loading folders...</div>';
    
    var data = JSON.stringify({
        email: currentEmailAccount.email,
        password: currentEmailAccount.password,
        server: currentEmailAccount.server,
        port: currentEmailAccount.port,
        ssl: currentEmailAccount.ssl
    });
    
    imapPost('/api/imap/folders', data, function(response) {
        try {
            var result = JSON.parse(response);
            if (result.success) {
                renderFolders(result.folders);
            } else {
                container.innerHTML = '<div class="error">Error: ' + (result.error || 'Unknown error') + '</div>';
            }
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading folders</div>';
        }
    }, function(error) {
        container.innerHTML = '<div class="error">Error: ' + error + '</div>';
    });
}

function renderFolders(folders) {
    var container = document.getElementById('foldersList');
    
    // Process and organize folders
    var processedFolders = [];
    var inboxFolder = null;
    
    for (var i = 0; i < folders.length; i++) {
        var folder = folders[i];
        var displayName = folder;
        var indent = 0;
        
        // Skip [Gmail] folder itself
        if (folder === '[Gmail]') {
            continue;
        }
        
        // Strip [Gmail]/ prefix
        if (folder.indexOf('[Gmail]/') === 0) {
            displayName = folder.substring(8); // Remove '[Gmail]/'
        }
        
        // Check if it's INBOX
        if (folder.toUpperCase() === 'INBOX') {
            inboxFolder = {
                folder: folder,
                displayName: displayName,
                indent: 0
            };
            continue;
        }
        
        // Handle subfolders (count slashes for indentation)
        var slashCount = (folder.match(/\//g) || []).length;
        if (slashCount > 0) {
            indent = slashCount;
            // Get just the last part for display
            var parts = displayName.split('/');
            displayName = parts[parts.length - 1];
        }
        
        processedFolders.push({
            folder: folder,
            displayName: displayName,
            indent: indent
        });
    }
    
    // Build HTML
    var html = '';
    
    // Show INBOX first if it exists
    if (inboxFolder) {
        html += '<div class="account-card" onclick="selectFolder(\'' + escapeHtml(inboxFolder.folder) + '\')">';
        html += '<div class="account-username"><i class="fa fa-inbox"></i> ' + escapeHtml(inboxFolder.displayName) + '</div>';
        html += '</div>';
    }
    
    // Show other folders
    for (var i = 0; i < processedFolders.length; i++) {
        var folderData = processedFolders[i];
        var indentPx = folderData.indent * 20;
        html += '<div class="account-card" onclick="selectFolder(\'' + escapeHtml(folderData.folder) + '\')" style="padding-left: ' + (12 + indentPx) + 'px;">';
        html += '<div class="account-username">';
        if (folderData.indent > 0) {
            html += '<i class="fa fa-level-up fa-rotate-90"></i> ';
        }
        html += escapeHtml(folderData.displayName) + '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html || '<div class="loading">No folders found</div>';
}

function selectFolder(folder) {
    currentFolder = folder;
    showEmailView('messages');
    document.getElementById('currentFolderName').innerHTML = escapeHtml(folder);
    loadMessages(folder);
}

function showFolderList() {
    showEmailView('folders');
}

function loadMessages(folder) {
    var container = document.getElementById('messagesList');
    container.innerHTML = '<div class="loading">Loading messages...</div>';
    
    var data = JSON.stringify({
        email: currentEmailAccount.email,
        password: currentEmailAccount.password,
        server: currentEmailAccount.server,
        port: currentEmailAccount.port,
        ssl: currentEmailAccount.ssl,
        folder: folder,
        limit: 20
    });
    
    imapPost('/api/imap/messages', data, function(response) {
        try {
            var result = JSON.parse(response);
            if (result.success) {
                renderMessages(result.messages);
            } else {
                container.innerHTML = '<div class="error">Error: ' + (result.error || 'Unknown error') + '</div>';
            }
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading messages</div>';
        }
    }, function(error) {
        container.innerHTML = '<div class="error">Error: ' + error + '</div>';
    });
}

function renderMessages(messages) {
    var container = document.getElementById('messagesList');
    
    if (!messages || messages.length === 0) {
        container.innerHTML = '<div class="loading">No messages found</div>';
        return;
    }
    
    var html = '';
    
    for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        html += '<div class="post-card" onclick="viewMessage(\'' + escapeHtml(msg.id) + '\')">';
        html += '<div class="post-header">' + escapeHtml(msg.from) + '</div>';
        html += '<div class="post-content"><strong>' + escapeHtml(msg.subject) + '</strong></div>';
        html += '<div class="timestamp">' + escapeHtml(msg.date) + '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function viewMessage(messageId) {
    currentMessageId = messageId;
    showEmailView('message');
    loadMessageDetail(messageId);
}

function showMessageList() {
    showEmailView('messages');
}

function loadMessageDetail(messageId) {
    var container = document.getElementById('messageDetail');
    container.innerHTML = '<div class="loading">Loading message...</div>';
    
    var data = JSON.stringify({
        email: currentEmailAccount.email,
        password: currentEmailAccount.password,
        server: currentEmailAccount.server,
        port: currentEmailAccount.port,
        ssl: currentEmailAccount.ssl,
        folder: currentFolder,
        message_id: messageId
    });
    
    imapPost('/api/imap/message', data, function(response) {
        try {
            var result = JSON.parse(response);
            if (result.success) {
                renderMessageDetail(result.message);
            } else {
                container.innerHTML = '<div class="error">Error: ' + (result.error || 'Unknown error') + '</div>';
            }
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading message</div>';
        }
    }, function(error) {
        container.innerHTML = '<div class="error">Error: ' + error + '</div>';
    });
}

function renderMessageDetail(message) {
    var container = document.getElementById('messageDetail');
    
    var html = '<div class="post-card" style="cursor: default;">';
    html += '<div class="post-header">';
    html += '<strong>From:</strong> ' + escapeHtml(message.from);
    html += '</div>';
    html += '<div class="post-header">';
    html += '<strong>To:</strong> ' + escapeHtml(message.to);
    html += '</div>';
    html += '<div class="post-header">';
    html += '<strong>Date:</strong> ' + escapeHtml(message.date);
    html += '</div>';
    html += '<div class="post-content">';
    html += '<h3>' + escapeHtml(message.subject) + '</h3>';
    
    // Render HTML or plain text
    if (message.is_html) {
        html += '<div style="border: 1px solid #ccc; padding: 12px; background: #fff;">' + message.body + '</div>';
    } else {
        html += '<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: Arial, sans-serif; font-size: 16px;">' + escapeHtml(message.body) + '</pre>';
    }
    
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
}

function showComposeEmail() {
    showEmailView('compose');
    
    // Clear form
    document.getElementById('composeTo').value = '';
    document.getElementById('composeSubject').value = '';
    document.getElementById('composeBody').value = '';
}

function hideComposeEmail() {
    showEmailView('folders');
}

function sendEmail(event) {
    event.preventDefault();
    
    var to = document.getElementById('composeTo').value;
    var subject = document.getElementById('composeSubject').value;
    var body = document.getElementById('composeBody').value;
    
    if (!to || !subject) {
        Modal.alert('Please enter recipient and subject');
        return;
    }
    
    // Get send button - use getElementsByTagName for better compatibility
    var buttons = event.target.getElementsByTagName('button');
    var sendBtn = null;
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].type === 'submit') {
            sendBtn = buttons[i];
            break;
        }
    }
    
    if (!sendBtn) return;
    
    var originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = 'Sending...';
    sendBtn.disabled = true;
    
    var data = JSON.stringify({
        email: currentEmailAccount.email,
        password: currentEmailAccount.password,
        server: currentEmailAccount.server,
        port: currentEmailAccount.port,
        ssl: currentEmailAccount.ssl,
        to: to,
        subject: subject,
        body: body
    });
    
    imapPost('/api/imap/send', data, function(response) {
        try {
            var result = JSON.parse(response);
            if (result.success) {
                Modal.alert('Email sent successfully!');
                hideComposeEmail();
            } else {
                Modal.alert('Error sending email: ' + (result.error || 'Unknown error'));
            }
        } catch (e) {
            Modal.alert('Error sending email');
        }
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }, function(error) {
        Modal.alert('Error: ' + error);
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    });
}

function imapPost(url, data, callback, errorCallback) {
    var xhr = createXHR();
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(xhr.responseText);
            } else {
                if (errorCallback) {
                    errorCallback(xhr.statusText || 'Request failed');
                }
            }
        }
    };
    
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(data);
}

// Clock and Date functions
function updateClock() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    var timeStr = hours + ':' + minutes + ' ' + ampm;
    document.getElementById('clock').innerHTML = timeStr;
    
    var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    var dateStr = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
    document.getElementById('date').innerHTML = dateStr;
}

// Screen management
function showScreen(screenName) {
    var screens = document.getElementsByClassName('screen');
    for (var i = 0; i < screens.length; i++) {
        screens[i].style.display = 'none';
    }
    
    previousScreen = currentScreen;
    currentScreen = screenName;
    
    var screenId = screenName + 'Screen';
    var screen = document.getElementById(screenId);
    if (screen) {
        screen.style.display = 'block';
    }
    
    // Load content based on screen
    if (screenName === 'explore') {
        loadExplore();
    } else if (screenName === 'home') {
        loadHomeFeed();
    } else if (screenName === 'notifications') {
        loadNotifications();
    }
}

function goBack() {
    if (previousScreen) {
        showScreen(previousScreen);
    } else {
        showScreen('explore');
    }
}

// Authentication functions
function checkLoginStatus() {
    try {
        var activeAccount = AccountManager.getActiveAccount();
        
        if (activeAccount && activeAccount.service === 'wasteof') {
            currentToken = activeAccount.token;
            currentUser = activeAccount.username;
            updateLoginUI(true);
        } else {
            currentToken = null;
            currentUser = null;
            updateLoginUI(false);
        }
    } catch (e) {
        console.log('Error checking login status: ' + e.message);
    }
}

function updateLoginUI(loggedIn) {
    var loginBtn = document.getElementById('loginBtn');
    var notificationsBtn = document.getElementById('notificationsBtn');
    var homeBtn = document.getElementById('homeBtn');
    var userInfo = document.getElementById('userInfo');
    
    if (loggedIn) {
        loginBtn.style.display = 'none';
        notificationsBtn.style.display = 'block';
        homeBtn.style.display = 'block';
        userInfo.style.display = 'inline-block';
        
        // Update user info
        var userNameElem = document.getElementById('userName');
        userNameElem.innerHTML = '@' + currentUser;
        userNameElem.onclick = function() {
            viewProfile(currentUser);
        };
        document.getElementById('userPic').src = 'https://api.wasteof.money/users/' + currentUser + '/picture';
        
        // Start checking notifications
        checkNotificationCount();
        if (notificationCheckInterval) {
            clearInterval(notificationCheckInterval);
        }
        notificationCheckInterval = setInterval(checkNotificationCount, 30000); // Check every 30 seconds
    } else {
        loginBtn.style.display = 'block';
        notificationsBtn.style.display = 'none';
        homeBtn.style.display = 'none';
        userInfo.style.display = 'none';
        
        // Stop checking notifications
        if (notificationCheckInterval) {
            clearInterval(notificationCheckInterval);
            notificationCheckInterval = null;
        }
    }
}

function login(event) {
    event.preventDefault();
    
    var username = document.getElementById('loginUsername').value;
    var password = document.getElementById('loginPassword').value;
    var errorDiv = document.getElementById('loginError');
    
    errorDiv.innerHTML = 'Logging in...';
    
    var data = JSON.stringify({
        username: username,
        password: password
    });
    
    proxyPost('https://api.wasteof.money/session', data, null, function(response) {
        try {
            var result = JSON.parse(response);
            if (result.token) {
                // Save account using AccountManager
                var accountId = AccountManager.saveAccount('wasteof', username, result.token);
                
                if (accountId) {
                    AccountManager.setActiveAccount(accountId);
                    currentToken = result.token;
                    currentUser = username;
                    
                    updateLoginUI(true);
                    errorDiv.innerHTML = '';
                    showScreen('home');
                } else {
                    errorDiv.innerHTML = 'Failed to save account';
                }
            } else {
                errorDiv.innerHTML = 'Login failed';
            }
        } catch (e) {
            errorDiv.innerHTML = 'Error: ' + e.message;
        }
    }, function(error) {
        errorDiv.innerHTML = 'Login failed: ' + error;
    });
}

function logout() {
    currentToken = null;
    currentUser = null;
    
    // Clear active account but keep accounts stored
    try {
        SafeStorage.removeItem('activeAccountId');
    } catch (e) {
        console.log('Could not clear active account');
    }
    
    updateLoginUI(false);
    showScreen('explore');
}

// Notifications functions
function checkNotificationCount() {
    if (!currentToken || !currentUser) {
        return;
    }
    
    proxyGet('https://api.wasteof.money/messages/unread', function(response) {
        try {
            var data = JSON.parse(response);
            var count = data.unread ? data.unread.length : 0;
            updateNotificationBadge(count);
        } catch (e) {
            console.log('Error checking notification count: ' + e.message);
        }
    }, function(error) {
        console.log('Error checking notifications: ' + error);
    }, currentToken);
}

function updateNotificationBadge(count) {
    var badge = document.getElementById('notificationBadge');
    if (badge) {
        if (count > 0) {
            badge.innerHTML = count > 99 ? '99+' : count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

function loadNotifications() {
    if (!currentToken || !currentUser) {
        document.getElementById('notificationsList').innerHTML = '<div class="error">Please log in first</div>';
        return;
    }
    
    var container = document.getElementById('notificationsList');
    container.innerHTML = '<div class="loading">Loading notifications...</div>';
    
    proxyGet('https://api.wasteof.money/messages/unread', function(response) {
        try {
            var data = JSON.parse(response);
            renderNotifications(data.unread);
            
            // Mark all as read
            if (data.unread && data.unread.length > 0) {
                markNotificationsAsRead(data.unread);
                // Reset badge after marking as read
                setTimeout(function() {
                    updateNotificationBadge(0);
                }, 500);
            } else {
                updateNotificationBadge(0);
            }
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading notifications</div>';
        }
    }, function(error) {
        container.innerHTML = '<div class="error">Error: ' + error + '</div>';
    }, currentToken);
}

function renderNotifications(notifications) {
    var container = document.getElementById('notificationsList');
    
    if (!notifications || notifications.length === 0) {
        container.innerHTML = '<div class="loading">No new notifications</div>';
        return;
    }
    
    var html = '';
    
    for (var i = 0; i < notifications.length; i++) {
        var notif = notifications[i];
        html += '<div class="notification-card">';
        
        if (notif.type === 'follow') {
            html += '<div class="notification-header">';
            html += '<img src="https://api.wasteof.money/users/' + escapeHtml(notif.data.actor.name) + '/picture" class="notification-pic" alt="">';
            html += '<div>';
            html += '<span class="user-name-link" onclick="viewProfile(\'' + escapeHtml(notif.data.actor.name) + '\')">@' + escapeHtml(notif.data.actor.name) + '</span>';
            html += ' followed you';
            html += '<div class="timestamp">' + formatTimestamp(notif.time) + '</div>';
            html += '</div>';
            html += '</div>';
        } else if (notif.type === 'comment') {
            html += '<div class="notification-header">';
            html += '<img src="https://api.wasteof.money/users/' + escapeHtml(notif.data.actor.name) + '/picture" class="notification-pic" alt="">';
            html += '<div>';
            html += '<span class="user-name-link" onclick="viewProfile(\'' + escapeHtml(notif.data.actor.name) + '\')">@' + escapeHtml(notif.data.actor.name) + '</span>';
            html += ' commented on your post';
            html += '<div class="timestamp">' + formatTimestamp(notif.time) + '</div>';
            html += '</div>';
            html += '</div>';
            html += '<div class="notification-content">' + sanitizeHtml(notif.data.comment.content) + '</div>';
            html += '<button class="btn" onclick="viewPost(\'' + notif.data.post._id + '\')">View Post</button>';
        } else if (notif.type === 'love') {
            html += '<div class="notification-header">';
            html += '<img src="https://api.wasteof.money/users/' + escapeHtml(notif.data.actor.name) + '/picture" class="notification-pic" alt="">';
            html += '<div>';
            html += '<span class="user-name-link" onclick="viewProfile(\'' + escapeHtml(notif.data.actor.name) + '\')">@' + escapeHtml(notif.data.actor.name) + '</span>';
            html += ' loved your post';
            html += '<div class="timestamp">' + formatTimestamp(notif.time) + '</div>';
            html += '</div>';
            html += '</div>';
            if (notif.data.post) {
                html += '<button class="btn" onclick="viewPost(\'' + notif.data.post._id + '\')">View Post</button>';
            }
        } else if (notif.type === 'repost') {
            html += '<div class="notification-header">';
            html += '<img src="https://api.wasteof.money/users/' + escapeHtml(notif.data.actor.name) + '/picture" class="notification-pic" alt="">';
            html += '<div>';
            html += '<span class="user-name-link" onclick="viewProfile(\'' + escapeHtml(notif.data.actor.name) + '\')">@' + escapeHtml(notif.data.actor.name) + '</span>';
            html += ' reposted your post';
            html += '<div class="timestamp">' + formatTimestamp(notif.time) + '</div>';
            html += '</div>';
            html += '</div>';
            if (notif.data.post) {
                html += '<button class="btn" onclick="viewPost(\'' + notif.data.post._id + '\')">View Post</button>';
            }
        } else {
            html += '<div class="notification-header">';
            html += '<div>New notification: ' + escapeHtml(notif.type) + '</div>';
            html += '<div class="timestamp">' + formatTimestamp(notif.time) + '</div>';
            html += '</div>';
        }
        
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function markNotificationsAsRead(notifications) {
    var messageIds = [];
    for (var i = 0; i < notifications.length; i++) {
        messageIds.push(notifications[i]._id);
    }
    
    var data = JSON.stringify({
        messages: messageIds
    });
    
    proxyPost('https://api.wasteof.money/messages/mark/read', data, currentToken, function(response) {
        console.log('Marked notifications as read');
    }, function(error) {
        console.log('Error marking notifications as read: ' + error);
    });
}

// API functions using server proxy
function proxyGet(url, callback, errorCallback, token) {
    var xhr = createXHR();
    if (!xhr) {
        if (errorCallback) errorCallback("XHR not supported");
        return;
    }
    
    var proxyUrl = '/api/proxy?url=' + encodeURIComponent(url);
    
    // Add timestamp to prevent caching on old browsers
    proxyUrl += '&t=' + new Date().getTime();
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(xhr.responseText);
            } else {
                if (errorCallback) {
                    errorCallback(xhr.statusText || 'Request failed');
                }
            }
        }
    };
    
    try {
        xhr.open('GET', proxyUrl, true);
        
        if (token) {
            xhr.setRequestHeader('Authorization', token);
        }
        
        xhr.send();
    } catch(e) {
        if (errorCallback) errorCallback("XHR Error: " + e.message);
    }
}

function proxyPost(url, data, token, callback, errorCallback) {
    var xhr = createXHR();
    if (!xhr) {
        if (errorCallback) errorCallback("XHR not supported");
        return;
    }

    var proxyUrl = '/api/proxy?url=' + encodeURIComponent(url);
    
    // Add timestamp to prevent caching
    proxyUrl += '&t=' + new Date().getTime();
    
    if (token) {
        proxyUrl += '&token=' + encodeURIComponent(token);
    }
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                callback(xhr.responseText);
            } else {
                if (errorCallback) {
                    errorCallback(xhr.statusText || 'Request failed');
                }
            }
        }
    };
    
    try {
        xhr.open('POST', proxyUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(data);
    } catch(e) {
         if (errorCallback) errorCallback("XHR Error: " + e.message);
    }
}

// Explore functions
function loadExplore() {
    // Ensure currentExploreTab is set
    if (!currentExploreTab) {
        currentExploreTab = 'users';
    }
    
    // Initialize tab display
    document.getElementById('exploreUsersTab').style.display = 'none';
    document.getElementById('explorePostsTab').style.display = 'none';
    
    // Update tab buttons
    var tabButtons = document.getElementsByClassName('tab-btn');
    for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = 'tab-btn';
    }
    
    // Load and show the current tab
    if (currentExploreTab === 'users') {
        document.getElementById('exploreUsersTab').style.display = 'block';
        if (tabButtons.length > 0) tabButtons[0].className = 'tab-btn active';
        loadTopUsers();
    } else {
        document.getElementById('explorePostsTab').style.display = 'block';
        if (tabButtons.length > 1) tabButtons[1].className = 'tab-btn active';
        loadTrendingPosts();
    }
}

function switchExploreTab(tabName) {
    currentExploreTab = tabName;
    
    // Update tab buttons
    var tabButtons = document.getElementsByClassName('tab-btn');
    for (var i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = 'tab-btn';
    }
    
    // Hide all tabs
    document.getElementById('exploreUsersTab').style.display = 'none';
    document.getElementById('explorePostsTab').style.display = 'none';
    
    // Show selected tab
    if (tabName === 'users') {
        document.getElementById('exploreUsersTab').style.display = 'block';
        tabButtons[0].className = 'tab-btn active';
        loadTopUsers();
    } else if (tabName === 'posts') {
        document.getElementById('explorePostsTab').style.display = 'block';
        tabButtons[1].className = 'tab-btn active';
        loadTrendingPosts();
    }
}

function loadTopUsers() {
    var container = document.getElementById('topUsers');
    container.innerHTML = '<div class="loading">Loading users...</div>';
    
    proxyGet('https://api.wasteof.money/explore/users/top', function(response) {
        try {
            var users = JSON.parse(response);
            renderUsers(users);
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading users</div>';
        }
    }, function(error) {
        container.innerHTML = '<div class="error">Error: ' + error + '</div>';
    });
}

function renderUsers(users) {
    var container = document.getElementById('topUsers');
    var html = '';
    
    for (var i = 0; i < Math.min(users.length, 10); i++) {
        var user = users[i];
        var badges = '';
        
        if (user.verified) {
            badges += '<span class="badge">VERIFIED</span>';
        }
        if (user.permissions && user.permissions.admin) {
            badges += '<span class="badge">ADMIN</span>';
        }
        if (user.beta) {
            badges += '<span class="badge">BETA</span>';
        }
        
        html += '<div class="user-card" onclick="viewProfile(\'' + escapeHtml(user.name) + '\')">';
        html += '<div class="user-card-header">';
        html += '<img src="https://api.wasteof.money/users/' + escapeHtml(user.name) + '/picture" class="user-pic-medium" alt="">';
        html += '<div>';
        html += '<div class="user-name">@' + escapeHtml(user.name) + badges + '</div>';
        html += '<div class="user-stats">' + user.stats.followers + ' followers</div>';
        html += '</div>';
        html += '</div>';
        html += '<div class="user-bio">' + escapeHtml(user.bio || '') + '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html || '<div class="loading">No users found</div>';
}

function loadTrendingPosts() {
    var container = document.getElementById('trendingPosts');
    container.innerHTML = '<div class="loading">Loading posts...</div>';
    
    proxyGet('https://api.wasteof.money/explore/posts/trending', function(response) {
        try {
            var data = JSON.parse(response);
            renderPosts(data.posts, 'trendingPosts');
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading posts</div>';
        }
    }, function(error) {
        container.innerHTML = '<div class="error">Error: ' + error + '</div>';
    });
}

// Home feed functions
function loadHomeFeed() {
    if (!currentUser) {
        document.getElementById('homeFeed').innerHTML = '<div class="error">Please log in first</div>';
        return;
    }
    
    var container = document.getElementById('homeFeed');
    container.innerHTML = '<div class="loading">Loading feed...</div>';
    
    proxyGet('https://api.wasteof.money/users/' + currentUser + '/following/posts', function(response) {
        try {
            var data = JSON.parse(response);
            renderPosts(data.posts, 'homeFeed');
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading feed</div>';
        }
    }, function(error) {
        container.innerHTML = '<div class="error">Error: ' + error + '</div>';
    });
}

// Post rendering
function renderPosts(posts, containerId) {
    var container = document.getElementById(containerId);
    var html = '';
    
    for (var i = 0; i < posts.length; i++) {
        var post = posts[i];
        html += renderPostCard(post);
    }
    
    container.innerHTML = html || '<div class="loading">No posts found</div>';
}

function renderPostCard(post) {
    var html = '<div class="post-card" onclick="viewPost(\'' + post._id + '\')">';
    
    // Check if this is a repost
    if (post.repost && post.repost._id) {
        // Show the reposter info
        html += '<div class="post-header" style="color: #666; font-size: 14px;">';
        html += '<i class="fa fa-retweet"></i> @' + escapeHtml(post.poster.name) + ' reposted';
        html += '</div>';
        
        // Show the quote if there is one
        if (post.content && post.content.trim()) {
            html += '<div class="post-content" style="margin-bottom: 8px;">' + sanitizeHtml(post.content) + '</div>';
        }
        
        // Show the reposted post - make it clickable
        html += '<div class="reposted-post" style="border: 1px solid #ccc; padding: 8px; margin-top: 8px; background: #f5f5f5; cursor: pointer;" onclick="event.stopPropagation(); viewPost(\'' + post.repost._id + '\');">';
        html += '<div class="post-header">';
        html += '<img src="https://api.wasteof.money/users/' + escapeHtml(post.repost.poster.name) + '/picture" class="post-pic-small" alt="">';
        html += '@' + escapeHtml(post.repost.poster.name);
        html += '</div>';
        html += '<div class="post-content">' + sanitizeHtml(post.repost.content) + '</div>';
        html += '<div class="post-footer">';
        html += '<span class="post-stat"><i class="fa fa-heart"></i> ' + post.repost.loves + '</span>';
        html += '<span class="post-stat"><i class="fa fa-comment"></i> ' + post.repost.comments + '</span>';
        html += '<span class="post-stat"><i class="fa fa-retweet"></i> ' + post.repost.reposts + '</span>';
        html += '<span class="timestamp">' + formatTimestamp(post.repost.time) + '</span>';
        html += '</div>';
        html += '</div>';
        
        // Stats for the repost itself - include repost count
        html += '<div class="post-footer" style="margin-top: 8px;">';
        html += '<span class="post-stat"><i class="fa fa-heart"></i> ' + post.loves + '</span>';
        html += '<span class="post-stat"><i class="fa fa-comment"></i> ' + post.comments + '</span>';
        html += '<span class="post-stat"><i class="fa fa-retweet"></i> ' + post.reposts + '</span>';
        html += '<span class="timestamp">' + formatTimestamp(post.time) + '</span>';
        html += '</div>';
    } else {
        // Regular post
        html += '<div class="post-header">';
        html += '<img src="https://api.wasteof.money/users/' + escapeHtml(post.poster.name) + '/picture" class="post-pic-small" alt="">';
        html += '@' + escapeHtml(post.poster.name);
        html += '</div>';
        html += '<div class="post-content">' + sanitizeHtml(post.content) + '</div>';
        html += '<div class="post-footer">';
        html += '<span class="post-stat"><i class="fa fa-heart"></i> ' + post.loves + '</span>';
        html += '<span class="post-stat"><i class="fa fa-comment"></i> ' + post.comments + '</span>';
        html += '<span class="post-stat"><i class="fa fa-retweet"></i> ' + post.reposts + '</span>';
        html += '<span class="timestamp">' + formatTimestamp(post.time) + '</span>';
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// View post detail
function viewPost(postId) {
    currentPostId = postId;
    showScreen('post');
    loadPostDetail(postId);
    loadPostComments(postId);
}

function loadPostDetail(postId) {
    var container = document.getElementById('postDetail');
    container.innerHTML = '<div class="loading">Loading post...</div>';
    
    proxyGet('https://api.wasteof.money/posts/' + postId, function(response) {
        try {
            var post = JSON.parse(response);
            renderPostDetail(post, postId);
            
            // Check if user has loved this post
            if (currentToken && currentUser) {
                checkIfLoved(postId);
            }
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading post</div>';
        }
    });
}

function renderPostDetail(post, postId) {
    var container = document.getElementById('postDetail');
    var html = '<div class="post-card" style="cursor: default;">';
    
    // Check if this is a repost
    if (post.repost && post.repost._id) {
        // Show the reposter info
        html += '<div class="post-header" style="color: #666; font-size: 14px;">';
        html += '<i class="fa fa-retweet"></i> @' + escapeHtml(post.poster.name) + ' reposted';
        html += '</div>';
        
        // Show the quote if there is one
        if (post.content && post.content.trim()) {
            html += '<div class="post-content" style="margin-bottom: 8px;">' + sanitizeHtml(post.content) + '</div>';
        }
        
        // Show the reposted post - make it clickable
        html += '<div class="reposted-post" style="border: 1px solid #ccc; padding: 8px; margin-top: 8px; background: #f5f5f5; cursor: pointer;" onclick="viewPost(\'' + post.repost._id + '\');">';
        html += '<div class="post-header">';
        html += '<img src="https://api.wasteof.money/users/' + escapeHtml(post.repost.poster.name) + '/picture" class="post-pic-small" alt="">';
        html += '<span class="user-name-link" onclick="event.stopPropagation(); viewProfile(\'' + escapeHtml(post.repost.poster.name) + '\')">@' + escapeHtml(post.repost.poster.name) + '</span>';
        html += '</div>';
        html += '<div class="post-content">' + sanitizeHtml(post.repost.content) + '</div>';
        html += '<div class="post-footer">';
        html += '<span class="post-stat"><i class="fa fa-heart"></i> ' + post.repost.loves + '</span>';
        html += '<span class="post-stat"><i class="fa fa-comment"></i> ' + post.repost.comments + '</span>';
        html += '<span class="post-stat"><i class="fa fa-retweet"></i> ' + post.repost.reposts + '</span>';
        html += '<span class="timestamp">' + formatTimestamp(post.repost.time) + '</span>';
        html += '</div>';
        html += '</div>';
    } else {
        // Regular post
        html += '<div class="post-header">';
        html += '<img src="https://api.wasteof.money/users/' + escapeHtml(post.poster.name) + '/picture" class="post-pic-small" alt="">';
        html += '<span class="user-name-link" onclick="viewProfile(\'' + escapeHtml(post.poster.name) + '\')">@' + escapeHtml(post.poster.name) + '</span>';
        html += '</div>';
        html += '<div class="post-content">' + sanitizeHtml(post.content) + '</div>';
    }
    
    html += '<div class="post-footer">';
    
    // Add like button if logged in
    if (currentToken) {
        html += '<span class="post-action" onclick="toggleLove(\'' + postId + '\', event)" id="loveBtn-' + postId + '">';
        html += '<i class="fa fa-heart-o"></i> <span id="loveCount-' + postId + '">' + post.loves + '</span>';
        html += '</span>';
    } else {
        html += '<span class="post-stat"><i class="fa fa-heart"></i> ' + post.loves + '</span>';
    }
    
    html += '<span class="post-stat"><i class="fa fa-comment"></i> ' + post.comments + '</span>';
    
    // Add repost button if logged in
    if (currentToken) {
        html += '<span class="post-action" onclick="showRepostOptions(\'' + postId + '\', event)">';
        html += '<i class="fa fa-retweet"></i> ' + post.reposts;
        html += '</span>';
    } else {
        html += '<span class="post-stat"><i class="fa fa-retweet"></i> ' + post.reposts + '</span>';
    }
    
    html += '<span class="timestamp">' + formatTimestamp(post.time) + '</span>';
    html += '</div>';
    html += '</div>';
    container.innerHTML = html;
    
    // Store the current post for reposting
    window.currentPostForRepost = post;
}

function checkIfLoved(postId) {
    proxyGet('https://api.wasteof.money/posts/' + postId + '/loves/' + currentUser, function(response) {
        try {
            var isLoved = JSON.parse(response);
            var loveBtn = document.getElementById('loveBtn-' + postId);
            
            if (loveBtn) {
                if (isLoved === true) {
                    loveBtn.className = 'post-action loved';
                    // Get the span using getElementsByTagName for better compatibility
                    var spans = loveBtn.getElementsByTagName('span');
                    var countText = spans.length > 0 ? spans[0].innerHTML : '0';
                    loveBtn.innerHTML = '<i class="fa fa-heart"></i> <span id="loveCount-' + postId + '">' + countText + '</span>';
                }
            }
        } catch (e) {
            console.log('Error checking love status: ' + e.message);
        }
    }, function(error) {
        console.log('Error checking love status: ' + error);
    }, currentToken);
}

function loadPostComments(postId) {
    var container = document.getElementById('postComments');
    container.innerHTML = '<div class="loading">Loading comments...</div>';
    
    proxyGet('https://api.wasteof.money/posts/' + postId + '/comments?page=1', function(response) {
        try {
            var data = JSON.parse(response);
            renderComments(data.comments);
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading comments</div>';
        }
    });
}

function renderComments(comments) {
    var container = document.getElementById('postComments');
    var html = '';
    
    for (var i = 0; i < comments.length; i++) {
        var comment = comments[i];
        html += '<div class="comment-card" id="comment-' + comment._id + '">';
        html += '<div class="comment-header">';
        html += '<img src="https://api.wasteof.money/users/' + escapeHtml(comment.poster.name) + '/picture" class="comment-pic-small" alt="">';
        html += '<span class="user-name-link" onclick="viewProfile(\'' + escapeHtml(comment.poster.name) + '\')">@' + escapeHtml(comment.poster.name) + '</span>';
        html += '</div>';
        html += '<div class="comment-content">' + sanitizeHtml(comment.content) + '</div>';
        html += '<div class="timestamp">' + formatTimestamp(comment.time) + '</div>';
        
        // Add reply button if logged in
        if (currentToken) {
            html += '<button class="show-replies-btn" onclick="showReplyBox(\'' + comment._id + '\', event)">Reply</button>';
        }
        
        if (comment.hasReplies) {
            html += '<button class="show-replies-btn" onclick="loadReplies(\'' + comment._id + '\')">Show Replies</button>';
            html += '<div id="replies-' + comment._id + '"></div>';
        }
        
        // Reply box (initially hidden)
        html += '<div id="replyBox-' + comment._id + '" class="reply-box" style="display:none;">';
        html += '<textarea id="replyContent-' + comment._id + '" placeholder="Write a reply..."></textarea>';
        html += '<button onclick="postReply(\'' + comment._id + '\')" class="btn">Reply</button>';
        html += '<button onclick="cancelReply(\'' + comment._id + '\')" class="btn-back">Cancel</button>';
        html += '<div id="replyError-' + comment._id + '" class="error"></div>';
        html += '</div>';
        
        html += '</div>';
    }
    
    container.innerHTML = html || '<div class="loading">No comments yet</div>';
}

function showReplyBox(commentId, event) {
    if (event) {
        event.stopPropagation();
    }
    var replyBox = document.getElementById('replyBox-' + commentId);
    if (replyBox) {
        replyBox.style.display = 'block';
    }
}

function cancelReply(commentId) {
    var replyBox = document.getElementById('replyBox-' + commentId);
    var replyContent = document.getElementById('replyContent-' + commentId);
    var replyError = document.getElementById('replyError-' + commentId);
    
    if (replyBox) {
        replyBox.style.display = 'none';
    }
    if (replyContent) {
        replyContent.value = '';
    }
    if (replyError) {
        replyError.innerHTML = '';
    }
}

function postReply(parentCommentId) {
    if (!currentToken) {
        document.getElementById('replyError-' + parentCommentId).innerHTML = 'Please log in first';
        return;
    }
    
    if (!currentPostId) {
        document.getElementById('replyError-' + parentCommentId).innerHTML = 'No post selected';
        return;
    }
    
    var content = document.getElementById('replyContent-' + parentCommentId).value;
    var errorDiv = document.getElementById('replyError-' + parentCommentId);
    
    if (!content.trim()) {
        errorDiv.innerHTML = 'Please enter some content';
        return;
    }
    
    errorDiv.innerHTML = 'Posting reply...';
    errorDiv.className = 'success';
    
    // Wrap content in <p> tags if not already HTML
    if (content.indexOf('<') === -1) {
        content = '<p>' + content + '</p>';
    }
    
    var data = JSON.stringify({
        content: content,
        parent: parentCommentId
    });
    
    proxyPost('https://api.wasteof.money/posts/' + currentPostId + '/comments', data, currentToken, function(response) {
        try {
            document.getElementById('replyContent-' + parentCommentId).value = '';
            errorDiv.innerHTML = 'Reply posted!';
            errorDiv.className = 'success';
            
            // Hide reply box and reload comments after a short delay
            setTimeout(function() {
                cancelReply(parentCommentId);
                loadPostComments(currentPostId);
                loadPostDetail(currentPostId);
            }, 1000);
        } catch (e) {
            errorDiv.innerHTML = 'Error: ' + e.message;
            errorDiv.className = 'error';
        }
    }, function(error) {
        errorDiv.innerHTML = 'Error: ' + error;
        errorDiv.className = 'error';
    });
}

function loadReplies(commentId) {
    var repliesContainer = document.getElementById('replies-' + commentId);
    repliesContainer.innerHTML = '<div class="loading">Loading replies...</div>';
    
    proxyGet('https://api.wasteof.money/comments/' + commentId + '/replies?page=1', function(response) {
        try {
            var data = JSON.parse(response);
            var html = '';
            
            for (var i = 0; i < data.comments.length; i++) {
                var reply = data.comments[i];
                html += '<div class="comment-card comment-reply">';
                html += '<div class="comment-header">';
                html += '<img src="https://api.wasteof.money/users/' + escapeHtml(reply.poster.name) + '/picture" class="comment-pic-small" alt="">';
                html += '<span class="user-name-link" onclick="viewProfile(\'' + escapeHtml(reply.poster.name) + '\')">@' + escapeHtml(reply.poster.name) + '</span>';
                html += '</div>';
                html += '<div class="comment-content">' + sanitizeHtml(reply.content) + '</div>';
                html += '<div class="timestamp">' + formatTimestamp(reply.time) + '</div>';
                
                // Add reply button for nested replies if logged in
                if (currentToken) {
                    html += '<button class="show-replies-btn" onclick="showReplyBox(\'' + reply._id + '\', event)">Reply</button>';
                }
                
                if (reply.hasReplies) {
                    html += '<button class="show-replies-btn" onclick="loadReplies(\'' + reply._id + '\')">Show More Replies</button>';
                    html += '<div id="replies-' + reply._id + '"></div>';
                }
                
                // Reply box for nested replies
                html += '<div id="replyBox-' + reply._id + '" class="reply-box" style="display:none;">';
                html += '<textarea id="replyContent-' + reply._id + '" placeholder="Write a reply..."></textarea>';
                html += '<button onclick="postReply(\'' + reply._id + '\')" class="btn">Reply</button>';
                html += '<button onclick="cancelReply(\'' + reply._id + '\')" class="btn-back">Cancel</button>';
                html += '<div id="replyError-' + reply._id + '" class="error"></div>';
                html += '</div>';
                
                html += '</div>';
            }
            
            repliesContainer.innerHTML = html;
        } catch (e) {
            repliesContainer.innerHTML = '<div class="error">Error loading replies</div>';
        }
    });
}

// Create post
function createPost() {
    if (!currentToken) {
        Modal.alert('Please log in first');
        return;
    }
    
    var content = document.getElementById('modalPostContent').value;
    var repostId = window.currentRepostId || null;
    
    // For pure repost, content can be empty
    if (!repostId && !content.trim()) {
        Modal.alert('Please enter some content');
        return;
    }
    
    // Wrap content in <p> tags if not already HTML
    if (content && content.indexOf('<') === -1) {
        content = '<p>' + content + '</p>';
    }
    
    var data = JSON.stringify({
        post: content || '',
        repost: repostId
    });
    
    proxyPost('https://api.wasteof.money/posts', data, currentToken, function(response) {
        try {
            var result = JSON.parse(response);
            if (result.ok) {
                document.getElementById('modalPostContent').value = '';
                window.currentRepostId = null;
                document.getElementById('repostPreview').style.display = 'none';
                Modal.alert('Posted successfully!');
                Modal.close();
                
                // Reload feed
                if (currentScreen === 'home') {
                    loadHomeFeed();
                } else if (currentScreen === 'post') {
                    loadPostDetail(currentPostId);
                }
            } else {
                Modal.alert('Failed to post');
            }
        } catch (e) {
            Modal.alert('Error: ' + e.message);
        }
    }, function(error) {
        Modal.alert('Error: ' + error);
    });
}

function showPostComposer() {
    if (!currentToken) {
        Modal.alert('Please log in first');
        return;
    }
    
    window.currentRepostId = null;
    document.getElementById('modalPostContent').value = '';
    document.getElementById('repostPreview').style.display = 'none';
    
    Modal.show('composePostModal');
}

function showRepostOptions(postId, event) {
    event.stopPropagation();
    
    if (!currentToken) {
        Modal.alert('Please log in first');
        return;
    }
    
    var post = window.currentPostForRepost;
    
    Modal.custom(
        'Repost',
        '<p>How would you like to repost this?</p>' +
        '<button onclick="doRepost(\'' + postId + '\')" class="btn" style="width: 100%; margin-bottom: 8px;">Repost</button>' +
        '<button onclick="doQuoteRepost(\'' + postId + '\')" class="btn" style="width: 100%;">Quote</button>',
        function() {}
    );
}

function doRepost(postId) {
    Modal.close();
    
    var data = JSON.stringify({
        post: '',
        repost: postId
    });
    
    proxyPost('https://api.wasteof.money/posts', data, currentToken, function(response) {
        try {
            var result = JSON.parse(response);
            if (result.ok) {
                Modal.alert('Reposted successfully!');
                
                // Reload feed or post detail
                if (currentScreen === 'home') {
                    loadHomeFeed();
                } else if (currentScreen === 'post') {
                    loadPostDetail(currentPostId);
                }
            } else {
                Modal.alert('Failed to repost');
            }
        } catch (e) {
            Modal.alert('Error: ' + e.message);
        }
    }, function(error) {
        Modal.alert('Error: ' + error);
    });
}

function doQuoteRepost(postId) {
    Modal.close();
    
    var post = window.currentPostForRepost;
    window.currentRepostId = postId;
    
    // Show the post being quoted in the preview
    var preview = document.getElementById('repostPreview');
    preview.style.display = 'block';
    preview.innerHTML = '<div style="border: 1px solid #ccc; padding: 8px; background: #f5f5f5; margin-bottom: 12px;">' +
        '<strong>Quoting:</strong><br>' +
        '<div class="post-header">' +
        '<img src="https://api.wasteof.money/users/' + escapeHtml(post.poster.name) + '/picture" class="post-pic-small" alt="">' +
        '@' + escapeHtml(post.poster.name) +
        '</div>' +
        '<div class="post-content">' + sanitizeHtml(post.content) + '</div>' +
        '</div>';
    
    document.getElementById('modalPostContent').value = '';
    Modal.show('composePostModal');
}

// Create comment
function postComment() {
    if (!currentToken) {
        document.getElementById('commentError').innerHTML = 'Please log in first';
        return;
    }
    
    if (!currentPostId) {
        document.getElementById('commentError').innerHTML = 'No post selected';
        return;
    }
    
    var content = document.getElementById('commentContent').value;
    var errorDiv = document.getElementById('commentError');
    
    if (!content.trim()) {
        errorDiv.innerHTML = 'Please enter some content';
        return;
    }
    
    errorDiv.innerHTML = 'Posting comment...';
    errorDiv.className = 'success';
    
    // Wrap content in <p> tags if not already HTML
    if (content.indexOf('<') === -1) {
        content = '<p>' + content + '</p>';
    }
    
    var data = JSON.stringify({
        content: content,
        parent: null
    });
    
    proxyPost('https://api.wasteof.money/posts/' + currentPostId + '/comments', data, currentToken, function(response) {
        try {
            document.getElementById('commentContent').value = '';
            errorDiv.innerHTML = 'Comment posted!';
            errorDiv.className = 'success';
            
            // Reload comments after a short delay
            setTimeout(function() {
                errorDiv.innerHTML = '';
                loadPostComments(currentPostId);
                loadPostDetail(currentPostId);
            }, 1000);
        } catch (e) {
            errorDiv.innerHTML = 'Error: ' + e.message;
            errorDiv.className = 'error';
        }
    }, function(error) {
        errorDiv.innerHTML = 'Error: ' + error;
        errorDiv.className = 'error';
    });
}

// Toggle love on a post
function toggleLove(postId, event) {
    if (event) {
        event.stopPropagation();
    }
    
    if (!currentToken) {
        Modal.alert('Please log in first');
        return;
    }
    
    var loveBtn = document.getElementById('loveBtn-' + postId);
    var loveCount = document.getElementById('loveCount-' + postId);
    
    if (loveBtn) {
        loveBtn.style.opacity = '0.5';
    }
    
    var data = JSON.stringify({});
    
    proxyPost('https://api.wasteof.money/posts/' + postId + '/loves', data, currentToken, function(response) {
        try {
            var result = JSON.parse(response);
            
            if (loveBtn && loveCount) {
                if (result['new'].isLoving) {
                    loveBtn.className = 'post-action loved';
                    loveBtn.innerHTML = '<i class="fa fa-heart"></i> <span id="loveCount-' + postId + '">' + result['new'].loves + '</span>';
                } else {
                    loveBtn.className = 'post-action';
                    loveBtn.innerHTML = '<i class="fa fa-heart-o"></i> <span id="loveCount-' + postId + '">' + result['new'].loves + '</span>';
                }
                loveBtn.style.opacity = '1';
            }
        } catch (e) {
            if (loveBtn) {
                loveBtn.style.opacity = '1';
            }
            console.log('Error toggling love: ' + e.message);
        }
    }, function(error) {
        if (loveBtn) {
            loveBtn.style.opacity = '1';
        }
        console.log('Error: ' + error);
    });
}

// Utility functions
function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function sanitizeHtml(html) {
    // Allow only safe HTML tags
    var allowedTags = ['p', 'br', 'b', 'i', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'img', 'a'];
    
    // Remove script tags and event handlers
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    html = html.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
    
    // Remove javascript: links
    html = html.replace(/javascript:/gi, '');
    
    return html;
}

function formatTimestamp(timestamp) {
    var now = new Date().getTime();
    var diff = now - timestamp;
    
    var minutes = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    
    if (minutes < 1) {
        return 'just now';
    } else if (minutes < 60) {
        return minutes + 'm ago';
    } else if (hours < 24) {
        return hours + 'h ago';
    } else if (days < 7) {
        return days + 'd ago';
    } else {
        var date = new Date(timestamp);
        return date.toLocaleDateString();
    }
}

// Profile functions
function viewProfile(username) {
    currentProfileUser = username;
    currentProfilePage = 1;
    showScreen('profile');
    loadProfileDetail(username);
    loadProfilePosts(username, 1);
}

function loadProfileDetail(username) {
    var container = document.getElementById('profileDetail');
    container.innerHTML = '<div class="loading">Loading profile...</div>';
    
    proxyGet('https://api.wasteof.money/users/' + username, function(response) {
        try {
            var user = JSON.parse(response);
            renderProfileDetail(user);
            
            // Check if we're following this user (only if logged in)
            if (currentToken && currentUser) {
                checkIfFollowing(username);
            }
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading profile</div>';
        }
    }, function(error) {
        container.innerHTML = '<div class="error">Error: ' + error + '</div>';
    });
}

function renderProfileDetail(user) {
    var container = document.getElementById('profileDetail');
    var badges = '';
    
    if (user.verified) {
        badges += '<span class="badge">VERIFIED</span>';
    }
    if (user.permissions && user.permissions.admin) {
        badges += '<span class="badge">ADMIN</span>';
    }
    if (user.beta) {
        badges += '<span class="badge">BETA</span>';
    }
    
    var html = '<div class="profile-header">';
    html += '<img src="https://api.wasteof.money/users/' + escapeHtml(user.name) + '/picture" class="profile-pic-large" alt="">';
    html += '<div class="profile-info">';
    html += '<div class="profile-username">@' + escapeHtml(user.name) + badges;
    
    // Add follow button next to username if logged in
    if (currentToken && currentUser) {
        html += '<button class="btn" id="followBtn" onclick="toggleFollow(\'' + escapeHtml(user.name) + '\')">Follow</button>';
    }
    
    html += '</div>';
    html += '<div class="profile-bio">' + escapeHtml(user.bio || 'No bio') + '</div>';
    html += '<div class="profile-stats">';
    html += '<span class="profile-stat" id="profilePostsCount">' + user.stats.posts + ' posts</span>';
    html += '<span class="profile-stat" id="profileFollowers">' + user.stats.followers + ' followers</span>';
    html += '<span class="profile-stat">' + user.stats.following + ' following</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
}

function checkIfFollowing(username) {
    proxyGet('https://api.wasteof.money/users/' + username + '/followers/' + currentUser, function(response) {
        try {
            var isFollowing = JSON.parse(response);
            var followBtn = document.getElementById('followBtn');
            
            if (followBtn) {
                if (isFollowing === true) {
                    followBtn.innerHTML = 'Unfollow';
                    followBtn.className = 'btn btn-following';
                } else {
                    followBtn.innerHTML = 'Follow';
                    followBtn.className = 'btn';
                }
            }
        } catch (e) {
            console.log('Error checking follow status: ' + e.message);
        }
    }, function(error) {
        console.log('Error checking follow status: ' + error);
    }, currentToken);
}

function toggleFollow(username) {
    if (!currentToken) {
        Modal.alert('Please log in first');
        return;
    }
    
    var followBtn = document.getElementById('followBtn');
    
    if (followBtn) {
        followBtn.disabled = true;
        followBtn.style.opacity = '0.5';
    }
    
    var data = JSON.stringify({});
    
    proxyPost('https://api.wasteof.money/users/' + username + '/followers', data, currentToken, function(response) {
        try {
            var result = JSON.parse(response);
            
            if (followBtn) {
                if (result['new'].isFollowing) {
                    followBtn.innerHTML = 'Unfollow';
                    followBtn.className = 'btn btn-following';
                } else {
                    followBtn.innerHTML = 'Follow';
                    followBtn.className = 'btn';
                }
                followBtn.disabled = false;
                followBtn.style.opacity = '1';
                
                // Update follower count
                var followerStat = document.getElementById('profileFollowers');
                if (followerStat) {
                    followerStat.innerHTML = result['new'].followers + ' followers';
                }
            }
        } catch (e) {
            if (followBtn) {
                followBtn.disabled = false;
                followBtn.style.opacity = '1';
            }
            console.log('Error toggling follow: ' + e.message);
        }
    }, function(error) {
        if (followBtn) {
            followBtn.disabled = false;
            followBtn.style.opacity = '1';
        }
        console.log('Error: ' + error);
    });
}

function loadProfilePosts(username, page) {
    var container = document.getElementById('profilePosts');
    container.innerHTML = '<div class="loading">Loading posts...</div>';
    
    proxyGet('https://api.wasteof.money/users/' + username + '/posts?page=' + page, function(response) {
        try {
            var data = JSON.parse(response);
            renderPosts(data.posts, 'profilePosts');
            
            // Calculate pagination
            var totalPosts = data.posts.length;
            if (totalPosts > 0 || page > 1) {
                renderProfilePagination(username, page, totalPosts === 15);
            }
        } catch (e) {
            container.innerHTML = '<div class="error">Error loading posts</div>';
        }
    }, function(error) {
        container.innerHTML = '<div class="error">Error: ' + error + '</div>';
    });
}

function renderProfilePagination(username, currentPage, hasMore) {
    var container = document.getElementById('profilePagination');
    var html = '<div class="pagination">';
    
    if (currentPage > 1) {
        html += '<button class="page-btn" onclick="loadProfilePage(' + (currentPage - 1) + ')">← Previous</button>';
    }
    
    html += '<span class="page-btn active">Page ' + currentPage + '</span>';
    
    if (hasMore) {
        html += '<button class="page-btn" onclick="loadProfilePage(' + (currentPage + 1) + ')">Next →</button>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function loadProfilePage(page) {
    currentProfilePage = page;
    loadProfilePosts(currentProfileUser, page);
    window.scrollTo(0, 0);
}

