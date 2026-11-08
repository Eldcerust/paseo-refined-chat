import { useEffect, useSyncExternalStore } from "react";
import { isAskReply, pairAskTranscripts } from "./ask-question";

// The host emits the request and its answer as separate rows with one callId.
// Keep their text while any row is mounted, including across virtualized rows.
const calls = new Map<string, { text: Map<number, string>; mounted: Map<number, number>; replies: Map<string, string> }>();
const listeners = new Set<() => void>();
let revision = 0;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const snapshot = () => revision;
export const onCodexAskChange = subscribe;

export function isHiddenCodexReply(messageId: string | undefined, text: string): boolean {
  if (!messageId) return false;
  for (const call of calls.values()) {
    if (call.mounted.size && call.replies.get(messageId) === text) return true;
  }
  return false;
}

export function noteCodexAskReply(agentId: string, messageId: string | undefined, message: string): void {
  if (!messageId) return;
  for (const [key, call] of calls) {
    if (!key.startsWith(`${agentId}:`) || !call.mounted.size) continue;
    const transcript = call.text.get(Math.max(...call.text.keys()))!;
    if (isAskReply(message, transcript) && call.replies.get(messageId) !== message) {
      call.replies.set(messageId, message);
      changed();
    }
  }
}
function changed() {
  revision++;
  listeners.forEach(listener => listener());
}

export function useIsCodexAskReply(agentId: string, message: string): boolean {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  for (const [key, call] of calls) {
    if (!key.startsWith(`${agentId}:`) || !call.mounted.size) continue;
    const latest = Math.max(...call.text.keys());
    if (isAskReply(message, call.text.get(latest)!)) return true;
  }
  return false;
}

export function useCodexAsk(agentId: string, callId: string | undefined, at: number, text: string | undefined) {
  const key = callId && text ? `${agentId}:${callId}` : undefined;
  useSyncExternalStore(subscribe, snapshot, snapshot);
  useEffect(() => {
    if (!key || !text) return;
    let call = calls.get(key);
    if (!call) {
      call = { text: new Map(), mounted: new Map(), replies: new Map() };
      calls.set(key, call);
    }
    call.text.set(at, text);
    call.mounted.set(at, (call.mounted.get(at) ?? 0) + 1);
    changed();
    return () => {
      const count = (call.mounted.get(at) ?? 1) - 1;
      if (count) call.mounted.set(at, count);
      else call.mounted.delete(at);
      if (!call.mounted.size) calls.delete(key);
      changed();
    };
  }, [key, at, text]);
  const call = key ? calls.get(key) : undefined;
  if (!call) return { hidden: false, questions: [], transcript: text };
  const times = [...call.text.keys()].sort((a, b) => a - b);
  const first = call.text.get(times[0]!)!;
  const last = call.text.get(times[times.length - 1]!)!;
  return {
    hidden: at !== Math.min(...call.mounted.keys()),
    questions: times.length > 1 ? pairAskTranscripts(first, last) : [],
    transcript: last,
  };
}
