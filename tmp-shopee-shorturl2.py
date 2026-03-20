import requests
short_path='opaanlp/1215229492/23694229374'
url=f'https://shopee.com.br/api/v4/pages/is_short_url/?path={short_path}'
headers={'User-Agent':'Mozilla/5.0','Accept':'application/json'}
r=requests.get(url, headers=headers, timeout=30)
print('status', r.status_code)
print(r.text)
