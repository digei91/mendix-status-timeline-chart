// Opens the harness in headless Edge, moves the real mouse over chart 1 and saves a screenshot (CDP).
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const [, , url, out, x, y] = process.argv;
const edge = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ["--headless=new", "--remote-debugging-port=9333", "--window-size=1400,400", "--allow-file-access-from-files",
   "--user-data-dir=" + process.env.TEMP + "/cdp-edge-tsc", url], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  let pages;
  for (let i = 0; i < 40 && !pages; i++) { await sleep(250); try { pages = await (await fetch("http://127.0.0.1:9333/json")).json(); } catch {} }
  const page = pages.find(p => p.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  let id = 0; const pending = new Map();
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); pending.get(m.id)?.(m.result); });
  const send = (method, params = {}) => new Promise(r => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  await sleep(2000);
  for (let i = 0; i < 3; i++) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: +x + i, y: +y }); await sleep(300); }
  await sleep(800);
  const shot = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(out, Buffer.from(shot.data, "base64"));
  ws.close();
} finally { edge.kill(); }
