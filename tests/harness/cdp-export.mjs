// Export test in headless Edge: change options like a user, hide "Done" in the legend, then download PNG + CSV,
// screenshot the open export menu and the print view. Usage: node cdp-export.mjs <outDir>
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const out = process.argv[2];
const url = "file:///C:/Projects/Apps/Mendix%20Chart%20Widget/tests/harness/index.html?only=7&demo=1";
const edge = spawn("C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ["--headless=new", "--remote-debugging-port=9334", "--window-size=1300,1000", "--allow-file-access-from-files",
   "--user-data-dir=" + process.env.TEMP + "/cdp-edge-export", url], { stdio: "ignore" });
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  let pages;
  for (let i = 0; i < 40 && !pages; i++) { await sleep(250); try { pages = await (await fetch("http://127.0.0.1:9334/json")).json(); } catch {} }
  const page = pages.find(p => p.type === "page");
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener("open", r));
  let id = 0; const pending = new Map();
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); pending.get(m.id)?.(m.result); });
  const send = (method, params = {}) => new Promise(r => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  const js = async expr => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }))?.result?.value;
  const click = async (x, y) => { for (const type of ["mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1 }); };
  const clickSel = async sel => { const r = await js(`(() => { const b = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; })()`); await click(r[0], r[1]); };
  const shot = async name => writeFileSync(`${out}/${name}`, Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));

  await send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: out });
  await send("Browser.grantPermissions", { permissions: ["clipboardReadWrite", "clipboardSanitizedWrite"] });
  await send("Runtime.enable");
  await sleep(2500); // render + demo changes (period week, 10 periods, title, y title, legend top, changes per period)
  await click(20, 900); // close the options pop-up the demo opened
  await sleep(400);
  // hide "Done" by clicking its legend box (found by its colour #eda100 in the legend row at the top)
  const done = await js(`(() => { const c = document.querySelector("canvas"); const r = c.getBoundingClientRect(); const ctx = c.getContext("2d");
    const k = c.width / r.width; const d = ctx.getImageData(0, 0, c.width, Math.round(40 * k)).data;
    for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i]-0xed) < 6 && Math.abs(d[i+1]-0xa1) < 6 && d[i+2] < 10) { const p = i / 4; return [r.x + (p % c.width) / k + 3, r.y + Math.floor(p / c.width) / k + 3]; }
    return null; })()`);
  if (done) { await click(done[0], done[1]); }
  await sleep(800);
  await shot("1-screen.png");
  await clickSel('[title="Export"]'); await sleep(400);
  await shot("2-menu.png");
  await clickSel('[role=menuitem]:nth-child(1)'); await sleep(1500);   // Download image
  await clickSel('[title="Export"]'); await sleep(300);
  await clickSel('[role=menuitem]:nth-child(3)'); await sleep(1500);   // Download data (CSV)
  await clickSel('[title="Export"]'); await sleep(300);
  await clickSel('[role=menuitem]:nth-child(2)'); await sleep(1500);   // Copy image
  await shot("4-copy.png");
  const types = await js(`navigator.clipboard.read().then(items => items.flatMap(i => i.types).join(","), e => "read failed: " + e.message)`);
  writeFileSync(`${out}/toast.txt`, String(await js(`document.querySelector(".stc-toast").textContent`)) + " | clipboard: " + types);
  // print view: keep the hidden print frame instead of printing, and show it full size
  await js(`new MutationObserver((list, obs) => { for (const m of list) if (m.target.tagName === "IFRAME") { m.target.onload = null;
    m.target.style.cssText = "position:fixed;left:0;top:0;width:900px;height:1000px;background:#fff;z-index:9999;border:1px solid #999"; obs.disconnect(); } })
    .observe(document.body, { subtree: true, attributes: true, attributeFilter: ["srcdoc"] }); true`);
  await clickSel('[title="Export"]'); await sleep(300);
  await clickSel('[role=menuitem]:nth-child(4)'); await sleep(1500);   // Print or save as PDF
  await shot("3-print.png");
  ws.close();
} finally { edge.kill(); }
