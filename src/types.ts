export type OutputFormat = "pretty" | "json";

export type DiagnosticLocation = {
	line: number;
	column: number;
	position?: number;
};

export type TomvalidDiagnostic = {
	kind: "io" | "parse";
	filePath: string;
	summary: string;
	details: string;
	location?: DiagnosticLocation;
	codeFrame?: string;
};

export type ValidationSuccess = {
	ok: true;
	filePath: string;
	value: unknown;
};

export type ValidationFailure = {
	ok: false;
	diagnostic: TomvalidDiagnostic;
};

export type ValidationResult = ValidationSuccess | ValidationFailure;
