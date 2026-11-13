import "server-only";
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

/*
 * The legal pages (Privacy Policy, Refund Policy, Terms and Conditions) are
 * written as Markdown in /documents, so they can be edited without touching
 * code. The pages are static, so the files are read once at build time.
 *
 * Only the Markdown those documents use is supported: "# " title,
 * "**Last updated:** …", "## " headings, "- " lists, "---" rules, paragraphs
 * (a line ending in two spaces is a line break), **bold** and [links](/url).
 */

export type LegalDoc = {
  title: string;
  updated: string | null;
  /** First paragraph, used as the page's meta description. */
  summary: string;
  body: React.ReactNode;
};

const DOCS_DIR = path.join(process.cwd(), "documents");

export function loadLegalDoc(fileName: string): LegalDoc {
  const raw = fs.readFileSync(path.join(DOCS_DIR, fileName), "utf8").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");

  let title = fileName.replace(/\.md$/, "");
  let updated: string | null = null;
  let summary = "";
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join("\n");
    if (!summary) summary = plain(text);
    blocks.push(<p key={blocks.length}>{lineBreaks(text)}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={blocks.length}>
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("# ")) {
      title = trimmed.slice(2).trim();
      continue;
    }
    const lastUpdated = trimmed.match(/^\*\*Last updated:\*\*\s*(.+)$/i);
    if (lastUpdated) {
      updated = lastUpdated[1].trim();
      continue;
    }
    if (trimmed === "") {
      flushParagraph();
      flushList();
      continue;
    }
    if (/^-{3,}$/.test(trimmed)) {
      flushParagraph();
      flushList();
      blocks.push(<hr key={blocks.length} className="my-10 border-slate-200" />);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      flushList();
      blocks.push(<h2 key={blocks.length}>{inline(trimmed.slice(3))}</h2>);
      continue;
    }
    if (trimmed.startsWith("### ")) {
      flushParagraph();
      flushList();
      blocks.push(<h3 key={blocks.length}>{inline(trimmed.slice(4))}</h3>);
      continue;
    }
    if (/^[-*] /.test(trimmed)) {
      flushParagraph();
      list.push(trimmed.slice(2));
      continue;
    }
    flushList();
    // Keep the two-space line-break marker; trim the rest.
    paragraph.push(line.endsWith("  ") ? `${trimmed}  ` : trimmed);
  }
  flushParagraph();
  flushList();

  return { title, updated, summary: summary.slice(0, 300), body: blocks };
}

/** A paragraph: lines joined with spaces, except "  " line ends become breaks. */
function lineBreaks(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    const hardBreak = line.endsWith("  ");
    out.push(<span key={`l${i}`}>{inline(line.trimEnd())}</span>);
    if (i < lines.length - 1) out.push(hardBreak ? <br key={`b${i}`} /> : " ");
  });
  return out;
}

const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|[\w.+-]+@[\w-]+\.[\w.]+)/g;

/** **bold**, [text](href) and bare email addresses (as mailto links). */
function inline(text: string): React.ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-navy-950">
          {inline(part.slice(2, -2))}
        </strong>
      );
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const className = "font-semibold text-brand-700 hover:underline";
      return href.startsWith("/") ? (
        <Link key={i} href={href} className={className}>
          {label}
        </Link>
      ) : (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {label}
        </a>
      );
    }
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(part)) {
      return (
        <a key={i} href={`mailto:${part}`} className="font-semibold text-brand-700 hover:underline">
          {part}
        </a>
      );
    }
    return part;
  });
}

/** Markdown-free text, for meta descriptions. */
function plain(text: string) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}
