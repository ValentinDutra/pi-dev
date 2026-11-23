import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { createBashTool } from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { homedir } from "node:os";

const PREVIEW_LINES = 3;
const MAX_ERROR_LENGTH = 140;

const toolCache = new Map<string, ReturnType<typeof createBashTool>>();

function getBashTool(cwd: string) {
	let tool = toolCache.get(cwd);
	if (!tool) {
		tool = createBashTool(cwd);
		toolCache.set(cwd, tool);
	}
	return tool;
}

function shortenPath(path: string): string {
	const home = homedir();
	if (path.startsWith(home)) {
		return `~${path.slice(home.length)}`;
	}
	return path;
}

function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return `${text.slice(0, maxLength - 1)}…`;
}

function shortenCommand(command: string): string {
	const cdPrefixMatch = command.match(/^cd\s+(\/\S+)\s*&&\s*/);
	if (cdPrefixMatch) {
		const shortenedDirectory = shortenPath(cdPrefixMatch[1]);
		const remainingCommand = command.slice(cdPrefixMatch[0].length);
		return `cd ${shortenedDirectory} && ${remainingCommand}`;
	}
	return command;
}

function getTextContent(content: Array<{ type: string; text?: string }>): string | undefined {
	const textBlock = content.find((block) => block.type === "text");
	if (!textBlock || textBlock.type !== "text") return undefined;
	return textBlock.text;
}

function lastNonEmptyLine(text: string | undefined): string | undefined {
	if (!text) return undefined;
	const lines = text.split("\n").filter((line) => line.trim().length > 0);
	return lines.at(-1);
}

function summarizeBashError(text: string | undefined): string {
	if (!text) return "Command failed";

	const timeoutMatch = text.match(/Command timed out after \d+ seconds/);
	if (timeoutMatch) return timeoutMatch[0];

	const exitCodeMatch = text.match(/Command exited with code \d+/);
	if (exitCodeMatch) return exitCodeMatch[0];

	return truncateText(lastNonEmptyLine(text) ?? "Command failed", MAX_ERROR_LENGTH);
}

function renderExpandedText(text: string | undefined, theme: any): Text | undefined {
	if (!text) return undefined;
	const rendered = text
		.split("\n")
		.map((line) => theme.fg("toolOutput", line))
		.join("\n");
	return new Text(rendered, 0, 0);
}

function renderPreview(text: string | undefined, theme: any): Text | undefined {
	if (!text) return undefined;
	const allLines = text.split("\n").filter((line) => line.trim().length > 0);
	if (allLines.length === 0) return undefined;

	const previewLines = allLines.slice(0, PREVIEW_LINES);
	const remainingCount = allLines.length - previewLines.length;

	const rendered = previewLines.map((line, index) => {
		const prefix = index === 0 ? "└  " : "   ";
		return theme.fg("toolOutput", `${prefix}${line}`);
	});

	if (remainingCount > 0) {
		rendered.push(theme.fg("muted", `   … +${remainingCount} lines (ctrl+o to expand)`));
	}

	return new Text(rendered.join("\n"), 0, 0);
}

export default function (pi: ExtensionAPI) {
	const defaultBashTool = createBashTool(process.cwd());

	pi.registerTool({
		name: "bash",
		label: "bash",
		description: defaultBashTool.description,
		parameters: defaultBashTool.parameters,
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			return getBashTool(ctx.cwd).execute(toolCallId, params, signal, onUpdate);
		},
		renderCall(args, theme) {
			const rawCommand = String(args.command ?? "").replace(/\s+/g, " ").trim();
			const command = shortenCommand(rawCommand);
			let text = `${theme.fg("toolTitle", theme.bold("$ "))}${theme.fg("accent", command)}`;
			if (args.timeout !== undefined) {
				text += theme.fg("muted", ` (${args.timeout}s)`);
			}
			return new Text(text, 0, 0);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			if (isPartial) return new Text("", 0, 0);

			const textContent = getTextContent(result.content);
			if (!expanded) {
				if (result.isError) {
					return new Text(theme.fg("error", `└  ${summarizeBashError(textContent)}`), 0, 0);
				}
				return renderPreview(textContent, theme) ?? new Text("", 0, 0);
			}

			return renderExpandedText(textContent, theme) ?? new Text("", 0, 0);
		},
	});
}
