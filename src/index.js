const REPO_URL = "https://github.com/getarcaneapp/arcane";
const DEFAULT_BRANCH = "main";

const UPDATER_REPO_URL = "https://github.com/getarcaneapp/updater";
const BUILDS_REPO_URL = "https://github.com/getarcaneapp/builds";
const SYS_REPO_URL = "https://github.com/getarcaneapp/sys";
const DOCKER_REPO_URL = "https://github.com/getarcaneapp/docker";

const MODULES = {
  arcane: { repoUrl: REPO_URL, subdir: "backend" },
  cli: { repoUrl: REPO_URL, subdir: "cli" },
  types: { repoUrl: REPO_URL, subdir: "types" },
  updater: { repoUrl: UPDATER_REPO_URL },
  builds: { repoUrl: BUILDS_REPO_URL },
  sys: { repoUrl: SYS_REPO_URL },
  "sys/atomic": { repoUrl: SYS_REPO_URL, subdir: "atomic" },
  "sys/cgroup": { repoUrl: SYS_REPO_URL, subdir: "cgroup" },
  "sys/crypto": { repoUrl: SYS_REPO_URL, subdir: "crypto" },
  "docker/convert": { repoUrl: DOCKER_REPO_URL, subdir: "convert" },
};

const GO_GET_RESPONSE_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-transform",
};

function getModuleRequest(pathname) {
  const pathSegments = pathname.split("/").filter(Boolean);

  for (let segmentCount = pathSegments.length; segmentCount > 0; segmentCount--) {
    const moduleName = pathSegments.slice(0, segmentCount).join("/");
    if (!Object.hasOwn(MODULES, moduleName)) {
      continue;
    }

    return {
      moduleName,
      module: MODULES[moduleName],
      subpathSegments: pathSegments.slice(segmentCount),
    };
  }

  return null;
}

function buildGoImportMeta(hostname, moduleName, { repoUrl, subdir }) {
  const metaContent = [`${hostname}/${moduleName}`, "git", repoUrl, subdir].filter(Boolean).join(" ");

  return `<!DOCTYPE html><meta name="go-import" content="${metaContent}">`;
}

function buildRedirectUrl({ repoUrl, subdir }, subpathSegments) {
  const redirectPath = [subdir, ...subpathSegments].filter(Boolean).join("/");

  return `${repoUrl}/tree/${DEFAULT_BRANCH}/${redirectPath}`;
}

export default {
  async fetch(request) {
    const { hostname, pathname, searchParams } = new URL(request.url);
    const moduleRequest = getModuleRequest(pathname);

    if (!moduleRequest) {
      return new Response("Not Found", { status: 404 });
    }

    const { moduleName, module, subpathSegments } = moduleRequest;

    // Go toolchain request — serve the go-import meta tag
    if (searchParams.get("go-get") === "1") {
      return new Response(buildGoImportMeta(hostname, moduleName, module), {
        headers: GO_GET_RESPONSE_HEADERS,
      });
    }

    return Response.redirect(buildRedirectUrl(module, subpathSegments), 302);
  },
};
