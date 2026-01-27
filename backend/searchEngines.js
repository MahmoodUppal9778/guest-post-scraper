// Search engines that are more bot-friendly

export const searchEngines = {
  // DuckDuckGo - Most bot-friendly
  duckduckgo: {
    name: 'DuckDuckGo',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({
        q: query,
        t: 'h_',
        ia: 'web'
      });
      if (country) params.append('kl', `${country}-en`);
      return `https://duckduckgo.com/?${params}`;
    },
    selectors: {
      resultSelector: '[data-testid="result"]',
      excludeDomain: 'duckduckgo.com'
    }
  },

  // Brave Search - Privacy focused, less restrictive
  brave: {
    name: 'Brave Search',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query });
      if (country) params.append('country', country.toUpperCase());
      return `https://search.brave.com/search?${params}`;
    },
    selectors: {
      resultSelector: '.snippet',
      excludeDomain: 'brave.com'
    }
  },

  // Qwant - European, privacy-focused
  qwant: {
    name: 'Qwant',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({
        q: query,
        t: 'web'
      });
      if (country) params.append('r', country.toUpperCase());
      return `https://www.qwant.com/?${params}`;
    },
    selectors: {
      resultSelector: '[data-testid="webResult"]',
      excludeDomain: 'qwant.com'
    }
  },

  // Mojeek - Independent, UK-based
  mojeek: {
    name: 'Mojeek',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query });
      return `https://www.mojeek.com/search?${params}`;
    },
    selectors: {
      resultSelector: '.results-standard li',
      excludeDomain: 'mojeek.com'
    }
  },

  // Ecosia - Tree-planting search engine
  ecosia: {
    name: 'Ecosia',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ q: query });
      return `https://www.ecosia.org/search?${params}`;
    },
    selectors: {
      resultSelector: '.result',
      excludeDomain: 'ecosia.org'
    }
  },

  // Startpage - Uses Google results anonymously
  startpage: {
    name: 'Startpage',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({
        q: query,
        cat: 'web'
      });
      return `https://www.startpage.com/sp/search?${params}`;
    },
    selectors: {
      resultSelector: '.w-gl__result',
      excludeDomain: 'startpage.com'
    }
  },

  // Yandex - Russian search engine, different algorithm
  yandex: {
    name: 'Yandex',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({ text: query });
      return `https://yandex.com/search/?${params}`;
    },
    selectors: {
      resultSelector: '.serp-item',
      excludeDomain: 'yandex'
    }
  },

  // SearXNG - Meta search (if self-hosted)
  searxng: {
    name: 'SearXNG (Public Instance)',
    buildUrl: (query, country) => {
      const params = new URLSearchParams({
        q: query,
        categories: 'general'
      });
      return `https://searx.be/search?${params}`;
    },
    selectors: {
      resultSelector: '.result',
      excludeDomain: 'searx'
    }
  }
};
