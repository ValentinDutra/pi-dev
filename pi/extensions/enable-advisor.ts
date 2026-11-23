import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const agentDir = join(homedir(), ".pi", "agent");
const bridgeSource = join(agentDir, "npm", "node_modules", "pi-claude-bridge", "src", "index.ts");
const advisorNoticePatch = join(agentDir, "patches", "pi-claude-bridge-advisor-notice.patch");

// pi-claude-bridge sets CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 when it loads. That also blocks
// the feature-flag fetch Claude Code needs to attach the advisor tool, so the advisorModel from
// ~/.claude/settings.json never applies. session_start runs after every extension has loaded, and
// the bridge copies process.env into each Claude Code child it starts.
export default function enableAdvisor(pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		delete process.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC;
		if (!readFileSync(bridgeSource, "utf8").includes("pushAdvisorNotice")) {
			ctx.ui.notify(`Advisor calls are hidden: pi-claude-bridge was reinstalled without ${advisorNoticePatch}. Reapply it with patch -p1.`, "warning");
		}
	});
}
