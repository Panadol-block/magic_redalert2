import { afterEach, describe, expect, mock, test } from 'bun:test';
import { findBundledGameResArchive } from '../../engine/gameRes/GameResConfig';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

function respond(status: number, contentType: string, size = '115017967') {
    const fetchMock = mock(async () => new Response(null, {
        status,
        headers: { 'Content-Type': contentType, 'Content-Length': size },
    }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    return fetchMock;
}

describe('bundled game resource archive', () => {
    test('accepts a same-origin bundle and probes without downloading the body', async () => {
        const fetchMock = respond(200, 'application/x-7z-compressed');
        const result = await findBundledGameResArchive('/game-res/full-pack.7z', 'http://localhost:4001/');
        expect(result?.href).toBe('http://localhost:4001/game-res/full-pack.7z');
        expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'HEAD', redirect: 'error' });
    });
    test('accepts binary content types with parameters', async () => {
        respond(200, 'application/octet-stream; charset=binary');
        expect(await findBundledGameResArchive('/pack.7z', 'https://localhost/')).toBeInstanceOf(URL);
    });
    test('accepts Vite static archives without a MIME type', async () => {
        respond(200, '');
        expect(await findBundledGameResArchive('/pack.7z', 'http://localhost/')).toBeInstanceOf(URL);
        expect(await findBundledGameResArchive('/index.html', 'http://localhost/')).toBeUndefined();
    });
    test('rejects missing, empty and SPA fallback responses', async () => {
        for (const [status, type, size] of [[404, 'application/octet-stream', '1'], [200, 'text/html', '123'], [200, 'application/octet-stream', '0']] as const) {
            respond(status, type, size);
            expect(await findBundledGameResArchive('/pack.7z', 'http://localhost/')).toBeUndefined();
        }
    });
    test('never requests external origins, credentials or non-HTTP protocols', async () => {
        const fetchMock = respond(200, 'application/octet-stream');
        for (const path of [undefined, '', 'https://external.example/pack.7z', 'file:///pack.7z', 'http://user:pass@localhost/pack.7z']) {
            expect(await findBundledGameResArchive(path, 'http://localhost/')).toBeUndefined();
        }
        expect(fetchMock).not.toHaveBeenCalled();
    });
    test('network errors return to manual import', async () => {
        globalThis.fetch = mock(async () => { throw new TypeError('network unavailable'); }) as unknown as typeof fetch;
        expect(await findBundledGameResArchive('/pack.7z', 'http://localhost/')).toBeUndefined();
    });
});
