import { readFile } from "node:fs/promises";
import * as TOML from "@iarna/toml";

import type {
	DiagnosticLocation,
	TomvalidDiagnostic,
	ValidationResult,
} from "./types";

const LOCATION_PATTERN = /at row (\d+), col (\d+), pos (\d+)/i;

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

const readNumericProperty = (
	value: unknown,
	key: string,
): number | undefined => {
	if (!isRecord(value)) {
		return undefined;
	}

	const property = value[key];
	return typeof property === "number" ? property : undefined;
};

const getErrorMessage = (cause: unknown): string => {
	return cause instanceof Error ? cause.message : String(cause);
};

/**
 * Builds a small code frame around a 1-based line and column pair.
 * @param source - Full TOML source text.
 * @param line - 1-based line number.
 * @param column - 1-based column number.
 * @returns
 * - A compact three-line frame when the location exists in the source
 * - `undefined` when the location is outside the available lines
 * @example
 * createCodeFrame("title = \"ok\"\nenabled = maybe\n", 2, 11);
 */
export const createCodeFrame = (
	source: string,
	line: number,
	column: number,
): string | undefined => {
	const sourceLines = source.split(/\r?\n/);
	if (line < 1 || line > sourceLines.length) {
		return undefined;
	}

	const startLine = Math.max(1, line - 1);
	const endLine = Math.min(sourceLines.length, line + 1);
	const gutterWidth = String(endLine).length;
	const frameLines: string[] = [];

	for (let currentLine = startLine; currentLine <= endLine; currentLine += 1) {
		const prefix = currentLine === line ? ">" : " ";
		const sourceLine = sourceLines[currentLine - 1] ?? "";
		frameLines.push(
			`${prefix} ${String(currentLine).padStart(gutterWidth)} | ${sourceLine}`,
		);

		if (currentLine === line) {
			const safeColumn = Math.max(1, Math.min(column, sourceLine.length + 1));
			frameLines.push(
				`  ${" ".repeat(gutterWidth)} | ${" ".repeat(safeColumn - 1)}^`,
			);
		}
	}

	return frameLines.join("\n");
};

const extractLocation = (
	cause: unknown,
	details: string,
): DiagnosticLocation | undefined => {
	const matchedLocation = details.match(LOCATION_PATTERN);
	if (matchedLocation != null) {
		const matchedLine = Number(matchedLocation[1]);
		const matchedColumn = Number(matchedLocation[2]);
		const matchedPosition = Number(matchedLocation[3]);

		if (
			!Number.isNaN(matchedLine) &&
			!Number.isNaN(matchedColumn) &&
			!Number.isNaN(matchedPosition)
		) {
			return {
				line: matchedLine,
				column: matchedColumn,
				position: matchedPosition,
			};
		}
	}

	const line = readNumericProperty(cause, "line");
	const column = readNumericProperty(cause, "col");
	const position = readNumericProperty(cause, "pos");

	if (line != null && column != null) {
		return {
			line: line + 1,
			column: column + 1,
			position,
		};
	}

	return undefined;
};

const extractSummary = (details: string): string => {
	const summary = details
		.replace(/\s+at row \d+, col \d+, pos \d+:[\s\S]*/i, "")
		.trim();
	return summary.length > 0 ? summary : "Unable to parse TOML.";
};

const createIoDiagnostic = (
	filePath: string,
	cause: unknown,
): TomvalidDiagnostic => {
	const details = getErrorMessage(cause);
	return {
		kind: "io",
		filePath,
		summary: "Unable to read TOML input.",
		details,
	};
};

const createParseDiagnostic = (
	filePath: string,
	source: string,
	cause: unknown,
): TomvalidDiagnostic => {
	const details = getErrorMessage(cause);
	const location = extractLocation(cause, details);

	return {
		kind: "parse",
		filePath,
		summary: extractSummary(details),
		details,
		location,
		codeFrame:
			location == null
				? undefined
				: createCodeFrame(source, location.line, location.column),
	};
};

/**
 * Validates a TOML string and returns a structured result instead of throwing.
 * @param source - Full TOML source text.
 * @param filePath - Label shown in diagnostics.
 * @returns
 * - `{ ok: true }` with parsed data when the TOML is valid
 * - `{ ok: false }` with a structured diagnostic when parsing fails
 * @example
 * validateTomlText('title = "ok"\n', 'example.toml');
 */
export const validateTomlText = (
	source: string,
	filePath: string,
): ValidationResult => {
	try {
		const value = TOML.parse(source);
		return {
			ok: true,
			filePath,
			value,
		};
	} catch (cause: unknown) {
		return {
			ok: false,
			diagnostic: createParseDiagnostic(filePath, source, cause),
		};
	}
};

/**
 * Reads a TOML file and validates its contents.
 * @param filePath - Path to the TOML file.
 * @returns
 * - `{ ok: true }` with parsed data when the file exists and the TOML is valid
 * - `{ ok: false }` with an IO or parse diagnostic when validation fails
 * @example
 * await validateTomlFile('./config.toml');
 */
export const validateTomlFile = async (
	filePath: string,
): Promise<ValidationResult> => {
	try {
		const source = await readFile(filePath, "utf8");
		return validateTomlText(source, filePath);
	} catch (cause: unknown) {
		return {
			ok: false,
			diagnostic: createIoDiagnostic(filePath, cause),
		};
	}
};
