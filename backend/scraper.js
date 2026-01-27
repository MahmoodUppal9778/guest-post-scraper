import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';
import { searchEngines } from './searchEngines.js';

puppeteer.use(StealthPlugin());

// Human-like delays
const randomDelay = (min, max) => {
  return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
};

// Human-like mouse movements
const humanMove = async (page) => {
  const width = await page.evaluate(() => window.innerWidth);
  const height = await page.evaluate(() => window.innerHeight);
  
  await page.mouse.move(
    Math.random() * width,
    Math.random() * height,
    { steps: Math.floor(Math.random() * 25) + 5 }
  );
};

// Human-like scrolling
const humanScroll = async (page) => {
  await page.evaluate(async () => {
    const scrollAmount = Math.random() * 500 + 200;
    window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
  });
  await randomDelay(500, 1500);
};

// Search queries for finding guest posting sites
const generateSearchQueries = (niche, country) => {
  const countryTLD = country ? `.${country.toLowerCase()}` : '';
  const countryName = getCountryName(country);
  
  const queries = [
    // Guest posting queries
    `"${niche}" "write for us"`,
    `"${niche}" "guest post"`,
    `"${niche}" "submit a guest post"`,
    `"${niche}" "become a contributor"`,
    `"${niche}" "contributing writer"`,
    `"${niche}" "guest author"`,
    `"${niche}" "submit article"`,
    `"${niche}" "guest posting guidelines"`,
    `"${niche}" "contributor guidelines"`,
    
    // Link insertion queries
    `"${niche}" "sponsored post"`,
    `"${niche}" "advertise with us"`,
    `"${niche}" "paid post"`,
    `"${niche}" "link insertion"`,
    `"${niche}" "niche edit"`,
    
    // Blog-specific
    `"${niche}" blog "write for us"`,
    `"${niche}" blog "guest post guidelines"`,
  ];

  // Add country-specific queries
  if (countryName) {
    queries.push(
      `"${niche}" "write for us" ${countryName}`,
      `"${niche}" "guest post" site:*${countryTLD}`,
      `"${niche}" blog ${countryName} "submit article"`
    );
  }

  return queries;
};

const getCountryName = (code) => {
  const countries = {
    'us': 'USA',
    'uk': 'UK',
    'gb': 'UK',
    'ca': 'Canada',
    'au': 'Australia',
    'in': 'India',
    'de': 'Germany',
    'fr': 'France',
    'es': 'Spain',
    'it': 'Italy',
    'nl': 'Netherlands',
    'br': 'Brazil',
    'mx': 'Mexico',
  };
  return countries[code?.toLowerCase()] || '';
};

// Extract contact information from page
const extractContactInfo = async (page, url) => {
  try {
    const html = await page.content();
    const $ = cheerio.load(html);
    
    // Find email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const pageText = $('body').text();
    const emails = pageText.match(emailRegex) || [];
    
    // Filter out common non-contact emails
    const filteredEmails = emails.filter(email => 
      !email.includes('example.com') &&
      !email.includes('domain.com') &&
      !email.includes('email.com') &&
      !email.includes('wixpress.com') &&
      !email.includes('sentry.io')
    );

    // Determine if it's guest post or link insertion
    const bodyText = pageText.toLowerCase();
    let type = 'unknown';
    
    if (bodyText.includes('write for us') || 
        bodyText.includes('guest post') || 
        bodyText.includes('guest author') ||
        bodyText.includes('submit article') ||
        bodyText.includes('contributor')) {
      type = 'guest_post';
    }
    
    if (bodyText.includes('sponsored') || 
        bodyText.includes('advertise') ||
        bodyText.includes('paid post') ||
        bodyText.includes('link insertion')) {
      type = type === 'guest_post' ? 'both' : 'link_insertion';
    }

    return {
      contactEmail: filteredEmails[0] || null,
      type,
      title: $('title').text().trim() || $('h1').first().text().trim()
    };
  } catch (error) {
    console.error(`Error extracting info from ${url}:`, error.message);
    return { contactEmail: null, type: 'unknown', title: '' };
  }
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
      '--window-size=1920,1080',
      '--start-maximized'
    ]
  });

  const searchQueries = generateSearchQueries(niche, country);
  const totalQueries = searchQueries.length;
  const visitedUrls = new Set();
  const engine = searchEngines[searchEngine] || searchEngines.duckduckgo;

  try {
    const page = await browser.newPage();
    
    // Set random user agent
    const userAgent = new UserAgent({ deviceCategory: 'desktop' });
    await page.setUserAgent(userAgent.toString());
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Block unnecessary resources for speed
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      onProgress?.(i + 1, totalQueries);
      
      console.log(`Searching: "${query}" on ${searchEngine}`);
      
      try {
        // Navigate to search engine
        const searchUrl = engine.buildUrl(query, country);
        console.log(`Navigating to: ${searchUrl}`);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for specific selector if defined
        if (engine.waitSelector) {
          try {
            await page.waitForSelector(engine.waitSelector, { timeout: 10000 });
          } catch (e) {
            console.log(`Wait selector ${engine.waitSelector} not found, continuing...`);
          }
        }
        
        // Human-like behavior
        await randomDelay(2000, 4000);
        await humanMove(page);
        await humanScroll(page);
        
        // Additional scroll for JS-rendered pages
        if (engine.needsJsRender) {
          await randomDelay(1000, 2000);
          await humanScroll(page);
          await randomDelay(1000, 1500);
        }
        
        // Extract search results with multiple selector strategies
        const results = await page.evaluate((selectors) => {
          const links = new Set();
          const excludeDomains = selectors.excludeDomains || [selectors.excludeDomain];
          
          // Try each result selector
          for (const resultSelector of selectors.resultSelectors || [selectors.resultSelector]) {
            document.querySelectorAll(resultSelector).forEach(el => {
              // Try each link selector
              for (const linkSelector of selectors.linkSelectors || ['a']) {
                el.querySelectorAll(linkSelector).forEach(link => {
                  if (link && link.href && link.href.startsWith('http')) {
                    const isExcluded = excludeDomains.some(domain => link.href.includes(domain));
                    if (!isExcluded) {
                      // Clean tracking parameters
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
          
          // Fallback: get all external links if no results found
          if (links.size === 0) {
            document.querySelectorAll('a[href^="http"]').forEach(link => {
              const isExcluded = excludeDomains.some(domain => link.href.includes(domain));
              if (!isExcluded && !link.href.includes('javascript:')) {
                try {
                  const url = new URL(link.href);
                  links.add(url.origin + url.pathname);
                } catch {
                  links.add(link.href);
                }
              }
            });
          }
          
          return Array.from(links).slice(0, 20);
        }, engine.selectors);

        console.log(`Found ${results.length} results from ${searchEngine}`);

        // Visit each result
        for (const url of results) {
          if (visitedUrls.has(url)) continue;
          visitedUrls.add(url);

          try {
            // Open in new tab for speed
            const newPage = await browser.newPage();
            await newPage.setUserAgent(userAgent.toString());
            
            await newPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
            await randomDelay(1000, 2000);
            
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
              console.log(`Found: ${url} (${info.type})`);
            }
            
            await newPage.close();
          } catch (error) {
            console.error(`Error visiting ${url}:`, error.message);
          }
        }

        // Random delay between searches (human-like)
        await randomDelay(3000, 6000);
        
      } catch (error) {
        console.error(`Error searching "${query}":`, error.message);
      }
    }
  } finally {
    await browser.close();
  }
};

