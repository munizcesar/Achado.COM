import requests
url='https://shopee.com.br/product/1215229492/23694229374'
headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'}
resp=requests.get(url, headers=headers, timeout=30)
text=resp.text
for pat in ['api/v4/item/get','api/v4/product/get','api/v4/shop/get','api/v3/item/get','api/v2/item/get','preload','window.__PRELOADED_STATE__','window.__NUXT__','window.__APP_ID__']:
    if pat in text:
        print('found', pat)

# find direct JS endpoints
for line in text.splitlines():
    if 'api/v4' in line or 'api/v2' in line or 'itemid' in line:
        if 'shopee' in line or 'url' in line or 'get' in line:
            print(line.strip())
            break
