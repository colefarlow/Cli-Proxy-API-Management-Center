import { describe, expect, test } from 'bun:test';
import { navigationSection, resetCountdown, setupHealth } from '../src/features/atelier/dailyView';

describe('daily management view', () => {
  test('keeps original management routes reachable under three daily destinations', () => {
    expect(navigationSection('/')).toBe('dashboard');
    expect(navigationSection('/dashboard')).toBe('dashboard');
    expect(navigationSection('/auth-files')).toBe('accounts');
    expect(navigationSection('/auth-files/oauth-excluded')).toBe('accounts');
    for (const route of [
      '/quota',
      '/oauth',
      '/routing',
      '/ai-providers',
      '/config',
      '/setup',
      '/logs',
      '/system',
      '/plugins',
    ]) {
      expect(navigationSection(route)).toBe('advanced');
    }
  });
  test('does not claim readiness before readings arrive or after a failed connection', () => {
    const checks = [{ id: 'affinity', state: 'on' as const, value: '12h' }];
    expect(setupHealth(checks, false, false)).toBe('checking');
    expect(setupHealth(checks, true, false)).toBe('ready');
    expect(setupHealth(checks, true, true)).toBe('unavailable');
    expect(setupHealth([{ ...checks[0], state: 'unknown' }], true, false)).toBe('attention');
    expect(setupHealth([{ ...checks[0], state: 'off' }], true, false)).toBe('attention');
  });
  test('turns an observed reset into a relative countdown without promising refreshed quota', () => {
    const now = Date.parse('2026-10-30T23:00:00Z');
    expect(resetCountdown('2026-10-31T01:10:00Z', now)).toEqual({
      kind: 'future',
      days: 0,
      hours: 2,
      minutes: 10,
    });
    expect(resetCountdown('2026-11-01T23:00:00Z', now)).toEqual({
      kind: 'future',
      days: 2,
      hours: 0,
      minutes: 0,
    });
    expect(resetCountdown('2026-10-30T23:00:01Z', now)).toEqual({
      kind: 'future',
      days: 0,
      hours: 0,
      minutes: 1,
    });
    expect(resetCountdown('2026-10-30T22:59:00Z', now)).toEqual({ kind: 'due' });
    expect(resetCountdown(null, now)).toEqual({ kind: 'unknown' });
    expect(resetCountdown('not-a-date', now)).toEqual({ kind: 'unknown' });
  });
});
