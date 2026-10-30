import { create } from 'zustand';
import type { AuthFileItem } from '@/types/authFile';

export function accountIdentity(file: AuthFileItem): string {
  const provider = String(file.provider ?? file.type ?? 'unknown').toLowerCase();
  const email = typeof file.email === 'string' ? file.email.trim().toLowerCase() : '';
  return `${provider}:${email || file.name}`;
}
export function validateAccountName(value: string): string | null {
  if (
    value.length > 60 ||
    Array.from(value).some(
      (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127
    )
  )
    return null;
  return value.trim();
}

interface NameState {
  names: Record<string, string>;
  rename: (file: AuthFileItem, value: string) => Promise<void>;
}
export const useAccountNames = create<NameState>((set) => ({
  names: typeof window !== 'undefined' ? (window.proxyAtelier?.accountNames ?? {}) : {},
  rename: async (file, value) => {
    const name = validateAccountName(value);
    if (name === null) throw new Error('invalid display name');
    const identity = accountIdentity(file);
    if (!window.proxyAtelier) throw new Error('desktop naming unavailable');
    await window.proxyAtelier.renameAccount(identity, name);
    set((state) => {
      const names = { ...state.names };
      if (name) names[identity] = name;
      else delete names[identity];
      return { names };
    });
  },
}));
