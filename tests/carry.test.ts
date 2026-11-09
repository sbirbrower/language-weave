import { describe, expect, it } from 'vitest';
import { carryLimit, DensityCarry } from '../src/weave/carry';

describe('DensityCarry', () => {
  it('carries a shortfall to later segments, a few words at a time', () => {
    const carry = new DensityCarry();
    carry.settle(5, 2);
    expect(carry.take(2)).toBe(2);
    expect(carry.take(2)).toBe(1);
    expect(carry.take(2)).toBe(0);
  });

  it('pays the debt down when a segment weaves more than planned, never below zero', () => {
    const carry = new DensityCarry();
    carry.settle(4, 1);
    carry.settle(3, 5);
    expect(carry.owed).toBe(1);
    carry.settle(2, 6);
    expect(carry.owed).toBe(0);
  });

  it('limits what one segment takes by its length', () => {
    expect(carryLimit(10)).toBe(1);
    expect(carryLimit(50)).toBe(4);
  });
});
