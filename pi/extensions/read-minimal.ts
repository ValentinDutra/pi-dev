import type { TextContent } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ReadToolDetails, Theme } from "@earendil-works/pi-coding-agent";
import {
	DEFAULT_MAX_BYTES,
	DEFAULT_MAX_LINES,
	createReadTool,
	formatSize,
	getLanguageFromPath,
	highlightCode,
} from "@earendil-works/pi-coding-agent";
import { Text } from "@earendil-works/pi-tui";
import { homedir } from "node:os";

interface ClaudeStyleReadToolDetails extends ReadToolDetails {
	requestedPath: string;
	requestedOffset?: number;
	requestedLimit?: number;
}

function shortenPath(path: string): string {
	const homeDirectory = homedir();
	if (path.startsWith(homeDirectory)) {
		return `~${path.slice(homeDirectory.length)}`;
	}
	return path;
}

function replaceTabsWithSpaces(text: string): string {
	return text.replace(/\t/g, "  ");
}

function getReadTextContent(contentBlocks: Array<TextContent | { type: string; text?: string }>): string | undefined {
	const textBlock = contentBlocks.find((contentBlock) => contentBlock.type === "text");
	if (!textBlock || textBlock.type !== "text") {
		return undefined;
	}
	return textBlock.text;
}

function splitContinuationNotice(text: string): { bodyText: string; continuationNotice?: string } {
	const trimmedText = text.replace(/\n+$/, "");
	const continuationNoticeMatch = trimmedText.match(
		/\n\n(\[(?:Showing lines .*|\d+ more lines in file\. Use offset=\d+ to continue\.|Line \d+ is .* exceeds .* limit\. Use bash: .*)\])$/s,
	);

	if (!continuationNoticeMatch) {
		return { bodyText: trimmedText };
	}

	const continuationNotice = continuationNoticeMatch[1];
	const bodyText = trimmedText.slice(0, trimmedText.length - continuationNoticeMatch[0].length);
	return { bodyText, continuationNotice };
}

function renderCodeLines(
	text: string,
	path: string,
	theme: Theme,
	startingLineNumber: number,
	previewLineCount: number,
): { renderedText: string; hiddenLineCount: number; visibleLineCount: number } {
	const normalizedText = replaceTabsWithSpaces(text);
	const language = getLanguageFromPath(path);
	const sourceLines = normalizedText.length === 0 ? [] : normalizedText.split("\n");
	const highlightedLines = language ? highlightCode(normalizedText, language) : sourceLines;
	const visibleLineCount = Math.min(previewLineCount, highlightedLines.length);
	const hiddenLineCount = Math.max(0, highlightedLines.length - visibleLineCount);
	const lastVisibleLineNumber = Math.max(startingLineNumber, startingLineNumber + visibleLineCount - 1);
	const lineNumberWidth = String(lastVisibleLineNumber).length;

	const renderedLines = highlightedLines.slice(0, visibleLineCount).map((line, index) => {
		const lineNumber = String(startingLineNumber + index).padStart(lineNumberWidth, " ");
		const linePrefix = theme.fg("dim", `${lineNumber} │ `);
		const lineText = language ? line : theme.fg("toolOutput", line);
		return `${linePrefix}${lineText}`;
	});

	return {
		renderedText: renderedLines.join("\n"),
		hiddenLineCount,
		visibleLineCount: highlightedLines.length,
	};
}

function buildTruncationLine(
	details: ClaudeStyleReadToolDetails,
	continuationNotice: string | undefined,
	theme: Theme,
): string | undefined {
	if (continuationNotice) {
		return theme.fg("muted", continuationNotice);
	}

	if (!details.truncation?.truncated) {
		return undefined;
	}

	if (details.truncation.firstLineExceedsLimit) {
		return theme.fg("muted", `First line exceeds ${formatSize(details.truncation.maxBytes ?? DEFAULT_MAX_BYTES)}.`);
	}

	if (details.truncation.truncatedBy === "lines") {
		return theme.fg(
			"muted",
			`Showing ${details.truncation.outputLines} of ${details.truncation.totalLines} lines (${details.truncation.maxLines ?? DEFAULT_MAX_LINES} line limit).`,
		);
	}

	return theme.fg(
		"muted",
		`Showing ${details.truncation.outputLines} lines (${formatSize(details.truncation.maxBytes ?? DEFAULT_MAX_BYTES)} limit).`,
	);
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		...createReadTool(process.cwd()),
		renderShell: "self",
		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const originalReadTool = createReadTool(ctx.cwd);
			const result = await originalReadTool.execute(toolCallId, params, signal, onUpdate);

			return {
				...result,
				details: {
					...(result.details ?? {}),
					requestedPath: params.path,
					requestedOffset: params.offset,
					requestedLimit: params.limit,
				} satisfies ClaudeStyleReadToolDetails,
			};
		},
		renderCall(args, theme) {
			const shortenedPath = shortenPath(args.path);
			return new Text(`${theme.fg("toolTitle", theme.bold("Read "))}${theme.fg("accent", shortenedPath)}`, 0, 0);
		},
		renderResult(result, { expanded, isPartial }, theme) {
			if (isPartial) {
				return new Text("", 0, 0);
			}

			if (!expanded) {
				return new Text("", 0, 0);
			}

			const details = (result.details ?? {
				requestedPath: "",
			}) as ClaudeStyleReadToolDetails;
			const textContent = getReadTextContent(result.content);
			const hasImageContent = result.content.some((contentBlock) => contentBlock.type === "image");

			if (hasImageContent) {
				if (!textContent) {
					return new Text(theme.fg("toolOutput", "Image loaded"), 0, 0);
				}
				return new Text(theme.fg("toolOutput", textContent), 0, 0);
			}

			if (textContent === undefined) {
				return new Text("", 0, 0);
			}

			const { bodyText, continuationNotice } = splitContinuationNotice(textContent);
			const truncationLine = buildTruncationLine(details, continuationNotice, theme);
			const startingLineNumber = details.requestedOffset ?? 1;
			const renderedCodeLines = renderCodeLines(
				bodyText,
				details.requestedPath,
				theme,
				startingLineNumber,
				Number.MAX_SAFE_INTEGER,
			);

			const renderedSections: string[] = [];
			if (renderedCodeLines.renderedText) {
				renderedSections.push(renderedCodeLines.renderedText);
			}
			if (truncationLine) {
				renderedSections.push(truncationLine);
			}

			if (renderedSections.length === 0) {
				return new Text("", 0, 0);
			}

			return new Text(renderedSections.join("\n"), 0, 0);
		},
	});
}
