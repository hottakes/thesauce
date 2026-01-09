import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateWaitlistPosition } from '@/lib/applicant-utils';

describe('applicant-utils', () => {
  describe('calculateWaitlistPosition', () => {
    beforeEach(() => {
      // Mock Math.random to return a consistent value (0.5 -> offset of 0)
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    it('returns position 100 for 0 points', () => {
      const position = calculateWaitlistPosition(0);
      expect(position).toBe(100);
    });

    it('returns position 1 for max points (175)', () => {
      const position = calculateWaitlistPosition(175);
      expect(position).toBe(1);
    });

    it('returns position around 50 for half max points', () => {
      const position = calculateWaitlistPosition(87.5);
      expect(position).toBeGreaterThanOrEqual(48);
      expect(position).toBeLessThanOrEqual(52);
    });

    it('caps position at max (100)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(1); // Max positive offset (+2)
      const position = calculateWaitlistPosition(0);
      expect(position).toBeLessThanOrEqual(100);
    });

    it('caps position at min (1)', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0); // Max negative offset (-2)
      const position = calculateWaitlistPosition(175);
      expect(position).toBeGreaterThanOrEqual(1);
    });

    it('handles points exceeding max score', () => {
      const position = calculateWaitlistPosition(200); // Over 175 max
      expect(position).toBe(1); // Should treat as max score
    });
  });
});
