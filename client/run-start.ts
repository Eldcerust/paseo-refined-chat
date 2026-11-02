/**
 * When a running tool call began.
 *
 * The host rewrites a timeline item's timestamp on every update, so once a
 * shell call settles its published timestamp is the finishing moment. The
 * transformer sees the running state first, and recording that moment there
 * lets the settled card still report how long it took, even when the provider
 * sends no duration of its own. A call is only recorded once and the map is
 * bounded, because a settled call never needs its start again.
 */
const starts = new Map<string, number>();
const MAX_ENTRIES = 500;

/** The first moment a call was seen running; later calls keep the first. */
export function noteRunningCall(key: string): number {
  const known = starts.get(key);
  if (known !== undefined) return known;

  const at = Date.now();
  starts.set(key, at);
  if (starts.size > MAX_ENTRIES) {
    const oldest = starts.keys().next().value;
    if (oldest !== undefined) starts.delete(oldest);
  }
  return at;
}

/** The start this module recorded, if the call was ever seen running. */
export function readRunStart(key: string): number | undefined {
  return starts.get(key);
}
