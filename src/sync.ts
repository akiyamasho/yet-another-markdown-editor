/** Pure synchronization decisions shared by the extension and its tests. */
export function shouldMountHostDocument(hasEditor: boolean, editorText: string | undefined, currentText: string, incomingText: string): boolean {
  return !hasEditor || (incomingText !== editorText && incomingText !== currentText);
}

export function isExternalDocumentChange(
  documentText: string,
  lastEditorText: string,
  pendingText: string | undefined,
  inFlightEditorWrites: ReadonlySet<string> = new Set()
): boolean {
  return documentText !== lastEditorText && documentText !== pendingText && !inFlightEditorWrites.has(documentText);
}

/** Do not let an older save completion discard a newer editor update. */
export function clearPendingTextIfPersisted(pendingText: string | undefined, persistedText: string): string | undefined {
  return pendingText === persistedText ? undefined : pendingText;
}

export function isSaveShortcut(key: string, ctrlKey: boolean, metaKey: boolean): boolean {
  return (ctrlKey || metaKey) && key.toLowerCase() === 's';
}
