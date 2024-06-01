"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryIndex = exports.addDocuments = exports.createIndex = void 0;
const LocalDocumentIndex_1 = require("./LocalDocumentIndex");
const OpenAIEmbeddings_1 = require("./OpenAIEmbeddings");
const internals_1 = require("./internals");
const viem_1 = require("viem");
const dotenv_1 = __importDefault(require("dotenv"));
const chains_1 = require("viem/chains");
dotenv_1.default.config();
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
function createIndex(apiKey, client) {
    return __awaiter(this, void 0, void 0, function* () {
        const publicClient = (0, viem_1.createPublicClient)({
            chain: chains_1.sepolia,
            transport: (0, viem_1.http)("https://sepolia.infura.io/v3/88044f5fa1d74542ab084ecb6c49e531"),
        });
        const indexInstance = new LocalDocumentIndex_1.LocalDocumentIndex({
            agent: "",
            apiKey: apiKey,
        });
        console.log(internals_1.Colorize.output(`creating index on lightHouse`));
        const newIndex = yield indexInstance.createIndex({
            version: 1,
            deleteIfExists: true,
            apiKey: apiKey,
        });
        if (newIndex) {
            return newIndex;
        }
    });
}
exports.createIndex = createIndex;
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
function addDocuments(indexName, apiKey, agent, uris, chunkSize, decryptedTexts) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("logged key", apiKey);
        const embeddings = new OpenAIEmbeddings_1.OpenAIEmbeddings({
            apiKey: openaiKey,
            model: "text-embedding-ada-002",
            logRequests: true,
        });
        const publicClient = (0, viem_1.createPublicClient)({
            chain: chains_1.sepolia,
            transport: (0, viem_1.http)(),
        });
        const loadIsCatalog = () => __awaiter(this, void 0, void 0, function* () {
            if (!agent) {
                console.log("no agent submitted");
                return true;
            }
            try {
                const agentContract = {
                    address: (0, viem_1.getAddress)(agent),
                    abi: agentABI,
                };
                const value = yield publicClient.readContract(Object.assign(Object.assign({}, agentContract), { functionName: "getIndexInfo" }));
                if (value[1] < 0) {
                    return false;
                }
                return true;
            }
            catch (err) {
                return false;
            }
        });
        const getDocumentID = (uri) => __awaiter(this, void 0, void 0, function* () {
            try {
                const publicClient = (0, viem_1.createPublicClient)({
                    chain: chains_1.sepolia,
                    transport: (0, viem_1.http)(),
                });
                const result = yield publicClient.readContract({
                    address: agent,
                    abi: agentABI,
                    functionName: "getDocumentCIDByURI",
                    args: [uri],
                });
                return result;
            }
            catch (e) {
                console.log(e);
            }
            return undefined;
        });
        const getDocumentUri = (documentId) => __awaiter(this, void 0, void 0, function* () {
            try {
                const publicClient = (0, viem_1.createPublicClient)({
                    chain: chains_1.sepolia,
                    transport: (0, viem_1.http)(),
                });
                const result = yield publicClient.readContract({
                    address: agent,
                    abi: agentABI,
                    functionName: "getURIByDocumentCID",
                    args: [documentId],
                });
                return result;
            }
            catch (e) {
                console.log(e);
            }
        });
        const isCatalog = yield loadIsCatalog();
        const indexInstance = new LocalDocumentIndex_1.LocalDocumentIndex({
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
        let ids = [];
        for (let i = 0; i < uris.length; i++) {
            const uri = uris[i];
            let documentResult;
            try {
                if (decryptedTexts) {
                    const decryptedText = decryptedTexts[i];
                    documentResult = yield indexInstance.upsertDocument(uri, decryptedText, "text/plain");
                    ids.push(documentResult.id);
                    console.log(internals_1.Colorize.replaceLine(internals_1.Colorize.success(`added ${uri}`)));
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
            }
            catch (err) {
                console.log(internals_1.Colorize.replaceLine(internals_1.Colorize.error(`Error adding: ${uri}\n${err.message}`)));
            }
        }
        return { uris, ids };
    });
}
exports.addDocuments = addDocuments;
function queryIndex(indexName, agent, apiKey, query, documentCount, chunkCount, sectionCount, tokens, format, overlap) {
    return __awaiter(this, void 0, void 0, function* () {
        // Initialize an array to store the results
        const queryResults = [];
        const embeddings = new OpenAIEmbeddings_1.OpenAIEmbeddings({
            apiKey: openaiKey,
            model: "text-embedding-ada-002",
            logRequests: true,
        });
        const publicClient = (0, viem_1.createPublicClient)({
            chain: chains_1.sepolia,
            transport: (0, viem_1.http)("https://sepolia.infura.io/v3/88044f5fa1d74542ab084ecb6c49e531"),
        });
        const loadIsCatalog = () => __awaiter(this, void 0, void 0, function* () {
            if (!agent) {
                console.log("no agent submitted");
                return true;
            }
            try {
                const agentContract = {
                    address: (0, viem_1.getAddress)(agent),
                    abi: agentABI,
                };
                const value = yield publicClient.readContract(Object.assign(Object.assign({}, agentContract), { functionName: "getIndexInfo" }));
                if (value[1] < 0) {
                    return false;
                }
                return true;
            }
            catch (err) {
                return false;
            }
        });
        const getDocumentID = (uri) => __awaiter(this, void 0, void 0, function* () {
            try {
                const publicClient = (0, viem_1.createPublicClient)({
                    chain: chains_1.sepolia,
                    transport: (0, viem_1.http)(),
                });
                const result = yield publicClient.readContract({
                    address: agent,
                    abi: agentABI,
                    functionName: "getDocumentCIDByURI",
                    args: [uri],
                });
                return result;
            }
            catch (e) {
                console.log(e);
            }
            return undefined;
        });
        const getDocumentUri = (documentId) => __awaiter(this, void 0, void 0, function* () {
            try {
                const publicClient = (0, viem_1.createPublicClient)({
                    chain: chains_1.sepolia,
                    transport: (0, viem_1.http)(),
                });
                const result = yield publicClient.readContract({
                    address: agent,
                    abi: agentABI,
                    functionName: "getURIByDocumentCID",
                    args: [documentId],
                });
                return result;
            }
            catch (e) {
                console.log(e);
            }
        });
        const isCatalog = yield loadIsCatalog();
        // Initialize index
        const indexInstance = new LocalDocumentIndex_1.LocalDocumentIndex({
            indexName: indexName,
            apiKey: apiKey,
            agent: "0x5D75A8d20ddDA716e716ff2a138c06727365d247",
            embeddings,
            isCatalog: isCatalog,
            _getDocumentId: getDocumentID,
            _getDoumentUri: getDocumentUri,
        });
        // Query index
        const results = yield indexInstance.queryDocuments(query, {
            maxDocuments: documentCount,
            maxChunks: chunkCount,
        });
        // Process each result
        for (const result of results) {
            const resultObj = {
                uri: result.uri,
                score: result.score,
                chunks: result.chunks.length,
                sections: [],
            };
            // Render sections if format is "sections"
            if (format === "sections") {
                const sections = yield result.renderSections(tokens, sectionCount, overlap);
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
    });
}
exports.queryIndex = queryIndex;
