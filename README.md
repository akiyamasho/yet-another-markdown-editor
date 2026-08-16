# Notion Markdown Editor

A calm, block-oriented Markdown editor for VS Code. Open a `.md` or `.markdown` file in the visual editor, type as naturally as you would in a document, and keep the file as portable plain Markdown.

## What it does

- Renders Markdown as an editable, focused canvas instead of a source-code wall.
- Preserves normal Markdown as the source of truth, with a raw-source fallback when a document cannot be rendered.
- Supports headings, paragraphs, bold, italic, strikethrough, links, images, block quotes, dividers, ordered and unordered lists, task lists, tables, inline code, fenced code, and common GFM content.
- Provides discoverable whole-block actions: copy as Markdown, duplicate, and delete. Block actions preserve editor undo history; native copy (`⌘/Ctrl+C`) remains ordinary text-selection copy.
- Includes a compact formatting toolbar, slash-style insertion menu, status feedback, and theme-aware light, dark, and high-contrast styling.
- Follows VS Code's editor colors and respects `prefers-reduced-motion` and forced-colors settings.
- Offers a native-picker-free emoji autocomplete: type `:smil`, then choose a result with Arrow keys + Enter/Tab or the mouse. A complete shortcode such as `:rocket:` is replaced automatically. The popup works on macOS, Windows, and Linux and is disabled in inline/fenced code.

The interaction model is inspired by the useful parts of modern block editors: generous whitespace, visible controls only when a block is active, keyboard-first actions, and a stable canvas that stays readable at narrow widths. It is an original interface and does not use Notion branding or assets.

## Shortcuts

| Action | macOS | Windows / Linux |
| --- | --- | --- |
| Bold | `⌘ B` | `Ctrl B` |
| Italic | `⌘ I` | `Ctrl I` |
| Strikethrough | `⌘ Shift X` | `Ctrl Shift X` |
| Undo / redo | `⌘ Z` / `⌘ Shift Z` | `Ctrl Z` / `Ctrl Y` |
| Copy active block as Markdown | `⌘ Shift C` | `Ctrl Shift C` |
| Duplicate active block | `⌘ Shift D` | `Ctrl Shift D` |
| Delete active block | `⌘ Shift Backspace` | `Ctrl Shift Backspace` |
| Paste | `⌘ V` | `Ctrl V` |
| Insert a block | Type `/` | Type `/` |
| Emoji autocomplete | Type `:name` → Arrow keys + `Enter` / `Tab` | Type `:name` → Arrow keys + `Enter` / `Tab` |
| Open raw Markdown | Command Palette → **Markdown Editor: Open Source** | Command Palette → **Markdown Editor: Open Source** |

The exact browser/editor shortcut behavior can vary with the active VS Code keybindings. Every formatting command is also available through the toolbar or block menu.

## Use it

1. Open this extension in VS Code.
2. Open any `.md` or `.markdown` file.
3. Choose **Notion Markdown Editor** if VS Code asks which editor to use. The extension is the default custom editor for Markdown files.
4. Edit, then use normal VS Code save behavior. The visual editor writes back to the same file with a short debounce.

To switch to source at any time, run **Markdown Editor: Open Source** from the Command Palette. Set `notionMarkdownEditor.showSourceOnOpen` to `true` if source should always open first.

## Settings

- `notionMarkdownEditor.autoSave` — automatically save visual edits (default `true`).
- `notionMarkdownEditor.showSourceOnOpen` — prefer the source editor when opening Markdown (default `false`).
- `notionMarkdownEditor.debounceMs` — delay before visual changes are written (default `150`, range `0`–`2000`).

## Development

Requirements: VS Code 1.85 or newer and Node.js 18+.

```sh
npm install
npm run typecheck
npm run build
```

Press `F5` in VS Code to launch an Extension Development Host, then open a Markdown file there. Use `npm run watch` while iterating on the bundle. The generated build is placed in `dist/`.

To make a local VSIX, install `@vscode/vsce` and run `vsce package`, then install the resulting file with **Extensions: Install from VSIX…**. Publishing and repository creation are intentionally separate release steps.

## Markdown round-trip and limitations

The editor writes Markdown rather than a proprietary document format. Formatting that is not represented by the active Markdown parser, unsupported extensions, unusual front matter, raw HTML, or custom directives may be preserved best by using the source editor. Rendering and serialization can normalize whitespace, list markers, table alignment, and fence styles. Review a diff before committing documents with advanced Markdown or embedded tooling. Binary assets remain external links and are not uploaded by this extension.

## Attribution

The editor is built for this project with VS Code's Custom Text Editor API and the Milkdown/ProseMirror editor stack. Their respective licenses and notices apply to bundled dependencies. The visual language is an original, Notion-inspired design; Notion is a trademark of Notion Labs, Inc. and is not affiliated with this project.

## License

MIT. See the package metadata for the current publisher and repository details.
