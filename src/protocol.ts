export type EditorToHostMessage =
  | { type: 'ready' }
  | { type: 'update'; text: string }
  | { type: 'save' }
  | { type: 'openSource' }
  | { type: 'requestDocument' }
  | { type: 'focus' }
  | { type: 'selection'; text: string }
  | { type: 'addToCodex' }
  | { type: 'status'; message: string };

export type HostToEditorMessage =
  | { type: 'document'; text: string; version: number }
  | { type: 'error'; message: string }
  | { type: 'status'; message: string; kind?: 'info' | 'success' | 'error' };

export function isEditorToHostMessage(value: unknown): value is EditorToHostMessage {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !('type' in value)) return false;
  const message = value as { type?: unknown; text?: unknown; message?: unknown };
  switch (message.type) {
    case 'update':
    case 'selection': return typeof message.text === 'string';
    case 'status': return typeof message.message === 'string';
    case 'ready':
    case 'openSource':
    case 'requestDocument':
    case 'focus':
    case 'addToCodex':
    case 'save':
      return Object.keys(message).length === 1;
    default: return false;
  }
}
