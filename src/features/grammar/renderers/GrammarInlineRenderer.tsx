"use client";

import type { ReactNode } from "react";
import type { GrammarInline } from "@/content/grammar/schema";
import { getGrammarConceptAnchorId } from "@/features/grammar/lib/grammarPresentation";
import type { Language } from "@/types/i18n";

type GrammarInlineRendererProps = {
  nodes: readonly GrammarInline[];
  language: Language;
  renderFootnoteRef?: (ref: string, key: string) => ReactNode;
};

function renderDictionaryEntryHref(dictionaryEntryId: string) {
  return `/entry/${encodeURIComponent(dictionaryEntryId)}`;
}

function renderCopticNode(
  key: string,
  dictionaryEntryId: string | undefined,
  className: string,
  content: ReactNode,
) {
  if (!dictionaryEntryId) {
    return (
      <span key={key} className={className}>
        {content}
      </span>
    );
  }

  return (
    <a
      key={key}
      href={renderDictionaryEntryHref(dictionaryEntryId)}
      target="_blank"
      rel="noreferrer noopener"
      data-dictionary-entry-id={dictionaryEntryId}
      className={`${className} no-underline`}
    >
      {content}
    </a>
  );
}

function renderInlineNode(
  node: GrammarInline,
  language: Language,
  key: string,
  renderFootnoteRef?: (ref: string, key: string) => ReactNode,
): ReactNode {
  switch (node.type) {
    case "text":
      return <span key={key}>{node.text}</span>;
    case "coptic":
      return renderCopticNode(
        key,
        node.dictionaryEntryId,
        "font-coptic text-emerald-600 dark:text-emerald-400",
        node.text,
      );
    case "copticSpan":
      return renderCopticNode(
        key,
        node.dictionaryEntryId,
        "font-coptic text-lg text-emerald-600 dark:text-emerald-400",
        <>
          <GrammarInlineRenderer
            nodes={node.children}
            language={language}
            renderFootnoteRef={renderFootnoteRef}
          />
        </>,
      );
    case "strong":
      return (
        <strong key={key}>
          <GrammarInlineRenderer
            nodes={node.children}
            language={language}
            renderFootnoteRef={renderFootnoteRef}
          />
        </strong>
      );
    case "em":
      return (
        <em key={key}>
          <GrammarInlineRenderer
            nodes={node.children}
            language={language}
            renderFootnoteRef={renderFootnoteRef}
          />
        </em>
      );
    case "smallCaps":
      return (
        <span key={key} className="small-caps">
          <GrammarInlineRenderer
            nodes={node.children}
            language={language}
            renderFootnoteRef={renderFootnoteRef}
          />
        </span>
      );
    case "underline":
      return (
        <span
          key={key}
          className="underline decoration-2 underline-offset-4"
        >
          <GrammarInlineRenderer
            nodes={node.children}
            language={language}
            renderFootnoteRef={renderFootnoteRef}
          />
        </span>
      );
    case "superscript":
      return (
        <sup key={key}>
          <GrammarInlineRenderer
            nodes={node.children}
            language={language}
            renderFootnoteRef={renderFootnoteRef}
          />
        </sup>
      );
    case "lineBreak":
      return <br key={key} />;
    case "termRef":
      return <span key={key}>{node.fallback ?? node.ref}</span>;
    case "conceptRef":
      return (
        <a
          key={key}
          href={`#${getGrammarConceptAnchorId(node.ref)}`}
          data-concept-ref={node.ref}
          className="font-medium text-sky-700 decoration-sky-300 underline decoration-dashed underline-offset-4 transition-colors hover:text-sky-600 hover:decoration-sky-500 dark:text-sky-300 dark:decoration-sky-700 dark:hover:text-sky-200 dark:hover:decoration-sky-400"
        >
          {node.fallback ?? node.ref}
        </a>
      );
    case "footnoteRef":
      if (renderFootnoteRef) {
        return renderFootnoteRef(node.ref, key);
      }

      return (
        <sup key={key} className="text-xs font-semibold text-sky-700 dark:text-sky-300">
          [{node.ref}]
        </sup>
      );
    case "link":
      return (
        <a
          key={key}
          href={node.href}
          className="text-sky-700 underline underline-offset-4 transition-colors hover:text-sky-600 dark:text-sky-300 dark:hover:text-sky-200"
        >
          <GrammarInlineRenderer
            nodes={node.children}
            language={language}
            renderFootnoteRef={renderFootnoteRef}
          />
        </a>
      );
    default: {
      const exhaustiveCheck: never = node;
      return exhaustiveCheck;
    }
  }
}

export function GrammarInlineRenderer({
  nodes,
  language,
  renderFootnoteRef,
}: GrammarInlineRendererProps) {
  return (
    <>
      {nodes.map((node, index) =>
        renderInlineNode(
          node,
          language,
          `${node.type}-${index}`,
          renderFootnoteRef,
        ),
      )}
    </>
  );
}
