
def check_balance(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    stack = []
    lines = content.split('\n')
    
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char in '{[(':
                stack.append((char, i+1))
            elif char in '}])':
                if not stack:
                    print(f"Error: Unexpected '{char}' at line {i+1}")
                    return
                last, last_line = stack.pop()
                if (last == '{' and char != '}') or \
                   (last == '[' and char != ']') or \
                   (last == '(' and char != ')'):
                    print(f"Error: Mismatched '{last}' (line {last_line}) and '{char}' (line {i+1})")
                    return

    if stack:
        print(f"Error: Unclosed '{stack[-1][0]}' from line {stack[-1][1]}")
    else:
        print("Braces balanced.")

check_balance('static/legacy.js')
