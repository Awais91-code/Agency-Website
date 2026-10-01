import Link from "next/link";
import type { ReactNode } from "react";

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*/g;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let index = 0;

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > cursor) nodes.push(text.slice(cursor, start));

    const key = `${keyPrefix}-${index++}`;

    if (match[1] && match[2]) {
      const href = match[2].trim();
      const safe =
        href.startsWith("/") ||
        href.startsWith("https://") ||
        href.startsWith("http://");

      nodes.push(
        safe ? (
          <Link
            key={key}
            href={href}
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            {match[1]}
          </Link>
        ) : (
          match[1]
        ),
      );
    } else if (match[3]) {
      nodes.push(
        <code key={key} className="rounded bg-muted px-1.5 py-0.5 text-[0.9em]">
          {match[3]}
        </code>,
      );
    } else if (match[4]) {
      nodes.push(<strong key={key}>{match[4]}</strong>);
    }

    cursor = start + match[0].length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function ArticleBody({ markdown }: { markdown: string }) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: Array<{ ordered: boolean; text: string }> = [];

  function flushParagraph() {
    if (!paragraph.length) return;
    const value = paragraph.join(" ").trim();

    if (value) {
      blocks.push(
        <p
          key={`p-${blocks.length}`}
          className="text-base leading-8 text-muted-foreground sm:text-lg"
        >
          {renderInline(value, `p-${blocks.length}`)}
        </p>,
      );
    }

    paragraph = [];
  }

  function flushList() {
    if (!list.length) return;
    const ordered = list[0]?.ordered ?? false;
    const Tag = ordered ? "ol" : "ul";

    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={
          ordered
            ? "list-decimal space-y-2 pl-6 text-base leading-7 text-muted-foreground"
            : "list-disc space-y-2 pl-6 text-base leading-7 text-muted-foreground"
        }
      >
        {list.map((item, index) => (
          <li key={`${item.text}-${index}`}>
            {renderInline(item.text, `li-${blocks.length}-${index}`)}
          </li>
        ))}
      </Tag>,
    );

    list = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3
          key={`h3-${blocks.length}`}
          className="pt-3 text-2xl font-black tracking-tight"
        >
          {renderInline(line.slice(4), `h3-${blocks.length}`)}
        </h3>,
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <h2
          key={`h2-${blocks.length}`}
          className="pt-5 text-3xl font-black tracking-tight"
        >
          {renderInline(line.slice(3), `h2-${blocks.length}`)}
        </h2>,
      );
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      flushList();
      blocks.push(
        <blockquote
          key={`quote-${blocks.length}`}
          className="border-l-4 border-primary pl-5 text-lg font-semibold leading-8"
        >
          {renderInline(line.slice(2), `quote-${blocks.length}`)}
        </blockquote>,
      );
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);

    if (unordered || ordered) {
      flushParagraph();
      const isOrdered = Boolean(ordered);
      if (list.length && list[0]?.ordered !== isOrdered) flushList();

      list.push({
        ordered: isOrdered,
        text: (ordered?.[1] || unordered?.[1] || "").trim(),
      });
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return <div className="space-y-6">{blocks}</div>;
}
