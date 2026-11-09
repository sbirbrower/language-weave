/** The `data:` payloads of a server-sent event stream, one per event. */
export async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data: string[] = [];
  const flush = function* () {
    if (data.length) yield data.join('\n');
    data = [];
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line === '') yield* flush();
      else if (line.startsWith('data:')) data.push(line.slice(line[5] === ' ' ? 6 : 5));
    }
  }
  if (buffer.startsWith('data:')) data.push(buffer.slice(buffer[5] === ' ' ? 6 : 5));
  yield* flush();
}

/** An API's error message from a failed response: `error.message` in its JSON, else the status. */
export async function errorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const message = (JSON.parse(text) as { error?: { message?: string } }).error?.message;
    if (message) return `${res.status}: ${message}`;
  } catch {
    // Not JSON.
  }
  return `${res.status} ${res.statusText}`.trim();
}

/**
 * Sends `send(level)` for each reasoning level in turn, moving to the next
 * only when the API rejects the level (a 400 that names `param`). Models
 * differ in the levels they take, and new ones arrive faster than a table.
 */
export async function withLevels<L>(levels: L[], param: RegExp, send: (level: L) => Promise<Response>): Promise<Response> {
  for (let i = 0; ; i++) {
    const res = await send(levels[i]!);
    if (res.ok) return res;
    const message = await errorMessage(res);
    if (res.status === 400 && i < levels.length - 1 && param.test(message)) continue;
    throw new Error(message);
  }
}
