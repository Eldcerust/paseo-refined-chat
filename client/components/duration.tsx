import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import type { StyleProp, TextStyle } from "react-native";

/**
 * A gap in human units — `4s`, `2m 12s`, `1h 5m`. A raw millisecond count in
 * a header forces the reader to divide, and a running command's count changes
 * before the eye can. Paseo's own formatter rounds to whole seconds; a gap
 * under one second reads as `<1s` rather than as zero.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0s";
  if (ms < 1000) return "<1s";

  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  return restMinutes === 0 ? `${hours}h` : `${hours}h ${restMinutes}m`;
}

interface LiveElapsedProps {
  /** Epoch milliseconds at which the work started. */
  startedAt: number;
  /** Ticks while true; when false the last reading is kept. */
  active?: boolean;
  style?: StyleProp<TextStyle>;
  selectable?: boolean;
}

/**
 * The running time of the card above it. Isolated from that card so only the
 * label re-renders once a second, not the output beside it.
 */
export function LiveElapsed({
  startedAt,
  active = true,
  style,
  selectable,
}: LiveElapsedProps) {
  const [elapsedMs, setElapsedMs] = useState(() => Math.max(0, Date.now() - startedAt));
  const visibleElapsedMs = active ? Math.max(0, Date.now() - startedAt) : elapsedMs;

  useEffect(() => {
    if (!active) return;
    setElapsedMs(Math.max(0, Date.now() - startedAt));
    const handle = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - startedAt));
    }, 1000);
    return () => clearInterval(handle);
  }, [active, startedAt]);

  return (
    <Text selectable={selectable} style={style}>
      {formatDuration(visibleElapsedMs)}
    </Text>
  );
}

interface RunDurationProps {
  /** Epoch milliseconds the call began, when this client saw it running. */
  startedAt?: number;
  /** A settled duration: the provider's own, or measured by the card. */
  durationMs?: number;
  running: boolean;
  style?: StyleProp<TextStyle>;
  selectable?: boolean;
}

/**
 * The one duration label a tool card needs: a live count while the call runs,
 * then the settled gap. Nothing is drawn when neither time is known.
 */
export function RunDuration({
  startedAt,
  durationMs,
  running,
  style,
  selectable,
}: RunDurationProps) {
  if (running && startedAt !== undefined) {
    return <LiveElapsed startedAt={startedAt} active style={style} selectable={selectable} />;
  }
  if (durationMs === undefined) return null;
  return (
    <Text selectable={selectable} style={style}>
      {formatDuration(durationMs)}
    </Text>
  );
}
