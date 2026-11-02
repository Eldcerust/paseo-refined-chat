import { parseMarkdown, type MdInline } from "./parse";

/**
 * Whether a reply is nothing but paragraphs: no heading, list, quote, table,
 * code block, rule or image, and no `==mark==`, which only this plugin draws.
 *
 * Such a reply loses nothing when the host draws it, and the host's text is
 * the text iOS can select. A reply with any other block stays with the plugin,
 * which cannot reach the host's markdown for a single paragraph of it.
 */
export function isProseOnly(text: string): boolean {
  const blocks = parseMarkdown(text);
  return blocks.length > 0 && blocks.every((block) => block.kind === "paragraph" && !hasMark(block.spans));
}

function hasMark(spans: MdInline[]): boolean {
  return spans.some((span) => {
    if (span.kind === "mark") return true;
    return "spans" in span && hasMark(span.spans);
  });
}
