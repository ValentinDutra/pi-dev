---
description: Quick web research on a concept or choice, answered with a recommendation and sources
argument-hint: "<question or topic>"
---
Research this on the web: $@

1. Run 2-4 focused `web_search` queries that attack the question from different angles (official docs, comparisons, recent discussion). Prefer sources from the last 12 months when the topic moves fast.
2. Open the 2-4 most relevant results with `fetch_content`. Do not answer from search snippets alone.
3. Answer in this order:
   - **Answer / recommendation** — one or two sentences. If it is a choice, pick one and say why.
   - **Key points** — at most 5 bullets, each tied to a source.
   - **Sources** — bare URLs, one per line.
4. Say plainly when sources disagree or when something could not be verified. Do not pad.
