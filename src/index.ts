const REPO_URL = "https://github.com/getarcaneapp/arcane";
const DEFAULT_BRANCH = "main";

const SYS_REPO_URL = "https://github.com/getarcaneapp/sys";
const KIT_REPO_URL = "https://github.com/getarcaneapp/kit";

interface VanityModule {
	repoUrl: string;
	subdir?: string;
}

interface ModuleRequest {
	moduleName: string;
	module: VanityModule;
	subpathSegments: string[];
}

const MODULES: Record<string, VanityModule> = {
	kit: { repoUrl: KIT_REPO_URL },
	acfs: { repoUrl: KIT_REPO_URL, subdir: "acfs" },
	builds: { repoUrl: KIT_REPO_URL, subdir: "builds" },
	updater: { repoUrl: KIT_REPO_URL, subdir: "updater" },
	streams: { repoUrl: KIT_REPO_URL, subdir: "streams" },
	"sys/bytes": { repoUrl: KIT_REPO_URL, subdir: "sys/bytes" },
	"sys/cgroup": { repoUrl: KIT_REPO_URL, subdir: "sys/cgroup" },
	"sys/crypto": { repoUrl: KIT_REPO_URL, subdir: "sys/crypto" },
	"docker/convert": { repoUrl: KIT_REPO_URL, subdir: "docker/convert" },

	// Remove eventually 
	"sys/atomic": { repoUrl: SYS_REPO_URL, subdir: "atomic" },

	arcane: { repoUrl: REPO_URL, subdir: "backend" },
	cli: { repoUrl: REPO_URL, subdir: "cli" },
	types: { repoUrl: REPO_URL, subdir: "types" },
};

const GO_GET_RESPONSE_HEADERS = {
	"Content-Type": "text/html; charset=utf-8",
	"Cache-Control": "no-transform",
} satisfies HeadersInit;

function getModuleRequest(pathname: string): ModuleRequest | null {
	const pathSegments = pathname.split("/").filter(Boolean);

	for (
		let segmentCount = pathSegments.length;
		segmentCount > 0;
		segmentCount--
	) {
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

function buildGoImportMeta(
	hostname: string,
	moduleName: string,
	{ repoUrl, subdir }: VanityModule,
): string {
	const metaContent = [`${hostname}/${moduleName}`, "git", repoUrl, subdir]
		.filter(Boolean)
		.join(" ");

	return `<!DOCTYPE html><meta name="go-import" content="${metaContent}">`;
}

function buildRedirectUrl(
	{ repoUrl, subdir }: VanityModule,
	subpathSegments: string[],
): string {
	const redirectPath = [subdir, ...subpathSegments].filter(Boolean).join("/");

	return `${repoUrl}/tree/${DEFAULT_BRANCH}/${redirectPath}`;
}

export default {
	async fetch(request: Request): Promise<Response> {
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
