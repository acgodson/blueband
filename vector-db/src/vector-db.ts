import { LocalDocumentIndex } from "./LocalDocumentIndex";
import { WebFetcher } from "./WebFetcher";
import { OpenAIEmbeddings } from "./OpenAIEmbeddings";
import { Colorize } from "./internals";
import {
  createPublicClient,
  getAddress,
  http,
  WalletClient,
} from "viem";
import dotenv from "dotenv";
import { sepolia } from "viem/chains";
dotenv.config();

const openaiKey = process.env.NEXT_PUBLIC_OPENAI_KEY;

const agentABI = [
  {
    inputs: [
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
    inputs: [],
    name: "getIndexInfo",
    outputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
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
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "cid",
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
];

//TODO: use index to update the catalog later
export async function createIndex(apiKey: string, client: WalletClient) {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(
      "https://sepolia.infura.io/v3/88044f5fa1d74542ab084ecb6c49e531"
    ),
  });

  const indexInstance = new LocalDocumentIndex({
    agent: "",
    apiKey: apiKey,
  });
  console.log(Colorize.output(`creating index on lightHouse`));
  const newIndex = await indexInstance.createIndex({
    version: 1,
    deleteIfExists: true,
    apiKey: apiKey,
  });
  if (newIndex) {
    return newIndex;
  }
}

// export async function addDocuments(
//   indexName: string,
//   apiKey: string,
//   uris: string[],
//   chunkSize: number,
//   decryptedTexts?: string[]
// ) {
// const keysData = { apiKey: openaiKey } as any;
// const embeddings = new OpenAIEmbeddings(
//   Object.assign({ model: "text-embedding-ada-002" }, keysData)
// );

// const indexInstance = new LocalDocumentIndex({
//   indexName: indexName,
//   apiKey: apiKey,
//   embeddings,
//   chunkingConfig: {
//     chunkSize: chunkSize,
//   },
// });

//   const webFetcher = new WebFetcher();
//   let ids: any[] = [];
//   for (let i = 0; i < uris.length; i++) {
//     const uri = uris[i];
//     let documentResult;

//     try {
//       if (decryptedTexts) {
//           const decryptedText = decryptedTexts[i];
//           documentResult  = await indexInstance.upsertDocument(
//           uri,
//           decryptedText,
//           "text/plain"
//         );
//         ids.push(documentResult.id);
//         console.log(Colorize.replaceLine(Colorize.success(`added ${uri}`)));
//       } else{
//         console.log(Colorize.progress(`fetching ${uri}`));
//         const fetcher = webFetcher;
//         await fetcher.fetch(uri, async (uri, text, docType) => {
//           console.log(Colorize.replaceLine(Colorize.progress(`indexing ${uri}`)));
//            documentResult = await indexInstance.upsertDocument(
//             uri,
//             text,
//             docType
//           );
//           ids.push(documentResult.id);
//           console.log(Colorize.replaceLine(Colorize.success(`added ${uri}`)));
//           return true;
//         });
//       }
//       return { uris, ids };

//     } catch (err: unknown) {
//       console.log(
//         Colorize.replaceLine(
//           Colorize.error(`Error adding: ${uri}\n${(err as Error).message}`)
//         )
//       );
//     }
//   }
// }

export async function addDocuments(
  indexName: string,
  apiKey: string,
  agent: string,
  uris: string[],
  chunkSize: number,
  decryptedTexts?: string[]
) {
  console.log("logged key", apiKey);
  const embeddings = new OpenAIEmbeddings({
    apiKey: openaiKey as string,
    model: "text-embedding-ada-002",
    logRequests: true,
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  const loadIsCatalog = async () => {
    if (!agent) {
      console.log("no agent submitted");
      return true;
    }
    try {
      const agentContract = {
        address: getAddress(agent),
        abi: agentABI,
      };
      const value: any = await publicClient.readContract({
        ...agentContract,
        functionName: "getIndexInfo",
      });
      if (value[1] < 0) {
        return false;
      }
      return true;
    } catch (err: unknown) {
      return false;
    }
  };

  const getDocumentID = async (uri: string) => {
    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const result: any = await publicClient.readContract({
        address: agent as `0x${string}`,
        abi: agentABI,
        functionName: "getDocumentCIDByURI",
        args: [uri],
      });

      return result;
    } catch (e) {
      console.log(e);
    }

    return undefined;
  };

  const getDocumentUri = async (documentId: string) => {
    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const result: any = await publicClient.readContract({
        address: agent as `0x${string}`,
        abi: agentABI,
        functionName: "getURIByDocumentCID",
        args: [documentId],
      });
      return result;
    } catch (e) {
      console.log(e);
    }
  };

  const isCatalog = await loadIsCatalog();

  const indexInstance = new LocalDocumentIndex({
    indexName: indexName,
    apiKey: apiKey,
    agent: "0x5D75A8d20ddDA716e716ff2a138c06727365d247",
    embeddings,
    isCatalog: isCatalog,
    _getDocumentId: getDocumentID,
    _getDoumentUri: getDocumentUri,
    chunkingConfig: {
      chunkSize: chunkSize,
    },
  });

  // const webFetcher = new WebFetcher();
  let ids: any[] = [];

  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i];
    let documentResult;

    try {
      if (decryptedTexts) {
        const decryptedText = decryptedTexts[i];
        documentResult = await indexInstance.upsertDocument(
          uri,
          decryptedText,
          "text/plain"
        );
        ids.push(documentResult.id);
        console.log(Colorize.replaceLine(Colorize.success(`added ${uri}`)));
      }

      // else {
      //   console.log(Colorize.progress(`fetching ${uri}`));
      //   const fetcher = webFetcher;
      //   await fetcher.fetch(uri, async (uri, text, docType) => {
      //     console.log(
      //       Colorize.replaceLine(Colorize.progress(`indexing ${uri}`))
      //     );
      //     documentResult = await indexInstance.upsertDocument(
      //       uri,
      //       text,
      //       docType
      //     );
      //     ids.push(documentResult.id);
      //     console.log(Colorize.replaceLine(Colorize.success(`added ${uri}`)));
      //     return true;
      //   });
      // }
    } catch (err: unknown) {
      console.log(
        Colorize.replaceLine(
          Colorize.error(`Error adding: ${uri}\n${(err as Error).message}`)
        )
      );
    }
  }

  return { uris, ids };
}

export async function queryIndex(
  indexName: string,
  agent: string,
  apiKey: string,
  query: string,
  documentCount: number,
  chunkCount: number,
  sectionCount: number,
  tokens: number,
  format: string,
  overlap: boolean
) {
  // Initialize an array to store the results
  const queryResults = [];

  const embeddings = new OpenAIEmbeddings({
    apiKey: openaiKey as string,
    model: "text-embedding-ada-002",
    logRequests: true,
  });

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(
      "https://sepolia.infura.io/v3/88044f5fa1d74542ab084ecb6c49e531"
    ),
  });

  const loadIsCatalog = async () => {
    if (!agent) {
      console.log("no agent submitted");
      return true;
    }
    try {
      const agentContract = {
        address: getAddress(agent),
        abi: agentABI,
      };
      const value: any = await publicClient.readContract({
        ...agentContract,
        functionName: "getIndexInfo",
      });
      if (value[1] < 0) {
        return false;
      }
      return true;
    } catch (err: unknown) {
      return false;
    }
  };

  const getDocumentID = async (uri: string) => {
    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const result: any = await publicClient.readContract({
        address: agent as `0x${string}`,
        abi: agentABI,
        functionName: "getDocumentCIDByURI",
        args: [uri],
      });

      return result;
    } catch (e) {
      console.log(e);
    }

    return undefined;
  };

  const getDocumentUri = async (documentId: string) => {
    try {
      const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const result: any = await publicClient.readContract({
        address: agent as `0x${string}`,
        abi: agentABI,
        functionName: "getURIByDocumentCID",
        args: [documentId],
      });
      return result;
    } catch (e) {
      console.log(e);
    }
  };

  const isCatalog = await loadIsCatalog();

  // Initialize index

  const indexInstance = new LocalDocumentIndex({
    indexName: indexName,
    apiKey: apiKey,
    agent: "0x5D75A8d20ddDA716e716ff2a138c06727365d247",
    embeddings,
    isCatalog: isCatalog,
    _getDocumentId: getDocumentID,
    _getDoumentUri: getDocumentUri,
  });

  // Query index
  const results = await indexInstance.queryDocuments(query, {
    maxDocuments: documentCount,
    maxChunks: chunkCount,
  });

  // Process each result
  for (const result of results) {
    const resultObj: any = {
      uri: result.uri,
      score: result.score,
      chunks: result.chunks.length,
      sections: [],
    };

    // Render sections if format is "sections"
    if (format === "sections") {
      const sections = await result.renderSections(
        tokens,
        sectionCount,
        overlap
      );
      resultObj.sections = sections.map((section, index) => ({
        title: sectionCount === 1 ? "Section" : `Section ${index + 1}`,
        score: section.score,
        tokens: section.tokenCount,
        text: section.text,
      }));
    }

    queryResults.push(resultObj);
  }

  return queryResults;
}
