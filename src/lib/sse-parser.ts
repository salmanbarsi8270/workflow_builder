export interface SSEEvent {
  type: string;
  data?: any;
  id?: string;
  text?: string;
}

export function parseSSEChunk(chunk: string): SSEEvent[] {
  const lines = chunk.split('\n');
  const events: SSEEvent[] = [];

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();
      if (dataStr === '[DONE]') continue;
      
      try {
        const parsed = JSON.parse(dataStr);
        events.push(parsed);
      } catch (e) {
         // Ignore malformed lines
      }
    }
  }

  return events;
}