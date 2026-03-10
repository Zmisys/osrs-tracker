import re

with open(r'Z:\osrs\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

m = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
js = m.group(1)

opens = 0
closes = 0
i = 0
length = len(js)
BS = chr(92)  # backslash

while i < length:
    ch = js[i]

    # Skip single-line comments
    if ch == '/' and i+1 < length and js[i+1] == '/':
        while i < length and js[i] != chr(10):
            i += 1
        continue

    # Skip multi-line comments
    if ch == '/' and i+1 < length and js[i+1] == '*':
        i += 2
        while i+1 < length and not (js[i] == '*' and js[i+1] == '/'):
            i += 1
        i += 2
        continue

    # Skip strings
    if ch in ('"', "'"):
        quote = ch
        i += 1
        while i < length:
            if js[i] == BS:
                i += 2
                continue
            if js[i] == quote:
                break
            i += 1
        i += 1
        continue

    # Skip template literals
    if ch == '`':
        i += 1
        while i < length:
            if js[i] == BS:
                i += 2
                continue
            if js[i] == '`':
                break
            if js[i] == '$' and i+1 < length and js[i+1] == '{':
                i += 2
                tdepth = 1
                while i < length and tdepth > 0:
                    if js[i] == '{': tdepth += 1
                    elif js[i] == '}': tdepth -= 1
                    elif js[i] == BS: i += 1
                    i += 1
                continue
            i += 1
        i += 1
        continue

    if ch == '{':
        opens += 1
    elif ch == '}':
        closes += 1

    i += 1

print(f"Open braces: {opens}")
print(f"Close braces: {closes}")
print(f"Balanced: {opens == closes}")
if opens != closes:
    print(f"Difference: {opens - closes} (positive = missing closes)")
