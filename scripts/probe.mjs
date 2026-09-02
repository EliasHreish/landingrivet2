/**
 * Ad-hoc DOM probe. Usage: node scripts/probe.mjs <profile> "<js expression>" [scrollTo selector]
 */
import { chromium, devices } from "playwright";
const [profile = "desktop", expr = "1", target] = process.argv.slice(2);
const profiles = {
  desktop: { viewport: { width: 1440, height: 900 } },
  laptop: { viewport: { width: 1280, height: 720 } },
  tablet: { viewport: { width: 834, height: 1112 }, hasTouch: true },
  mobile: { ...devices["iPhone 13"] },
};
const browser = await chromium.launch();
const ctx = await browser.newContext(profiles[profile]);
const page = await ctx.newPage();
await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.waitForTimeout(2400);
if (target) {
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ behavior: "instant", block: "center" }), target);
  await page.waitForTimeout(1500);
}
const out = await page.evaluate(expr);
console.log(JSON.stringify(out, null, 1));
await browser.close();
