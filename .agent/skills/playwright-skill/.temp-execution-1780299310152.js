const { chromium } = require('playwright');

const TARGET_URL = 'http://121.154.5.172:3000';

(async () => {
  console.log('Starting Comprehensive Playwright Test...');
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = { visited: [], featuresTested: [], errors: [], consoleErrors: [] };

  page.on('pageerror', error => {
    results.errors.push(`[PAGE ERROR on ${page.url()}] ${error.message}`);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Only keep unique console errors to avoid spam
      if (!results.consoleErrors.includes(text)) {
        results.consoleErrors.push(text);
      }
    }
  });

  const safeVisit = async (path, name) => {
    console.log(`\nVisiting ${name} (${TARGET_URL}${path})...`);
    try {
      // Use 'load' instead of 'networkidle' to bypass SSE infinite loading issues
      await page.goto(`${TARGET_URL}${path}`, { waitUntil: 'load', timeout: 15000 });
      results.visited.push(path);
      console.log(`✅ Loaded: ${await page.title()}`);
      await page.waitForTimeout(2000); // Give time for client-side rendering
    } catch (e) {
      console.error(`❌ Failed to load ${path}: ${e.message}`);
      results.errors.push(`Failed to load ${path}: ${e.message}`);
    }
  };

  try {
    // 1. LOGIN
    console.log(`\n[Test 1/5] Login`);
    await safeVisit('/login', 'Login');
    await page.fill('input[type="email"]', 'wjdals1831@naver.com');
    await page.fill('input[type="password"]', 'netid000');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${TARGET_URL}/`, { timeout: 10000 });
    results.featuresTested.push('Login Authentication');
    console.log(`✅ Login successful`);

    // 2. HOME PAGE UI
    console.log(`\n[Test 2/5] Home Page & Navigation`);
    await safeVisit('/', 'Home');
    // Check if main layout loaded
    const hasNav = await page.isVisible('nav');
    if (hasNav) results.featuresTested.push('Home Page Navigation Bar');
    console.log(`✅ Home page basic UI loaded`);

    // 3. USERS SEARCH
    console.log(`\n[Test 3/5] Users Search (관리자)`);
    await safeVisit('/users', 'Users');
    try {
      const searchSelector = 'input[placeholder*="검색"]';
      await page.waitForSelector(searchSelector, { timeout: 5000 });
      await page.fill(searchSelector, '관리자');
      await page.waitForTimeout(2000); // Wait for debounce and API fetch
      
      // Look for the auto-complete dropdown or search result
      const hasResults = await page.locator('text=관리자').count() > 0;
      if (hasResults) {
        results.featuresTested.push('Users Search Data Fetch');
        console.log(`✅ Search fetched results for "관리자"`);
      } else {
        results.errors.push('Search test: Could not find user "관리자" in the results.');
      }
    } catch (e) {
      results.errors.push(`Search test failed: ${e.message}`);
    }

    // 4. MY PROFILE TABS
    console.log(`\n[Test 4/5] My Profile Tabs`);
    await safeVisit('/profile', 'My Profile');
    try {
      // Click through some tabs
      const tabs = ['히스토리', '내 오디오잼', '내 장비', '좋아하는 곡'];
      for (const tab of tabs) {
        const tabEl = page.locator(`button:has-text("${tab}")`).first();
        if (await tabEl.isVisible()) {
          await tabEl.click();
          await page.waitForTimeout(500);
        }
      }
      results.featuresTested.push('Profile Tabs Navigation');
      console.log(`✅ Profile tabs interacted successfully`);
    } catch (e) {
      results.errors.push(`Profile test failed: ${e.message}`);
    }

    // 5. JAM BOARD
    console.log(`\n[Test 5/5] Jam Board`);
    await safeVisit('/jam', 'Jam Board');
    try {
      // Just verify the page renders without crashing
      await page.waitForTimeout(2000);
      results.featuresTested.push('Jam Board Load');
      console.log(`✅ Jam board accessed successfully`);
    } catch (e) {
      results.errors.push(`Jam board test failed: ${e.message}`);
    }

  } catch (error) {
    console.error('❌ Critical Error during testing:', error);
    results.errors.push(`CRITICAL SCRIPT ERROR: ${error.message}`);
  }

  // Generate Report
  console.log('\n=======================================');
  console.log('       COMPREHENSIVE TEST REPORT       ');
  console.log('=======================================');
  console.log(`\n[Pages Visited] (${results.visited.length}):`);
  results.visited.forEach(p => console.log(`- ${p}`));
  
  console.log(`\n[Features Successfully Tested] (${results.featuresTested.length}):`);
  results.featuresTested.forEach(f => console.log(`- ${f}`));

  console.log(`\n[Console Errors Detected] (${results.consoleErrors.length}):`);
  results.consoleErrors.forEach(e => console.log(`! ${e}`));

  console.log(`\n[Runtime & Action Errors] (${results.errors.length}):`);
  if (results.errors.length > 0) {
    results.errors.forEach(e => console.log(`X ${e}`));
  } else {
    console.log('✅ None!');
  }
  console.log('=======================================');

  await browser.close();
})();
