async function run() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  
  const form = new FormData();
  form.append('prompt', 'A sleek laptop on a desk with the text "Hello"');
  
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-2-dev`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiToken}` },
    body: form
  });
  console.log("dev:", res.status);
}
run();
