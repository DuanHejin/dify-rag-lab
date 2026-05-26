---
name: personal-article-series
description: Generate personal technical narrative articles in Duan Hejin's established style, especially follow-up articles for the "重新部署自己" / SuperAgentConsole / Dify learning series. Use when the user asks to draft one or more public technical articles, turn learning notes into articles, create a series plan, or generate WeChat official account, Zhihu, and Juejin versions for each article.
---

# Personal Article Series

Use this skill to turn the user's project notes, debugging records, learning plans, or implementation logs into publishable Chinese technical narrative articles.

## Core Workflow

1. Identify the article context:
   - Read local source notes first when the user points to a repo, `docs/`, plan file, or existing article folder.
   - Preserve the user's real sequence of events. Do not invent personal history, dates, results, costs, or production claims.
   - If this is a follow-up to an existing series, position the new article as a continuation, not a restart.

2. Create article sets:
   - Generate three versions for every article unless the user says otherwise.
   - Use the suffix pattern:
     - Base / WeChat narrative version: `NN-topic.md`
     - Zhihu version: `NN-topic-zhihu.md`
     - Juejin version: `NN-topic-juejin.md`
   - For a series, also create or update a `README.md` with article order, core points, and filenames.

3. Match the user's narrative style:
   - Write in first person.
   - Start from a concrete stage, problem, or realization.
   - Use short paragraphs, often one sentence per paragraph.
   - Prefer real engineering details over generic inspiration.
   - Use `txt`, `bash`, `json`, or other code blocks for chains, commands, logs, requests, and key lists.
   - Close with a grounded reflection about engineering, product understanding, or career direction.

4. Produce platform-specific variants:
   - Base / WeChat: more narrative, smoother emotional and learning arc, fewer numbered headings.
   - Zhihu: clearer explanatory structure, stronger reasoning, useful for readers asking "why".
   - Juejin: more technical, numbered sections, practical commands, requests, response fields, bug causes, and summary points.

5. Validate before finishing:
   - Check every planned article has exactly three versions.
   - Check filenames are consistent.
   - Check the platform tone is actually different, not just title changes.
   - Check code blocks are valid Markdown fences.
   - Check the article does not overstate what the user has done.

## Style References

Read these only as needed:

- `references/style-guide.md`: the user's prose rhythm, structure, and common patterns.
- `references/platform-versions.md`: differences between WeChat, Zhihu, and Juejin outputs.
