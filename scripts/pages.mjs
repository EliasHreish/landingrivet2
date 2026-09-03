/**
 * Capture any page at a breakpoint. Usage:
 *   node scripts/pages.mjs <outDir> <profile> <path> [targets...]
 * targets: css selectors to scroll to, "menu" (open nav), "full" (full page),
 *          "sign" (fill and submit the agreement with a drawn signature),
 *          "print" (the print stylesheet, full page)
 */
import { chromium, devices } from "playwright";
import fs from "node:fs";

const [outDir = "shots", profile = "desktop", urlPath = "/", ...targets] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const profiles = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  laptop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  tablet: { viewport: { width: 834, height: 1112 }, deviceScaleFactor: 1, hasTouch: true },
  mobile: { ...devices["iPhone 13"], deviceScaleFactor: 2 },
};

const browser = await chromium.launch();
const ctx = await browser.newContext(profiles[profile]);
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("dialog", (d) => d.dismiss());

await page.goto(`http://localhost:5173${urlPath}`, { waitUntil: "networkidle" });
await page.waitForTimeout(1600);
const slug = urlPath.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home";

for (const sel of targets) {
  if (sel === "menu") {
    await page.click(".menu-toggle");
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${outDir}/${profile}-${slug}-menu.png` });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(900);
    continue;
  }
  if (sel === "full") {
    await page.screenshot({ path: `${outDir}/${profile}-${slug}-full.png`, fullPage: true });
    continue;
  }
  if (sel === "print") {
    await page.emulateMedia({ media: "print" });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/${profile}-${slug}-print.png`, fullPage: true });
    await page.emulateMedia({ media: "screen" });
    continue;
  }
  if (sel === "sign") {
    const fill = async (name, value) => page.fill(`[name='${name}']`, value);
    await fill("legalName", "Iron House Fitness Co.");
    await fill("tradeName", "Iron House Gym");
    await fill("registrationNumber", "123456");
    await fill("branches", "2");
    await fill("address", "Mecca Street, Umm Uthaina");
    await fill("city", "Amman");
    await fill("signatoryName", "Omar Haddad");
    await fill("signatoryTitle", "Owner");
    await fill("idNumber", "9871234567");
    await fill("phone", "077 123 4567");
    await fill("email", "omar@example.com");
    await page.selectOption("[name='plan']", "growth");
    await fill("startDate", "2026-10-01");
    await fill("place", "Amman");
    const box = await page.locator(".sig__pad canvas").boundingBox();
    await page.locator(".sig__pad canvas").scrollIntoViewIfNeeded();
    const b = await page.locator(".sig__pad canvas").boundingBox();
    const x0 = b.x + 40, y0 = b.y + b.height * 0.55;
    await page.mouse.move(x0, y0);
    await page.mouse.down();
    for (let i = 1; i <= 40; i++) {
      const t = i / 40;
      await page.mouse.move(x0 + t * 260, y0 + Math.sin(t * Math.PI * 4) * 28 - t * 10);
    }
    await page.mouse.up();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${outDir}/${profile}-${slug}-signature.png` });
    for (const c of await page.locator(".check input").all()) await c.check();
    await page.click("#sign-form [type='submit']");
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}/${profile}-${slug}-record.png` });
    const rec = await page.evaluate(() => ({
      hidden: document.getElementById("sign-record").hidden,
      ref: document.querySelector("[data-out='reference']")?.textContent,
      hash: document.querySelector("[data-out='hash']")?.textContent?.slice(0, 16),
      status: document.querySelector(".record__status")?.textContent?.slice(0, 90),
      id: document.querySelector("[data-out='id']")?.textContent,
      sigLen: document.querySelector("[data-out='signature']")?.src?.length,
    }));
    console.log("sign:", JSON.stringify(rec));
    continue;
  }
  await page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return;
    el.scrollIntoView({ behavior: "instant", block: "start" });
    window.scrollBy(0, -8);
  }, sel);
  await page.waitForTimeout(1300);
  const name = sel.replace(/[#.]/g, "").replace(/[^a-z0-9-]/gi, "_");
  await page.screenshot({ path: `${outDir}/${profile}-${slug}-${name}.png` });
}

const overflow = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, vw: window.innerWidth }));
console.log(JSON.stringify({ profile, path: urlPath, overflow, errors }));
await browser.close();
