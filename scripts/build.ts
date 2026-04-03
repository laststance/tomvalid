import { chmod, mkdir, rm } from "node:fs/promises";

import { build } from "esbuild";

const DISTRIBUTION_DIRECTORY = "./dist";
const CLI_ENTRY = "./src/cli.ts";
const CLI_OUTPUT = `${DISTRIBUTION_DIRECTORY}/cli.cjs`;
const NODE_SHEBANG = "#!/usr/bin/env node\n";

/**
 * Builds the publishable CLI bundle with esbuild.
 * @returns
 * - Resolves after a Node-compatible CLI bundle is written to `dist/cli.js`
 * - Exits the process with code `1` when the build fails
 * @example
 * await buildCli();
 */
const buildCli = async (): Promise<void> => {
	await rm(DISTRIBUTION_DIRECTORY, { force: true, recursive: true });
	await mkdir(DISTRIBUTION_DIRECTORY, { recursive: true });

	await build({
		banner: {
			js: NODE_SHEBANG,
		},
		bundle: true,
		entryPoints: [CLI_ENTRY],
		format: "cjs",
		logLevel: "info",
		outfile: CLI_OUTPUT,
		platform: "node",
		sourcemap: "external",
		target: ["node18"],
	});

	await chmod(CLI_OUTPUT, 0o755);

	console.log(`Built ${CLI_OUTPUT}`);
};

await buildCli();
