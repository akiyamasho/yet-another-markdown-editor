# Repository guide

## Scope

This repository contains the Yet Another Markdown Editor VS Code extension. Markdown text is always the canonical document format; the webview is an editable rendering of that text.

## Development

- Install dependencies with `npm ci`.
- Run `npm test`, `npm run typecheck`, and `npm run build` before committing.
- Build the release package with `npm run package`.
- Keep webview messages typed and validated in `src/protocol.ts`.
- Preserve external-edit synchronization, VS Code undo/save behavior, CSP restrictions, keyboard accessibility, and light/dark/high-contrast theming.

## Project map

- `src/extension.ts`: VS Code custom-editor host and document synchronization.
- `src/webview/`: Milkdown editor, block actions, and emoji autocomplete.
- `media/editor-theme.css`: packaged VS Code-aware editor theme.
- `tests/`: protocol, synchronization, emoji, packaging, and visual-harness checks.

## Release rules

- Keep `package.json`, `CHANGELOG.md`, README download links, VSIX filename, Git tag, and GitHub Release version aligned.
- Do not commit `dist/`, `node_modules/`, or generated `.vsix` files.
- Never publish automatically to the VS Code Marketplace; GitHub Releases are the supported distribution channel until explicitly changed.
