import re

with open(r'Z:\osrs\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

script_start_line = html[:html.index('<script>')].count(chr(10)) + 1
m = re.search(r'<script>(.*?)</script>', html, re.DOTALL)
js = m.group(1)

BS = chr(92)
NL = chr(10)

depth = 0
line_num = 1
i = 0
length = len(js)

# Track depth at start of each line
line_depths = {}
line_depths[1] = 0

while i < length:
    ch = js[i]

    if ch == NL:
        line_num += 1
        line_depths[line_num] = depth
        i += 1
        continue

    # Skip single-line comments
    if ch == '/' and i+1 < length and js[i+1] == '/':
        while i < length and js[i] != NL:
            i += 1
        continue

    # Skip multi-line comments
    if ch == '/' and i+1 < length and js[i+1] == '*':
        i += 2
        while i+1 < length and not (js[i] == '*' and js[i+1] == '/'):
            if js[i] == NL:
                line_num += 1
                line_depths[line_num] = depth
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
            if js[i] == NL:
                line_num += 1
                line_depths[line_num] = depth
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
            if js[i] == NL:
                line_num += 1
                line_depths[line_num] = depth
            if js[i] == '$' and i+1 < length and js[i+1] == '{':
                i += 2
                tdepth = 1
                while i < length and tdepth > 0:
                    if js[i] == '{': tdepth += 1
                    elif js[i] == '}': tdepth -= 1
                    elif js[i] == BS: i += 1
                    elif js[i] == NL:
                        line_num += 1
                        line_depths[line_num] = depth
                    i += 1
                continue
            i += 1
        i += 1
        continue

    if ch == '{':
        depth += 1
    elif ch == '}':
        depth -= 1

    i += 1

print(f"Final depth: {depth}")
print()

# Find lines where depth increases and stays elevated
# Look for function/block starts where depth never returns
lines = js.split(NL)
prev = 0
func_opens = []
for ln in range(1, len(lines)+1):
    d = line_depths.get(ln, prev)
    if d > prev and d <= 3:
        html_ln = script_start_line + ln
        content = lines[ln-1].strip()[:100] if ln <= len(lines) else ''
        func_opens.append((ln, html_ln, d, content))
    prev = d

# Now find which opens never have a matching close
# Walk forward from each open, find when depth returns to open_depth - 1
print("Blocks that opened and MAY not close properly:")
for js_ln, html_ln, open_depth, content in func_opens:
    # Check if depth ever returns to open_depth - 1 after this line
    target = open_depth - 1
    found_close = False
    for check_ln in range(js_ln + 1, len(lines) + 1):
        d = line_depths.get(check_ln, open_depth)
        if d <= target:
            found_close = True
            break
    if not found_close:
        print(f"  JS:{js_ln:4d} HTML:{html_ln:4d} depth={open_depth}: {content}")
