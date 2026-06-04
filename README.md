# cf-go-vanity-imports

> **Proof of concept** for a tiny Cloudflare Worker that serves [Go vanity import paths](https://pkg.go.dev/cmd/go#hdr-Remote_import_paths) with just ~25 lines of JavaScript.
>
> Currently powering [`go.carr.sh`](https://go.carr.sh).

Go vanity imports let you use a custom domain (e.g. `go.carr.sh/litmus`) as the canonical import path for your Go modules, while the source code lives on GitHub. This worker handles the handshake between the Go toolchain and your repos.

## How it works

When the Go toolchain fetches a module it sends a `?go-get=1` query parameter. The worker responds with an HTML page containing a `<meta name="go-import">` tag that points to the corresponding GitHub repository:

```console
$ curl 'https://go.carr.sh/arcane?go-get=1'
<!DOCTYPE html><meta name="go-import" content="go.carr.sh/arcane git https://github.com/getarcaneapp/arcane backend">
```

If a regular browser hits the same URL (without `?go-get=1`), the worker redirects to the GitHub repo instead:

```console
$ curl -is 'https://go.carr.sh/arcane' | grep location
location: https://github.com/getarcaneapp/arcane/tree/main/backend
```

## Adding a module

Modules are registered in the `MODULES` object in `src/index.js`. Each property associates a vanity import prefix (i.e. `go.carr.sh/<module name>`) with the Git repo root plus the module's directory inside that repo.

In the example below, the `arcane`, `cli`, and `types` modules all live in the same GitHub repo, but each module has its own root directory within that monorepo:

```js
const REPO_URL = 'https://github.com/getarcaneapp/arcane';

const MODULES = {
  arcane: { repoUrl: REPO_URL, subdir: 'backend' },
  cli: { repoUrl: REPO_URL, subdir: 'cli' },
  types: { repoUrl: REPO_URL, subdir: 'types' },
};
```

### Monorepo / subdirectory modules

If your Go module lives under a subdirectory of the repository, the `go-import` tag must use:

- the **repository root** as `repo-root`, and
- the module directory as the **fourth** `subdir` field.

For example, this is correct for a module that lives in `backend/` inside the `getarcaneapp/arcane` repo:

```html
<meta name="go-import" content="go.carr.sh/arcane git https://github.com/getarcaneapp/arcane backend" />
```

Pointing `repo-root` at a GitHub folder URL like `https://github.com/getarcaneapp/arcane/backend` will not work reliably, because Go expects the root of the VCS repository there.

If you use subdirectory modules, make sure the upstream module metadata lines up too:

- the `module` path in each `go.mod` should match the vanity path you want to publish, and
- version tags should be prefixed with the module directory (for example `backend/v1.2.3`, `cli/v1.2.3`, `types/v1.2.3`).

## Getting started

### Prerequisites

The only prerequisite is [Bun](https://bun.sh/). The specific version of Bun is pinned in the `packageManager` entry of the `package.json` file.

### Install dependencies

Install the worker's dependencies with Bun:

```sh
bun install
```

### Run locally

Run the worker in development mode with hot reloading:

```sh
bun run dev
```

### Run tests

Run tests with coverage reporting (we strive for 100% coverage):

```sh
bun test --coverage
```

### Lint & format

Lint and format the codebase (with auto-fix) using [Biome](https://biomejs.dev/):

```sh
bun run check
```

## Deployment

The worker is deployed to Cloudflare via [Wrangler](https://developers.cloudflare.com/workers/wrangler/):

```sh
bun run deploy
```

Routing is configured in `wrangler.jsonc` to serve requests on the `go.carr.sh` custom domain.

## License

This repo is licensed under the [MIT License](LICENSE).
