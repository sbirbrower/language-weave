import { describe, expect, it } from 'vitest';
import { recordingKey, recordingPath, toBase64 } from '../src/recordings';

describe('word recordings', () => {
  it('keys a word the same however it is written: case, apostrophes, spaces, brackets, punctuation', () => {
    for (const text of ['l’arbre', 'L’Arbre', "l'arbre (m)", ' l‘arbre. ', '«l’arbre»']) expect(recordingKey(text), text).toBe("l'arbre");
    expect(recordingKey('pomme  de   terre (f)')).toBe('pomme de terre');
    expect(recordingKey('café')).not.toBe(recordingKey('cafe'));
  });

  it('finds a language’s index and clips in the build', () => {
    expect(recordingPath('fr')).toBe('/recordings/fr/index.json');
    expect(recordingPath('fr', '12.mp3')).toBe('/recordings/fr/12.mp3');
  });

  it('encodes a clip as base64, long ones too', () => {
    expect(toBase64(new TextEncoder().encode('Language Weave').buffer)).toBe(btoa('Language Weave'));
    const long = new Uint8Array(100_000).map((_, i) => i % 251);
    expect(atob(toBase64(long.buffer)).length).toBe(100_000);
  });
});
