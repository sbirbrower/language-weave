/**
 * Hearing the reader say a sentence, for speaking exercises (opt-in, Options).
 * An offscreen document records (`entrypoints/offscreen/`), so the microphone
 * belongs to the extension, not the page; the background sends the clip to
 * Whisper on DeepInfra with the expected sentence as a prompt, which heard
 * learners best in `evals/speak/` (`npm run speak`).
 */
import { withoutReadings } from './ruby';

export const WHISPER_MODEL = 'openai/whisper-large-v3';
export const WHISPER_ENDPOINT = `https://api.deepinfra.com/v1/inference/${WHISPER_MODEL}`;
/** DeepInfra's price per second of audio, for when a response doesn't say what it cost. */
export const WHISPER_USD_PER_SEC = 0.00045 / 60;

/** Clips are recorded at this rate, mono, 16-bit: what Whisper works at. */
export const RECORD_RATE = 16000;
/** A recording stops by itself after this long. */
export const MAX_RECORD_SECS = 20;

/** The microphone was refused: it's allowed from Options, where the switch asks for it. */
export const NO_MIC_ERROR = "Language Weave can't use the microphone. Turn speaking exercises off and on again in Language Weave options to allow it.";
export const SILENT_ERROR = "I didn't hear anything. Is the microphone on?";

/** 16-bit PCM WAV from samples in -1..1. */
export function encodeWav(pcm: Float32Array, rate = RECORD_RATE): Uint8Array<ArrayBuffer> {
  const view = new DataView(new ArrayBuffer(44 + pcm.length * 2));
  const ascii = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + pcm.length * 2, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, pcm.length * 2, true);
  pcm.forEach((x, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x)) * 0x7fff, true));
  return new Uint8Array(view.buffer);
}

/**
 * Nothing said: no 50 ms stretch louder than a whisper, or under half a second in all. Not sent, since
 * Whisper given the sentence as a prompt can "hear" it in silence.
 */
export function isSilent(pcm: Float32Array, rate = RECORD_RATE): boolean {
  if (pcm.length < rate / 2) return true;
  const window = Math.round(rate * 0.05);
  for (let start = 0; start + window <= pcm.length; start += window) {
    let sum = 0;
    for (let i = start; i < start + window; i++) sum += pcm[i]! * pcm[i]!;
    if (Math.sqrt(sum / window) > 0.02) return false;
  }
  return true;
}

/** Whisper's request: the clip, its language (from a BCP 47 tag) and the sentence expected, as its prompt. */
export function whisperForm(wav: Uint8Array<ArrayBuffer>, bcp47: string, expected: string): FormData {
  const form = new FormData();
  form.append('audio', new Blob([wav], { type: 'audio/wav' }), 'clip.wav');
  form.append('language', bcp47.split('-')[0]!.toLowerCase());
  form.append('initial_prompt', withoutReadings(expected));
  return form;
}

export function parseWhisper(body: string, secs: number): { text: string; usd: number } {
  const d = JSON.parse(body) as { text?: string; inference_status?: { cost?: number } };
  return { text: (d.text ?? '').trim(), usd: d.inference_status?.cost ?? secs * WHISPER_USD_PER_SEC };
}

/** The error DeepInfra sent, or the status when the body isn't JSON. */
export function whisperError(status: number, body: string): string {
  try {
    const d = JSON.parse(body) as { detail?: unknown; error?: { message?: string } };
    const message = typeof d.detail === 'string' ? d.detail : d.error?.message;
    if (message) return `Listening failed: ${message}`;
  } catch {
    // not JSON
  }
  return `Listening failed (HTTP ${status}).`;
}

export const toBase64 = (bytes: Uint8Array) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

export const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
