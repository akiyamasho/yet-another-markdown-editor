<p align="center">
  <img src="media/logo.png" width="168" alt="Yet Another Markdown Editor logo">
</p>

# Yet Another Markdown Editor

<p align="center">
  Edit rendered Markdown directly in Visual Studio Code. Your file stays Markdown.
</p>

<p align="center">
  <a href="https://github.com/akiyamasho/yet-another-markdown-editor/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/akiyamasho/yet-another-markdown-editor?display_name=tag&sort=semver"></a>
  <a href="https://github.com/akiyamasho/yet-another-markdown-editor/releases/latest/download/yet-another-markdown-editor.vsix"><img alt="Download VSIX" src="https://img.shields.io/badge/download-latest%20VSIX-6f42c1"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-2ea44f"></a>
</p>

![A Markdown document being edited as a rendered page, with formatting and block controls visible](media/screenshots/editor-overview.png)

Open a `.md` or `.markdown` file. Type, format, reorder, copy, duplicate, or delete blocks. Save the same portable text file you started with.

## Type `:smil`

![Emoji suggestions appearing below a partially typed shortcode](media/screenshots/emoji-autocomplete.png)

Use the arrow keys and `Enter` or `Tab`, or click a result. Emoji completion runs inside the editor on macOS, Windows, and Linux, including exact shortcodes such as `:rocket:`.

## Editing tools

- Headings, paragraphs, bold, italic, strikethrough, links, images, quotes, dividers, lists, task lists, tables, inline code, fenced code, math, and GFM content.
- Selection formatting toolbar and persistent top toolbar.
- `/` insertion commands plus add and drag block handles.
- Whole-block copy as Markdown, duplicate, and delete actions with undo support.
- Select rendered text, then use **Codex** or **Add Rendered Selection to Codex Thread** to pass the matching source lines into Codex.
- VS Code light, dark, and high-contrast colors, responsive narrow panes, reduced-motion support, and visible keyboard focus.
- **Source** opens the underlying Markdown whenever you want direct control.

## Install

1. **[Download the latest VSIX](https://github.com/akiyamasho/yet-another-markdown-editor/releases/latest/download/yet-another-markdown-editor.vsix)**.
2. In VS Code, run **Extensions: Install from VSIX…**.
3. Open a Markdown file. If another editor opens, choose **Reopen Editor With → Yet Another Markdown Editor** once.

Or install from a terminal:

```sh
code --install-extension yet-another-markdown-editor.vsix
```

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
| Insert a block | Type `/` | Type `/` |
| Emoji autocomplete | Type `:name`, then arrows + `Enter` / `Tab` | Type `:name`, then arrows + `Enter` / `Tab` |

Native `⌘/Ctrl+C` remains normal selection copy.

## Settings

- `yetAnotherMarkdownEditor.autoSave` — automatically save visual edits (default `true`).
- `yetAnotherMarkdownEditor.showSourceOnOpen` — prefer the source editor when opening Markdown (default `false`).
- `yetAnotherMarkdownEditor.debounceMs` — delay before visual changes are written (default `150`, range `0`–`2000`).

Run **Yet Another Markdown Editor: Open Source** from the Command Palette to switch to raw Markdown.

## Markdown compatibility

Rendering and serialization may normalize whitespace, list markers, table alignment, or fence styles. Use the source editor for unusual front matter, raw HTML, custom directives, or syntax unsupported by the active parser. Review diffs before committing documents with advanced embedded tooling.

## Development

Requires VS Code 1.85+ and Node.js 24+ for the current TypeScript test runner.

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run package
```

Press `F5` in VS Code to launch an Extension Development Host.

## License

MIT.
