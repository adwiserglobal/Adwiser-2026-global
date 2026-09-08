async function run() {
  const res = await fetch('https://api.cloudflare.com/client/v4/accounts/123/ai/run/@cf/bytedance/stable-diffusion-xl-lightning', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer 123', 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: "cat" })
  });
  console.log(res.status);
  const json = await res.json().catch(()=>null);
  console.log(json);
}
run();
