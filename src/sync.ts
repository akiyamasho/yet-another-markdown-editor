/** Pure synchronization decisions shared by the extension and its tests. */
export function shouldMountHostDocument(hasEditor: boolean, editorText: string | undefined, currentText: string, incomingText: string): boolean {
  return !hasEditor || (incomingText !== editorText && incomingText !== currentText);
}

export function isExternalDocumentChange(documentText: string, lastEditorText: string, pendingText: string | undefined): boolean {
  return documentText !== lastEditorText && documentText !== pendingText;
}

export function isSaveShortcut(key: string, ctrlKey: boolean, metaKey: boolean): boolean {
  return (ctrlKey || metaKey) && key.toLowerCase() === 's';
}
