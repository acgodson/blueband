import { v4 } from "uuid";
import { GPT3Tokenizer } from "./GPT3Tokenizer";
import { CreateIndexConfig, LocalIndex } from "./LocalIndex";
import { TextSplitter, TextSplitterConfig } from "./TextSplitter";
import {
  MetadataFilter,
  EmbeddingsModel,
  Tokenizer,
  MetadataTypes,
  EmbeddingsResponse,
  QueryResult,
  DocumentChunkMetadata,
  DocumentCatalogStats,
} from "./types";
import { LocalDocumentResult } from "./LocalDocumentResult";
import { LocalDocument } from "./LocalDocument";
import {
  defineChain,
  getContract,
  createPublicClient,
  http,
  WalletClient,
} from "viem";
import { localhost } from "viem/chains";
import lighthouse from "@lighthouse-web3/sdk";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();


const chianId = process.env.CHAIN_ID;
const BluebandAddress = process.env.BLUEBAND_CONTRACT;

export interface DocumentQueryOptions {
  maxDocuments?: number;
  maxChunks?: number;
  filter?: MetadataFilter;
}

export interface LocalDocumentIndexConfig {
  indexName?: string;
  apiKey: string;
  embeddings?: EmbeddingsModel;
  tokenizer?: Tokenizer;
  chunkingConfig?: Partial<TextSplitterConfig>;
}

const abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "indexName",
        type: "string",
      },
      {
        internalType: "string",
        name: "uri",
        type: "string",
      },
      {
        internalType: "string",
        name: "documentCID",
        type: "string",
      },
    ],
    name: "addDocument",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "indexName",
        type: "string",
      },
    ],
    name: "createIndex",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "indexId",
        type: "string",
      },
      {
        internalType: "string",
        name: "uri",
        type: "string",
      },
    ],
    name: "getDocumentCIDByURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "getOwnersIndexes",
    outputs: [
      {
        internalType: "string[]",
        name: "",
        type: "string[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "indexId",
        type: "string",
      },
      {
        internalType: "string",
        name: "uri",
        type: "string",
      },
    ],
    name: "getURIByDocumentCID",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    name: "indexes",
    outputs: [
      {
        internalType: "uint256",
        name: "version",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "count",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "owners",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export class LocalDocumentIndex extends LocalIndex {
  private readonly _embeddings?: EmbeddingsModel;
  private readonly _tokenizer: Tokenizer;
  private readonly apiKey: string;
  private readonly _chunkingConfig?: TextSplitterConfig;
  private _catalog?: DocumentCatalog;
  private _newCatalog?: DocumentCatalog;

  /**
   * Creates a new `LocalDocumentIndex` instance.
   * @param config Configuration settings for the document index.
   */
  public constructor(config: LocalDocumentIndexConfig) {
    super(config.indexName);
    this._embeddings = config.embeddings;
    this._chunkingConfig = Object.assign(
      {
        keepSeparators: true,
        chunkSize: 512,
        chunkOverlap: 0,
      } as TextSplitterConfig,
      config.chunkingConfig
    );
    this._tokenizer =
      config.tokenizer ?? this._chunkingConfig.tokenizer ?? new GPT3Tokenizer();
    this._chunkingConfig.tokenizer = this._tokenizer;
    this.apiKey = config.apiKey;
  }

  public get embeddings(): EmbeddingsModel | undefined {
    return this._embeddings;
  }

  public get tokenizer(): Tokenizer {
    return this._tokenizer;
  }

  public async isCatalogCreated(): Promise<boolean> {
    try {
      const localhostChain = defineChain({
        ...localhost,
        id: parseInt(chianId || "0"),
        url: "http://localhost:8545",
      });

      const publicClient = createPublicClient({
        chain: localhostChain,
        transport: http(),
      });

      const data = await publicClient.readContract({
        abi: [
          {
            inputs: [
              {
                internalType: "address",
                name: "owner",
                type: "address",
              },
            ],
            name: "getOwnersIndexes",
            outputs: [
              {
                internalType: "string[]",
                name: "",
                type: "string[]",
              },
            ],
            stateMutability: "view",
            type: "function",
          },
        ],
        address:  BluebandAddress as `0x${string}`,
        functionName: "getOwnersIndexes",
        args: ["0xf2750684eB187fF9f82e2F980f6233707eF5768C"],
      });

      const exists = data.find((x: any) => x.toLowerCase() === this.indexName);
      if (exists) {
        return true;
      }

      return true;
      // else {
      //   console.log("index not found");
      //   return false;
      // }
    } catch (err: unknown) {
      return false;
    }
  }

  /**
   * Returns the document ID for the given URI.
   * @param uri URI of the document to lookup.
   * @returns Document ID or undefined if not found.
   */
  public async getDocumentId(
    uri: string,
    apiKey: string
  ): Promise<string | undefined> {
    await this.loadIndexData(apiKey);
    //we'll get this from ipfs "489a50e2-c4a7-47a9-80b1-de4602a73e18.txt"
    try {
      const localhostChain = defineChain({
        ...localhost,
        id: parseInt(chianId || "0"),
        url: "http://localhost:8545",
      });

      const publicClient = createPublicClient({
        chain: localhostChain,
        transport: http(),
      });

      const result: any = await publicClient.readContract({
        address: BluebandAddress as `0x${string}`,
        abi: abi,
        functionName: "getDocumentCIDByURI",
        args: [this.indexName, uri],
      });

      return result;
    } catch (e) {
      console.log(e);
      // QmcdMbcXG81U8VPN54gCc5yHZde78z9UsGDLng3BaXi4Ku
      // return "https://en.wikipedia.org/wiki/2023_Cricket_World_Cup";
    }

    return this._catalog?.uriToId[uri];
  }

  /**
   * Returns the document URI for the given ID.
   * @param documentId ID of the document to lookup.
   * @returns Document URI or undefined if not found.
   */
  public async getDocumentUri(documentId: string): Promise<string | undefined> {
    await this.loadIndexData(this.apiKey);

    try {
      const localhostChain = defineChain({
        ...localhost,
        id: parseInt(chianId || "0"),
        url: "http://localhost:8545",
      });

      const publicClient = createPublicClient({
        chain: localhostChain,
        transport: http(),
      });

      const result: any = await publicClient.readContract({
        address: BluebandAddress as `0x${string}`,
        abi: abi,
        functionName: "getURIByDocumentCID",
        args: [this.indexName, documentId],
      });

      return result;
    } catch (e) {
      console.log(e);
      // return "https://en.wikipedia.org/wiki/2023_Cricket_World_Cup";
    }
  }

  /**
   * Loads the document catalog from disk and returns its stats.
   * @returns Catalog stats.
   */
  public async getCatalogStats(): Promise<DocumentCatalogStats> {
    const stats = await this.getIndexStats(this.apiKey);
    return {
      version: this._catalog!.version,
      documents: this._catalog!.count,
      chunks: stats.items,
      metadata_config: stats.metadata_config,
    };
  }

  /**
   * Deletes a document from the index.
   * @param uri URI of the document to delete.
   */
  public async deleteDocument(uri: string): Promise<void> {
    // Lookup document ID
    const documentId = await this.getDocumentId(uri, this.apiKey);
    if (documentId == undefined) {
      return;
    }

    // Delete document chunks from index and remove from catalog
    await this.beginUpdate();
    try {
      // Get list of chunks for document
      const chunks = await this.listItemsByMetadata<DocumentChunkMetadata>(
        {
          documentId,
        },
        this.apiKey
      );

      // Delete chunks
      for (const chunk of chunks) {
        await this.deleteItem(chunk.id, this.apiKey);
      }

      // Remove entry from catalog
      delete this._newCatalog!.uriToId[uri];
      delete this._newCatalog!.idToUri[documentId];
      this._newCatalog!.count--;

      // Commit changes
      await this.endUpdate();
    } catch (err: unknown) {
      // Cancel update and raise error
      this.cancelUpdate();
      throw new Error(
        `Error deleting document "${uri}": ${(err as any).toString()}`
      );
    }

    // Delete text file from smart contract

    // Delete metadata file from metadata
  }

  /**
   * Adds a document to the catalog.
   * @remarks
   * A new update is started if one is not already in progress. If an document with the same uri
   * already exists, it will be replaced.
   * @param uri - Document URI
   * @param text - Document text
   * @param docType - Optional. Document type
   * @param metadata - Optional. Document metadata to index
   * @returns Inserted document
   */
  public async upsertDocument(
    uri: string,
    text: string,
    docType?: string,
    metadata?: Record<string, MetadataTypes>
  ): Promise<LocalDocument> {
    // Ensure embeddings configured
    if (!this._embeddings) {
      throw new Error(`Embeddings model not configured.`);
    }

    // Check for existing document ID
    let documentId = await this.getDocumentId(uri, this.apiKey);

    if (documentId != undefined) {
      // Delete existing document
      await this.deleteDocument(uri);
    }
    //save it on ipfs first

    const response = await lighthouse.uploadText(text, this.apiKey);

    console.log(response);
    documentId = response.data.Hash;

    if (!documentId) {
      throw new Error("failed to upload text to IPFS");
    }

    // Initialize text splitter settings
    const config = Object.assign({ docType }, this._chunkingConfig);
    if (config.docType == undefined) {
      // Populate docType based on extension
      const pos = uri.lastIndexOf(".");
      if (pos >= 0) {
        const ext = uri.substring(pos + 1).toLowerCase();
        config.docType = ext;
      }
    }

    // Split text into chunks
    const splitter = new TextSplitter(config);
    const chunks = splitter.split(text);

    // Break chunks into batches for embedding generation
    let totalTokens = 0;
    const chunkBatches: string[][] = [];
    let currentBatch: string[] = [];
    for (const chunk of chunks) {
      totalTokens += chunk.tokens.length;
      if (totalTokens > this._embeddings.maxTokens) {
        chunkBatches.push(currentBatch);
        currentBatch = [];
        totalTokens = chunk.tokens.length;
      }
      currentBatch.push(chunk.text.replace(/\n/g, " "));
    }
    if (currentBatch.length > 0) {
      chunkBatches.push(currentBatch);
    }

    // Generate embeddings for chunks
    const embeddings: number[][] = [];
    for (const batch of chunkBatches) {
      let response: EmbeddingsResponse;
      try {
        response = await this._embeddings.createEmbeddings(batch);
      } catch (err: unknown) {
        throw new Error(
          `Error generating embeddings: ${(err as any).toString()}`
        );
      }

      // Check for error
      if (response.status != "success") {
        throw new Error(`Error generating embeddings: ${response.message}`);
      }

      // Add embeddings to output
      for (const embedding of response.output!) {
        embeddings.push(embedding);
      }
    }

    // Add document chunks to index
    await this.beginUpdate();

    try {
      // Add chunks to index
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        const chunkMetadata: DocumentChunkMetadata = Object.assign(
          {
            documentId,
            startPos: chunk.startPos,
            endPos: chunk.endPos,
          },
          metadata
        );
        await this.insertItem(
          {
            id: v4(),
            metadata: chunkMetadata,
            vector: embedding,
          },
          this.apiKey
        );
      }

      // Add entry to catalog
      this._newCatalog!.uriToId[uri] = documentId;
      this._newCatalog!.idToUri[documentId] = uri;
      this._newCatalog!.count++;

      // Commit changes
      await this.endUpdate();
    } catch (err: unknown) {
      // Cancel update and raise error
      this.cancelUpdate();
      throw new Error(
        `Error adding document "${uri}": ${(err as any).toString()}`
      );
    }

    // Return document
    return new LocalDocument(this, documentId, uri);
  }

  /**
   * Returns all documents in the index.
   * @remarks
   * Each document will contain all of the documents indexed chunks.
   * @returns Array of documents.
   */
  public async listDocuments(): Promise<LocalDocumentResult[]> {
    // Sort chunks by document ID
    const docs: { [documentId: string]: QueryResult<DocumentChunkMetadata>[] } =
      {};
    const chunks = await this.listItems<DocumentChunkMetadata>(this.apiKey);
    chunks.forEach((chunk) => {
      const metadata = chunk.metadata;
      if (docs[metadata.documentId] == undefined) {
        docs[metadata.documentId] = [];
      }
      docs[metadata.documentId].push({ item: chunk, score: 1.0 });
    }, this.apiKey);

    // Create document results
    const results: LocalDocumentResult[] = [];
    for (const documentId in docs) {
      const uri = (await this.getDocumentUri(documentId)) as string;
      const documentResult = new LocalDocumentResult(
        this,
        documentId,
        uri,
        docs[documentId],
        this._tokenizer
      );
      results.push(documentResult);
    }

    return results;
  }

  /**
   * Queries the index for documents similar to the given query.
   * @param query Text to query for.
   * @param options Optional. Query options.
   * @returns Array of document results.
   */
  public async queryDocuments(
    query: string,
    options?: DocumentQueryOptions
  ): Promise<LocalDocumentResult[]> {
    // Ensure embeddings configured
    if (!this._embeddings) {
      throw new Error(`Embeddings model not configured.`);
    }

    // Ensure options are defined
    options = Object.assign(
      {
        maxDocuments: 10,
        maxChunks: 50,
      },
      options
    );

    // Generate embeddings for query
    let embeddings: EmbeddingsResponse;
    try {
      embeddings = await this._embeddings.createEmbeddings(
        query.replace(/\n/g, " ")
      );
    } catch (err: unknown) {
      throw new Error(
        `Error generating embeddings for query: ${(err as any).toString()}`
      );
    }

    // Check for error
    if (embeddings.status != "success") {
      throw new Error(
        `Error generating embeddings for query: ${embeddings.message}`
      );
    }

    // Query index for chunks
    const results = await this.queryItems<DocumentChunkMetadata>(
      embeddings.output![0],
      options.maxChunks!,
      options.filter as any
    );

    // Group chunks by document
    const documentChunks: {
      [documentId: string]: QueryResult<DocumentChunkMetadata>[];
    } = {};

    for (const result of results) {
      const metadata = result.item.metadata;
      if (documentChunks[metadata.documentId] == undefined) {
        documentChunks[metadata.documentId] = [];
      }
      documentChunks[metadata.documentId].push(result);
    }

    // Create a document result for each document
    const documentResults: LocalDocumentResult[] = [];
    for (const documentId in documentChunks) {
      const chunks = documentChunks[documentId];
      const uri = (await this.getDocumentUri(documentId)) as string;
      const documentResult = new LocalDocumentResult(
        this,
        documentId,
        uri,
        chunks,
        this._tokenizer
      );
      documentResults.push(documentResult);
    }

    // Sort document results by score and return top results
    return documentResults
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxDocuments!);
  }

  // Overrides

  public async beginUpdate(): Promise<void> {
    await super.beginUpdate(this.apiKey);
    this._newCatalog = Object.assign({}, this._catalog);
  }

  public cancelUpdate(): void {
    super.cancelUpdate();
    this._newCatalog = undefined;
  }

  public async createIndex(
    config?: CreateIndexConfig
  ): Promise<string | undefined> {
    const newIndex = await super.createIndex(config);
    await this.loadIndexData(this.apiKey);
    return newIndex;
  }

  public async endUpdate(): Promise<void> {
    await super.endUpdate(this.apiKey);

    try {
      // Save catalog on smart contract
      this._catalog = this._newCatalog;
      this._newCatalog = undefined;
    } catch (err: unknown) {
      throw new Error(
        `Error saving document catalog: ${(err as any).toString()}`
      );
    }
  }

  protected async loadIndexData(apiKey: string): Promise<void> {
    await super.loadIndexData(apiKey);

    if (this._catalog) {
      return;
    }
    //creating catalog on the smart contract
    if (await this.isCatalogCreated()) {
      // Load catalog from smart contract
      // const localhostChain = defineChain({
      //   ...localhost,
      //   id: parseInt(chianId || "0"),
      //   url: "http://localhost:8545",
      // });

      // const publicClient = createPublicClient({
      //   chain: localhostChain,
      //   transport: http(),
      // });

      this._catalog = {
        version: 1,
        count: 0,
        uriToId: {},
        idToUri: {},
      };
    } else {
      this._catalog = {
        version: 1,
        count: 0,
        uriToId: {},
        idToUri: {},
      };
    }
  }
}

interface DocumentCatalog {
  version: number;
  count: number;
  uriToId: { [uri: string]: string };
  idToUri: { [id: string]: string };
}
