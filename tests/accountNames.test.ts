import { expect, test } from 'bun:test';
import { accountIdentity, validateAccountName } from '../src/features/atelier/accountNames';

test('account names share a stable identity across hosts and separate providers', () => {
  const a = accountIdentity({ name: 'a.json', email: 'Example@Example.test', provider: 'claude' });
  const b = accountIdentity({ name: 'b.json', email: 'example@example.test', provider: 'claude' });
  expect(a).toBe(b);
  expect(a).not.toBe(accountIdentity({ name: 'a.json', email: 'example@example.test', provider: 'codex' }));
});
test('display naming never reads the unsafe raw account field', () => {
  expect(accountIdentity({ name: 'named.json', provider: 'claude', account: 'not-an-identity' })).toBe('claude:named.json');
});
test('validates display names without silently truncating them', () => {
  expect(validateAccountName('  Work  ')).toBe('Work');
  expect(validateAccountName('')).toBe('');
  expect(validateAccountName('x'.repeat(61))).toBeNull();
  expect(validateAccountName('a\nb')).toBeNull();
});
