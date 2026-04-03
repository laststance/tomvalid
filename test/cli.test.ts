import { execFile } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, test } from "vitest";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = join(currentDirectory, "..");
const execFileAsync = promisify(execFile);
const validFixturePath = join(
	projectDirectory,
	"test",
	"fixtures",
	"valid.toml",
);
const invalidFixturePath = join(
	projectDirectory,
	"test",
	"fixtures",
	"invalid.toml",
);

/**
 * Runs the source CLI with Node + tsx and captures its text output.
 * @param cliArguments - Arguments passed to `src/cli.ts`.
 * @returns
 * - The process exit code, stdout, and stderr
 * @example
 * await runCli(['./test/fixtures/valid.toml']);
 */
const runCli = async (cliArguments: string[]) => {
	try {
		const result = await execFileAsync(
			process.execPath,
			["--import", "tsx", "./src/cli.ts", ...cliArguments],
			{
				cwd: projectDirectory,
			},
		);

		return { exitCode: 0, stderr: result.stderr, stdout: result.stdout };
	} catch (error: unknown) {
		if (!(error instanceof Error)) {
			throw error;
		}

		const failedProcess = error as Error & {
			code?: number;
			stderr?: string;
			stdout?: string;
		};

		return {
			exitCode: failedProcess.code ?? 1,
			stderr: failedProcess.stderr ?? "",
			stdout: failedProcess.stdout ?? "",
		};
	}
};

describe("cli", () => {
	test("returns success for valid TOML", async () => {
		const result = await runCli([validFixturePath, "--no-color"]);

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("Valid TOML");
		expect(result.stdout).toContain(validFixturePath);
	});

	test("returns a readable parse error for invalid TOML", async () => {
		const result = await runCli([invalidFixturePath, "--no-color"]);

		expect(result.exitCode).toBe(1);
		expect(result.stderr).toContain("TOML parse error");
		expect(result.stderr).toContain("enabled = maybe");
		expect(result.stderr).toContain("^");
	});
});
