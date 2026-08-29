# Changelog

## 0.1.7

- Kept the Contents header and Hide control visible while scrolling, with a stable non-overlapping layout that avoids toggle jumps.
- Restored rendered-selection Add to Codex bridging with focus persistence and improved high-contrast selection styling.

## 0.1.6

- Added native source-editor selection handoff for adding selected text to a Codex thread.
- Added a Notion-style table of contents for H1–H5 headings with jump navigation.
- Added UI-only heading collapse/expand controls without changing the underlying Markdown.

## 0.1.5

- Fixed cursor loss during editor synchronization and external document remounts.
- Fixed Cmd/Ctrl+F so the VS Code find widget opens reliably.

## 0.1.4

- Removed the persistent top bars and their redundant controls.
- Restored reliable native Cmd/Ctrl+F find behavior.
- Added Notion-style absolute heading shortcuts for `#` through `######`.

## 0.1.3

- Improved inline-code contrast across light, dark, and high-contrast VS Code themes.
- Isolated inline-code styling from fenced code blocks so syntax highlighting remains intact.

## 0.1.2

- Replaced the extension artwork with a minimal Markdown-focused icon.
- Added a dedicated Marketplace description separate from the GitHub project README.
- Fixed Marketplace screenshot and logo URL handling in packaged releases.

All notable changes to this project are documented here.

## [0.1.1] — 2026-08-16

### Changed

- Reworked the README and extension details page around large product screenshots.
- Replaced legacy internal UI names with project-owned identifiers.
- Expanded extension search metadata and presentation settings.
- Increased document width, font size, line height, block spacing, and code/table padding for a calmer reading surface.
- Added a rendered-selection bridge for the Codex editor command, with toolbar and context-menu access.

## [0.1.0] — 2026-08-16

### Added

- Initial Yet Another Markdown Editor release for VS Code.
- Editable block canvas with Markdown and common GFM rendering coverage.
- Keyboard-first formatting, slash insertion, block menus, copy/paste, and raw-source fallback.
- VS Code light, dark, and high-contrast theme-aware styling with accessible focus states.
- Responsive narrow-panel layout and reduced-motion support.
- Cross-platform `:emoji:` autocomplete with keyboard and mouse navigation.
- Original Y-shaped application logo, GitHub Release distribution, and feature screenshots.

### Notes

- Markdown remains the durable source format. See the round-trip limitations in `README.md` before using advanced syntax.
- This is an early release; editor behavior and serialization may evolve as more Markdown edge cases are covered.
