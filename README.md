<p align="center">
  <img src="media/logo.png" width="128" alt="Yet Another Markdown Editor logo">
</p>

<h1 align="center">Yet Another Markdown Editor</h1>

<p align="center">
  A rendered Markdown editor that lives inside Visual Studio Code and keeps plain text as the source of truth.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=akiyamasho.yet-another-markdown-editor"><img alt="Visual Studio Marketplace version" src="https://img.shields.io/visual-studio-marketplace/v/akiyamasho.yet-another-markdown-editor?label=marketplace&color=6d4aff"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=akiyamasho.yet-another-markdown-editor"><img alt="Visual Studio Marketplace installs" src="https://img.shields.io/visual-studio-marketplace/i/akiyamasho.yet-another-markdown-editor"></a>
  <a href="https://github.com/akiyamasho/yet-another-markdown-editor/releases/latest"><img alt="Latest GitHub release" src="https://img.shields.io/github/v/release/akiyamasho/yet-another-markdown-editor?display_name=tag&sort=semver"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-2ea44f"></a>
</p>

![Rendered Markdown editor with formatting and block controls](media/screenshots/editor-overview.png)

## What it does

Open a `.md` or `.markdown` file and edit the rendered document directly. Formatting, block actions, undo, save, and external file changes remain connected to the underlying Markdown document.

- Edit headings, paragraphs, emphasis, links, images, quotes, lists, tasks, tables, code, math, and GFM content.
- Insert content with `/`, then reorder it with block handles.
- Copy a whole block as Markdown, duplicate it, or delete it with undo support.
- Type an emoji shortcode such as `:rocket:` using the built-in cross-platform completion menu.
- Select rendered text and pass its matching source lines to a Codex task.
- Switch to the normal text editor whenever raw Markdown is the better tool.
- Follow VS Code light, dark, and high-contrast themes with accessible keyboard focus and reduced-motion support.

## Install

Install **Yet Another Markdown Editor** from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=akiyamasho.yet-another-markdown-editor), or run:

```sh
code --install-extension akiyamasho.yet-another-markdown-editor
```

For an offline installation, [download the latest VSIX](https://github.com/akiyamasho/yet-another-markdown-editor/releases/latest/download/yet-another-markdown-editor.vsix), then run **Extensions: Install from VSIX…** in VS Code.

After installation, open a Markdown file. If another editor is active, choose **Reopen Editor With → Yet Another Markdown Editor**.

## Emoji completion

![Emoji shortcode suggestions below the caret](media/screenshots/emoji-autocomplete.png)

Type `:` followed by a name. Use the arrow keys and `Enter` or `Tab`, or select a candidate with the pointer. Completion is local and works on macOS, Windows, and Linux.

## Keyboard shortcuts

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
| Complete an emoji | Type `:name`, then arrows + `Enter` / `Tab` | Type `:name`, then arrows + `Enter` / `Tab` |

Normal `⌘/Ctrl+C` remains selection copy.

## Commands and settings

- **Yet Another Markdown Editor: Open Source** opens the current file in VS Code's text editor.
- **Add Rendered Selection to Codex Thread** sends the selected rendered text with its corresponding source range.
- `yetAnotherMarkdownEditor.autoSave` saves visual edits automatically. Default: `true`.
- `yetAnotherMarkdownEditor.showSourceOnOpen` prefers the text editor for Markdown files. Default: `false`.
- `yetAnotherMarkdownEditor.debounceMs` controls the visual-to-source update delay. Default: `150`.

## Markdown compatibility

Markdown remains the canonical document format. Rendering and serialization can normalize whitespace, list markers, table alignment, or fence styles. Use the source editor for unusual front matter, raw HTML, custom directives, or syntax unsupported by the active parser, and review diffs when working with advanced embedded tooling.

## Development

The extension requires VS Code 1.85 or newer. Development uses Node.js 24 or newer.

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run package
```

Press `F5` in VS Code to launch an Extension Development Host. Project conventions and architecture notes are in [`AGENTS.md`](AGENTS.md).

## Releases and support

- [Latest release](https://github.com/akiyamasho/yet-another-markdown-editor/releases/latest)
- [Version history](CHANGELOG.md)
- [Issue tracker](https://github.com/akiyamasho/yet-another-markdown-editor/issues)

## License

[MIT](LICENSE)
