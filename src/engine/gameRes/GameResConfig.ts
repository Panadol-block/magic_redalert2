import { GameResSource } from './GameResSource';
export async function findBundledGameResArchive(path: string | undefined, baseUrl: string): Promise<URL | undefined> {
    if (!path) {
        return undefined;
    }
    try {
        const base = new URL(baseUrl);
        const url = new URL(path, base);
        if (url.origin !== base.origin || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
            return undefined;
        }
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'error',
            signal: AbortSignal.timeout(5000),
        });
        const contentType = response.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase();
        if (response.ok && Number(response.headers.get('Content-Length')) > 0
            && (contentType === 'application/x-7z-compressed' || contentType === 'application/octet-stream'
                || (!contentType && url.pathname.endsWith('.7z')))) {
            return url;
        }
    }
    catch {
        // Missing bundles and unsupported static hosts retain the manual import flow.
    }
    return undefined;
}
export class GameResConfig {
    private defaultCdnBaseUrl: string;
    public source?: GameResSource;
    public cdnUrl?: string;
    constructor(defaultCdnBaseUrl: string) {
        this.defaultCdnBaseUrl = defaultCdnBaseUrl;
    }
    unserialize(serializedConfig: string): void {
        const parts = serializedConfig.split(",");
        const sourceNum = Number(parts[0]);
        if (!(sourceNum in GameResSource)) {
            throw new Error(`Unknown game res source type number: "${sourceNum}"`);
        }
        this.source = sourceNum as GameResSource;
        this.cdnUrl = parts[1] ? decodeURIComponent(parts[1]) : undefined;
    }
    serialize(): string {
        if (this.source === undefined) {
            throw new Error("GameResConfig source is undefined, cannot serialize.");
        }
        let serialized = String(this.source);
        if (this.cdnUrl) {
            serialized += "," + encodeURIComponent(this.cdnUrl);
        }
        return serialized;
    }
    isCdn(): boolean {
        return this.source === GameResSource.Cdn;
    }
    getCdnBaseUrl(): string | undefined {
        return this.cdnUrl ?? this.defaultCdnBaseUrl;
    }
}
