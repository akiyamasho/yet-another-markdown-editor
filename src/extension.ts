import * as vscode from 'vscode';
import { EditorToHostMessage, HostToEditorMessage, isEditorToHostMessage } from './protocol';
import { isExternalDocumentChange } from './sync';

const VIEW_TYPE = 'notionMarkdown.editor';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new NotionMarkdownEditorProvider(context);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(VIEW_TYPE, provider, {
      supportsMultipleEditorsPerDocument: false,
      webviewOptions: { retainContextWhenHidden: true }
    }),
    vscode.commands.registerCommand('notionMarkdown.openSource', async (resource?: vscode.Uri) => {
      const uri = resource ?? vscode.window.activeTextEditor?.document.uri;
      if (uri) await vscode.commands.executeCommand('vscode.openWith', uri, 'default');
    })
  );
}

export function deactivate(): void {}

class NotionMarkdownEditorProvider implements vscode.CustomTextEditorProvider {
  private readonly panels = new Map<string, vscode.WebviewPanel>();

  constructor(private readonly context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(document: vscode.TextDocument, panel: vscode.WebviewPanel, _token: vscode.CancellationToken): Promise<void> {
    const media = vscode.Uri.joinPath(this.context.extensionUri, 'media');
    const dist = vscode.Uri.joinPath(this.context.extensionUri, 'dist');
    panel.webview.options = { enableScripts: true, localResourceRoots: [media, dist] };
    if (vscode.workspace.getConfiguration('notionMarkdownEditor').get<boolean>('showSourceOnOpen', false)) {
      await vscode.commands.executeCommand('vscode.openWith', document.uri, 'default');
      panel.dispose();
      return;
    }
    panel.webview.html = this.getHtml(panel.webview);
    const key = document.uri.toString();
    this.panels.set(key, panel);
    let writeTimer: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    let pendingText: string | undefined;
    let lastEditorText = document.getText();
    const send = (message: HostToEditorMessage) => { if (!disposed) void panel.webview.postMessage(message); };
    const sync = () => send({ type: 'document', text: document.getText(), version: document.version });

    const documentListener = vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.document.uri.toString() !== key) return;
      const text = event.document.getText();
      if (isExternalDocumentChange(text, lastEditorText, pendingText)) {
        pendingText = undefined;
        lastEditorText = text;
        sync();
      }
    });
    const messageListener = panel.webview.onDidReceiveMessage(async (raw: unknown) => {
      if (!isEditorToHostMessage(raw)) return;
      const message = raw as EditorToHostMessage;
      if (message.type === 'ready' || message.type === 'requestDocument') {
        lastEditorText = document.getText();
        sync();
        send({ type: 'status', message: 'Ready', kind: 'success' });
        return;
      }
      if (message.type === 'focus') { send({ type: 'status', message: 'Editing', kind: 'info' }); return; }
      if (message.type === 'status') { send({ type: 'status', message: message.message, kind: 'info' }); return; }
      if (message.type === 'openSource') { await vscode.commands.executeCommand('vscode.openWith', document.uri, 'default'); return; }
      if (message.type === 'save') {
        if (writeTimer) clearTimeout(writeTimer);
        const text = pendingText;
        if (text === undefined || text === document.getText()) {
          if (await document.save()) send({ type: 'status', message: 'Saved', kind: 'success' });
          else send({ type: 'error', message: 'VS Code could not save the document.' });
          pendingText = undefined;
          return;
        }
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), text);
        try {
          if (!await vscode.workspace.applyEdit(edit)) throw new Error('VS Code rejected the document edit.');
          if (!await document.save()) throw new Error('VS Code could not save the document.');
          pendingText = undefined;
          send({ type: 'status', message: 'Saved', kind: 'success' });
        } catch (error) {
          send({ type: 'error', message: error instanceof Error ? error.message : String(error) });
        }
        return;
      }
      if (message.type !== 'update') return;
      lastEditorText = message.text;
      pendingText = message.text;
      if (writeTimer) clearTimeout(writeTimer);
      const settings = vscode.workspace.getConfiguration('notionMarkdownEditor');
      const autoSave = settings.get<boolean>('autoSave', true);
      const delay = settings.get<number>('debounceMs', 150);
      if (!autoSave) {
        send({ type: 'status', message: 'Unsaved changes (press Ctrl/Cmd+S to save)', kind: 'info' });
        return;
      }
      writeTimer = setTimeout(async () => {
        if (disposed) return;
        if (document.getText() === message.text) {
          if (!await document.save()) send({ type: 'error', message: 'VS Code could not save the document.' });
          else { pendingText = undefined; send({ type: 'status', message: 'Saved', kind: 'success' }); }
          return;
        }
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), message.text);
        try {
          const applied = await vscode.workspace.applyEdit(edit);
          if (!applied) throw new Error('VS Code rejected the document edit.');
          if (!await document.save()) throw new Error('VS Code could not save the document.');
          pendingText = undefined;
          send({ type: 'status', message: 'Saved', kind: 'success' });
        } catch (error) {
          send({ type: 'error', message: error instanceof Error ? error.message : String(error) });
        }
      }, Math.max(0, delay));
    });
    panel.onDidDispose(() => {
      disposed = true;
      if (writeTimer) clearTimeout(writeTimer);
      documentListener.dispose();
      messageListener.dispose();
      this.panels.delete(key);
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = createNonce();
    const script = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview.js'));
    const theme = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'notion-theme.css'));
    const csp = [`default-src 'none'`, `script-src 'nonce-${nonce}' ${script}`, `style-src ${webview.cspSource} 'unsafe-inline'`, `img-src ${webview.cspSource} data: https:`, `font-src ${webview.cspSource} data:`, `connect-src ${webview.cspSource}`].join('; ');
    return `<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${theme}"><title>Markdown Editor</title></head><body><div id="app"><div class="editor-loading">Loading Markdown editor…</div></div><script nonce="${nonce}" src="${script}"></script></body></html>`;
  }
}

function createNonce(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}
