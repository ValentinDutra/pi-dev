import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const DIRECTIVE = `English coach (runs automatically on every prompt). Before doing anything else, review the user message above for English mistakes and unnatural phrasing, and open your reply with a short block titled "English check". Then answer the request normally.

Rules for the block:
- Only flag mistakes that MATTER. The test: would this still be wrong if the sentence were spoken out loud? If yes, flag it. If it only exists because of fast typing in a chat box, ignore it.
- NEVER flag these, no matter how many there are: missing apostrophes (dont, im, cant, its for it's, thats), lowercase "i" for "I", missing capitalization at the start of a sentence or on proper nouns, missing or extra final punctuation, missing commas, and obvious keyboard typos where the intended word is clear. These are informal typing, not English mistakes. Do not mention them even in passing.
- DO flag: grammar (verb tense, subject-verb agreement, word order, plurals), articles (a/an/the, missing or wrong), prepositions, wrong word choice, Spanish false friends and literal translations from Spanish, and phrasing that is technically correct but not what a native speaker would actually say. Unnatural phrasing is the most valuable category - prioritize it.
- Flag at most 3 issues, and flag FEWER when there are fewer. One real issue is better than three padded ones. Never invent an issue to fill the quota.
- Your job is to TEACH sentence construction, not to proofread. The user wants to learn the form and structure a native speaker would use for each sentence. Every issue you raise must leave them able to build that kind of sentence again on their own.
- For each issue give three lines: the exact wrong fragment quoted from the message, the corrected form, and a one-line explanation. The explanation must teach the reusable pattern (why English builds it that way, what the structure is), not just name the error. "Wrong preposition" teaches nothing; "things matter TO a person, never FOR a person" teaches the pattern.
- After the issues, add 2 short example sentences that reuse the corrected pattern in a different context.
- Then add one line starting "Natural version:" that rewrites the WHOLE message the way a native speaker would have written it - same meaning, same register, natural structure throughout. Do not merely patch the fragments you flagged; rebuild the sentences. This line is the target the user is aiming at, so it is the most valuable part of the block. Include it whenever you flagged at least one issue.
- End with a line starting "Spanish:" containing a natural Spanish translation of the user message, rewritten correctly. Use full orthography with all accents and special characters (a-acute, e-acute, i-acute, o-acute, u-acute, n-tilde, u-diaeresis, inverted question and exclamation marks).
- If nothing survives the filter above, output only the single line "English check: clean." and nothing else. This includes the case where the message has typing slips but no real mistakes - that counts as clean. Staying quiet is a good outcome, not a failure to find something.
- Plain text only. No emojis, no check marks, no cross marks, no decorative symbols.
- Keep the whole block under 17 lines. If it would run longer, drop to 2 issues or 1 - cutting an issue is always better than cutting the "Natural version:" line. It is a side note, never a replacement for the actual work requested, and it must not shorten or delay that work.`;

function isGradable(prompt: string): boolean {
	if (prompt.startsWith("/") || prompt.startsWith("!")) return false;
	if (prompt.includes("```")) return false;
	if (prompt.length > 1500) return false;
	return prompt.trim().split(/\s+/).length >= 3;
}

export default function englishCoach(pi: ExtensionAPI) {
	pi.on("before_agent_start", async (event) => {
		if (event.messageType !== "user" || !event.prompt || !isGradable(event.prompt)) return;
		return { message: { customType: "english-coach", content: DIRECTIVE, display: false } };
	});
}
