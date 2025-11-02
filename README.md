# KoboWeb - wasteof.money Client for Android 2.0

A lightweight wasteof.money web client designed to work on Android Browser 4 (Android 2.0), specifically targeting the Kobo Touch C e-ink device.

## Features

- **Clock & Date Display**: Shows current time (without seconds for e-ink optimization) and date
- **Explore Tab**: Browse top users and trending posts
- **Login System**: Authenticate with wasteof.money account
- **Home Feed**: View posts from users you follow
- **Post Creation**: Create new posts
- **Post Details**: View individual posts with comments
- **Comment System**: Add comments to posts
- **XSS Protection**: Sanitizes HTML content to prevent malicious scripts

## Compatibility

Built with Android Browser 4 / Android 2.0 in mind:
- Uses ES3/ES5 JavaScript (no modern JS features)
- Simple CSS without flexbox, grid, or advanced features
- XMLHttpRequest for API calls (no fetch API)
- localStorage for session persistence
- Server-side proxy for CORS handling

## Installation

1. Ensure Python 2.7 is installed on your system
2. Navigate to the project directory
3. Run the server:
   ```
   python server.py
   ```
4. Open your browser and navigate to `http://localhost:8080`

## Usage

### Accessing from Kobo Touch C

1. Start the server on a computer on your local network
2. Find your computer's IP address
3. On the Kobo Touch C browser, navigate to `http://[YOUR_IP]:8080`

### Navigation

- **Explore**: Browse trending content (no login required)
- **Login**: Sign in with your wasteof.money credentials
- **Home**: View your personalized feed (requires login)
- **Logout**: Sign out of your account

### Creating Posts

1. Log in to your account
2. Go to the Home tab
3. Type your post in the text area
4. Click "Post"

### Commenting

1. Click on any post to view details
2. Scroll to the comment section
3. Type your comment
4. Click "Comment"

## Technical Details

### Server (server.py)

- Python 2.7 compatible HTTP server
- Proxies API requests to wasteof.money
- Handles CORS issues
- Serves static files

### Client (HTML/CSS/JS)

- **index.html**: Main page structure
- **style.css**: E-ink optimized styling (black & white, simple layout)
- **script.js**: Client-side logic using ES5 JavaScript

### API Integration

The client integrates with the wasteof.money API:
- `GET /explore/users/top` - Top users
- `GET /explore/posts/trending` - Trending posts
- `POST /session` - User login
- `GET /users/{username}/following/posts` - Home feed
- `POST /posts` - Create post
- `GET /posts/{id}` - Post details
- `GET /posts/{id}/comments` - Post comments
- `POST /posts/{id}/comments` - Create comment

### Security

- HTML sanitization to prevent XSS attacks
- Only allows safe HTML tags (p, b, i, h1-h6, etc.)
- Removes script tags and event handlers
- Filters javascript: protocol links

## Limitations

- No nested comment replies (parent always null)
- No real-time updates (manual refresh required)
- Limited to basic HTML styling
- Session stored in localStorage (not ideal but necessary for old browsers)

## License

This project is for educational purposes. wasteof.money is a separate service with its own terms of service.
