import https from 'https';
const url = 'https://s.shopee.com.br/6VJGYAnIyH';

function get(url, redirectCount = 0) {
  if (redirectCount > 8) throw new Error('Too many redirects');
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' } }, res => {
      if ([301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        return resolve(get(res.headers.location, redirectCount + 1));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, finalUrl: res.responseUrl || url, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

(async () => {
  try {
    const result = await get(url);
    console.log('finalUrl', result.finalUrl);
    console.log('status', result.status);
    console.log('og:title', result.body.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i));
    console.log('og:image', result.body.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i));
    console.log('titleTag', result.body.match(/<title>([^<]+)<\/title>/i));
    const w = result.body.match(/window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]+?\})\s*;\s*window\./);
    console.log('preloaded', !!w);
    if(w) {
      console.log('preloaded snippet', w[1].slice(0,300));
    }
    const imgJson = result.body.match(/"image"\s*:\s*"(https?:\/\/[^\"]+)"/i);
    console.log('json image', imgJson && imgJson[1]);
    console.log('body snippet', result.body.slice(0, 4000).replace(/\n/g, ' '));
  } catch(e) {
    console.error(e);
  }
})();