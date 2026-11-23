import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { SidePanelCompositor } from "./compositor.ts";
import { TouchedFiles, displayPath, renderFiles, type Style } from "./files.ts";
import { collectTokens, renderFlightdeck, type FlightdeckState, type PlanUsage } from "./flightdeck.ts";

type Settings = { open: boolean; width: number; split: number };

const SETTINGS_PATH = join(homedir(), ".pi", "agent", "cockpit.json");
const DEFAULT_SETTINGS: Settings = { open: true, width: 45, split: 35 };
const RECENT_TOOLS_KEPT = 5;
const ANIMATION_FRAME_MS = 40;
const EDIT_TOOLS = new Set(["edit", "write"]);

function loadSettings(): Settings {
	try {
		return { ...DEFAULT_SETTINGS, ...JSON.parse(readFileSync(SETTINGS_PATH, "utf8")) };
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}

function summarizeToolInput(input: any, cwd: string): string {
	if (typeof input?.path === "string") return displayPath(input.path, cwd);
	if (typeof input?.command === "string") return input.command.split("\n")[0];
	if (typeof input?.name === "string") return input.name;
	const firstString = Object.values(input ?? {}).find((value) => typeof value === "string");
	return typeof firstString === "string" ? firstString.split("\n")[0] : "";
}

export default function cockpit(pi: ExtensionAPI) {
	const settings = loadSettings();
	const touchedFiles = new TouchedFiles();
	const state: FlightdeckState = {
		runStartedAt: null,
		spinnerFrame: 0,
		context: null,
		tokens: collectTokens([]),
		subscription: false,
		plan: null,
		activeTool: null,
		agents: new Map(),
		speed: null,
		receipt: null,
		recentTools: [],
	};
	let run = { toolCalls: 0, edits: 0, costAtStart: 0 };
	let request = { startedAt: 0, firstTokenAt: 0 };
	let cwd = process.cwd();
	let theme: any = null;
	let tui: any = null;
	let compositor: SidePanelCompositor | null = null;
	let spinnerTimer: ReturnType<typeof setInterval> | null = null;
	let paintTimer: ReturnType<typeof setTimeout> | null = null;
	// null follows the latest touched file; a number is a manual wheel position.
	let filesScroll: number | null = null;
	let filesWindow = { firstRow: 0, rows: 0, maxOffset: 0, offset: 0 };

	const style: Style = {
		bold: (text) => (theme ? theme.bold(text) : text),
		fg: (color, text) => (theme ? theme.fg(color, text) : text),
	};

	const saveSettings = () => writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n");

	const requestPaint = () => {
		if (paintTimer) return;
		paintTimer = setTimeout(() => {
			paintTimer = null;
			compositor?.paint();
		}, 16);
	};

	const renderPanel = (width: number, rows: number): string[] => {
		const flightdeckRows = Math.round((rows * settings.split) / 100);
		const flightdeck = renderFlightdeck(state, width, style).slice(0, flightdeckRows);
		while (flightdeck.length < flightdeckRows) flightdeck.push("");

		const { header, body, latestLine } = renderFiles(touchedFiles.list(), touchedFiles.active(), state.spinnerFrame, width, style);
		const bodyRows = Math.max(0, rows - flightdeckRows - header.length);
		const maxOffset = Math.max(0, body.length - bodyRows);
		const wanted = filesScroll ?? latestLine - Math.floor(bodyRows / 2);
		const offset = Math.max(0, Math.min(maxOffset, wanted));
		filesWindow = { firstRow: flightdeckRows + header.length, rows: bodyRows, maxOffset, offset };
		return [...flightdeck, ...header, ...body.slice(offset, offset + bodyRows)];
	};

	const onWheel = (row: number, delta: number) => {
		if (row <= filesWindow.firstRow || filesWindow.maxOffset === 0) return;
		filesScroll = Math.max(0, Math.min(filesWindow.maxOffset, filesWindow.offset + delta));
		requestPaint();
	};

	const mount = () => {
		compositor?.dispose();
		compositor = null;
		if (!tui || !settings.open) {
			tui?.requestRender?.();
			return;
		}
		compositor = new SidePanelCompositor(tui, settings.width, renderPanel, onWheel, (text) => style.fg("dim", text));
		compositor.install();
		tui.requestRender?.(true);
	};

	const updateContext = (ctx: ExtensionContext) => {
		cwd = ctx.cwd;
		state.context = ctx.getContextUsage() ?? null;
		state.tokens = collectTokens(ctx.sessionManager.getEntries() as any[]);
		state.subscription = ctx.model ? ctx.modelRegistry.isUsingOAuth(ctx.model) : false;
	};

	// Subscribed at load so the reading plan-usage.ts takes on session_start is not missed.
	pi.events.on("plan-usage", (usage) => {
		state.plan = usage as PlanUsage;
		requestPaint();
	});

	pi.on("session_start", async (_event, ctx) => {
		updateContext(ctx);
		const entries = ctx.sessionManager.getBranch() as any[];
		touchedFiles.reconstruct(entries, cwd);
		state.agents.clear();
		state.recentTools = [];
		state.receipt = null;
		filesScroll = null;
		if (!ctx.hasUI) return;
		// setWidget is the only hook that hands an extension the TUI instance.
		ctx.ui.setWidget("cockpit", (widgetTui: any, widgetTheme: any) => {
			tui = widgetTui;
			theme = widgetTheme;
			mount();
			return {
				render: () => [],
				invalidate() {},
				dispose() {
					compositor?.dispose();
					compositor = null;
					tui = null;
				},
			};
		}, { placement: "belowEditor" });
	});

	const stopAnimation = () => {
		if (spinnerTimer) clearInterval(spinnerTimer);
		spinnerTimer = null;
	};

	// Runs while the agent works and until the last file highlight fades.
	const startAnimation = () => {
		spinnerTimer ??= setInterval(() => {
			const idle = state.runStartedAt === null && touchedFiles.active().size === 0;
			state.spinnerFrame++;
			requestPaint();
			if (idle) stopAnimation();
		}, ANIMATION_FRAME_MS);
	};

	pi.on("session_shutdown", async () => {
		stopAnimation();
	});

	pi.on("agent_start", async (_event, ctx) => {
		updateContext(ctx);
		state.runStartedAt = Date.now();
		run = { toolCalls: 0, edits: 0, costAtStart: state.tokens.cost };
		startAnimation();
	});

	pi.on("agent_end", async (_event, ctx) => {
		updateContext(ctx);
		if (state.runStartedAt !== null) {
			state.receipt = { durationMs: Date.now() - state.runStartedAt, toolCalls: run.toolCalls, edits: run.edits, cost: state.tokens.cost - run.costAtStart };
		}
		state.runStartedAt = null;
		state.activeTool = null;
		touchedFiles.finishAll();
		requestPaint();
	});

	// Each turn sends one model request.
	pi.on("turn_start", async () => {
		request = { startedAt: Date.now(), firstTokenAt: 0 };
	});

	const lightUp = (toolCallId: string, toolName: string, input: unknown) => {
		if (!touchedFiles.start(toolCallId, toolName, input, cwd)) return;
		filesScroll = null;
		startAnimation();
		requestPaint();
	};

	// Lights a file while the model is still writing the call, not only once it runs.
	pi.on("message_update", async (event: any) => {
		const streamed = event.assistantMessageEvent;
		if (request.firstTokenAt === 0 && streamed?.type?.endsWith("_delta")) request.firstTokenAt = Date.now();
		if (streamed?.type === "toolcall_end") {
			lightUp(streamed.toolCall.id, streamed.toolCall.name, streamed.toolCall.arguments);
		} else if (streamed?.type === "toolcall_delta") {
			const call = streamed.partial?.content?.[streamed.contentIndex];
			const input = call?.arguments ?? {};
			// The path is complete once the model has moved on to the next argument.
			const pathDone = Object.keys(input).some((key) => key !== "path" && key !== "file_path");
			if (call?.type === "toolCall" && call.name !== "bash" && pathDone) lightUp(call.id, call.name, input);
		}
	});

	pi.on("turn_end", async (_event, ctx) => {
		updateContext(ctx);
		requestPaint();
	});

	// tool_execution_* also fires for calls made inside codemode scripts.
	pi.on("tool_execution_start", async (event) => {
		const activity = { name: event.toolName, summary: summarizeToolInput(event.args, cwd), startedAt: Date.now() };
		state.activeTool = activity;
		state.recentTools = [activity, ...state.recentTools].slice(0, RECENT_TOOLS_KEPT);
		run.toolCalls++;
		if (EDIT_TOOLS.has(event.toolName)) run.edits++;
		if (event.toolName === "subagent" && typeof event.args?.name === "string") state.agents.set(event.args.name, Date.now());
		lightUp(event.toolCallId, event.toolName, event.args);
		requestPaint();
	});

	pi.on("tool_execution_end", async (event) => {
		state.activeTool = null;
		touchedFiles.finish(event.toolCallId, event.result, event.isError);
		requestPaint();
	});

	pi.on("message_end", async (event: any, ctx) => {
		const message = event.message;
		if (message?.role === "assistant" && request.startedAt > 0 && request.firstTokenAt > 0) {
			const streamingMs = Date.now() - request.firstTokenAt;
			const outputTokens = message.usage?.output ?? 0;
			// Under 300 ms of streaming means the text arrived in one chunk, so a rate would be meaningless.
			state.speed = { ttftMs: request.firstTokenAt - request.startedAt, tokensPerSecond: streamingMs >= 300 && outputTokens > 0 ? (outputTokens * 1000) / streamingMs : null };
		}
		// pi-interactive-subagents reports a finished subagent as this custom message.
		if (message?.role === "custom" && message.customType === "subagent_result") state.agents.delete(message.details?.name);
		updateContext(ctx);
		requestPaint();
	});

	pi.registerCommand("cockpit", {
		description: "Side panel: /cockpit [open | close | split <20-80> | width <30-100>]",
		handler: async (args, ctx) => {
			const [command, value] = (args ?? "").trim().split(/\s+/);
			const number = Number.parseInt(value ?? "", 10);
			if (command === "split" || command === "width") {
				const [minimum, maximum] = command === "split" ? [20, 80] : [30, 100];
				if (!(number >= minimum && number <= maximum)) {
					ctx.ui.notify(`Usage: /cockpit ${command} <${minimum}-${maximum}>`, "warning");
					return;
				}
				settings[command] = number;
			} else if (command === "open" || command === "close") {
				settings.open = command === "open";
			} else if (!command) {
				settings.open = !settings.open;
			} else {
				ctx.ui.notify("Usage: /cockpit [open | close | split <20-80> | width <30-100>]", "warning");
				return;
			}
			saveSettings();
			mount();
		},
	});
}
