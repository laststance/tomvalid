type ColorMethod = (text: string) => string;

export type Colorizer = {
	bold: ColorMethod;
	cyan: ColorMethod;
	dim: ColorMethod;
	green: ColorMethod;
	red: ColorMethod;
	yellow: ColorMethod;
};

const ANSI_ESCAPE = {
	reset: "\u001B[0m",
	bold: "\u001B[1m",
	dim: "\u001B[2m",
	red: "\u001B[31m",
	green: "\u001B[32m",
	yellow: "\u001B[33m",
	cyan: "\u001B[36m",
} as const;

/**
 * Detects whether colored CLI output should be enabled.
 * @param useColorFlag - The final `--color` / `--no-color` decision from the CLI.
 * @returns
 * - `true` when the terminal supports colors and colors were not disabled
 * - `false` when output is not a TTY or `NO_COLOR` is set
 * @example
 * supportsColor(true)  // => true or false depending on the terminal
 * supportsColor(false) // => false
 */
export const supportsColor = (useColorFlag: boolean): boolean => {
	return (
		useColorFlag &&
		Boolean(process.stdout.isTTY) &&
		process.env.NO_COLOR == null
	);
};

/**
 * Creates a tiny ANSI color helper for CLI output.
 * @param enabled - Whether color codes should be emitted.
 * @returns
 * - Color wrapper methods when enabled
 * - Identity methods when disabled
 * @example
 * const color = createColorizer(true);
 * color.red("error");
 */
export const createColorizer = (enabled: boolean): Colorizer => {
	const wrap = (openCode: string): ColorMethod => {
		return (text: string): string => {
			if (!enabled) {
				return text;
			}

			return `${openCode}${text}${ANSI_ESCAPE.reset}`;
		};
	};

	return {
		bold: wrap(ANSI_ESCAPE.bold),
		cyan: wrap(ANSI_ESCAPE.cyan),
		dim: wrap(ANSI_ESCAPE.dim),
		green: wrap(ANSI_ESCAPE.green),
		red: wrap(ANSI_ESCAPE.red),
		yellow: wrap(ANSI_ESCAPE.yellow),
	};
};
