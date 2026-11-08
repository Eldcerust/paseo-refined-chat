/**
 * When each completed timeline section ended, per agent.
 *
 * A reasoning or assistant item carries only the moment its last chunk
 * arrived: the host rewrites the timestamp on every update and keeps no start.
 * A card that mounts after its section has finished — a scroll back, a plugin
 * reload, or a provider that sends the whole block at once — has no live
 * instant to measure from. The end of the previous completed section is the
 * honest fallback: the gap from there to this section's end is this section's
 * elapsed time.
 *
 * Only settled sections are recorded. A streaming item's timestamp moves with
 * every chunk, and recording those would fill the store with partial times and
 * make the next section measure from the wrong place.
 */
type SectionKind = "user" | "assistant" | "reasoning" | "tool";

interface SectionEnd {
  at: number;
  kind: SectionKind;
}

const byAgent = new Map<string, SectionEnd[]>();
const MAX_ENTRIES = 400;

/** Records that a section ended at `at`. Re-renders of the same item are free. */
export function noteSectionEnd(agentId: string, at: number, kind: SectionKind): void {
  if (!Number.isFinite(at)) return;
  let list = byAgent.get(agentId);
  if (!list) {
    list = [];
    byAgent.set(agentId, list);
  }
  if (list.some((entry) => entry.at === at)) return;

  list.push({ at, kind });
  list.sort((a, b) => a.at - b.at);
  if (list.length > MAX_ENTRIES) list.splice(0, list.length - MAX_ENTRIES);
}

/** The newest completed section that ended before `at`, when one is known. */
export function previousSectionEnd(agentId: string, at: number): number | undefined {
  const list = byAgent.get(agentId);
  if (!list) return undefined;

  let found: number | undefined;
  for (const entry of list) {
    if (entry.at < at) found = entry.at;
    else break;
  }
  return found;
}
