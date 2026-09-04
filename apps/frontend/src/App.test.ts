import { describe, expect, it } from 'vitest';
import { getHealthLabel } from './App';

describe('frontend connection status', () => {
  it('labels a connected backend', () => {
    expect(getHealthLabel('connected')).toBe('Backend connected');
  });
});
