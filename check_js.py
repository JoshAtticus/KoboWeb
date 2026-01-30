import re

def check_js(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    lines = content.split('\n')
    
    # 1. Check for trailing commas
    # This regex looks for a comma, optional whitespace, then a closing bracket/brace
    # It's a heuristic, might find false positives in strings but good for a quick check.
    # We strip comments first to strict it up? simpler to just run regex.
    
    trailing_comma = re.compile(r',(\s*[}\]])')
    
    print("--- Trailing Comma Check ---")
    for i, line in enumerate(lines):
        # simple check: remove strings
        clean_line = re.sub(r'([\'"]).*?\1', '', line) 
        if trailing_comma.search(clean_line):
           print(f"Line {i+1}: Potential trailing comma: {line.strip()}")

    # 2. Check for reserved words as bare keys
    # e.g. default: or class: 
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
    # match patterns like:  key:  or  .key
    for word in reserved:
        # Key in object literal:  default: value
        pattern_key = re.compile(r'[^a-zA-Z0-9_$.]' + word + r'\s*:', re.MULTILINE)
        # Property access: .default
        pattern_dot = re.compile(r'\.' + word + r'[^a-zA-Z0-9_]', re.MULTILINE)
        
        for i, line in enumerate(lines):
             # remove strings
            clean_line = re.sub(r'([\'"]).*?\1', '', line)
            
            if pattern_key.search(clean_line):
                print(f"Line {i+1}: Reserved word '{word}' used as key: {line.strip()}")
            
            # Dot access is usually okay in newer browsers but ES3 hates .default
            if pattern_dot.search(clean_line):
                 print(f"Line {i+1}: Reserved word '{word}' used in dot access: {line.strip()}")

check_js('static/legacy.js')
