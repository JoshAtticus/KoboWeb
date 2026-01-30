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
