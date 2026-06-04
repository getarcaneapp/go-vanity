import { describe, expect, test } from 'bun:test';
import worker from './index.js';

const TEST_DOMAIN = 'go.carr.sh';
const REPO_URL = 'https://github.com/getarcaneapp/arcane';
const MODULES = {
  arcane: 'backend',
  cli: 'cli',
  types: 'types',
};

/**
 * Helper to invoke the worker's fetch handler.
 * @param {string} path - URL path (e.g. "/litmus" or "/litmus?go-get=1")
 * @returns {Promise<Response>}
 */
function request(path) {
  return worker.fetch(new Request(`https://${TEST_DOMAIN}${path}`));
}

function expectedGoImport(hostname, moduleName) {
  return `<meta name="go-import" content="${hostname}/${moduleName} git ${REPO_URL} ${MODULES[moduleName]}">`;
}

function expectedRedirect(moduleName, ...subpathSegments) {
  return `${REPO_URL}/tree/main/${[MODULES[moduleName], ...subpathSegments].join('/')}`;
}

// ---------------------------------------------------------------------------
// Root path
// ---------------------------------------------------------------------------
describe('root path', () => {
  test('returns 404', async () => {
    const res = await request('/');
    expect(res.status).toBe(404);
  });

  test('body says Not Found', async () => {
    const res = await request('/');
    expect(await res.text()).toBe('Not Found');
  });
});

// ---------------------------------------------------------------------------
// Unknown module
// ---------------------------------------------------------------------------
describe('unknown module', () => {
  test('returns 404 for unregistered module', async () => {
    const res = await request('/unknown-module');
    expect(res.status).toBe(404);
  });

  test('body says Not Found', async () => {
    const res = await request('/unknown-module');
    expect(await res.text()).toBe('Not Found');
  });

  test('returns 404 for prototype-inherited key', async () => {
    const res = await request('/__proto__');
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// go-get requests (Go toolchain)
// ---------------------------------------------------------------------------
describe('go-get request', () => {
  test('returns 200', async () => {
    const res = await request('/arcane?go-get=1');
    expect(res.status).toBe(200);
  });

  test('Content-Type is text/html', async () => {
    const res = await request('/arcane?go-get=1');
    expect(res.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
  });

  for (const moduleName of Object.keys(MODULES)) {
    test(`contains go-import meta tag with correct content for ${moduleName}`, async () => {
      const res = await request(`/${moduleName}?go-get=1`);
      const html = await res.text();
      expect(html).toContain(expectedGoImport(TEST_DOMAIN, moduleName));
    });
  }

  test('go-get with subpath still resolves the module', async () => {
    const res = await request('/arcane/pkg?go-get=1');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain(expectedGoImport(TEST_DOMAIN, 'arcane'));
  });
});

// ---------------------------------------------------------------------------
// Browser requests (no go-get param → redirect)
// ---------------------------------------------------------------------------
describe('browser redirect', () => {
  test('returns 302', async () => {
    const res = await request('/arcane');
    expect(res.status).toBe(302);
  });

  for (const moduleName of Object.keys(MODULES)) {
    test(`redirects ${moduleName} to the module directory in GitHub`, async () => {
      const res = await request(`/${moduleName}`);
      expect(res.headers.get('Location')).toBe(expectedRedirect(moduleName));
    });
  }

  test('redirect keeps subpaths inside the module directory', async () => {
    const res = await request('/arcane/pkg/');
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe(expectedRedirect('arcane', 'pkg'));
  });
});

// ---------------------------------------------------------------------------
// Domain derived from request URL
// ---------------------------------------------------------------------------
describe('domain from request URL', () => {
  test('uses the request hostname in go-import meta tag', async () => {
    const res = await worker.fetch(new Request('https://custom.example.com/cli?go-get=1'));
    const html = await res.text();
    expect(html).toContain(expectedGoImport('custom.example.com', 'cli'));
  });
});
