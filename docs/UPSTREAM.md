# Maintaining the upstream relationship

Refined Chat is a GitHub fork of
[ABorakati/beautiful-chat](https://github.com/ABorakati/beautiful-chat).
Keep the fork relationship and full original Git history.

Review upstream changes manually; do **not** merge automatically.
For a proposed update:

```bash
git remote add upstream https://github.com/ABorakati/beautiful-chat.git
git fetch upstream
git switch -c chore/review-upstream-update
git merge --no-commit --no-ff upstream/main
```

Inspect and resolve conflicts. Preserve Refined Chat's distinct
`paseo-plugin.json` ID, package name, browser storage namespace,
CSS/DOM identifiers, copyright notices and font licenses.

Verify with `npm ci` and `npm run typecheck` locally, then create
a PR. No hosted CI is configured.

Refined Chat has adapted changes from several open upstream pull requests,
starting with
[upstream PR #9](https://github.com/ABorakati/beautiful-chat/pull/9). Each is
credited to its author in `NOTICE.md`. These changes were ported individually,
not merged into upstream main. When syncing future upstream changes, resolve
any duplicate or overlapping edits explicitly, and add a line to `NOTICE.md`
when you adapt another pull request.

Avoid enabling Beautiful Chat and Refined Chat simultaneously;
both replace the same timeline surfaces in Paseo.

## Syncing with GenoDevelop/paseo-refined-chat

This fork's GitHub parent is
[GenoDevelop/paseo-refined-chat](https://github.com/GenoDevelop/paseo-refined-chat).
`.github/workflows/sync-upstream.yml` merges its `main` into this fork every six
hours, but it can only resolve `CHANGELOG.md`. Any other conflict fails the run,
pushes nothing, and every later run fails the same way until someone merges by hand:
the fork then falls further behind (it was 13 commits behind after the PR 50 squash
merge, with the workflow failing since 2026-11-08).

To fix a failing run, merge `upstream/main` in a separate worktree, resolve the
conflicts, run `npm run typecheck` and `node --test tests/`, and push to `main`.

Where the fork and upstream both implement the same thing, the merge of v0.6.1 kept
this:

- **iOS text selection.** The fork's native-Markdown prose and its Select dialog stay
  first. Upstream's `IOSSelectableProse` draws prose when the host has no `Markdown`,
  and a paragraph it cannot take (a link, a file path) keeps the fork's long-press
  dialog. The Select button and long-press are not wired into the fullscreen diff.
- **Cards start open.** A completed tool card starts open unless its kind is under
  "Cards that start collapsed". Upstream's `startsExpanded` (completed cards start
  folded) is still exported and tested, but `live-renderers.tsx` does not call it.
  The question card follows upstream and can now be folded from that setting.
- **Question card.** Upstream's version (PR 50 plus the Codex follow-ups) replaced
  the fork's copy of `client/ask-question.ts`.
