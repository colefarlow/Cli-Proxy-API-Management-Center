import axios, { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios';

interface NativeResult {
  status: number;
  headers: Record<string, string>;
  body: string;
}
interface DesktopConnection {
  host: 'macbook' | 'linuxbox2';
  accountNames: Record<string, string>;
  renameAccount: (identity: string, value: string) => Promise<void>;
  request: (payload: {
    path: string;
    method: string;
    body: string;
    headers: Record<string, string>;
  }) => Promise<NativeResult>;
  switchHost: (host: string) => void;
}
declare global {
  interface Window {
    proxyAtelier?: DesktopConnection;
  }
}

const encode = (bytes: Uint8Array): string => {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  return btoa(binary);
};

/** Desktop-only transport. The management key never crosses this bridge. */
export const nativeAdapter: AxiosAdapter = async (config) => {
  const bridge = window.proxyAtelier;
  if (!bridge) throw new AxiosError('Desktop connection unavailable', 'ERR_NETWORK', config);
  const url = new URL(axios.getUri(config));
  const headers: Record<string, string> = {};
  let body = '';
  if (config.data instanceof FormData) {
    const multipart = new Response(config.data);
    headers['Content-Type'] = multipart.headers.get('Content-Type') ?? '';
    body = encode(new Uint8Array(await multipart.arrayBuffer()));
  } else if (config.data !== undefined && config.data !== null) {
    headers['Content-Type'] = String(config.headers.get('Content-Type') ?? 'application/json');
    body = encode(
      new TextEncoder().encode(
        typeof config.data === 'string' ? config.data : JSON.stringify(config.data)
      )
    );
  }
  const operation = bridge.request({
    path: url.pathname + url.search,
    method: (config.method ?? 'GET').toUpperCase(),
    body,
    headers,
  });
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new AxiosError('Desktop request timed out', 'ECONNABORTED', config)),
          config.timeout || 60000
        );
      }),
    ]);
    const bytes = Uint8Array.from(atob(result.body), (character) => character.charCodeAt(0));
    let data: unknown = new TextDecoder().decode(bytes);
    if (config.responseType === 'blob')
      data = new Blob([bytes], { type: result.headers['content-type'] });
    else if (config.responseType === 'arraybuffer') data = bytes.buffer;
    const response = {
      data,
      status: result.status,
      statusText: String(result.status),
      headers: new AxiosHeaders(result.headers),
      config,
    };
    if (config.validateStatus && !config.validateStatus(result.status)) {
      // Run Axios JSON transforms before the existing error normalizer reads the response.
      if (typeof data === 'string') {
        try {
          response.data = JSON.parse(data);
        } catch {
          /* text response */
        }
      }
      throw new AxiosError(
        `HTTP ${result.status}`,
        'ERR_BAD_RESPONSE',
        config,
        undefined,
        response
      );
    }
    return response;
  } catch (error) {
    if (error instanceof AxiosError) throw error;
    throw new AxiosError(
      'Cannot reach the selected proxy. Check its connection and try again.',
      'ERR_NETWORK',
      config
    );
  } finally {
    clearTimeout(timer);
  }
};
