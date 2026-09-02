/**
 * Special captures: intro frames, journey choreography frames, reduced motion,
 * keyboard focus, and form validation. Usage: node scripts/checks.mjs <outDir>
 */
import { chromium, devices } from "playwright";
import fs from "node:fs";
const [outDir = "checks"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();

// 1. Intro frames
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto("http://localhost:5173/", { waitUntil: "domcontentloaded" });
  const t0 = Date.now();
  for (const t of [350, 700, 1100, 1500, 1900, 2600]) {
    const wait = t - (Date.now() - t0);
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `${outDir}/intro-${t}.png`, clip: { x: 0, y: 0, width: 1440, height: 900 } });
  }
  // 2. Journey choreography: jump from step 1 to step 2
  await page.evaluate(() => document.querySelector("#step-sales").scrollIntoView({ behavior: "instant", block: "center" }));
  await page.waitForTimeout(1800);
  await page.evaluate(() => document.querySelector("#step-memberships").scrollIntoView({ behavior: "instant", block: "center" }));
  const t1 = Date.now();
  for (const t of [80, 300, 560, 850, 1100, 1500]) {
    const wait = t - (Date.now() - t1);
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `${outDir}/journey-${t}.png`, clip: { x: 0, y: 80, width: 700, height: 620 } });
  }
  // 3. Keyboard focus states
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(600);
  await page.keyboard.press("Tab"); // skip link
  await page.keyboard.press("Tab"); // brand
  await page.keyboard.press("Tab"); // header cta
  await page.keyboard.press("Tab"); // menu toggle
  await page.screenshot({ path: `${outDir}/focus-toggle.png`, clip: { x: 900, y: 0, width: 540, height: 80 } });
  await page.keyboard.press("Tab"); // hero button
  await page.keyboard.press("Tab"); // hero link
  await page.keyboard.press("Tab"); // plate 1
  await page.screenshot({ path: `${outDir}/focus-plate.png` });
  // open menu with keyboard
  await page.focus(".menu-toggle");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/focus-menu.png` });
  const menuState = await page.evaluate(() => ({ active: document.activeElement?.textContent?.trim(), fs: getComputedStyle(document.querySelector(".menu__label")).fontSize }));
  console.log("menu focus:", JSON.stringify(menuState));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  const afterEsc = await page.evaluate(() => ({ active: document.activeElement?.className, open: document.getElementById("menu").className, htmlCls: document.documentElement.className }));
  console.log("after esc:", JSON.stringify(afterEsc));
  // 4. Form validation
  await page.evaluate(() => document.querySelector("#contact").scrollIntoView({ behavior: "instant" }));
  await page.waitForTimeout(1200);
  await page.click(".form [type=submit]");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${outDir}/form-invalid.png` });
  await page.fill("#f-gym", "Iron House");
  await page.fill("#f-name", "Test");
  await page.fill("#f-phone", "079 000 0000");
  await page.click(".form [type=submit]");
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${outDir}/form-noendpoint.png` });
  await ctx.close();
}

// 5. Reduced motion
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${outDir}/rm-hero.png` });
  await page.evaluate(() => document.querySelector("#step-reception").scrollIntoView({ behavior: "instant", block: "center" }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/rm-journey.png` });
  await page.click(".menu-toggle");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${outDir}/rm-menu.png` });
  await ctx.close();
}

// 6. Mobile menu after fit
{
  const ctx = await browser.newContext({ ...devices["iPhone 13"] });
  const page = await ctx.newPage();
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await page.click(".menu-toggle");
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `${outDir}/mobile-menu.png` });
  await ctx.close();
}
await browser.close();
