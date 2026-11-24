const res = await fetch("http://localhost:3010/api/auth", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ phone: "09120000001", password: "567890" }),
});
console.log("status:", res.status);
const text = await res.text();
console.log("body:", text.slice(0, 400));
