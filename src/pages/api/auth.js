export async function GET({ env }) {
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = `https://achadocerto.vip/api/callback`;
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,user`;
  return Response.redirect(authUrl, 302);
}