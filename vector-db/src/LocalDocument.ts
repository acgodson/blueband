import * as fs from "fs/promises";
import * as path from "path";
import { MetadataTypes } from "./types";
import { LocalDocumentIndex } from "./LocalDocumentIndex";
import { createPublicClient, defineChain, http } from "viem";
import { localhost } from "viem/chains";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();


const chianId = process.env.CHAIN_ID;

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

/**
 * Represents an indexed document stored on disk.
 */
export class LocalDocument {
  private readonly _index: LocalDocumentIndex;
  private readonly _id: string;
  private readonly _uri: string;
  private _metadata: Record<string, MetadataTypes> | undefined;
  private _text: string | undefined;

  /**
   * Creates a new `LocalDocument` instance.
   * @param index Parent index that contains the document.
   * @param id ID of the document.
   * @param uri URI of the document.
   */
  public constructor(index: LocalDocumentIndex, id: string, uri: string) {
    this._index = index;
    this._id = id;
    this._uri = uri;
  }

  /**
   * Returns the ID of the document.
   */
  public get id(): string {
    return this._id;
  }

  /**
   * Returns the URI of the document.
   */
  public get uri(): string {
    return this._uri;
  }

  /**
   * Returns the length of the document in tokens.
   * @remarks
   * This value will be estimated for documents longer then 40k bytes.
   * @returns Length of the document in tokens.
   */
  public async getLength(): Promise<number> {
    const text = await this.loadText();
    if (text.length <= 40000) {
      return this._index.tokenizer.encode(text).length;
    } else {
      return Math.ceil(text.length / 4);
    }
  }

  public async hasMetadata(): Promise<boolean> {
    try {
      return false;
    } catch (err: unknown) {
      return false;
    }
  }

  public async loadMetadata(): Promise<Record<string, MetadataTypes>> {
    if (this._metadata == undefined) {
      let json: string;
      try {
        json = "";
      } catch (err: unknown) {
        throw new Error(
          `Error reading metadata for document "${this.uri}": ${(
            err as any
          ).toString()}`
        );
      }

      try {
        this._metadata = JSON.parse(json);
      } catch (err: unknown) {
        throw new Error(
          `Error parsing metadata for document "${this.uri}": ${(
            err as any
          ).toString()}`
        );
      }
    }

    return this._metadata!;
  }

  public async loadText(): Promise<string> {
    if (this._text == undefined) {
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
        const result = await publicClient.readContract({
          address: "0xeD3fda27A039FFCd66AcA14b82b86e17aFBc2Da2",
          abi: abi,
          functionName: "getDocumentCIDByURI",
          args: [this._index.indexName, this._uri],
        });
        const response = await axios.get(
          `https://gateway.lighthouse.storage/ipfs/${result}`
        );
        const data = response.data;
        if (data) {
          this._text = data;
        }
      } catch (err: unknown) {
        throw new Error(
          `Error reading text file for document "${this.uri}": ${(
            err as any
          ).toString()}`
        );
      }
    }
    return this._text || "";
  }
}
