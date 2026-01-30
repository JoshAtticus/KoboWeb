
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
