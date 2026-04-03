import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

import { formatPrettyResult, validateTomlText } from "../src/index";

const currentDirectory = dirname(fileURLToPath(import.meta.url));

/**
 * Reads a TOML fixture from the local test directory.
 * @param fileName - Fixture file name.
 * @returns
 * - The fixture contents as UTF-8 text
 * @example
 * await readFixture('valid.toml');
 */
const readFixture = async (fileName: string): Promise<string> => {
	return await readFile(join(currentDirectory, "fixtures", fileName), "utf8");
};

describe("validateTomlText", () => {
	test("returns success for valid TOML", async () => {
		const source = await readFixture("valid.toml");
		const result = validateTomlText(source, "test/fixtures/valid.toml");

		expect(result.ok).toBe(true);
		if (!result.ok) {
			return;
		}

		expect(result.filePath).toBe("test/fixtures/valid.toml");
	});

	test("returns a structured parse diagnostic for invalid TOML", async () => {
		const source = await readFixture("invalid.toml");
		const result = validateTomlText(source, "test/fixtures/invalid.toml");

		expect(result.ok).toBe(false);
		if (result.ok) {
			return;
		}

		expect(result.diagnostic.kind).toBe("parse");
		expect(result.diagnostic.location?.line).toBe(2);
		expect(result.diagnostic.location?.column).toBeGreaterThan(1);
		expect(result.diagnostic.codeFrame).toContain("^");
		expect(result.diagnostic.summary.length).toBeGreaterThan(0);
	});

	test("formats a readable pretty error message", async () => {
		const source = await readFixture("invalid.toml");
		const result = validateTomlText(source, "test/fixtures/invalid.toml");

		expect(result.ok).toBe(false);
		if (result.ok) {
			return;
		}

		const rendered = formatPrettyResult(result, false);

		expect(rendered).toContain("TOML parse error");
		expect(rendered).toContain("test/fixtures/invalid.toml");
		expect(rendered).toContain("enabled = maybe");
		expect(rendered).toContain("^");
	});
});
