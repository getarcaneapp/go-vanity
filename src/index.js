const REPO_URL = 'https://github.com/getarcaneapp/arcane';
const DEFAULT_BRANCH = 'main';

const MODULES = {
  arcane: { repoUrl: REPO_URL, subdir: 'backend' },
  cli: { repoUrl: REPO_URL, subdir: 'cli' },
  types: { repoUrl: REPO_URL, subdir: 'types' },
};

const GO_GET_RESPONSE_HEADERS = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'no-transform',
};

function getModuleRequest(pathname) {
  const [, moduleName, ...subpathSegments] = pathname.split('/');

  if (!moduleName || !Object.hasOwn(MODULES, moduleName)) {
    return null;
  }

  const module = MODULES[moduleName];

  return {
    moduleName,
    module,
    subpathSegments: subpathSegments.filter(Boolean),
  };
}

function buildGoImportMeta(hostname, moduleName, { repoUrl, subdir }) {
  const metaContent = [`${hostname}/${moduleName}`, 'git', repoUrl, subdir].filter(Boolean).join(' ');

  return `<!DOCTYPE html><meta name="go-import" content="${metaContent}">`;
}

function buildRedirectUrl({ repoUrl, subdir }, subpathSegments) {
  const redirectPath = [subdir, ...subpathSegments].filter(Boolean).join('/');

  return `${repoUrl}/tree/${DEFAULT_BRANCH}/${redirectPath}`;
}

export default {
  async fetch(request) {
    const { hostname, pathname, searchParams } = new URL(request.url);
    const moduleRequest = getModuleRequest(pathname);

    if (!moduleRequest) {
      return new Response('Not Found', { status: 404 });
    }

    const { moduleName, module, subpathSegments } = moduleRequest;

    // Go toolchain request — serve the go-import meta tag
    if (searchParams.get('go-get') === '1') {
      return new Response(buildGoImportMeta(hostname, moduleName, module), {
        headers: GO_GET_RESPONSE_HEADERS,
      });
    }

    return Response.redirect(buildRedirectUrl(module, subpathSegments), 302);
  },
};
