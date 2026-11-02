// Grab full-res frames of dev.html shots with headless Chrome (puppeteer-core, system Chrome, GPU on).
// Usage: node grab.mjs out_dir shot:t1,t2,... [shot:t ...] [--dur=N]
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const specs = process.argv.slice(3).filter((a) => !a.startsWith("--"));
const durArg = process.argv.find((a) => a.startsWith("--dur="));
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl", "--window-size=1920,1080"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") console.log("console:", m.text().slice(0, 300));
});
page.on("pageerror", (e) => console.log("pageerror:", e.message));
for (const spec of specs) {
  const [shot, ts] = spec.split(":");
  const times = (ts || "1").split(",").map(Number);
  const dur = durArg ? "&dur=" + durArg.split("=")[1] : "";
  await page.goto(`http://127.0.0.1:8777/dev.html?shot=${shot}&t=${times[0]}&scale=1${dur}`, { waitUntil: "load" });
  await page.waitForFunction("window.__ready === true", { timeout: 60000 });
  for (const t of times) {
    await page.evaluate((t) => window.renderAt(t), t);
    const f = path.join(out, `${shot}_${String(t).replace(".", "_")}.jpg`);
    await page.screenshot({ path: f, type: "jpeg", quality: 88 });
    console.log(f);
  }
}
await browser.close();
