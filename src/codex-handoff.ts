export type CodexHandoffResult = { success: boolean };

export type CodexHandoffOperations<TEditor> = {
  showSource: () => Promise<TEditor>;
  isActiveSource: (editor: TEditor) => boolean;
  invokeCodex: () => Promise<void>;
  copySelection: () => Promise<void>;
  reportFailure: (message: string) => void;
  restoreCustomEditor: () => Promise<void>;
};

/** ChatGPT reads window.activeTextEditor and ignores command arguments. */
export async function runCodexHandoff<TEditor>(
  operations: CodexHandoffOperations<TEditor>
): Promise<CodexHandoffResult> {
  try {
    const sourceEditor = await operations.showSource();
    if (!operations.isActiveSource(sourceEditor)) {
      throw new Error('VS Code did not activate the Markdown source editor.');
    }
    await operations.invokeCodex();
    return { success: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    try {
      await operations.copySelection();
      operations.reportFailure(`${detail} The selected text was copied instead.`);
    } catch (copyError) {
      const copyDetail = copyError instanceof Error ? copyError.message : String(copyError);
      operations.reportFailure(`${detail} Clipboard recovery also failed: ${copyDetail}`);
    }
    return { success: false };
  } finally {
    try {
      await operations.restoreCustomEditor();
    } catch {
      // Keep the actionable handoff error if restoration itself fails.
    }
  }
}
