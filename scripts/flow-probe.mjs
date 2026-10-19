#!/usr/bin/env node
/**
 * VidMo → Google Flow live probe
 *
 * Attaches to the Chrome window VidMo already opened (CDP, default port 9333)
 * and inspects the signed-in Flow page. This is a developer tool for mapping
 * Flow's undocumented DOM. It never types prompts or spends credits unless you
 * explicitly pass --click/--type.
 *
 * Usage:
 *   npm run flow:probe                         dump page state + interactive elements
 *   npm run flow:probe -- --shot out.png       also save a screenshot
 *   npm run flow:probe -- --click "Tools"      click the first visible match
 *   npm run flow:probe -- --click "Tools" --shot tools.png
 *   npm run flow:probe -- --eval "location.href"
 *   npm run flow:probe -- --port=9333
 *
 * The server keeps the window open; this script disconnects without closing it.
 */

import { chromium } from 'playwright-core';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const match = args.find((arg) => arg === `--${name}` || arg.startsWith(`--${name}=`));
  if (!match) return fallback;
  if (match === `--${name}`) {
    const index = args.indexOf(match);
    const next = args[index + 1];
    return next && !next.startsWith('--') ? next : fallback;
  }
  return match.slice(name.length + 3);
};
const has = (name) => args.includes(`--${name}`);
const port = option('port', process.env.VIDMO_FLOW_CDP_PORT || '9333');
const shot = option('shot', '');
const clickText = option('click', '');
const clickList = (option('clicks', '') || '')
  .split('||')
  .map((item) => item.trim())
  .filter(Boolean);
const pressKey = option('press', '');
const gotoUrl = option('goto', '');
const afterMs = Number(option('after', '3000')) || 3000;
const settleMs = Number(option('settle', '0')) || 0;
const evalCode = option('eval', '');
const waitMs = Number(option('wait', '800')) || 0;

function summarize(elements) {
  return elements.map((element) => {
    const bits = [element.tag];
    if (element.role) bits.push(`role=${element.role}`);
    if (element.type) bits.push(`type=${element.type}`);
    const flags = [];
    if (element.disabled) flags.push('disabled');
    if (!element.visible) flags.push('hidden');
    const label = element.name ? ` "${element.name}"` : '';
    return `${bits.join(' ')}${label}${flags.length ? ` [${flags.join(',')}]` : ''} @${element.x},${element.y} ${element.width}x${element.height}`;
  });
}

async function main() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, {
    timeout: 15_000,
  });
  const pages = browser.contexts().flatMap((context) => context.pages());
  const page =
    pages.find((candidate) => /flow\.google\.com\/project\//i.test(candidate.url())) ||
    pages.find((candidate) => /flow\.google\.com|labs\.google\/fx\/tools\/flow/i.test(candidate.url())) ||
    pages[0];
  if (!page) throw new Error('No page found in the attached Chrome window.');

  await page.bringToFront().catch(() => {});
  await page.waitForTimeout(waitMs);

  if (gotoUrl) {
    await page.goto(gotoUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 }).catch(() => {});
    await page.waitForTimeout(afterMs);
    const tabs = browser.contexts().flatMap((context) => context.pages());
    console.log(`after goto: ${page.url()}`);
    console.log('tabs now:');
    for (const tab of tabs) console.log(`  ${tab.url()}`);
    const refreshed =
      tabs.find((tab) => /flow\.google\.com\/project\//i.test(tab.url())) ||
      tabs.find((tab) => /flow\.google\.com/i.test(tab.url())) ||
      tabs[tabs.length - 1] ||
      page;
    const active = refreshed;
    const prompt = await active
      .locator('[contenteditable="true"][role="textbox"], textarea, div[role="textbox"]')
      .first()
      .isVisible({ timeout: 2500 })
      .catch(() => false);
    console.log(`prompt visible on active tab: ${prompt}`);
  }

  if (pressKey) {
    await page.keyboard.press(pressKey).catch(() => {});
    await page.waitForTimeout(250);
  }

  console.log(`url:   ${page.url()}`);
  console.log(`title: ${await page.title().catch(() => '')}`);

  const targets = [clickText, ...clickList].filter(Boolean);
  for (const target of targets) {
    if (/^settings trigger$/i.test(target)) {
      const alreadyOpen = await page
        .locator('button[role="radio"]')
        .first()
        .isVisible({ timeout: 300 })
        .catch(() => false);
      if (alreadyOpen) {
        console.log('settings already open');
        continue;
      }
    }
    if (/select model family/i.test(target)) {
      const menuOpen = await page
        .locator('[role="menuitem"]')
        .first()
        .isVisible({ timeout: 300 })
        .catch(() => false);
      if (menuOpen) {
        console.log('model menu already open');
        continue;
      }
    }
    const locators = [
      page.getByRole('button', { name: target, exact: false }),
      page.getByRole('menuitem', { name: target, exact: false }),
      page.getByRole('tab', { name: target, exact: false }),
      page.getByRole('link', { name: target, exact: false }),
      page.getByText(target, { exact: false }),
    ];
    let clicked = false;
    for (const locator of locators) {
      const first = locator.first();
      if (await first.isVisible({ timeout: 700 }).catch(() => false)) {
        await first.click({ timeout: 5000 }).catch(() => {});
        console.log(`clicked: ${target}`);
        clicked = true;
        break;
      }
    }
    if (!clicked) console.log(`not found: ${target}`);
    await page.waitForTimeout(800);
  }

  if (settleMs) await page.waitForTimeout(settleMs);

  const tabsAfter = browser.contexts().flatMap((context) => context.pages());
  console.log('tabs:');
  for (const tab of tabsAfter) console.log(`  ${tab.url()}`);
  console.log(`current: ${page.url()}`);

  if (evalCode) {
    const result = await page.evaluate(evalCode).catch((error) => ({ error: String(error) }));
    console.log('eval:', JSON.stringify(result, null, 2));
  }

  const elements = await page.evaluate(() => {
    const selector =
      'a, button, input, textarea, select, [role="button"], [role="menuitem"], ' +
      '[role="option"], [role="tab"], [role="textbox"], [contenteditable="true"]';
    return [...document.querySelectorAll(selector)].slice(0, 400).map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        role: element.getAttribute('role') || '',
        type: element.getAttribute('type') || '',
        name: (
          element.getAttribute('aria-label') ||
          element.getAttribute('placeholder') ||
          element.innerText ||
          ''
        )
          .trim()
          .replace(/\s+/g, ' ')
          .slice(0, 140),
        href: element.getAttribute('href') || '',
        disabled: Boolean(element.disabled ?? element.getAttribute('aria-disabled') === 'true'),
        visible:
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== 'hidden' &&
          style.display !== 'none',
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    });
  });

  const visible = elements.filter((element) => element.visible);
  console.log(`\nvisible interactive elements (${visible.length}/${elements.length}):`);
  for (const line of summarize(visible)) console.log(`  ${line}`);

  const links = visible.filter((element) => element.href);
  if (links.length) {
    console.log('\nlinks:');
    for (const link of links) console.log(`  ${link.name || '(no text)'} -> ${link.href}`);
  }

  if (shot) {
    const target = path.resolve(shot);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await page.screenshot({ path: target, fullPage: has('full') });
    console.log(`\nscreenshot: ${target}`);
  }

  if (has('aria')) {
    const aria = await page.locator('body').ariaSnapshot({ timeout: 8000 }).catch(() => '');
    console.log('\naria snapshot:\n' + String(aria).slice(0, 20_000));
  }

  await browser.close().catch(() => {});
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exitCode = 1;
});
