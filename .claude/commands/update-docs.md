---
description: Sync CLAUDE.md status, project_status.md, Changelog.md and Architecture.md with what actually happened. Run at the end of each step.
---

Bring the project docs up to date with the real state of the project. Run this at the end of every step or phase of work. `$ARGUMENTS` may name the step that just finished.

## 1. Establish what actually changed
Base everything on the repo, not on memory of the conversation:
- Run `git status` and `git log --oneline -15` once the repo has history. If there is no repo yet, list files changed this session instead.
- Read the files you are about to update before editing them.
- Compare the real file tree with the **Directory Structure** in `CLAUDE.md`.

## 2. Update these files (only what actually changed)
1. **`CLAUDE.md`, "Current Status" section.** Update Phase, Last completed, Next step, Blockers and the build-phase checklist. Keep it a lightweight snapshot. Detail goes in `project_status.md`, not here.
2. **`CLAUDE.md`, other sections, only if reality changed.** Directory Structure (if files or folders were added, moved or renamed), Frequently Used Commands (if new commands now exist and work), Repository Etiquette (if a workflow was decided).
3. **`project_status.md`:** move finished items to Completed, refresh Next up, add any decision made this step to the Decisions log (what and why), and update Open items.
4. **`Changelog.md`:** add concise entries under `[Unreleased]` for what was added, changed or fixed.
5. **`Architecture.md`:** update the Components table (status and notes) for anything built or changed. Update the Data flow section only if the implemented flow differs from `planning/engineering_design.md`.

## 3. Rules
- Do not invent progress. If something was started but not finished, say so.
- Do not duplicate content between `CLAUDE.md` and `project_status.md`. CLAUDE.md summarizes, project_status.md details.
- If the work contradicts `planning/product_requirements.md` or `planning/engineering_design.md`, do not silently edit them. Flag the mismatch to the user and ask.
- Do not commit, push or create PRs. This command only edits the docs.

## 4. Report
Finish with a short summary of what changed in each file, and call out anything that needs a decision from the user.
