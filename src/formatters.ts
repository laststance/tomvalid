import { createColorizer, supportsColor } from "./color";
import type { OutputFormat, ValidationResult } from "./types";

export type FormatterOptions = {
	color: boolean;
	format: OutputFormat;
};

const colorizeCodeFrame = (
	codeFrame: string,
	color: ReturnType<typeof createColorizer>,
): string => {
	return codeFrame
		.split("\n")
		.map((line) => {
			if (line.includes("^")) {
				return line.replace("^", color.red("^"));
			}

			if (line.startsWith("> ")) {
				return color.yellow(line);
			}

			return color.dim(line);
		})
		.join("\n");
};

/**
 * Formats a validation result into a readable CLI message.
 * @param result - The validation result to render.
 * @param useColorFlag - Whether the CLI requested colored output.
 * @returns
 * - A short success message for valid TOML
 * - A readable parse or file error message for invalid input
 * @example
 * formatPrettyResult({ ok: true, filePath: 'a.toml', value: {} }, true);
 */
export const formatPrettyResult = (
	result: ValidationResult,
	useColorFlag: boolean,
): string => {
	const color = createColorizer(supportsColor(useColorFlag));

	if (result.ok) {
		return `${color.green("✔")} ${color.bold("Valid TOML")} ${color.dim(result.filePath)}`;
	}

	const { diagnostic } = result;
	const locationLabel =
		diagnostic.location == null
			? ""
			: color.dim(`:${diagnostic.location.line}:${diagnostic.location.column}`);
	const title = diagnostic.kind === "parse" ? "TOML parse error" : "File error";
	const sections = [
		`${color.bold(color.red(title))} ${color.cyan(diagnostic.filePath)}${locationLabel}`,
	];

	sections.push(diagnostic.summary);

	if (diagnostic.codeFrame != null) {
		sections.push(colorizeCodeFrame(diagnostic.codeFrame, color));
	} else {
		sections.push(color.dim(diagnostic.details));
	}

	return sections.join("\n\n");
};

/**
 * Formats a validation result into JSON for scripts and CI.
 * @param result - The validation result to render.
 * @returns
 * - A stable JSON string with success details
 * - A stable JSON string with structured error details
 * @example
 * formatJsonResult({ ok: true, filePath: 'a.toml', value: {} });
 */
export const formatJsonResult = (result: ValidationResult): string => {
	if (result.ok) {
		return JSON.stringify(
			{
				ok: true,
				path: result.filePath,
			},
			null,
			2,
		);
	}

	return JSON.stringify(
		{
			ok: false,
			error: {
				kind: result.diagnostic.kind,
				path: result.diagnostic.filePath,
				summary: result.diagnostic.summary,
				details: result.diagnostic.details,
				line: result.diagnostic.location?.line,
				column: result.diagnostic.location?.column,
				position: result.diagnostic.location?.position,
				codeFrame: result.diagnostic.codeFrame,
			},
		},
		null,
		2,
	);
};

/**
 * Chooses the requested formatter for a validation result.
 * @param result - The validation result to render.
 * @param options - Output formatting options.
 * @returns
 * - Pretty text when `format` is `pretty`
 * - JSON when `format` is `json`
 * @example
 * formatValidationResult(result, { format: 'pretty', color: true });
 */
export const formatValidationResult = (
	result: ValidationResult,
	options: FormatterOptions,
): string => {
	return options.format === "json"
		? formatJsonResult(result)
		: formatPrettyResult(result, options.color);
};
