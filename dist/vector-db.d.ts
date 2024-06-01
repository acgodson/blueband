import { WalletClient } from "viem";
export declare function createIndex(apiKey: string, client: WalletClient): Promise<string | undefined>;
export declare function addDocuments(indexName: string, apiKey: string, agent: string, uris: string[], chunkSize: number, decryptedTexts?: string[]): Promise<{
    uris: string[];
    ids: any[];
}>;
export declare function queryIndex(indexName: string, agent: string, apiKey: string, query: string, documentCount: number, chunkCount: number, sectionCount: number, tokens: number, format: string, overlap: boolean): Promise<any[]>;
