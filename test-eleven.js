async function run() {
  const res = await fetch('https://api.elevenlabs.io/v1/flows/image/e715c2ceace9f71c8aa3dcd2dc534d2', { method: 'GET' });
  console.log(res.status, await res.text());
}
run();
