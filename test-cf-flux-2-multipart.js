async function run() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  
  const form = new FormData();
  form.append('prompt', 'A sleek laptop on a desk');
  
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-2-klein-4b`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${apiToken}`
    },
    body: form
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
