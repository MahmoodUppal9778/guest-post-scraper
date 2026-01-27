// Search engines configuration with working selectors and geo-targeting
// Supports all 193 UN member countries

// Language codes for countries
const languageCodes = {
  // English
  us: 'en', gb: 'en', uk: 'en', ca: 'en', au: 'en', nz: 'en', ie: 'en', za: 'en',
  ng: 'en', gh: 'en', ke: 'en', ug: 'en', tz: 'en', zw: 'en', jm: 'en', tt: 'en',
  bs: 'en', bb: 'en', bz: 'en', gy: 'en', sg: 'en', ph: 'en', in: 'en', pk: 'en',
  bd: 'en', lk: 'en', mt: 'en', fj: 'en', pg: 'en', sb: 'en', vu: 'en', ws: 'en',
  to: 'en', ki: 'en', nr: 'en', tv: 'en', mh: 'en', fm: 'en', pw: 'en',
  // Spanish
  es: 'es', mx: 'es', ar: 'es', co: 'es', pe: 'es', ve: 'es', cl: 'es', ec: 'es',
  gt: 'es', cu: 'es', bo: 'es', do: 'es', hn: 'es', py: 'es', sv: 'es', ni: 'es',
  cr: 'es', pa: 'es', uy: 'es', gq: 'es',
  // Portuguese
  pt: 'pt', br: 'pt', ao: 'pt', mz: 'pt', cv: 'pt', gw: 'pt', st: 'pt', tl: 'pt',
  // French
  fr: 'fr', be: 'fr', ch: 'fr', lu: 'fr', mc: 'fr', sn: 'fr', ci: 'fr', ml: 'fr',
  bf: 'fr', ne: 'fr', tg: 'fr', bj: 'fr', ga: 'fr', cg: 'fr', cd: 'fr', cm: 'fr',
  cf: 'fr', td: 'fr', dj: 'fr', km: 'fr', mg: 'fr', mu: 'fr', sc: 'fr', ht: 'fr',
  rw: 'fr', bi: 'fr',
  // German
  de: 'de', at: 'de', li: 'de',
  // Italian
  it: 'it', sm: 'it', va: 'it',
  // Dutch
  nl: 'nl', sr: 'nl',
  // Russian
  ru: 'ru', by: 'ru', kz: 'ru', kg: 'ru', tj: 'ru',
  // Arabic
  sa: 'ar', ae: 'ar', eg: 'ar', iq: 'ar', jo: 'ar', lb: 'ar', sy: 'ar', ye: 'ar',
  om: 'ar', kw: 'ar', bh: 'ar', qa: 'ar', ly: 'ar', tn: 'ar', dz: 'ar', ma: 'ar',
  mr: 'ar', sd: 'ar', so: 'ar', ss: 'ar',
  // Chinese
  cn: 'zh',
  // Japanese
  jp: 'ja',
  // Korean
  kr: 'ko', kp: 'ko',
  // Other
  tr: 'tr', ir: 'fa', il: 'he', th: 'th', vn: 'vi', id: 'id', my: 'ms',
  pl: 'pl', cz: 'cs', sk: 'sk', hu: 'hu', ro: 'ro', bg: 'bg', rs: 'sr',
  hr: 'hr', si: 'sl', ba: 'bs', mk: 'mk', al: 'sq', me: 'sr', gr: 'el',
  cy: 'el', ua: 'uk', md: 'ro', ge: 'ka', am: 'hy', az: 'az', uz: 'uz',
  tm: 'tk', mn: 'mn', np: 'ne', bt: 'dz', mm: 'my', kh: 'km', la: 'lo',
  af: 'ps', mv: 'dv', lv: 'lv', lt: 'lt', ee: 'et', fi: 'fi', se: 'sv',
  no: 'no', dk: 'da', is: 'is', ad: 'ca', mw: 'ny', rw: 'rw', bi: 'rn',
  sz: 'ss', ls: 'st', bw: 'tn', na: 'af', er: 'ti', et: 'am'
};

const getLanguage = (country) => languageCodes[country?.toLowerCase()] || 'en';

// Build geo params dynamically for any country
const buildGoogleGeo = (country) => {
  if (!country) return {};
  const c = country.toUpperCase();
  return { cr: `country${c}`, gl: country.toLowerCase(), hl: getLanguage(country) };
};

export const searchEngines = {
  // Google - Most comprehensive
  google: {
    name: 'Google',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query, num: '30' });
      if (country) {
        const geo = buildGoogleGeo(country);
        Object.entries(geo).forEach(([k, v]) => params.append(k, v));
      }
      return `https://www.google.com/search?${params}`;
    },
    selectors: {
      resultSelectors: ['div.g', 'div[data-sokoban-container]', '.tF2Cxc', '.yuRUbf', '[data-hveid]'],
      linkSelectors: ['a[href^="http"]', 'a[data-ved]'],
      excludeDomains: ['google.com', 'youtube.com', 'maps.google', 'translate.google']
    },
    waitSelector: '#search'
  },

  // DuckDuckGo - Bot-friendly
  duckduckgo: {
    name: 'DuckDuckGo',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query, t: 'h_', ia: 'web' });
      if (country) {
        const lang = getLanguage(country);
        params.append('kl', `${country.toLowerCase()}-${lang}`);
      }
      return `https://duckduckgo.com/?${params}`;
    },
    selectors: {
      resultSelectors: ['article[data-testid="result"]', '[data-testid="result"]', '.result', '.nrn-react-div', 'li[data-layout="organic"]'],
      linkSelectors: ['a[data-testid="result-title-a"]', 'a[href^="http"]'],
      excludeDomains: ['duckduckgo.com']
    },
    waitSelector: '[data-testid="result"]',
    needsJsRender: true
  },

  // Brave Search
  brave: {
    name: 'Brave Search',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query, source: 'web' });
      if (country) params.append('country', country.toLowerCase());
      return `https://search.brave.com/search?${params}`;
    },
    selectors: {
      resultSelectors: ['.snippet', '.snippet-content', '[data-type="web"]', '.fdb'],
      linkSelectors: ['a.result-header', 'a[href^="http"]'],
      excludeDomains: ['brave.com']
    },
    waitSelector: '.snippet'
  },

  // Qwant - European
  qwant: {
    name: 'Qwant',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query, t: 'web' });
      if (country) {
        params.append('r', country.toUpperCase());
        params.append('locale', `${getLanguage(country)}_${country.toUpperCase()}`);
      }
      return `https://www.qwant.com/?${params}`;
    },
    selectors: {
      resultSelectors: ['[data-testid="webResult"]', '.web-result', '[class*="WebResult"]', 'div[data-testid]', '.result'],
      linkSelectors: ['a[href^="http"]'],
      excludeDomains: ['qwant.com']
    },
    waitSelector: '[data-testid="serp"]',
    needsJsRender: true
  },

  // Mojeek - Independent UK-based
  mojeek: {
    name: 'Mojeek',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query, fmt: 'html' });
      if (country) params.append('reg', country.toLowerCase());
      return `https://www.mojeek.com/search?${params}`;
    },
    selectors: {
      resultSelectors: ['.results-standard li', '.result-col', 'ul.results-standard > li', '.result'],
      linkSelectors: ['a.ob', 'a[href^="http"]'],
      excludeDomains: ['mojeek.com']
    },
    waitSelector: '.results-standard'
  },

  // Ecosia - Tree-planting
  ecosia: {
    name: 'Ecosia',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query, addon: 'opensearch' });
      if (country) params.append('c', country.toUpperCase());
      return `https://www.ecosia.org/search?${params}`;
    },
    selectors: {
      resultSelectors: ['.result', '[data-test-id="mainline-result-web"]', '.mainline__result', 'article'],
      linkSelectors: ['a.result__link', 'a[href^="http"]'],
      excludeDomains: ['ecosia.org']
    },
    waitSelector: '.mainline'
  },

  // Startpage - Uses Google anonymously
  startpage: {
    name: 'Startpage',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query, cat: 'web', pl: '', sc: '' });
      if (country) {
        const lang = getLanguage(country);
        params.append('language', lang === 'en' ? 'english' : lang);
        params.append('lui', lang);
      }
      return `https://www.startpage.com/sp/search?${params}`;
    },
    selectors: {
      resultSelectors: ['.w-gl__result', '.result', '.search-result', '.w-gl__result-url'],
      linkSelectors: ['a.w-gl__result-url', 'a[href^="http"]'],
      excludeDomains: ['startpage.com']
    },
    waitSelector: '.w-gl'
  },

  // Yandex - Russian
  yandex: {
    name: 'Yandex',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ text: query });
      // Yandex uses numeric region codes, fallback to generic
      if (country) params.append('lr', '0'); // 0 = worldwide
      return `https://yandex.com/search/?${params}`;
    },
    selectors: {
      resultSelectors: ['.serp-item', '.organic', '[data-cid]', '.Organic'],
      linkSelectors: ['a.link', 'a.OrganicTitle-Link', 'a[href^="http"]'],
      excludeDomains: ['yandex.com', 'yandex.ru']
    },
    waitSelector: '.serp-list'
  },

  // SearXNG - Meta search
  searxng: {
    name: 'SearXNG',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query, categories: 'general' });
      if (country) {
        const lang = getLanguage(country);
        params.append('language', `${lang}-${country.toUpperCase()}`);
      }
      return `https://searx.be/search?${params}`;
    },
    selectors: {
      resultSelectors: ['.result', 'article.result', '.result-default', '#urls article'],
      linkSelectors: ['a.url_wrapper', 'h3 a', 'a[href^="http"]'],
      excludeDomains: ['searx.be', 'searx']
    },
    waitSelector: '#results'
  }
};
