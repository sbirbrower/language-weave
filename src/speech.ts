/**
 * Reading a passage aloud with Google Cloud Text-to-Speech, Chirp 3 HD.
 * The background sends the request (it holds the key); the content script
 * plays what comes back (`speaker.ts`).
 */
import { withoutReadings } from './ruby';

export const SPEECH_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

/** Picked by ear from Chirp 3 HD's voices (`evals/speech_check.py --variants 'chirp3-*'`); every language has it. */
export const SPEECH_VOICE = 'Leda';

/** Chirp 3 HD bills by character. */
export const SPEECH_USD_PER_CHAR = 30 / 1e6;

/** Single words are read slower; picked by ear from 1, 0.75 and 0.6 (`evals/speech_check.py --kinds word`, chirp3-slow). */
export const WORD_SPEAKING_RATE = 0.75;

export const voiceName = (bcp47: string) => `${bcp47}-Chirp3-HD-${SPEECH_VOICE}`;

/** `slow` reads at `WORD_SPEAKING_RATE`, for a word on its own. */
export function speechBody(text: string, bcp47: string, slow = false) {
  return {
    input: { text: withoutReadings(text) },
    voice: { languageCode: bcp47, name: voiceName(bcp47) },
    audioConfig: slow ? { audioEncoding: 'MP3', speakingRate: WORD_SPEAKING_RATE } : { audioEncoding: 'MP3' },
  };
}

export const speechCost = (text: string) => withoutReadings(text).length * SPEECH_USD_PER_CHAR;

/** The error Google sent, or the status when the body isn't JSON. */
export function speechError(status: number, body: string): string {
  try {
    const message = (JSON.parse(body) as { error?: { message?: string } }).error?.message;
    if (message) return `Speech failed: ${message}`;
  } catch {
    // not JSON
  }
  return `Speech failed (HTTP ${status}).`;
}
