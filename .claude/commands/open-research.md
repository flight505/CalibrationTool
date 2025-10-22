---
description: Open the latest saved deep web research report (or a matching one by slug/topic)
argument-hint: "<optional: slug or topic>"
---

# Open Research Report

## Usage

```bash
/open-research
/open-research <slug or topic>
```

## Behavior

- Opens a saved research report from `docs/research/` created by the Deep Web Research workflow.
- If a `<slug or topic>` is provided, opens the most recent matching report; otherwise opens the most recent report overall.
- If multiple candidates exist, show a short, dated shortlist and then open the newest one.

## Steps (deterministic)

1) Ensure the directory `docs/research/` exists. If it does not exist, inform the user there are no saved reports yet.
2) List all `docs/research/*.md` files. Exclude non-markdown files.
3) If an argument `<slug or topic>` is provided:
   - Case-insensitive filter on filename and (if present) parse `docs/research/index.jsonl` to match by `topic` as well.
   - Prefer matches where `<slug or topic>` appears in the filename after the timestamp separator.
4) Sort candidates by timestamp descending. Timestamps follow the prefix format `<YYYY-MM-DD_HH-mm>-<topic-slug>.md`.
5) Open the newest matching file in the editor.
6) If `docs/research/index.jsonl` exists, surface the corresponding JSONL entry inline (topic, timestamp, path, num_sources) for the opened file.
7) If no matches are found, inform the user and suggest running `/deep-web-research <query>` first.

## Notes

- This command relies on the persistence pattern documented in `Deep-Web-Research-Agent.md` (saving timestamped markdown files and appending to `docs/research/index.jsonl`).
- Do not execute shell commands unless explicitly allowed by project settings; use editor/file tools to enumerate files and open the selected document.


