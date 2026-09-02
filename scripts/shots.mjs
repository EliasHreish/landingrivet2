/**
 * Design-review screenshots. Usage:
 *   node scripts/shots.mjs <outDir> [profile] [targets...]
 * profile: desktop | tablet | mobile | wide (default desktop)
 * targets: css selectors to scroll to (default: every section) or "menu" for the open nav
 */
import { chromium, devices } from "playwright";
import fs from "node:fs";

const [outDir = "shots", profile = "desktop", ...targets] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const profiles = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  wide: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  laptop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  tablet: { viewport: { width: 834, height: 1112 }, deviceScaleFactor: 1, hasTouch: true },
  tabletl: { viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1, hasTouch: true },
  mobile: { ...devices["iPhone 13"], deviceScaleFactor: 2 },
  mobiles: { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

const browser = await chromium.launch();
const ctx = await browser.newContext(profiles[profile]);
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(2600);

const list = targets.length ? targets : ["#top", "#why", "#journey", "#step-payments", "#step-members", ".step--end", "#accountability", "#floor", "#region", "#contact", ".footer"];

for (const sel of list) {
  if (sel === "menu") {
    await page.click(".menu-toggle");
    await page.waitForTimeout(1300);
    await page.hover(".menu__link >> nth=2");
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outDir}/${profile}-menu.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(900);
    continue;
  }
  if (sel === "full") {
    await page.screenshot({ path: `${outDir}/${profile}-full.png`, fullPage: true });
    continue;
  }
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return;
    const block = s.startsWith("#step") || s === ".step--end" ? "center" : "start";
    el.scrollIntoView({ behavior: "instant", block });
    if (block === "start") window.scrollBy(0, -8);
  }, sel);
  await page.waitForTimeout(sel.startsWith("#step") || sel === ".step--end" ? 1700 : 1400);
  const name = sel.replace(/[#.]/g, "").replace(/[^a-z0-9-]/gi, "_");
  await page.screenshot({ path: `${outDir}/${profile}-${name}.png` });
}

const overflow = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, vw: window.innerWidth }));
console.log(JSON.stringify({ profile, overflow, errors }, null, 1));
await browser.close();
