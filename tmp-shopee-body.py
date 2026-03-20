import requests
import re
url='https://s.shopee.com.br/6VJGYAnIyH'
headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
resp=requests.get(url, headers=headers, allow_redirects=True, timeout=30)
print('final', resp.url)
print('status', resp.status_code)
text = resp.text
print('len', len(text))
found = [m.group(1) for m in re.finditer(r'window\.__(\w+)', text)]
print('window__', found[:20], 'count', len(found))
print('has itemid', 'itemid' in text)
print('has name', 'name' in text)
print('has image', 'image' in text)
print('has images', 'images' in text)
print('itemid-regex', bool(re.search(r'"itemid"\s*:\s*\"?\d+\"?', text)))
print('name-regex', bool(re.search(r'"name"\s*:\s*"[^\"]+"', text)))
print('images-regex', bool(re.search(r'"images"\s*:\s*\[', text)))
idx = text.find('window.__APP_ID__')
print('APP_ID idx', idx)
print(text[idx:idx+600].replace('\n',' '))
# find product JSON keys in scripts
for k in ['itemid','name','image','images','shopid','price']:
    for m in re.finditer(rf'\"{k}\"\s*:\s*(\"[^\"]+\"|\d+)', text):
        snippet = text[max(0,m.start()-50):m.end()+50]
        print('found', k, m.group(0), 'snippet', snippet.replace('\n',' '))
        break

