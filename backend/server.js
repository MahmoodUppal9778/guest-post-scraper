import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { scrapeGuestPostingSites } from './scraper.js';
import { searchEngines } from './searchEngines.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Store results in memory (use database in production)
let scrapingResults = [];
let scrapingStatus = { isRunning: false, progress: 0, total: 0 };

// Get available search engines
app.get('/api/search-engines', (req, res) => {
  res.json(Object.keys(searchEngines));
});

// Start scraping
app.post('/api/scrape', async (req, res) => {
  const { niche, country, searchEngine = 'duckduckgo', maxPages = 3 } = req.body;

  if (!niche) {
    return res.status(400).json({ error: 'Niche is required' });
  }

  if (scrapingStatus.isRunning) {
    return res.status(409).json({ error: 'Scraping already in progress' });
  }

  scrapingStatus = { isRunning: true, progress: 0, total: 0 };
  scrapingResults = [];

  // Run scraping in background
  scrapeGuestPostingSites({
    niche,
    country,
    searchEngine,
    maxPages,
    onProgress: (progress, total) => {
      scrapingStatus.progress = progress;
      scrapingStatus.total = total;
    },
    onResult: (result) => {
      scrapingResults.push(result);
    }
  }).then(() => {
    scrapingStatus.isRunning = false;
  }).catch((error) => {
    console.error('Scraping error:', error);
    scrapingStatus.isRunning = false;
  });

  res.json({ message: 'Scraping started', status: scrapingStatus });
});

// Get scraping status
app.get('/api/status', (req, res) => {
  res.json(scrapingStatus);
});

// Get results
app.get('/api/results', (req, res) => {
  res.json(scrapingResults);
});

// Clear results
app.delete('/api/results', (req, res) => {
  scrapingResults = [];
  res.json({ message: 'Results cleared' });
});

// Export results as CSV
app.get('/api/export', (req, res) => {
  const csv = [
    ['URL', 'Title', 'Type', 'Contact Email', 'DA Score', 'Niche', 'Country', 'Found Date'].join(','),
    ...scrapingResults.map(r => [
      `"${r.url}"`,
      `"${r.title?.replace(/"/g, '""') || ''}"`,
      r.type,
      r.contactEmail || '',
      r.daScore || '',
      r.niche || '',
      r.country || '',
      r.foundDate
    ].join(','))
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=guest-posting-sites.csv');
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

