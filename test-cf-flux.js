async function run() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: "A sleek laptop on a desk" })
  });
  console.log(res.status);
  const ct = res.headers.get('content-type');
  console.log(ct);
  if (ct.includes('application/json')) {
    const json = await res.json().catch(()=>null);
    console.log(json?.success, json?.errors);
  } else {
    console.log("Got binary image");
  }
}
run();
