#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KoboWeb Server - Compatible with Android 2.0 Browser
A simple Python server that hosts the website and acts as a proxy for API requests
"""

import os
import json
import time
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import mimetypes
import re
import imaplib
import smtplib
import email
from email.header import decode_header
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64
import socketserver

TIMEOUT = 30  # Connectivity timeout in seconds

PORT = int(os.getenv('PORT', '3004'))

class ThreadedHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True

class KoboWebHandler(BaseHTTPRequestHandler):
    """Request handler for KoboWeb server"""
    
    ALLOWED_DOMAINS = ['api.wasteof.money', 'wasteof.money', 'i.ibb.co', 'u.cubeupload.com']
    RATE_LIMIT_Window = 60  # seconds
    RATE_LIMIT_MAX_REQUESTS = 60  # requests per window
    request_history = {}

    def is_url_allowed(self, url):
        """Check if the URL is allowed to be proxied"""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if ':' in domain:
                domain = domain.split(':')[0]
            for allowed in self.ALLOWED_DOMAINS:
                if domain == allowed or domain.endswith('.' + allowed):
                    return True
            return False
        except:
            return False

    def check_rate_limit(self):
        """Check if the client has exceeded the rate limit"""
        client_ip = self.client_address[0]
        now = time.time()
        
        if client_ip not in self.request_history:
            self.request_history[client_ip] = []
        
        self.request_history[client_ip] = [t for t in self.request_history[client_ip] if now - t < self.RATE_LIMIT_Window]
        
        if len(self.request_history[client_ip]) >= self.RATE_LIMIT_MAX_REQUESTS:
            return False
            
        self.request_history[client_ip].append(now)
        return True
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/' or path == '/index.html':
            self.serve_file('static/index.html', 'text/html')
        elif path == '/style.css':
            self.serve_file('static/style.css', 'text/css')
        elif path == '/script.js':
            self.serve_file('static/script.js', 'application/javascript')
        elif path == '/bot':
            self.serve_file('static/bot.html', 'text/html')
        elif path.startswith('/api/proxy'):
            # Proxy API requests
            self.handle_proxy_get(parsed_path)
        elif path == '/font-awesome.css':
            # Proxy Font Awesome CSS
            self.proxy_external_file('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css', 'text/css')
        elif path.startswith('/fonts/'):
            # Proxy Font Awesome font files
            font_file = path.split('/')[-1]
            self.proxy_font_file(font_file)
        else:
            self.send_error(404, 'File Not Found')
    
    def do_POST(self):
        """Handle POST requests"""
        # Global rate limit check for POST requests
        if not self.check_rate_limit():
            self.send_error(429, 'Too Many Requests')
            return

        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/api/proxy'):
            self.handle_proxy_post(parsed_path)
        elif path == '/api/imap/connect':
            self.handle_imap_connect()
        elif path == '/api/imap/folders':
            self.handle_imap_folders()
        elif path == '/api/imap/messages':
            self.handle_imap_messages()
        elif path == '/api/imap/message':
            self.handle_imap_message()
        elif path == '/api/imap/send':
            self.handle_imap_send()
        else:
            self.send_error(404, 'Not Found')
    
    def serve_file(self, filepath, content_type):
        """Serve a static file"""
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', len(content))
                self.end_headers()
                self.wfile.write(content)
        except IOError:
            self.send_error(404, 'File Not Found: ' + filepath)
    
    def proxy_external_file(self, url, content_type):
        """Proxy an external file (CSS, fonts, etc.)"""
        try:
            request = urllib.request.Request(url)
            request.add_header('User-Agent', 'KoboWeb/1.0 (+https://kobo.joshattic.us/bot)')
            
            response = urllib.request.urlopen(request, timeout=TIMEOUT)
            data = response.read()
            
            # If it's CSS, rewrite font URLs to point to our proxy
            if content_type == 'text/css':
                data_str = data.decode('utf-8')
                # Rewrite Font Awesome URLs to use our proxy
                data_str = data_str.replace('../fonts/', '/fonts/')
                data_str = data_str.replace('https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/fonts/', '/fonts/')
                data = data_str.encode('utf-8')
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(data))
            self.send_header('Cache-Control', 'public, max-age=86400')
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            print(f'Error proxying file from {url}: {e}')
            self.send_error(500, f'Error proxying file: {str(e)}')
    
    def proxy_font_file(self, filename):
        """Proxy Font Awesome font files"""
        # Determine content type based on extension
        content_types = {
            '.woff2': 'font/woff2',
            '.woff': 'font/woff',
            '.ttf': 'font/ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.svg': 'image/svg+xml'
        }
        
        ext = os.path.splitext(filename)[1].lower()
        content_type = content_types.get(ext, 'application/octet-stream')
        
        font_url = f'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/fonts/{filename}'
        
        try:
            request = urllib.request.Request(font_url)
            request.add_header('User-Agent', 'KoboWeb/1.0 (+https://kobo.joshattic.us/bot)')
            
            response = urllib.request.urlopen(request, timeout=TIMEOUT)
            data = response.read()
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(data))
            self.send_header('Cache-Control', 'public, max-age=31536000')
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            print(f'Error proxying font file {filename}: {e}')
            self.send_error(500, f'Error proxying font: {str(e)}')
    
    def handle_proxy_get(self, parsed_path):
        """Handle GET proxy requests"""
        # Rate limit check
        if not self.check_rate_limit():
            self.send_error(429, 'Too Many Requests')
            return

        query_params = parse_qs(parsed_path.query)
        
        if 'url' not in query_params:
            self.send_error(400, 'Missing url parameter')
            return
        
        target_url = query_params['url'][0]
        
        # Domain allowlist check
        if not self.is_url_allowed(target_url):
            self.send_error(403, 'Forbidden: Domain not allowed')
            return

        auth_token = self.headers.get('Authorization')
        
        try:
            # Make request to wasteof.money API
            request = urllib.request.Request(target_url)
            request.add_header('User-Agent', 'KoboWeb/1.0 (+https://kobo.joshattic.us/bot)')
            
            # Add Forwarded headers
            client_ip = self.client_address[0]
            request.add_header('X-Forwarded-For', client_ip)
            request.add_header('Forwarded', f'for={client_ip}')

            if auth_token:
                request.add_header('Authorization', auth_token)
            
            response = urllib.request.urlopen(request, timeout=TIMEOUT)
            data = response.read()
            
            # Send response back to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', len(data))
            self.end_headers()
            self.wfile.write(data)
        except urllib.error.HTTPError as e:
            error_msg = json.dumps({'error': str(e)}).encode('utf-8')
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(error_msg))
            self.end_headers()
            self.wfile.write(error_msg)
        except Exception as e:
            error_msg = json.dumps({'error': str(e)}).encode('utf-8')
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(error_msg))
            self.end_headers()
            self.wfile.write(error_msg)
    
    def handle_proxy_post(self, parsed_path):
        """Handle POST proxy requests"""
        # Rate limit check
        if not self.check_rate_limit():
            self.send_error(429, 'Too Many Requests')
            return

        query_params = parse_qs(parsed_path.query)
        
        if 'url' not in query_params:
            self.send_error(400, 'Missing url parameter')
            return
        
        target_url = query_params['url'][0]
        
        # Domain allowlist check
        if not self.is_url_allowed(target_url):
            self.send_error(403, 'Forbidden: Domain not allowed')
            return

        try:
            # Read POST data
            content_length = int(self.headers.get('content-length', 0))
            post_data = self.rfile.read(content_length)
            
            # Get authorization header if present
            auth_token = query_params.get('token', [None])[0]
            
            # Make request to wasteof.money API
            request = urllib.request.Request(target_url, data=post_data)
            request.add_header('Content-Type', 'application/json')
            request.add_header('User-Agent', 'KoboWeb/1.0 (+https://kobo.joshattic.us/bot)')
            
            # Add Forwarded headers
            client_ip = self.client_address[0]
            request.add_header('X-Forwarded-For', client_ip)
            request.add_header('Forwarded', f'for={client_ip}')

            if auth_token:
                request.add_header('Authorization', auth_token)
            
            response = urllib.request.urlopen(request, timeout=TIMEOUT)
            data = response.read()
            
            # Send response back to client
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Length', len(data))
            self.end_headers()
            self.wfile.write(data)
        except urllib.error.HTTPError as e:
            error_msg = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(error_msg))
            self.end_headers()
            self.wfile.write(error_msg)
        except Exception as e:
            error_msg = json.dumps({'error': str(e)}).encode('utf-8')
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', len(error_msg))
            self.end_headers()
            self.wfile.write(error_msg)
    
    def handle_imap_connect(self):
        """Test IMAP connection"""
        try:
            content_length = int(self.headers.get('content-length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            server = data.get('server')
            port = data.get('port', 993)
            email_addr = data.get('email')
            password = data.get('password')
            use_ssl = data.get('ssl', True)
            
            # Connect to IMAP server
            mail = None
            try:
                if use_ssl:
                    mail = imaplib.IMAP4_SSL(server, port)
                else:
                    mail = imaplib.IMAP4(server, port)
                
                mail.login(email_addr, password)
                
                result = {'success': True, 'message': 'Connection successful'}
                self.send_json_response(result)
            finally:
                if mail:
                    try:
                        mail.logout()
                    except:
                        pass
        except Exception as e:
            result = {'success': False, 'error': str(e)}
            self.send_json_response(result, 400)
    
    def handle_imap_folders(self):
        """List IMAP folders"""
        try:
            content_length = int(self.headers.get('content-length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            server = data.get('server')
            port = data.get('port', 993)
            email_addr = data.get('email')
            password = data.get('password')
            use_ssl = data.get('ssl', True)
            
            mail = None
            try:
                if use_ssl:
                    mail = imaplib.IMAP4_SSL(server, port)
                else:
                    mail = imaplib.IMAP4(server, port)
                
                mail.login(email_addr, password)
                
                # List all folders
                status, folders = mail.list()
                folder_list = []
                
                if status == 'OK':
                    for folder in folders:
                        # Parse folder name from response
                        # Format: (flags) "delimiter" "folder name"
                        folder_str = folder.decode('utf-8', errors='ignore')
                        # Try to extract the folder name (last quoted string)
                        # Match the last quoted string or unquoted string at the end
                        match = re.search(r'"([^"]+)"\s*$', folder_str)
                        if match:
                            folder_name = match.group(1)
                        else:
                            # Try without quotes
                            parts = folder_str.split()
                            if len(parts) >= 3:
                                folder_name = parts[-1]
                            else:
                                continue
                        folder_list.append(folder_name)
                
                result = {'success': True, 'folders': folder_list}
                self.send_json_response(result)
            finally:
                if mail:
                    try:
                        mail.logout()
                    except:
                        pass
        except Exception as e:
            result = {'success': False, 'error': str(e)}
            self.send_json_response(result, 400)
    
    def handle_imap_messages(self):
        """Fetch message list from folder"""
        try:
            content_length = int(self.headers.get('content-length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            server = data.get('server')
            port = data.get('port', 993)
            email_addr = data.get('email')
            password = data.get('password')
            use_ssl = data.get('ssl', True)
            folder = data.get('folder', 'INBOX')
            limit = data.get('limit', 20)
            
            mail = None
            try:
                if use_ssl:
                    mail = imaplib.IMAP4_SSL(server, port)
                else:
                    mail = imaplib.IMAP4(server, port)
                
                mail.login(email_addr, password)
                
                # Select the folder (mailbox)
                status, response = mail.select(folder)
                if status != 'OK':
                    raise Exception(f'Failed to select folder "{folder}": {response}')
                
                # Search for all messages
                status, messages = mail.search(None, 'ALL')
                message_ids = messages[0].split()
                
                # Get most recent messages
                message_ids = message_ids[-limit:]
                message_ids.reverse()
                
                message_list = []
                
                for msg_id in message_ids:
                    status, msg_data = mail.fetch(msg_id, '(RFC822.HEADER)')
                    
                    if status == 'OK':
                        email_message = email.message_from_bytes(msg_data[0][1])
                        
                        # Decode subject
                        subject = self.decode_mime_words(email_message.get('Subject', '(No Subject)'))
                        
                        # Get sender
                        from_header = self.decode_mime_words(email_message.get('From', ''))
                        
                        # Get date
                        date = email_message.get('Date', '')
                        
                        message_list.append({
                            'id': msg_id.decode(),
                            'subject': subject,
                            'from': from_header,
                            'date': date
                        })
                
                result = {'success': True, 'messages': message_list}
                self.send_json_response(result)
            finally:
                if mail:
                    try:
                        mail.logout()
                    except:
                        pass
        except Exception as e:
            result = {'success': False, 'error': str(e)}
            self.send_json_response(result, 400)
    
    def handle_imap_message(self):
        """Fetch full message content"""
        try:
            content_length = int(self.headers.get('content-length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            server = data.get('server')
            port = data.get('port', 993)
            email_addr = data.get('email')
            password = data.get('password')
            use_ssl = data.get('ssl', True)
            folder = data.get('folder', 'INBOX')
            message_id = data.get('message_id')
            
            mail = None
            try:
                if use_ssl:
                    mail = imaplib.IMAP4_SSL(server, port)
                else:
                    mail = imaplib.IMAP4(server, port)
                
                mail.login(email_addr, password)
                mail.select(folder)
                
                # Fetch the message
                status, msg_data = mail.fetch(message_id.encode(), '(RFC822)')
                
                if status == 'OK':
                    email_message = email.message_from_bytes(msg_data[0][1])
                    
                    # Get headers
                    subject = self.decode_mime_words(email_message.get('Subject', '(No Subject)'))
                    from_header = self.decode_mime_words(email_message.get('From', ''))
                    to_header = self.decode_mime_words(email_message.get('To', ''))
                    date = email_message.get('Date', '')
                    
                    # Get body (now returns dict with html/text/is_html)
                    body_data = self.get_email_body(email_message)
                    
                    result = {
                        'success': True,
                        'message': {
                            'subject': subject,
                            'from': from_header,
                            'to': to_header,
                            'date': date,
                            'body': body_data['html'] if body_data['is_html'] else body_data['text'],
                            'is_html': body_data['is_html']
                        }
                    }
                    self.send_json_response(result)
                else:
                    result = {'success': False, 'error': 'Message not found'}
                    self.send_json_response(result, 404)
            finally:
                if mail:
                    try:
                        mail.logout()
                    except:
                        pass
        except Exception as e:
            result = {'success': False, 'error': str(e)}
            self.send_json_response(result, 400)
    
    def handle_imap_send(self):
        """Send an email via SMTP"""
        try:
            content_length = int(self.headers.get('content-length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            server = data.get('server')
            port = data.get('port', 993)
            email_addr = data.get('email')
            password = data.get('password')
            use_ssl = data.get('ssl', True)
            
            to_addr = data.get('to')
            subject = data.get('subject', '')
            body = data.get('body', '')
            
            # Determine SMTP server from IMAP server
            smtp_server = server.replace('imap', 'smtp')
            smtp_port = 587 if not use_ssl else 465
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = email_addr
            msg['To'] = to_addr
            msg['Subject'] = subject
            
            # Append KoboWeb footer
            footer = "\n\n--\nSent via KoboWeb (https://kobo.joshattic.us)"
            body += footer
            
            # Add plain text and HTML versions
            text_part = MIMEText(body, 'plain', 'utf-8')
            msg.attach(text_part)
            
            # Send email
            if use_ssl and smtp_port == 465:
                smtp = smtplib.SMTP_SSL(smtp_server, smtp_port)
            else:
                smtp = smtplib.SMTP(smtp_server, smtp_port)
                if use_ssl:
                    smtp.starttls()
            
            smtp.login(email_addr, password)
            smtp.send_message(msg)
            smtp.quit()
            
            result = {'success': True, 'message': 'Email sent successfully'}
            self.send_json_response(result)
        except Exception as e:
            result = {'success': False, 'error': str(e)}
            self.send_json_response(result, 400)
    
    def decode_mime_words(self, s):
        """Decode MIME encoded words"""
        if not s:
            return ''
        decoded_fragments = decode_header(s)
        fragments = []
        for fragment, encoding in decoded_fragments:
            if isinstance(fragment, bytes):
                if encoding:
                    try:
                        fragment = fragment.decode(encoding)
                    except:
                        fragment = fragment.decode('utf-8', errors='ignore')
                else:
                    fragment = fragment.decode('utf-8', errors='ignore')
            fragments.append(fragment)
        return ''.join(fragments)
    
    def get_email_body(self, email_message):
        """Extract email body from message - prefer HTML, fallback to plain text"""
        html_body = ""
        plain_body = ""
        
        if email_message.is_multipart():
            for part in email_message.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition"))
                
                if content_type == "text/plain" and "attachment" not in content_disposition:
                    try:
                        plain_body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    except:
                        pass
                elif content_type == "text/html" and "attachment" not in content_disposition:
                    try:
                        html_body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    except:
                        pass
        else:
            content_type = email_message.get_content_type()
            try:
                payload = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
                if content_type == "text/html":
                    html_body = payload
                else:
                    plain_body = payload
            except:
                plain_body = str(email_message.get_payload())
        
        # Return HTML if available, otherwise plain text
        return {
            'html': html_body,
            'text': plain_body,
            'is_html': bool(html_body)
        }
    
    def send_json_response(self, data, status=200):
        """Send JSON response"""
        response = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', len(response))
        self.end_headers()
        self.wfile.write(response)
    
    def log_message(self, format, *args):
        """Override to customize logging"""
        print("%s - - [%s] %s" % (self.client_address[0],
                                   self.log_date_time_string(),
                                   format % args)) 

def main():
    """Start the KoboWeb server"""
    # Create static directory if it doesn't exist
    if not os.path.exists('static'):
        os.makedirs('static')
    
    server = ThreadedHTTPServer(('0.0.0.0', PORT), KoboWebHandler)
    print(f'KoboWeb server running on port {PORT}')
    print(f'Open http://localhost:{PORT} in your browser')
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        server.shutdown()

if __name__ == '__main__':
    main()
