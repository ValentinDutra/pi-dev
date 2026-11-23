import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import type { Style } from "./files.ts";

export type ToolActivity = { name: string; summary: string; startedAt: number };
export type Receipt = { durationMs: number; toolCalls: number; edits: number; cost: number };
export type ContextUsage = { tokens: number | null; contextWindow: number; percent: number | null };
export type TokenTotals = { input: number; output: number; cacheRead: number; cacheWrite: number; cost: number; cacheHitRate: number | null };
type UsageWindow = { utilization: number | null; resets_at: string | null } | null;
/** Payload plan-usage.ts emits on the "plan-usage" event channel. */
export type PlanUsage = { five_hour: UsageWindow; seven_day: UsageWindow };

export type FlightdeckState = {
	runStartedAt: number | null;
	spinnerFrame: number;
	context: ContextUsage | null;
	tokens: TokenTotals;
	subscription: boolean;
	plan: PlanUsage | null;
	activeTool: ToolActivity | null;
	agents: Map<string, number>;
	speed: { ttftMs: number; tokensPerSecond: number | null } | null;
	receipt: Receipt | null;
	recentTools: ToolActivity[];
};

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
// Animation frames tick every 40 ms; the spinner steps every third frame.
const FRAMES_PER_SPINNER_STEP = 3;

export function formatDuration(milliseconds: number): string {
	const seconds = Math.floor(milliseconds / 1000);
	const minutes = Math.floor(seconds / 60);
	if (minutes >= 60) return `${Math.floor(minutes / 60)}h${minutes % 60}m`;
	return minutes > 0 ? `${minutes}m${seconds % 60}s` : `${seconds}s`;
}

export function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

// Same totals as colorful-footer.ts: every entry that carries usage, not only the current branch.
export function collectTokens(entries: any[]): TokenTotals {
	const totals: TokenTotals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, cacheHitRate: null };
	for (const entry of entries) {
		let usage: any;
		if (entry.type === "usage") usage = entry.usage;
		else if (entry.type === "message" && (entry.message.role === "assistant" || entry.message.role === "toolResult")) usage = entry.message.usage;
		else if (entry.type === "branch_summary" || entry.type === "compaction") usage = entry.usage;
		if (!usage) continue;
		totals.input += usage.input;
		totals.output += usage.output;
		totals.cacheRead += usage.cacheRead;
		totals.cacheWrite += usage.cacheWrite;
		totals.cost += usage.cost.total;
		if (entry.type === "message" && entry.message.role === "assistant") {
			const promptTokens = usage.input + usage.cacheRead + usage.cacheWrite;
			totals.cacheHitRate = promptTokens > 0 ? (usage.cacheRead / promptTokens) * 100 : null;
		}
	}
	return totals;
}

function formatReset(resetsAt: string): string {
	const reset = new Date(resetsAt);
	const time = reset.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
	if (reset.toDateString() === new Date().toDateString()) return time;
	return `${reset.toLocaleDateString([], { weekday: "short" })} ${time}`;
}

function usageColor(percent: number): string {
	return percent > 90 ? "error" : percent > 70 ? "warning" : "success";
}

function row(label: string, value: string, style: Style): string {
	return style.fg("dim", ` ${label.padEnd(6)} `) + value;
}

export function renderFlightdeck(state: FlightdeckState, width: number, style: Style): string[] {
	const now = Date.now();
	const status = state.runStartedAt === null
		? style.fg("dim", "idle")
		: style.fg("accent", `${SPINNER[Math.floor(state.spinnerFrame / FRAMES_PER_SPINNER_STEP) % SPINNER.length]} working ${formatDuration(now - state.runStartedAt)}`);
	const padding = Math.max(1, width - visibleWidth(" flightdeck") - visibleWidth(status) - 1);
	const lines = [style.bold(" flightdeck") + " ".repeat(padding) + status, style.fg("dim", "─".repeat(width))];

	if (state.context) {
		const { tokens, contextWindow, percent } = state.context;
		if (percent === null || tokens === null) {
			lines.push(row("ctx", style.fg("dim", `? / ${formatTokens(contextWindow)} (until next reply)`), style));
		} else {
			const color = usageColor(percent);
			const barWidth = Math.max(4, width - 8 - 5);
			const filled = Math.round((Math.min(100, percent) / 100) * barWidth);
			lines.push(row("ctx", style.fg(color, "█".repeat(filled)) + style.fg("dim", "░".repeat(barWidth - filled)) + style.fg(color, `${Math.round(percent)}%`.padStart(5)), style));
			const left = Math.max(0, contextWindow - tokens);
			lines.push(row("", `${formatTokens(tokens)} / ${formatTokens(contextWindow)}` + style.fg("dim", " · ") + style.fg(color, `${formatTokens(left)} left`), style));
		}
	}

	const { input, output, cacheRead, cacheWrite, cost, cacheHitRate } = state.tokens;
	const tokenParts = [
		...(input ? [style.fg("syntaxVariable", `↑${formatTokens(input)}`)] : []),
		...(output ? [style.fg("syntaxString", `↓${formatTokens(output)}`)] : []),
		...(cacheRead ? [style.fg("syntaxNumber", `R${formatTokens(cacheRead)}`)] : []),
		...(cacheWrite ? [style.fg("syntaxNumber", `W${formatTokens(cacheWrite)}`)] : []),
		...(cacheHitRate !== null && (cacheRead || cacheWrite) ? [style.fg("syntaxType", `cache ${Math.round(cacheHitRate)}%`)] : []),
	];
	if (tokenParts.length > 0) lines.push(row("tokens", tokenParts.join(" "), style));
	if (cost > 0 || state.subscription) lines.push(row("cost", style.fg("success", `$${cost.toFixed(3)}`) + style.fg("dim", state.subscription ? " (sub)" : ""), style));

	const windows = state.plan ? ([["5h", state.plan.five_hour], ["7d", state.plan.seven_day]] as const) : [];
	let planLabel = "plan";
	for (const [name, window] of windows) {
		if (window?.utilization == null) continue;
		const used = window.utilization;
		const reset = window.resets_at ? style.fg("dim", ` ↻${formatReset(window.resets_at)}`) : "";
		lines.push(row(planLabel, `${name} ` + style.fg(usageColor(used), `${Math.round(Math.max(0, 100 - used))}% left`) + style.fg("dim", ` (${Math.round(used)}% used)`) + reset, style));
		planLabel = "";
	}

	if (state.activeTool) {
		const elapsed = style.fg("dim", ` ${formatDuration(now - state.activeTool.startedAt)}`);
		lines.push(row("now", style.fg("accent", state.activeTool.name) + " " + state.activeTool.summary + elapsed, style));
	}

	if (state.agents.size > 0) {
		const agents = [...state.agents].map(([name, startedAt]) => `${name} ${style.fg("dim", formatDuration(now - startedAt))}`);
		lines.push(row("agents", agents.join(", "), style));
	}

	if (state.speed) {
		const rate = state.speed.tokensPerSecond === null ? "" : style.fg("dim", " · ") + `${Math.round(state.speed.tokensPerSecond)} tok/s`;
		lines.push(row("speed", `ttft ${(state.speed.ttftMs / 1000).toFixed(1)}s` + rate, style));
	}

	if (state.receipt) {
		const { durationMs, toolCalls, edits, cost } = state.receipt;
		const parts = [formatDuration(durationMs), `${toolCalls} tools`, `${edits} edits`, ...(cost > 0 ? [`$${cost.toFixed(2)}`] : [])];
		lines.push(row("last", style.fg("muted", parts.join(" · ")), style));
	}

	if (state.recentTools.length > 0) {
		lines.push("", style.fg("dim", " recent"));
		for (const tool of state.recentTools) lines.push(`   ${style.fg("muted", tool.name.padEnd(6))} ${tool.summary}`);
	}

	return lines.map((line) => truncateToWidth(line, width, "…"));
}
