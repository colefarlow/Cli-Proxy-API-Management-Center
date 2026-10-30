import { createContext, useContext } from 'react';
import type { useAtelierSnapshot } from './useAtelierSnapshot';

export const SnapshotContext = createContext<
  (ReturnType<typeof useAtelierSnapshot> & { query: string }) | null
>(null);
export const useAtelier = () => {
  const state = useContext(SnapshotContext);
  if (!state) throw new Error('Atelier context missing');
  return state;
};
