# go-vanity

Cloudflare Worker for Go vanity import paths under `go.getarcane.app`.

The Worker has two jobs:

- return `go-import` metadata when the Go toolchain requests `?go-get=1`
- redirect browser requests to the matching GitHub repository path

## Add A Module

Modules are registered in [src/index.ts](src/index.ts):

```ts
const MODULES: Record<string, VanityModule> = {
	arcane: { repoUrl: REPO_URL, subdir: "backend" },
	streams: { repoUrl: STREAMS_REPO_URL },
};
```

Use `subdir` when the Go module lives below the repository root. Omit it for a
module that lives at the root of its own repository.

For example:

- `go.getarcane.app/arcane` maps to `https://github.com/getarcaneapp/arcane`
  with module files in `backend/`
- `go.getarcane.app/streams` maps to
  `https://github.com/getarcaneapp/streams` at the repository root

## Commands

Install dependencies:

```sh
bun install
```

Run the Worker locally:

```sh
bun run dev
```

Run checks:

```sh
bun run check
bun run typecheck
bun test
```

Deploy with Wrangler:

```sh
bun run deploy
```

## Configuration

Worker routing and the TypeScript entrypoint are configured in
[wrangler.jsonc](wrangler.jsonc).

## License

MIT
