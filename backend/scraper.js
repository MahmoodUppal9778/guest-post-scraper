import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';
import { searchEngines } from './searchEngines.js';
import { getCountryName, getCountryDomainSuffixes } from './country.js';

puppeteer.use(StealthPlugin());

// Configurable delays - can be reduced for speed while maintaining human-like patterns
const DELAYS = {
  searchMin: 1500,      // Min delay between searches
  searchMax: 3000,      // Max delay between searches
  pageLoadMin: 800,     // Min delay after page load
  pageLoadMax: 1500,    // Max delay after page load
  scrollMin: 300,       // Min delay after scroll
  scrollMax: 800,       // Max delay after scroll
  visitMin: 500,        // Min delay when visiting result pages
  visitMax: 1000        // Max delay when visiting result pages
};

// Concurrent page limit for speed
const MAX_CONCURRENT_VISITS = 3;

// Human-like delays with variance
const randomDelay = (min, max) => {
  const variance = (max - min) * 0.2;
  const base = Math.random() * (max - min) + min;
  const jitter = (Math.random() - 0.5) * variance;
  return new Promise(resolve => setTimeout(resolve, Math.max(min, base + jitter)));
};

// Human-like mouse movements (lightweight)
const humanMove = async (page) => {
  try {
    const width = await page.evaluate(() => window.innerWidth);
    const height = await page.evaluate(() => window.innerHeight);
    await page.mouse.move(
      Math.random() * width * 0.8 + width * 0.1,
      Math.random() * height * 0.8 + height * 0.1,
      { steps: Math.floor(Math.random() * 10) + 3 }
    );
  } catch (e) { /* ignore */ }
};

// Human-like scrolling (faster)
const humanScroll = async (page) => {
  try {
    await page.evaluate(() => {
      window.scrollBy({ top: Math.random() * 400 + 150, behavior: 'smooth' });
    });
    await randomDelay(DELAYS.scrollMin, DELAYS.scrollMax);
  } catch (e) { /* ignore */ }
};

// Search queries for finding guest posting sites
const generateSearchQueries = (niche, country) => {
  const countryName = getCountryName(country);
  const countrySuffixes = getCountryDomainSuffixes(country);
  
  // Core queries - reduced set for speed
  const queries = [
    `"${niche}" "write for us"`,
    `"${niche}" "guest post"`,
    `"${niche}" "submit a guest post"`,
    `"${niche}" "become a contributor"`,
    `"${niche}" "guest author"`,
    `"${niche}" "submit article"`,
    `"${niche}" "sponsored post"`,
    `"${niche}" "advertise with us"`,
    `"${niche}" blog "write for us"`,
  ];

  // Country-specific queries
  if (countryName) {
    queries.push(
      `${niche} write for us ${countryName}`,
      `${niche} guest post ${countryName}`,
      `"${niche}" "write for us" ${countryName}`,
      `${niche} blog ${countryName} guest post`
    );
  }

  // ccTLD targeting
  if (countrySuffixes.length > 0) {
    const suffix = countrySuffixes[0]; // Use primary suffix
    queries.push(
      `${niche} write for us site:*${suffix}`,
      `"${niche}" "guest post" site:*${suffix}`
    );
  }

  return queries;
};

const urlMatchesCountry = (url, countryCode) => {
  const suffixes = getCountryDomainSuffixes(countryCode);
  if (!suffixes.length) return true;

  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return suffixes.some((s) => hostname.endsWith(s));
  } catch {
    return false;
  }
};

// Extract contact information from page (optimized)
const extractContactInfo = async (page, url) => {
  try {
    const result = await page.evaluate(() => {
      const bodyText = document.body?.innerText || '';
      const titleText = document.title || document.querySelector('h1')?.textContent || '';
      
      // Find emails
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = bodyText.match(emailRegex) || [];
      const filteredEmails = emails.filter(email => 
        !email.includes('example.com') &&
        !email.includes('domain.com') &&
        !email.includes('wixpress.com') &&
        !email.includes('sentry.io')
      );

      // Determine type
      const lower = bodyText.toLowerCase();
      let type = 'unknown';
      
      if (lower.includes('write for us') || lower.includes('guest post') || 
          lower.includes('guest author') || lower.includes('submit article') ||
          lower.includes('contributor')) {
        type = 'guest_post';
      }
      
      if (lower.includes('sponsored') || lower.includes('advertise') ||
          lower.includes('paid post') || lower.includes('link insertion')) {
        type = type === 'guest_post' ? 'both' : 'link_insertion';
      }

      return {
        contactEmail: filteredEmails[0] || null,
        type,
        title: titleText.trim().substring(0, 200)
      };
    });
    
    return result;
  } catch (error) {
    return { contactEmail: null, type: 'unknown', title: '' };
  }
};

// Process results in parallel batches
const processResultsBatch = async (browser, urls, userAgent, niche, country, query, onResult) => {
  const results = [];
  
  for (let i = 0; i < urls.length; i += MAX_CONCURRENT_VISITS) {
    const batch = urls.slice(i, i + MAX_CONCURRENT_VISITS);
    
    const batchPromises = batch.map(async (url) => {
      let newPage = null;
      try {
        newPage = await browser.newPage();
        await newPage.setUserAgent(userAgent.toString());
        await newPage.setViewport({ width: 1920, height: 1080 });
        
        // Block heavy resources
        await newPage.setRequestInterception(true);
        newPage.on('request', (req) => {
          const type = req.resourceType();
          if (['image', 'stylesheet', 'font', 'media', 'websocket'].includes(type)) {
            req.abort();
          } else {
            req.continue();
          }
        });

        await newPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await randomDelay(DELAYS.visitMin, DELAYS.visitMax);
        
        const info = await extractContactInfo(newPage, url);
        
        if (info.type !== 'unknown') {
          const result = {
            url,
            title: info.title,
            type: info.type,
            contactEmail: info.contactEmail,
            niche,
            country: country || 'global',
            foundDate: new Date().toISOString(),
            searchQuery: query
          };
          onResult?.(result);
          results.push(result);
        }
      } catch (error) {
        // Silent fail for speed
      } finally {
        if (newPage) await newPage.close().catch(() => {});
      }
    });

    await Promise.all(batchPromises);
  }
  
  return results;
};

// Main scraping function
export const scrapeGuestPostingSites = async ({
  niche,
  country,
  searchEngine = 'duckduckgo',
  maxPages = 3,
  onProgress,
  onResult
}) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-infobars',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--no-first-run',
      '--no-zygote'
    ]
  });

  const searchQueries = generateSearchQueries(niche, country);
  const totalQueries = searchQueries.length;
  const visitedUrls = new Set();
  const engine = searchEngines[searchEngine] || searchEngines.duckduckgo;
  const userAgent = new UserAgent({ deviceCategory: 'desktop' });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(userAgent.toString());
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      onProgress?.(i + 1, totalQueries);
      
      console.log(`[${i + 1}/${totalQueries}] Searching: "${query}" on ${searchEngine}`);
      
      try {
        const searchUrl = engine.buildUrl(query, country);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 20000 });
        
        // Wait for results
        if (engine.waitSelector) {
          try {
            await page.waitForSelector(engine.waitSelector, { timeout: 5000 });
          } catch (e) { /* continue anyway */ }
        }
        
        // Human-like behavior
        await randomDelay(DELAYS.pageLoadMin, DELAYS.pageLoadMax);
        await humanMove(page);
        await humanScroll(page);
        
        // Extra scroll for JS-rendered pages
        if (engine.needsJsRender) {
          await humanScroll(page);
        }
        
        // Extract search results
        const results = await page.evaluate((selectors) => {
          const links = new Set();
          const excludeDomains = selectors.excludeDomains || [];
          
          for (const resultSelector of selectors.resultSelectors || []) {
            document.querySelectorAll(resultSelector).forEach(el => {
              for (const linkSelector of selectors.linkSelectors || ['a']) {
                el.querySelectorAll(linkSelector).forEach(link => {
                  if (link?.href?.startsWith('http')) {
                    const isExcluded = excludeDomains.some(d => link.href.includes(d));
                    if (!isExcluded) {
                      try {
                        const url = new URL(link.href);
                        links.add(url.origin + url.pathname);
                      } catch {
                        links.add(link.href);
                      }
                    }
                  }
                });
              }
            });
          }
          
          // Fallback
          if (links.size === 0) {
            document.querySelectorAll('a[href^="http"]').forEach(link => {
              const isExcluded = excludeDomains.some(d => link.href.includes(d));
              if (!isExcluded && !link.href.includes('javascript:')) {
                try {
                  const url = new URL(link.href);
                  links.add(url.origin + url.pathname);
                } catch {}
              }
            });
          }
          
          return Array.from(links).slice(0, 25);
        }, engine.selectors);

        // Filter by country
        const countryFilteredResults = results.filter((url) => {
          if (visitedUrls.has(url)) return false;
          visitedUrls.add(url);
          return urlMatchesCountry(url, country);
        });

        console.log(`Found ${results.length} results (${countryFilteredResults.length} after country filter)`);

        // Process results in parallel
        if (countryFilteredResults.length > 0) {
          await processResultsBatch(browser, countryFilteredResults, userAgent, niche, country, query, onResult);
        }

        // Delay between searches
        await randomDelay(DELAYS.searchMin, DELAYS.searchMax);
        
      } catch (error) {
        console.error(`Error searching "${query}":`, error.message);
      }
    }
  } finally {
    await browser.close();
  }
};
