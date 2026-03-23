import pathlib, re
root = pathlib.Path('src/content/blog')
bad = []
for f in sorted(root.glob('*.md')):
    text = f.read_text(encoding='utf-8')
    if not text.startswith('---\n'):
        bad.append((f.name,'missing---start'))
        continue
    m = re.search(r'^---\n(.*?)\n---', text, re.S)
    if not m:
        bad.append((f.name,'missing---end'))
        continue
    fm = m.group(1)
    if 'title:' not in fm or 'date:' not in fm:
        bad.append((f.name,'missing title/date'))
print('bad:', len(bad))
for b in bad:
    print(b[0],b[1])
