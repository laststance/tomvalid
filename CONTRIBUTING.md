# Contributing

## Development

```bash
pnpm install
pnpm run check
pnpm run build
```

Run the CLI from source:

```bash
pnpm run dev ./test/fixtures/valid.toml
```

## Publish Checklist

```bash
npm whoami
npm pack --dry-run
pnpm run prepublishOnly
pnpm publish
```

## Notes

- `tomvalid` intentionally keeps publish behavior in `package.json#publishConfig`.
- A repo-local `.npmrc` is not included because it can override developer-specific npm settings.
- Repository metadata fields such as `repository`, `bugs`, and `homepage` should be added once this directory is backed by a real git remote.
