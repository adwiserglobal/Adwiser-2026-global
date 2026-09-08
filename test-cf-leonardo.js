async function run() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/leonardo/lucid-origin`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: "A sleek laptop on a desk" })
  });
  console.log("JSON response status:", res.status);
  if (res.ok) {
     const ct = res.headers.get('content-type');
     console.log("JSON response type:", ct);
  } else {
     console.log(await res.text());
  }
}
run();
