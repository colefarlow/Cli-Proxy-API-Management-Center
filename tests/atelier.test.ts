import { describe, expect, test } from 'bun:test';
import {
  codexQuota,
  quotaWindow,
  recommendationChecks,
  summarizeAccounts,
} from '../src/features/atelier/atelierData';

describe('Atelier observations', () => {
  test('detects affinity TTL and retry credential-cap drift', () => {
    const checks = recommendationChecks(
      {
        routing: {
          'session-affinity': true,
          'session-affinity-ttl': '1h',
          retry: { 'request-retry': 2, 'max-retry-credentials': 99 },
        },
      },
      [],
      null
    );
    expect(checks.find((check) => check.id === 'affinity')?.state).toBe('off');
    expect(checks.find((check) => check.id === 'retries')?.state).toBe('off');
  });
  test('recognizes a weekly-only Codex window without labeling it five-hour', () => {
    const result = codexQuota({
      primary_window: { limit_window_seconds: 604800, used_percent: 77 },
      secondary_window: null,
    });
    expect(result.weekly?.remaining).toBe(23);
    expect(result.short).toBeNull();
  });
  test('unknown quota is not represented as unused capacity', () => {
    expect(quotaWindow({})).toBeNull();
    expect(quotaWindow({ utilization: '12' })).toBeNull();
    expect(quotaWindow({ utilization: 125 })).toEqual({ remaining: 0, resetsAt: null });
  });
  test('tracks actual account counters without assuming health from failure history', () => {
    const result = summarizeAccounts([
      { name: 'claude-a.json', provider: 'claude', successCount: 12, failureCount: 2 },
      { name: 'codex-a.json', provider: 'codex', successCount: 8, failureCount: 0 },
      { name: 'disabled.json', provider: 'claude', disabled: true, successCount: 3 },
    ]);
    expect(result).toEqual({ active: 2, total: 25, success: 23, failures: 2, successRate: 92 });
  });
  test('marks absent settings unknown and a stopped helper as requiring attention', () => {
    const checks = recommendationChecks({}, [], null);
    expect(checks.every((check) => check.state === 'unknown')).toBe(true);
    const known = recommendationChecks(
      {
        routing: {
          strategy: 'fill-first',
          'session-affinity': true,
          'session-affinity-ttl': '12h',
        },
      },
      [{ name: 'codex-a.json', provider: 'codex', websockets: true }],
      { enabled: false, lastRun: null, lastStatus: null }
    );
    expect(known.find((check) => check.id === 'priority')?.state).toBe('off');
    expect(known.find((check) => check.id === 'affinity')?.state).toBe('on');
    expect(known.find((check) => check.id === 'websockets')?.state).toBe('on');
  });
  test('requires every active Codex credential to enable WebSockets', () => {
    const checks = recommendationChecks(
      {},
      [
        { name: 'a', provider: 'codex', websockets: true },
        { name: 'b', provider: 'codex' },
      ],
      null
    );
    expect(checks.find((check) => check.id === 'websockets')?.state).toBe('off');
  });
});
