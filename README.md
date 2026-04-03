# tomvalid

`tomvalid` is a small CLI for validating TOML files and returning readable parse errors.

It is managed with pnpm, built with esbuild, and is designed to work through `npx`.

It is packaged as a small public npm CLI with a conservative publish setup: the published tarball is limited through `files`, the package ships with an MIT license, and publish-time defaults live in `package.json` instead of a repo-local `.npmrc`.

## Features

- Validates a TOML file with `@iarna/toml`
- Prints a compact, human-readable code frame on parse errors
- Supports machine-readable JSON output
- Supports stdin for shell pipelines

## Usage

```bash
npx tomvalid ./config.toml
```

```bash
cat ./config.toml | npx tomvalid --stdin --filename config.toml
```

```bash
npx tomvalid ./config.toml --format json
```

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the CLI directly from source:

```bash
pnpm run dev ./test/fixtures/valid.toml
```

Run checks:

```bash
pnpm run check
```

Build the publishable CLI:

```bash
pnpm run build
```

After building, verify the Node-compatible output:

```bash
node ./dist/cli.cjs ./test/fixtures/valid.toml
```

## Publish Flow

The package is set up for npm publishing.

```bash
npm whoami
npm pack --dry-run
pnpm run prepublishOnly
pnpm publish
```

`prepublishOnly` runs typecheck, lint, tests, and the Node-based build step before publishing.

`publishConfig.access = "public"` is set in `package.json` so the publish intent stays with the package manifest.

Repository metadata now points at `laststance/tomvalid` on GitHub.

See `CONTRIBUTING.md` for the maintainer workflow.
