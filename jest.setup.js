import '@testing-library/jest-dom';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_API_URL = 'https://api.test.oasisbio.com';
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_OAUTH_API_URL = 'https://api.test.oasisbio.com';
process.env.VITE_OAUTH_CLIENT_ID = 'test-oauth-client-id';
process.env.VITE_OAUTH_REDIRECT_URI = 'oasisbio://oauth/callback';

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    value: jest.fn(),
  });

  Object.defineProperty(window, 'location', {
    writable: true,
    value: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
    },
  });
}

class MockURL {
  constructor(url, base) {
    if (base) {
      this.href = new URL(url, base).href;
    } else {
      this.href = url;
    }
    const parsed = this.parseUrl(this.href);
    this.protocol = parsed.protocol;
    this.host = parsed.host;
    this.hostname = parsed.hostname;
    this.port = parsed.port;
    this.pathname = parsed.pathname;
    this.search = parsed.search;
    this.hash = parsed.hash;
    this.origin = parsed.origin;
    this.searchParams = new MockURLSearchParams(parsed.search);
  }

  parseUrl(url) {
    try {
      const parsed = new URL(url);
      return {
        protocol: parsed.protocol,
        host: parsed.host,
        hostname: parsed.hostname,
        port: parsed.port,
        pathname: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
        origin: parsed.origin,
      };
    } catch {
      return {
        protocol: 'http:',
        host: 'localhost:3000',
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        search: '',
        hash: '',
        origin: 'http://localhost:3000',
      };
    }
  }

  toString() {
    return this.href;
  }

  toJSON() {
    return this.href;
  }
}

class MockURLSearchParams {
  constructor(search) {
    this.params = new Map();
    if (search && search.startsWith('?')) {
      search = search.slice(1);
    }
    if (search) {
      search.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
          this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
        }
      });
    }
  }

  get(key) {
    return this.params.get(key);
  }

  set(key, value) {
    this.params.set(key, value);
  }

  has(key) {
    return this.params.has(key);
  }

  delete(key) {
    this.params.delete(key);
  }

  toString() {
    const pairs = [];
    this.params.forEach((value, key) => {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });
    return pairs.join('&');
  }
}

if (typeof global.URL === 'undefined') {
  global.URL = MockURL;
  global.URLSearchParams = MockURLSearchParams;
}
