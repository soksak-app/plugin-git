// Checks that each page takes its colors from the theme of the window (core docs/spec/native-surfaces.md, Theme): the view bridge sets
// the theme tokens --card, --fg, --muted, --edge and --fail on the root, and a page that chose its colors from the color scheme of the
// system drew the text of a light system on the dark card of a dark window.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const PAGES = ["status.html"];

for (const page of PAGES) {
  test(`${page} takes its colors from the theme of the window`, () => {
    const html = readFileSync(new URL(`../ui/${page}`, import.meta.url), "utf8");
    assert.doesNotMatch(html, /prefers-color-scheme|data-theme/, "the page chooses no palette of its own");
    assert.doesNotMatch(html, /--(text|muted|line|error|card)\s*:\s*#/, "the page sets no literal color for a theme name");
    assert.match(html, /--text: var\(--fg\); --line: var\(--edge\); --error: var\(--fail\);/);
  });
}
