import type { Result } from './messages';

export interface Speaker {
  /**
   * Reads `texts` aloud in order; `onLine` gets the index playing, then -1 when done, stopped or failed.
   * `slow` is for single words. Playing anything stops what was playing.
   */
  play(texts: string[], onLine: (index: number) => void, onError: (error: string) => void, slow?: boolean): void;
  stop(): void;
  /** Whether it can read `text` (a word or sentence with a local recording, `src/recordings.ts`); unset, anything. */
  can?(text: string): boolean;
}

export interface SpeakerDeps {
  /** One clip, as base64 MP3. */
  fetch(text: string, slow: boolean): Promise<Result<{ audio: string; usd: number | null }>>;
  onSpend(usd: number | null): void;
  /** Only these texts can be read (`Speaker.can`). */
  can?(text: string): boolean;
}

function decodeBase64(s: string): ArrayBuffer {
  const bytes = Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  return bytes.buffer;
}

/**
 * Plays clips through Web Audio: decoded from bytes, so the page's
 * content security policy (which can block media URLs) doesn't apply.
 * Each text is fetched once; the next line is fetched while one plays.
 */
export function createSpeaker(deps: SpeakerDeps): Speaker {
  let ctx: AudioContext | undefined;
  let source: AudioBufferSourceNode | undefined;
  let run = 0;
  let current: ((index: number) => void) | undefined;
  const clips = new Map<string, Promise<AudioBuffer>>();

  function load(text: string, slow: boolean): Promise<AudioBuffer> {
    const key = `${slow ? 'slow' : 'normal'}|${text}`;
    let clip = clips.get(key);
    if (!clip) {
      clip = deps.fetch(text, slow).then(async (res) => {
        if (!res.ok) throw new Error(res.error);
        deps.onSpend(res.value.usd);
        return ctx!.decodeAudioData(decodeBase64(res.value.audio));
      });
      // A failure isn't kept, so the line can be tried again.
      clip.catch(() => clips.delete(key));
      clips.set(key, clip);
    }
    return clip;
  }

  function stop() {
    run++;
    source?.stop();
    source = undefined;
    current?.(-1);
    current = undefined;
  }

  async function play(texts: string[], onLine: (index: number) => void, onError: (error: string) => void, slow = false) {
    stop();
    const mine = ++run;
    current = onLine;
    // Made on the first click: browsers only let audio start from a gesture.
    ctx ??= new AudioContext();
    try {
      if (ctx.state === 'suspended') await ctx.resume();
      for (const [i, text] of texts.entries()) {
        // Nothing left to say (a line that was only an emoji or a label).
        if (!text) continue;
        onLine(i);
        const buffer = await load(text, slow);
        if (texts[i + 1]) void load(texts[i + 1]!, slow).catch(() => {});
        if (mine !== run) return;
        await new Promise<void>((resolve) => {
          source = ctx!.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx!.destination);
          source.onended = () => resolve();
          source.start();
        });
        if (mine !== run) return;
      }
    } catch (e) {
      if (mine === run) onError(e instanceof Error ? e.message : String(e));
    }
    if (mine === run) {
      source = undefined;
      current = undefined;
      onLine(-1);
    }
  }

  return { play: (texts, onLine, onError, slow) => void play(texts, onLine, onError, slow), stop, can: deps.can };
}
