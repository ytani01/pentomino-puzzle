#!/usr/bin/env node
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
page.on('console', msg => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
  }
});

await page.goto('http://localhost:8765/tests.html', { waitUntil: 'networkidle' });

// Wait for tests to complete - look for summary element with results
await page.waitForSelector('#summary', { timeout: 30000 });

const summary = await page.textContent('#summary');
const failedTests = await page.evaluate(() => {
  const failures = [];
  document.querySelectorAll('.fail').forEach(el => {
    const name = el.querySelector('.name')?.textContent || 'unknown';
    const reason = el.querySelector('.reason')?.textContent || 'no reason given';
    failures.push({ name, reason });
  });
  return failures;
});

console.log('=== Test Results ===');
console.log('Summary:', summary);
console.log('Failed tests:', failedTests.length);
failedTests.forEach(test => {
  console.log(`  - ${test.name}: ${test.reason}`);
});
console.log('Console errors:', consoleErrors.length);
consoleErrors.forEach(err => {
  console.log(`  - ${err}`);
});

await browser.close();
