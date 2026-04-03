/**
 * Reads UTF-8 text from standard input.
 * @returns
 * - The full stdin payload when a pipe or redirected input is present
 * - An empty string when stdin closes without data
 * @example
 * const source = await readStandardInput();
 * source.length > 0;
 */
export const readStandardInput = async (): Promise<string> => {
	return await new Promise((resolve, reject) => {
		const chunks: string[] = [];

		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk: string) => {
			chunks.push(chunk);
		});
		process.stdin.on("end", () => {
			resolve(chunks.join(""));
		});
		process.stdin.on("error", reject);
	});
};
