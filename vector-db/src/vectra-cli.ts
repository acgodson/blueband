// vectra-cli.ts

import fs from "fs";
import { LocalDocumentIndex } from "./LocalDocumentIndex";
import { WebFetcher } from "./WebFetcher";
import { OpenAIEmbeddings } from "./OpenAIEmbeddings";
import { Colorize } from "./internals";
import { WalletClient } from "viem";
// import lighthouse from "@lighthouse-web3/sdk";

//TODO: use index to update the catalog later
export async function createIndex(apiKey: string, client: WalletClient) {
  const indexInstance = new LocalDocumentIndex({
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

export async function addDocuments(
  indexName: string,
  apiKey: string,
  keys: string,
  uris: string[],
  chunkSize: number
) {
  const keysData = JSON.parse(await fs.readFileSync(keys, "utf-8"));
  const embeddings = new OpenAIEmbeddings(
    Object.assign({ model: "text-embedding-ada-002" }, keysData)
  );

  const indexInstance = new LocalDocumentIndex({
    indexName: indexName,
    apiKey: apiKey,
    embeddings,
    chunkingConfig: {
      chunkSize: chunkSize,
    },
  });

  const webFetcher = new WebFetcher();
  let ids: any[] = [];
  for (const uri of uris) {
    try {
      console.log(Colorize.progress(`fetching ${uri}`));
      const fetcher = webFetcher;
      await fetcher.fetch(uri, async (uri, text, docType) => {
        console.log(Colorize.replaceLine(Colorize.progress(`indexing ${uri}`)));

        const documentResult = await indexInstance.upsertDocument(
          uri,
          text,
          docType
        );
        ids.push(documentResult.id);
        console.log(Colorize.replaceLine(Colorize.success(`added ${uri}`)));
        return true;
      });
      return { uris, ids };
    } catch (err: unknown) {
      console.log(
        Colorize.replaceLine(
          Colorize.error(`Error adding: ${uri}\n${(err as Error).message}`)
        )
      );
    }
  }
}

export async function queryIndex(
  indexName: string,
  apiKey: string,
  query: string,
  keys: string,
  documentCount: number,
  chunkCount: number,
  sectionCount: number,
  tokens: number,
  format: string,
  overlap: boolean
) {
  // Initialize an array to store the results
  const queryResults = [];

  // Create embeddings
  const keysData = JSON.parse(await fs.readFileSync(keys, "utf-8"));
  const embeddings = new OpenAIEmbeddings(
    Object.assign({ model: "text-embedding-ada-002" }, keysData)
  );

  // Initialize index
  const indexInstance = new LocalDocumentIndex({
    indexName: indexName,
    apiKey,
    embeddings,
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

export async function deleteIndex(index: string) {}

export async function removeDocuments(
  index: string,
  apiKey: string,
  list: string,
  uris: string[]
) {}

export async function getIndexStats(index: string, apiKey: string) {}

// const deleteAllLightHouseIndex = async (apiKey: string) => {
//   const allKeys = await lighthouse.getAllKeys(apiKey);
//   const data = allKeys.data;
//   for (let i = 0; i < data.length; i++) {
//     const element = data[i];
//     const removeRes = await lighthouse.removeKey(element.ipnsName, apiKey);
//     console.log(removeRes.data);
//   }
// };
