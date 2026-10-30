import { useCallback, useEffect, useState } from 'react';
import { authFilesApi } from '@/services/api';
import { apiClient } from '@/services/api/client';
import type { AuthFileItem } from '@/types/authFile';
import {
  codexQuota,
  record,
  type AccountQuota,
  type HelperStatus,
  type RecordValue,
  quotaWindow,
} from './atelierData';

export interface AtelierSnapshot {
  accounts: AuthFileItem[];
  config: RecordValue;
  quotas: Record<string, AccountQuota>;
  helper: HelperStatus | null;
  observedAt: Date | null;
}
const EMPTY: AtelierSnapshot = {
  accounts: [],
  config: {},
  quotas: {},
  helper: null,
  observedAt: null,
};

export function useAtelierSnapshot() {
  const [snapshot, setSnapshot] = useState<AtelierSnapshot>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    const connection = apiClient.captureConnection();
    const revision = apiClient.getConnectionRevision();
    try {
      const [files, config, helper] = await Promise.all([
        authFilesApi.list(),
        connection.get<RecordValue>('/config'),
        window.proxyAtelier
          ? connection.get<HelperStatus>('/atelier/status').catch(() => null)
          : Promise.resolve(null),
      ]);
      const quotas: Record<string, AccountQuota> = {};
      await Promise.all(
        files.files
          .filter(
            (file) =>
              !file.disabled && ['claude', 'codex'].includes(String(file.provider ?? file.type))
          )
          .map(async (file) => {
            try {
              const claude = (file.provider ?? file.type) === 'claude';
              const result = await connection.post<RecordValue>('/requests/api-call', {
                auth_index: String(file.authIndex),
                method: 'GET',
                url: claude
                  ? 'https://api.anthropic.com/api/oauth/usage'
                  : 'https://chatgpt.com/backend-api/wham/usage',
                header: {
                  Authorization: 'Bearer $TOKEN$',
                  Accept: 'application/json',
                  ...(claude ? { 'anthropic-beta': 'oauth-2025-04-20' } : {}),
                },
              });
              if (result.status_code !== 200) throw new Error('quota unavailable');
              const payload = record(
                typeof result.body === 'string' ? JSON.parse(result.body) : result.body
              );
              const rate = record(payload.rate_limit);
              quotas[file.name] = {
                ...(claude
                  ? {
                      weekly: quotaWindow(payload.seven_day),
                      short: quotaWindow(payload.five_hour),
                    }
                  : codexQuota(rate)),
                error: false,
              };
            } catch {
              quotas[file.name] = { weekly: null, short: null, error: true };
            }
          })
      );
      if (revision !== apiClient.getConnectionRevision()) return;
      setSnapshot({ accounts: files.files, config, quotas, helper, observedAt: new Date() });
      setError(false);
    } catch {
      if (revision === apiClient.getConnectionRevision()) setError(true);
    } finally {
      if (revision === apiClient.getConnectionRevision()) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 300000);
    return () => clearInterval(timer);
  }, [refresh]);
  return { ...snapshot, loading, error, refresh };
}
