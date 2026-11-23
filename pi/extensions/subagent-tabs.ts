import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// pi-interactive-subagents splits the caller's Herdr pane unless the call names a tab.
// A tab label that does not exist yet becomes a new tab in the caller's workspace,
// and Herdr closes that tab when the subagent's pane closes.
export default function (pi: ExtensionAPI) {
	pi.on("tool_call", async (event) => {
		if (process.env.HERDR_ENV !== "1") return;
		if (event.toolName !== "subagent" && event.toolName !== "subagent_resume") return;
		event.input.tab ??= event.input.name ?? "Resume";
	});
}
