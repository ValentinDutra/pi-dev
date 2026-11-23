import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { basename } from "node:path";

function formatCwd(cwd: string): string {
	if (cwd === process.env.HOME) return "~";
	return basename(cwd) || cwd;
}

function sanitizeStatus(text: string): string {
	return text.replace(/[\r\n\t]/g, " ").replace(/ +/g, " ").trim();
}

export default function colorfulFooter(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		if (ctx.mode !== "tui") return;

		ctx.ui.setFooter((tui, theme, footerData) => {
			const unsubscribe = footerData.onBranchChange(() => tui.requestRender());
			const separator = theme.fg("dim", " • ");

			function locationLine(width: number): string {
				let line = theme.bold(theme.fg("borderAccent", formatCwd(ctx.sessionManager.getCwd())));
				const branch = footerData.getGitBranch();
				if (branch) {
					const branchColor = branch === "detached" ? "warning" : "mdHeading";
					line += ` ${theme.fg("dim", "(")}${theme.fg(branchColor, branch)}${theme.fg("dim", ")")}`;
				}
				const sessionName = ctx.sessionManager.getSessionName();
				if (sessionName) line += separator + theme.fg("customMessageLabel", sessionName);
				return truncateToWidth(line, width, theme.fg("dim", "..."));
			}

			// Tokens, cost, context and plan limits live in the cockpit flightdeck.
			function statsLeft(): string {
				return Array.from(footerData.getExtensionStatuses().entries())
					.sort(([first], [second]) => first.localeCompare(second))
					.map(([, text]) => sanitizeStatus(text))
					.join(" ");
			}

			function modelRight(includeProvider: boolean): string {
				const model = ctx.model;
				let right = theme.fg("mdLink", model?.id ?? "no-model");
				if (model?.reasoning) {
					const level = ctx.thinkingLevel ?? "off";
					right += separator + theme.getThinkingBorderColor(level)(level === "off" ? "thinking off" : level);
				}
				if (includeProvider && model) right = `${theme.fg("muted", `(${model.provider})`)} ${right}`;
				return right;
			}

			function statsLine(width: number): string {
				const left = truncateToWidth(statsLeft(), width, "...");
				const leftWidth = visibleWidth(left);
				const minimumPadding = 2;
				let right = modelRight(footerData.getAvailableProviderCount() > 1);
				if (leftWidth + minimumPadding + visibleWidth(right) > width) right = modelRight(false);
				const availableForRight = width - leftWidth - minimumPadding;
				if (availableForRight <= 0) return left;
				right = truncateToWidth(right, availableForRight, "");
				return left + " ".repeat(Math.max(minimumPadding, width - leftWidth - visibleWidth(right))) + right;
			}

			return {
				dispose: unsubscribe,
				invalidate() {},
				render(width: number): string[] {
					return [locationLine(width), statsLine(width)];
				},
			};
		});
	});
}
