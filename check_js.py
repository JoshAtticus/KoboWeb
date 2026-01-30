import re

def check_js(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    lines = content.split('\n')
    
    # 1. Check for trailing commas
    # This regex looks for a comma, optional whitespace, then a closing bracket/brace
    # It checks for ,] or ,} which is invalid
    
    trailing_comma = re.compile(r',(\s*[}\]])')
    
    print("--- Trailing Comma Check ---")
    for i, line in enumerate(lines):
        # simple check: remove strings
        clean_line = re.sub(r'([\'"]).*?\1', '', line) 
        if trailing_comma.search(clean_line):
           print(f"Line {i+1}: Potential trailing comma: {line.strip()}")

    # 2. Check for reserved words as bare keys
    reserved = [
        'abstract', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 
        'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 
        'else', 'enum', 'export', 'extends', 'false', 'final', 'finally', 'float', 
        'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 
        'int', 'interface', 'long', 'native', 'new', 'null', 'package', 'private', 
        'protected', 'public', 'return', 'short', 'static', 'super', 'switch', 
        'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 
        'typeof', 'var', 'void', 'volatile', 'while', 'with'
    ]
    
    print("\n--- Reserved Word Key Check ---")
    for word in reserved:
        # Key in object literal:  default: value (needs quote)
        # We look for word followed by colon
        # But we must ensure the word is surrounded by non-word chars
        pattern_key = re.compile(r'(^|[^a-zA-Z0-9_$])' + word + r'\s*:', re.MULTILINE)
        
        # Dot access: .default
        pattern_dot = re.compile(r'\.' + word + r'($|[^a-zA-Z0-9_$])', re.MULTILINE)
        
        for i, line in enumerate(lines):
             # remove strings (basic quote removal)
            clean_line = re.sub(r'([\'"]).*?\1', '', line)
            
            # Remove comments //
            if '//' in clean_line:
                clean_line = clean_line.split('//')[0]

            if pattern_key.search(clean_line):
                # Check if it's a case statement (case value:)
                if word == 'case' or word == 'default':
                     # "default:" is valid in switch, but not "{ default: }"
                     # heuristic: if there is a { before it on the same line?
                     pass
                
                # Ignore "javascript:" protocol
                if "javascript:" in line: continue

                print(f"Line {i+1}: Reserved KEY '{word}': {line.strip()}")
            
            if pattern_dot.search(clean_line):
                 print(f"Line {i+1}: Reserved DOT '{word}': {line.strip()}")

check_js('static/legacy.js')
