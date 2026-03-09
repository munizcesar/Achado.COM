export async function onRequest(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response("Error: Authorization code not found.", { status: 400 });
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 
        'Accept': 'application/json', 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        client_id: context.env.GITHUB_CLIENT_ID,
        client_secret: context.env.GITHUB_CLIENT_SECRET,
        code: code
      })
    });

    const data = await tokenResponse.json();
    
    if (data.error) {
      console.error('GitHub OAuth error:', data);
      return new Response(`Authentication error: ${data.error_description || data.error}`, { status: 500 });
    }

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Autenticando...</title>
</head>
<body>
<script>
  (function() {
    function receiveMessage(e) {
      console.log('receiveMessage', e);
      window.opener.postMessage(
        'authorization:github:success:' + JSON.stringify({
          token: '${data.access_token}',
          provider: 'github'
        }),
        e.origin
      );
    }
    window.addEventListener('message', receiveMessage, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
</script>
</body>
</html>`;
    
    return new Response(html, { 
      headers: { 
        'Content-Type': 'text/html; charset=utf-8'
      } 
    });
  } catch (error) {
    console.error('Callback error:', error);
    return new Response(`Server error: ${error.message}`, { status: 500 });
  }
}
