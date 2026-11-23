import { statSync } from "node:fs";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { homedir } from "node:os";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";

export type TouchedFile = { path: string; order: number; added: number; removed: number };
export type Style = { bold(text: string): string; fg(color: string, text: string): string };

const FILE_TOOLS = new Set(["read", "edit", "write"]);
const MAX_COMMAND_TOKENS = 200;
// Most reads and edits finish in under 100 ms, too fast to see, so a file stays lit a little after its call ends.
const HIGHLIGHT_LINGER_MS = 2000;
const SHIMMER_BASE = [167, 139, 250];
const SHIMMER_PEAK = [245, 240, 255];
const SHIMMER_RADIUS = 3;
const IDLE_MARKER = "\x1b[38;2;255;255;255m■\x1b[39m";

/** A bright band sweeping left to right across the text, one character per frame. */
function shimmer(text: string, frame: number): string {
	const characters = [...text];
	const peakIndex = (frame % (characters.length + 2 * SHIMMER_RADIUS)) - SHIMMER_RADIUS;
	const colored = characters.map((character, index) => {
		const strength = Math.max(0, 1 - Math.abs(index - peakIndex) / SHIMMER_RADIUS);
		const [red, green, blue] = SHIMMER_BASE.map((value, channel) => Math.round(value + (SHIMMER_PEAK[channel] - value) * strength));
		return `\x1b[38;2;${red};${green};${blue}m${character}`;
	});
	return `\x1b[1m${colored.join("")}\x1b[39m\x1b[22m`;
}

/** Relative to cwd when inside it, `~/…` or absolute otherwise. */
export function displayPath(path: string, cwd: string): string {
	const absolute = isAbsolute(path) ? path : `${cwd}/${path}`;
	const relativePath = relative(cwd, absolute);
	if (relativePath && !relativePath.startsWith("..") && !isAbsolute(relativePath)) return relativePath;
	const home = homedir();
	return absolute.startsWith(home + "/") ? "~" + absolute.slice(home.length) : absolute;
}

/** Words in a bash command that name an existing file, resolved against cwd. */
function filesInCommand(command: string, cwd: string): string[] {
	const found = new Set<string>();
	const tokens = command.split(/[\s;|&<>()`'"=]+/).filter((token) => token.length > 0 && token.length < 300 && !token.startsWith("-"));
	for (const token of tokens.slice(0, MAX_COMMAND_TOKENS)) {
		const expanded = token.startsWith("~/") ? homedir() + token.slice(1) : token;
		const absolute = resolve(cwd, expanded);
		try {
			if (statSync(absolute).isFile()) found.add(absolute);
		} catch {
			// Not a path.
		}
	}
	return [...found];
}

/** Paths a tool call works on: the `path` argument of file tools, or files named in a bash command. */
function pathsFor(toolName: string, input: any, cwd: string): string[] {
	if (FILE_TOOLS.has(toolName)) {
		const path = input?.path ?? input?.file_path;
		return typeof path === "string" && path.trim() !== "" ? [path.trim()] : [];
	}
	if (toolName === "bash" && typeof input?.command === "string") return filesInCommand(input.command, cwd);
	return [];
}

type Call = { paths: string[]; writtenLines: number };

export class TouchedFiles {
	private files = new Map<string, TouchedFile>();
	private nextOrder = 0;
	/** In-progress tool calls by id, so parallel calls each keep their own highlight. */
	private inProgress = new Map<string, Call>();
	private lingerUntil = new Map<string, number>();

	clear(): void {
		this.files.clear();
		this.inProgress.clear();
		this.lingerUntil.clear();
		this.nextOrder = 0;
	}

	/** Returns the display paths the tool works on. */
	record(toolName: string, input: unknown, cwd: string): string[] {
		return pathsFor(toolName, input, cwd).map((path) => {
			const key = displayPath(path, cwd);
			const existing = this.files.get(key);
			this.files.set(key, { path: key, order: ++this.nextOrder, added: existing?.added ?? 0, removed: existing?.removed ?? 0 });
			return key;
		});
	}

	/**
	 * Called while the model is still streaming the call and again when it runs; the
	 * same id is recorded once. Returns true when it lit up a new file.
	 */
	start(toolCallId: string, toolName: string, input: unknown, cwd: string): boolean {
		const writtenLines = toolName === "write" ? countLines((input as any)?.content) : 0;
		const existing = this.inProgress.get(toolCallId);
		if (existing) {
			existing.writtenLines = Math.max(existing.writtenLines, writtenLines);
			return false;
		}
		const paths = this.record(toolName, input, cwd);
		if (paths.length === 0) return false;
		this.inProgress.set(toolCallId, { paths, writtenLines });
		return true;
	}

	/** Counts changed lines from a successful edit's patch, or a write's content (an overwrite counts as all added). */
	finish(toolCallId: string, result?: any, isError = true): void {
		const call = this.inProgress.get(toolCallId);
		if (call === undefined) return;
		this.inProgress.delete(toolCallId);
		for (const path of call.paths) this.lingerUntil.set(path, Date.now() + HIGHLIGHT_LINGER_MS);
		if (!isError && call.paths.length === 1) this.addChanges(call.paths[0], result?.details?.patch, call.writtenLines);
	}

	/** An aborted run never sends tool_execution_end. */
	finishAll(): void {
		for (const toolCallId of [...this.inProgress.keys()]) this.finish(toolCallId);
	}

	/** Files being worked on now or within the linger window. */
	active(): Set<string> {
		const now = Date.now();
		for (const [path, until] of this.lingerUntil) if (until <= now) this.lingerUntil.delete(path);
		return new Set([...[...this.inProgress.values()].flatMap((call) => call.paths), ...this.lingerUntil.keys()]);
	}

	/** Rebuild from session history so a resumed session shows its files and line counts. */
	reconstruct(entries: any[], cwd: string): void {
		this.clear();
		const calls = new Map<string, Call>();
		for (const entry of entries) {
			if (entry?.type !== "message") continue;
			const message = entry.message;
			if (message?.role === "assistant" && Array.isArray(message.content)) {
				for (const part of message.content) {
					if (part?.type !== "toolCall" || typeof part.name !== "string") continue;
					const paths = this.record(part.name, part.arguments, cwd);
					if (paths.length > 0) calls.set(part.id, { paths, writtenLines: part.name === "write" ? countLines(part.arguments?.content) : 0 });
				}
			} else if (message?.role === "toolResult" && !message.isError) {
				const call = calls.get(message.toolCallId);
				if (call?.paths.length === 1) this.addChanges(call.paths[0], message.details?.patch, call.writtenLines);
			}
		}
	}

	list(): TouchedFile[] {
		return [...this.files.values()];
	}

	private addChanges(path: string, patch: unknown, writtenLines: number): void {
		const file = this.files.get(path);
		if (!file) return;
		if (typeof patch === "string") {
			for (const line of patch.split("\n")) {
				if (line.startsWith("+") && !line.startsWith("+++")) file.added++;
				else if (line.startsWith("-") && !line.startsWith("---")) file.removed++;
			}
		} else {
			file.added += writtenLines;
		}
	}
}

function countLines(content: unknown): number {
	if (typeof content !== "string" || content === "") return 0;
	return content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
}

/** Keeps the last two folders: `~/.pi/agent/extensions/cockpit` becomes `…/extensions/cockpit`. */
function shortDirectory(directory: string): string {
	const segments = directory.split("/").filter(Boolean);
	return segments.length <= 2 ? directory : `…/${segments.slice(-2).join("/")}`;
}

/**
 * Header plus a directory-grouped list. A file being worked on shows a violet ■
 * and a shimmering name; every other file a white ■ and a plain name.
 * Returns the body lines and the index of the latest file's line, so the caller
 * can keep it in view.
 */
export function renderFiles(files: TouchedFile[], active: Set<string>, frame: number, width: number, style: Style): { header: string[]; body: string[]; latestLine: number } {
	const summary = files.length === 0 ? "" : `${files.length}`;
	const padding = Math.max(1, width - visibleWidth(" files") - visibleWidth(summary));
	const header = [style.bold(" files") + " ".repeat(padding) + style.fg("dim", summary), style.fg("dim", "─".repeat(width))];
	if (files.length === 0) return { header, body: [style.fg("dim", " (no files touched yet)")], latestLine: 0 };

	const latest = files.reduce((newest, file) => (file.order > newest.order ? file : newest));
	const byDirectory = new Map<string, TouchedFile[]>();
	for (const file of files) byDirectory.set(dirname(file.path), [...(byDirectory.get(dirname(file.path)) ?? []), file]);
	const directories = [...byDirectory.keys()].sort((a, b) => (a === "." ? -1 : b === "." ? 1 : a.localeCompare(b)));

	const body: string[] = [];
	let latestLine = 0;
	for (const directory of directories) {
		const indent = directory === "." ? " " : "   ";
		if (directory !== ".") body.push(style.fg("dim", truncateToWidth(` ▾ ${shortDirectory(directory)}/`, width, "…")));
		for (const file of byDirectory.get(directory)!.sort((a, b) => a.path.localeCompare(b.path))) {
			const added = file.added ? style.fg("success", `+${file.added}`) : "";
			const removed = file.removed ? style.fg("error", `−${file.removed}`) : "";
			const changes = [added, removed].filter(Boolean).join(" ");
			const changesWidth = changes ? visibleWidth(changes) + 1 : 0;
			const name = truncateToWidth(basename(file.path), Math.max(0, width - indent.length - 2 - changesWidth), "…");
			if (file === latest) latestLine = body.length;
			const left = active.has(file.path) ? `${indent}${shimmer("■", 0)} ${shimmer(name, frame)}` : `${indent}${IDLE_MARKER} ${name}`;
			body.push(changes ? left + " ".repeat(Math.max(1, width - visibleWidth(left) - visibleWidth(changes))) + changes : left);
		}
	}
	return { header, body, latestLine };
}
