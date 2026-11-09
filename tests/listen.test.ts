import { describe, expect, it } from 'vitest';
import { encodeWav, fromBase64, isSilent, parseWhisper, RECORD_RATE, toBase64, whisperError, whisperForm } from '../src/listen';

const tone = (secs: number, amp: number) => Float32Array.from({ length: secs * RECORD_RATE }, (_, i) => amp * Math.sin(i / 5));

describe('listen', () => {
  it('writes 16 kHz mono 16-bit WAV', () => {
    const wav = encodeWav(tone(1, 0.5));
    const view = new DataView(wav.buffer);
    expect(new TextDecoder().decode(wav.subarray(0, 4))).toBe('RIFF');
    expect(view.getUint32(24, true)).toBe(RECORD_RATE);
    expect(view.getUint16(22, true)).toBe(1);
    expect(wav.length).toBe(44 + RECORD_RATE * 2);
    expect(fromBase64(toBase64(wav))).toEqual(wav);
  });

  it('calls silence or a click silent, and speech not', () => {
    expect(isSilent(tone(2, 0.001))).toBe(true);
    expect(isSilent(tone(0.25, 0.5))).toBe(true);
    expect(isSilent(tone(2, 0.3))).toBe(false);
  });

  it('asks Whisper in the language, with the sentence as its prompt and no readings', () => {
    const form = whisperForm(new Uint8Array(4), 'ja-JP', '東京《とうきょう》に行《い》きます。');
    expect(form.get('language')).toBe('ja');
    expect(form.get('initial_prompt')).toBe('東京に行きます。');
    expect(form.get('audio')).toBeInstanceOf(Blob);
  });

  it('reads what Whisper heard and what it cost', () => {
    expect(parseWhisper('{"text":" Je vis à Paris. ","inference_status":{"cost":0.00002}}', 3)).toEqual({ text: 'Je vis à Paris.', usd: 0.00002 });
    expect(parseWhisper('{"text":"x"}', 60).usd).toBeCloseTo(0.00045);
    expect(whisperError(401, '{"detail":"Invalid token"}')).toBe('Listening failed: Invalid token');
    expect(whisperError(502, 'Bad gateway')).toBe('Listening failed (HTTP 502).');
  });
});
