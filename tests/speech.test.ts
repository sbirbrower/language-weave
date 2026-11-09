import { describe, expect, it } from 'vitest';
import { speechBody, speechCost, speechError, voiceName } from '../src/speech';

describe('speech', () => {
  it('asks for Chirp 3 HD Leda in the lesson’s language, as MP3', () => {
    expect(voiceName('fr-FR')).toBe('fr-FR-Chirp3-HD-Leda');
    expect(speechBody('Bonjour.', 'fr-FR')).toEqual({
      input: { text: 'Bonjour.' },
      voice: { languageCode: 'fr-FR', name: 'fr-FR-Chirp3-HD-Leda' },
      audioConfig: { audioEncoding: 'MP3' },
    });
  });

  it('prices by character', () => {
    expect(speechCost('a'.repeat(1000))).toBeCloseTo(0.03);
  });

  it('passes on Google’s error, or the status', () => {
    expect(speechError(403, '{"error":{"message":"API key not valid."}}')).toBe('Speech failed: API key not valid.');
    expect(speechError(500, 'oops')).toBe('Speech failed (HTTP 500).');
  });
});
