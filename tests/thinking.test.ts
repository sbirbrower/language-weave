import { describe, expect, it } from 'vitest';
import { thinkingOff, thinks } from '../src/providers/thinking';

describe('thinkingOff', () => {
  it('uses the form each model accepts', () => {
    expect(thinkingOff('claude-haiku-5-5')).toEqual({ type: 'disabled' });
    expect(thinkingOff('claude-sonnet-5-5')).toEqual({ type: 'between_tools' });
    expect(thinkingOff('claude-opus-5')).toEqual({ type: 'disabled' });
    expect(thinkingOff('claude-haiku-4-5-20251001')).toBeUndefined();
  });

  it("knows which models can't turn it off", () => {
    expect(thinkingOff('claude-opus-5-5')).toBe('unsupported');
    expect(thinkingOff('claude-fable-5-1')).toBe('unsupported');
    expect(thinkingOff('some-other-model')).toBe('unsupported');
  });

  it('reports whether requests will think', () => {
    expect(thinks('claude-haiku-5-5', 'off')).toBe(false);
    expect(thinks('claude-opus-5-5', 'off')).toBe(true);
    expect(thinks('claude-haiku-5-5', 'on')).toBe(true);
  });
});
