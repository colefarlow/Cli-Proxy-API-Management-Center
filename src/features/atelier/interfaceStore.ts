import { create } from 'zustand';

export const useInterfaceStore = create<{
  original: boolean;
  setOriginal: (value: boolean) => void;
}>((set) => ({
  original: false,
  setOriginal: (original) => {
    set({ original });
    if (typeof window !== 'undefined') window.location.hash = '/';
  },
}));
