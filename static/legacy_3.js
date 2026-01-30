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

