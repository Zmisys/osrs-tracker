import re

with open(r'Z:\osrs\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

script_start = html.index('<script>') + len('<script>')
script_end = html.index('</script>')
js = html[script_start:script_end]
script_start_line = html[:script_start].count(chr(10)) + 1

BS = chr(92)
NL = chr(10)

depth = 0
i = 0
length = len(js)
pos_to_line = {}
line_num = 1
for ci, c in enumerate(js):
    pos_to_line[ci] = line_num
    if c == NL:
        line_num += 1

depth_changes = []

i = 0
while i < length:
    ch = js[i]

    # Skip single-line comments
    if ch == '/' and i+1 < length and js[i+1] == '/':
        while i < length and js[i] != NL:
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
        old = depth
        depth += 1
        ln = pos_to_line.get(i, 0)
        html_ln = script_start_line + ln - 1
        depth_changes.append(('OPEN', ln, html_ln, old, depth))
    elif ch == '}':
        old = depth
        depth -= 1
        ln = pos_to_line.get(i, 0)
        html_ln = script_start_line + ln - 1
        depth_changes.append(('CLOSE', ln, html_ln, old, depth))

    i += 1

print(f"Final depth: {depth}")
print()

# Find the problem: walk through and find where depth goes to 1 and never returns to 0
# For each OPEN that takes depth from 0->1, find its matching CLOSE (1->0)
stack = []
unclosed = []
for action, js_ln, html_ln, old_d, new_d in depth_changes:
    if action == 'OPEN':
        stack.append((js_ln, html_ln, new_d))
    elif action == 'CLOSE':
        if stack:
            stack.pop()

# Anything left on stack is unclosed
print(f"Unclosed blocks remaining on stack: {len(stack)}")
lines = js.split(NL)
for js_ln, html_ln, d in stack:
    content = lines[js_ln - 1].strip()[:120] if js_ln <= len(lines) else '??'
    print(f"  JS:{js_ln:4d} HTML:{html_ln:4d} depth={d}: {content}")
