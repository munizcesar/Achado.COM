from pathlib import Path
path = Path('src/content/blog/guia-creatina-performance.md')
text = path.read_text(encoding='utf-8')
marker = '## Conclusão estratégica'
idx = text.find(marker)
if idx == -1:
    print('marker not found')
    raise SystemExit(1)
# keep only until end of first conclusion block
# find double newlines after conclusion block: we keep first block and remove anything after first second heading
# we can safely keep until 'Resultado final' and remove remaining content i.e., second #.
split_marker = '\n# Creatina monohidratada:'
idx2 = text.find(split_marker, idx)
if idx2 != -1:
    text = text[:idx2]
    path.write_text(text, encoding='utf-8')
    print('trimmed duplicated section')
else:
    print('no duplicate section after conclusion')
