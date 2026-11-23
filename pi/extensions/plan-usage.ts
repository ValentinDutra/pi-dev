import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MINIMUM_REFRESH_INTERVAL_MS = 60_000;

// Claude Code owns this keychain item and refreshes the token itself; reading it never rotates it.
async function readClaudeCodeAccessToken(): Promise<string> {
	const { stdout } = await execFileAsync("security", ["find-generic-password", "-s", "Claude Code-credentials", "-w"]);
	return JSON.parse(stdout).claudeAiOauth.accessToken;
}

// Undocumented endpoint behind Claude Code's /usage. Utilization is a 0-100 percentage.
async function fetchUsage(): Promise<unknown> {
	const response = await fetch("https://api.anthropic.com/api/oauth/usage", {
		headers: { Authorization: `Bearer ${await readClaudeCodeAccessToken()}`, "anthropic-beta": "oauth-2025-04-20" },
	});
	if (!response.ok) throw new Error(`usage endpoint returned ${response.status}`);
	return response.json();
}

// Publishes the reading on the "plan-usage" event channel; the cockpit flightdeck displays it.
export default function planUsage(pi: ExtensionAPI) {
	let lastRefresh = 0;

	async function refresh(ctx: ExtensionContext) {
		if (ctx.mode !== "tui" || Date.now() - lastRefresh < MINIMUM_REFRESH_INTERVAL_MS) return;
		lastRefresh = Date.now();
		try {
			pi.events.emit("plan-usage", await fetchUsage());
		} catch {
			// Keep the last reading. An expired token recovers once Claude Code refreshes it on the next bridge request.
		}
	}

	// Not awaited: turn_end handlers block stream consumption.
	pi.on("session_start", (_event, ctx) => {
		void refresh(ctx);
	});
	pi.on("turn_end", (_event, ctx) => {
		void refresh(ctx);
	});
}
