import { defineCommand, runMain } from "citty";
import packageJson from "../package.json";

import { formatValidationResult } from "./formatters";
import { readStandardInput } from "./input";
import type { OutputFormat, ValidationResult } from "./types";
import { validateTomlFile, validateTomlText } from "./validate";

/**
 * Resolves the CLI input source and validates it.
 * @param options - The parsed CLI options.
 * @returns
 * - A validation result for the requested file or stdin payload
 * - `undefined` when the CLI arguments are invalid and an error was already printed
 * @example
 * await resolveValidationResult({ file: './config.toml', stdin: false, filename: '<stdin>' });
 */
const resolveValidationResult = async (options: {
	file?: string;
	stdin: boolean;
	filename: string;
}): Promise<ValidationResult | undefined> => {
	if (options.stdin && options.file != null) {
		console.error("Choose either a file path or --stdin, not both.");
		process.exitCode = 1;
		return undefined;
	}

	if (!options.stdin && options.file == null) {
		console.error("Provide a TOML file path or use --stdin.");
		process.exitCode = 1;
		return undefined;
	}

	if (options.stdin) {
		if (process.stdin.isTTY) {
			console.error("No TOML input received on stdin.");
			process.exitCode = 1;
			return undefined;
		}

		const source = await readStandardInput();
		return validateTomlText(source, options.filename);
	}

	const filePath = options.file;
	if (filePath == null) {
		return undefined;
	}

	return await validateTomlFile(filePath);
};

const main = defineCommand({
	meta: {
		name: "tomvalid",
		version: packageJson.version,
		description: "Validate TOML files and print human-readable parse errors.",
	},
	args: {
		file: {
			type: "positional",
			description: "Path to the TOML file to validate",
			required: false,
		},
		stdin: {
			type: "boolean",
			description: "Read TOML from stdin instead of a file",
			default: false,
		},
		filename: {
			type: "string",
			description: "Display name used when reading TOML from stdin",
			default: "<stdin>",
		},
		format: {
			type: "enum",
			description: "Output format",
			options: ["pretty", "json"],
			default: "pretty",
		},
		color: {
			type: "boolean",
			description: "Enable ANSI colors for pretty output",
			default: true,
		},
	},
	async run({ args }) {
		const filePath = typeof args.file === "string" ? args.file : undefined;
		const stdin = args.stdin === true;
		const filename =
			typeof args.filename === "string" ? args.filename : "<stdin>";
		const format: OutputFormat = args.format === "json" ? "json" : "pretty";
		const color = args.color !== false;

		const result = await resolveValidationResult({
			file: filePath,
			stdin,
			filename,
		});

		if (result == null) {
			return;
		}

		const output = formatValidationResult(result, { color, format });
		const outputStream = result.ok ? process.stdout : process.stderr;
		outputStream.write(`${output}\n`);
		process.exitCode = result.ok ? 0 : 1;
	},
});

void runMain(main);
