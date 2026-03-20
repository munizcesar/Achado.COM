import requests
from urllib.parse import quote
url='https://shopee.com.br/product/1215229492/23694229374'
headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
resp=requests.get(url, headers=headers, allow_redirects=True, timeout=30)
print('final', resp.url)
print('status', resp.status_code)
text=resp.text
print('len', len(text))
print('og:title', bool('og:title' in text), 'og:image', bool('og:image' in text))
print('title', bool('<title>' in text))
print(text[:1500])
