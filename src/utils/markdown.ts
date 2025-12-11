import { colors } from "./colors.js";

type InlineToken =
  | { type: "text"; content: string }
  | { type: "code"; content: string }
  | { type: "bold"; children: InlineToken[] }
  | { type: "italic"; children: InlineToken[] }
  | { type: "boldItalic"; children: InlineToken[] }
  | { type: "strike"; children: InlineToken[] }
  | { type: "link"; children: InlineToken[]; url: string };

const allowedBareExtensions = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "md",
  "py",
  "java",
  "yml",
  "yaml",
  "sh",
  "html",
  "css",
  "scss",
  "gradle",
  "xml",
  "lock",
  "toml",
  "ini",
  "env",
]);

const candidatePathRegex =
  /\b[A-Za-z0-9._-]+(?:[\\/][A-Za-z0-9._-]+)*\.[A-Za-z]{1,8}\b/g;

const pathStyle = `${colors.bold}${colors.cyan}`;

export function renderMarkdownToAnsi(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const output: string[] = [];

  let inCodeFence = false;
  let fenceDelimiter: "```" | "~~~" | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const fenceMatch = line.match(/^\s*(```|~~~)(.*)$/);
    if (fenceMatch) {
      const delim = fenceMatch[1] as "```" | "~~~";
      if (!inCodeFence) {
        inCodeFence = true;
        fenceDelimiter = delim;
        output.push(`${colors.gray}${line.trimEnd()}${colors.reset}`);
      } else if (fenceDelimiter === delim) {
        inCodeFence = false;
        fenceDelimiter = null;
        output.push(`${colors.gray}${line.trimEnd()}${colors.reset}`);
      } else {
        output.push(`${colors.gray}${line.trimEnd()}${colors.reset}`);
      }
      continue;
    }

    if (inCodeFence) {
      output.push(`${colors.gray}${line}${colors.reset}`);
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();
      const headingColor =
        level === 1 ? colors.cyan : level === 2 ? colors.blue : colors.magenta;
      output.push(
        `${headingColor}${colors.bold}${renderInline(text)}${colors.reset}`
      );
      continue;
    }

    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      output.push(`${colors.gray}${"─".repeat(50)}${colors.reset}`);
      continue;
    }

    const blockquoteMatch = line.match(/^\s*>\s?(.*)$/);
    if (blockquoteMatch) {
      output.push(
        `${colors.gray}│ ${colors.reset}${renderInline(blockquoteMatch[1])}`
      );
      continue;
    }

    const taskMatch = line.match(/^(\s*)[-+*]\s+\[( |x|X)\]\s+(.*)$/);
    if (taskMatch) {
      const indent = taskMatch[1];
      const checked = taskMatch[2].toLowerCase() === "x";
      const box = checked
        ? `${colors.green}☑${colors.reset}`
        : `${colors.gray}☐${colors.reset}`;
      output.push(`${indent}${box} ${renderInline(taskMatch[3])}`);
      continue;
    }

    const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      const indent = orderedMatch[1];
      const num = orderedMatch[2];
      output.push(
        `${indent}${colors.yellow}${num}.${colors.reset} ${renderInline(
          orderedMatch[3]
        )}`
      );
      continue;
    }

    const unorderedMatch = line.match(/^(\s*)[-+*]\s+(.*)$/);
    if (unorderedMatch) {
      const indent = unorderedMatch[1];
      output.push(
        `${indent}${colors.yellow}•${colors.reset} ${renderInline(
          unorderedMatch[2]
        )}`
      );
      continue;
    }

    if (looksLikeTableHeader(line, lines[i + 1])) {
      output.push(renderTableLine(line, true));
      output.push(`${colors.gray}${lines[i + 1].trimEnd()}${colors.reset}`);
      i++;
      continue;
    }

    if (looksLikeTableRow(line)) {
      output.push(renderTableLine(line, false));
      continue;
    }

    output.push(renderInline(line));
  }

  return output.join("\n");
}

function renderInline(text: string): string {
  return renderTokens(parseInline(text), "");
}

function renderTokens(tokens: InlineToken[], activeStyle: string): string {
  let output = "";
  for (const token of tokens) {
    switch (token.type) {
      case "text":
        output += highlightPaths(token.content, activeStyle);
        break;
      case "code": {
        const codeStyle = activeStyle + colors.cyan;
        output += codeStyle;
        output += highlightPaths(token.content, codeStyle);
        output += colors.reset + activeStyle;
        break;
      }
      case "bold": {
        const style = activeStyle + colors.bold;
        output += style;
        output += renderTokens(token.children, style);
        output += colors.reset + activeStyle;
        break;
      }
      case "italic": {
        const style = activeStyle + colors.italic;
        output += style;
        output += renderTokens(token.children, style);
        output += colors.reset + activeStyle;
        break;
      }
      case "boldItalic": {
        const style = activeStyle + colors.bold + colors.italic;
        output += style;
        output += renderTokens(token.children, style);
        output += colors.reset + activeStyle;
        break;
      }
      case "strike": {
        const style = activeStyle + colors.gray;
        output += style;
        output += renderTokens(token.children, style);
        output += colors.reset + activeStyle;
        break;
      }
      case "link": {
        const linkStyle = activeStyle + colors.blue + colors.underline;
        output += linkStyle;
        output += renderTokens(token.children, linkStyle);
        output += colors.reset + activeStyle;
        output += `${colors.gray} (${token.url})${colors.reset}${activeStyle}`;
        break;
      }
      default:
        break;
    }
  }
  return output;
}

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    if (ch === "\\" && i + 1 < text.length) {
      tokens.push({ type: "text", content: text[i + 1] });
      i += 2;
      continue;
    }

    if (text.startsWith("```", i) || text.startsWith("~~~", i)) {
      tokens.push({ type: "text", content: ch });
      i++;
      continue;
    }

    if (ch === "`") {
      const end = findDelimiter(text, i + 1, "`");
      if (end !== -1) {
        tokens.push({ type: "code", content: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (text.startsWith("[", i)) {
      const closeBracket = findDelimiter(text, i + 1, "]");
      if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
        const closeParen = findDelimiter(text, closeBracket + 2, ")");
        if (closeParen !== -1) {
          const linkText = text.slice(i + 1, closeBracket);
          const url = text.slice(closeBracket + 2, closeParen);
          tokens.push({
            type: "link",
            children: parseInline(linkText),
            url,
          });
          i = closeParen + 1;
          continue;
        }
      }
    }

    if (text.startsWith("***", i) || text.startsWith("___", i)) {
      const delim = text.slice(i, i + 3);
      const end = findDelimiter(text, i + 3, delim);
      if (end !== -1) {
        tokens.push({
          type: "boldItalic",
          children: parseInline(text.slice(i + 3, end)),
        });
        i = end + 3;
        continue;
      }
    }

    if (text.startsWith("**", i) || text.startsWith("__", i)) {
      const delim = text.slice(i, i + 2);
      const end = findDelimiter(text, i + 2, delim);
      if (end !== -1) {
        tokens.push({
          type: "bold",
          children: parseInline(text.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }

    if (text.startsWith("~~", i)) {
      const end = findDelimiter(text, i + 2, "~~");
      if (end !== -1) {
        tokens.push({
          type: "strike",
          children: parseInline(text.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }

    if (ch === "*" || ch === "_") {
      const prev = text[i - 1];
      const next = text[i + 1];
      // Check for a word boundary: transition between word and non-word character
      const looksLikeWordBoundary =
        (isWordChar(prev) && !isWordChar(next)) ||
        (!isWordChar(prev) && isWordChar(next));

      if (looksLikeWordBoundary) {
        const end = findDelimiter(text, i + 1, ch);
        if (end !== -1) {
          tokens.push({
            type: "italic",
            children: parseInline(text.slice(i + 1, end)),
          });
          i = end + 1;
          continue;
        }
      }
    }

    const nextSpecial = findNextSpecialIndex(text, i);
    const endIndex = nextSpecial === -1 ? text.length : nextSpecial;
    if (endIndex === i) {
      tokens.push({ type: "text", content: ch });
      i++;
      continue;
    }
    tokens.push({ type: "text", content: text.slice(i, endIndex) });
    i = endIndex;
  }

  return tokens;
}

function findDelimiter(text: string, startIndex: number, delim: string): number {
  let searchIndex = startIndex;
  while (searchIndex < text.length) {
    const idx = text.indexOf(delim, searchIndex);
    if (idx === -1) return -1;
    if (idx > 0 && text[idx - 1] === "\\") {
      searchIndex = idx + 1;
      continue;
    }
    return idx;
  }
  return -1;
}

function findNextSpecialIndex(text: string, startIndex: number): number {
  const specials = ["\\", "`", "[", "*", "_", "~"];
  let min = -1;
  for (const s of specials) {
    const idx = text.indexOf(s, startIndex);
    if (idx !== -1 && (min === -1 || idx < min)) {
      min = idx;
    }
  }
  return min;
}

function isWordChar(ch?: string): boolean {
  return !!ch && /[A-Za-z0-9]/.test(ch);
}

function highlightPaths(text: string, baseStyle: string): string {
  candidatePathRegex.lastIndex = 0;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = candidatePathRegex.exec(text))) {
    const value = match[0];
    const hasSlash = value.includes("/") || value.includes("\\");
    const ext = value.split(".").pop()?.toLowerCase() ?? "";
    const shouldHighlight = hasSlash || allowedBareExtensions.has(ext);

    result += text.slice(lastIndex, match.index);

    if (shouldHighlight) {
      const restore = baseStyle ? colors.reset + baseStyle : colors.reset;
      result += `${pathStyle}${value}${restore}`;
    } else {
      result += value;
    }

    lastIndex = match.index + value.length;
  }

  result += text.slice(lastIndex);
  return result;
}

function looksLikeTableHeader(line: string, nextLine?: string): boolean {
  if (!nextLine) return false;
  return looksLikeTableRow(line) && looksLikeTableSeparator(nextLine);
}

function looksLikeTableRow(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return false;
  const pipeCount = (trimmed.match(/\|/g) || []).length;
  return pipeCount >= 2;
}

function looksLikeTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function renderTableLine(line: string, isHeader: boolean): string {
  const trimmed = line.trim();
  const cells = trimmed
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

  const renderedCells = cells.map((cell) =>
    isHeader
      ? `${colors.bold}${renderInline(cell)}${colors.reset}`
      : renderInline(cell)
  );

  return `| ${renderedCells.join(" | ")} |`;
}
