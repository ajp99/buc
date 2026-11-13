import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// UI strings must go through t(). This catches literal English in JSX text and
// in user-visible attributes. shadcn primitives in components/ui are exempt.
const ROOTS = ["app", "components"];
const SKIP_DIRS = new Set(["ui"]);
const ALLOWED = [
  /placeholder="https:\/\//, // example URL, not language-specific
  /^\s+Website\s*$/, // hidden honeypot label, never shown to people
];
const PATTERNS = [
  /(?<!=)>\s*[A-Za-z][A-Za-z ,.'!?:-]+\s*</, // >Some text<  (but not "=> Promise<")
  /\b(placeholder|aria-label|title|alt)="[A-Za-z][^"]*"/,
  /^\s+[A-Z][a-z]+( [a-z]+)*\s*$/, // a JSX text line on its own
];

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return SKIP_DIRS.has(name) ? [] : tsxFiles(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

describe("no hard-coded UI text", () => {
  it("routes all JSX text through the dictionary", () => {
    const offenders = ROOTS.flatMap(tsxFiles).flatMap((file) =>
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .flatMap((raw, i) => {
          const text = raw.trim();
          const flagged =
            PATTERNS.some((p) => p.test(raw)) &&
            !ALLOWED.some((a) => a.test(raw)) &&
            !text.startsWith("//") &&
            !text.startsWith("*");
          return flagged ? [`${file}:${i + 1}  ${text}`] : [];
        }),
    );
    expect(offenders).toEqual([]);
  });
});
