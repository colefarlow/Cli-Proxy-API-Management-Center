import { afterEach, describe, expect, test } from 'bun:test';
import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { nativeAdapter } from '../src/services/api/nativeAdapter';

const originalWindow = globalThis.window;
afterEach(() => {
  globalThis.window = originalWindow;
});
const config = (extra = {}): InternalAxiosRequestConfig => ({
  url: '/config',
  baseURL: 'http://127.0.0.1:8317/v8/management',
  method: 'get',
  headers: new AxiosHeaders({ Authorization: 'native-managed' }),
  timeout: 1000,
  validateStatus: (status) => status < 400,
  ...extra,
});
describe('native desktop API transport', () => {
  test('forwards the path and parameters without exposing authorization to the bridge', async () => {
    let sent: unknown;
    globalThis.window = {
      proxyAtelier: {
        host: 'macbook',
        switchHost: () => {},
        request: async (payload) => {
          sent = payload;
          return { status: 200, headers: {}, body: btoa('{}') };
        },
      },
    } as unknown as Window & typeof globalThis;
    await nativeAdapter(config({ params: { name: 'an account.json', all: false } }));
    expect(sent).toEqual({
      path: '/v8/management/config?name=an+account.json&all=false',
      method: 'GET',
      body: '',
      headers: {},
    });
  });
  test('preserves backend error status and decoded JSON for existing error handlers', async () => {
    globalThis.window = {
      proxyAtelier: {
        host: 'macbook',
        switchHost: () => {},
        request: async () => ({ status: 401, headers: {}, body: btoa('{"error":"unauthorized"}') }),
      },
    } as unknown as Window & typeof globalThis;
    try {
      await nativeAdapter(config());
      throw new Error('request should fail');
    } catch (error) {
      expect((error as { response: { status: number; data: unknown } }).response).toMatchObject({
        status: 401,
        data: { error: 'unauthorized' },
      });
    }
  });
  test('retains binary downloads byte for byte', async () => {
    globalThis.window = {
      proxyAtelier: {
        host: 'macbook',
        switchHost: () => {},
        request: async () => ({
          status: 200,
          headers: { 'content-type': 'application/octet-stream' },
          body: btoa('\x00\xff\x01'),
        }),
      },
    } as unknown as Window & typeof globalThis;
    const response = await nativeAdapter(config({ responseType: 'blob' }));
    expect([...new Uint8Array(await response.data.arrayBuffer())]).toEqual([0, 255, 1]);
  });
  test('serializes multipart uploads with their generated boundary', async () => {
    let sent: { headers: Record<string, string>; body: string } | undefined;
    globalThis.window = {
      proxyAtelier: {
        host: 'macbook',
        switchHost: () => {},
        request: async (payload) => {
          sent = payload;
          return { status: 200, headers: {}, body: btoa('{}') };
        },
      },
    } as unknown as Window & typeof globalThis;
    const form = new FormData();
    form.append('file', new Blob(['public test content']), 'example.txt');
    await nativeAdapter(config({ method: 'post', data: form }));
    expect(sent?.headers['Content-Type']).toContain('multipart/form-data; boundary=');
    expect(atob(sent!.body)).toContain('public test content');
    expect(atob(sent!.body)).toContain('filename="example.txt"');
  });
  test('bounds requests when the native host does not reply', async () => {
    globalThis.window = {
      proxyAtelier: { host: 'macbook', switchHost: () => {}, request: () => new Promise(() => {}) },
    } as unknown as Window & typeof globalThis;
    await expect(nativeAdapter(config({ timeout: 5 }))).rejects.toMatchObject({
      code: 'ECONNABORTED',
    });
  });
});
