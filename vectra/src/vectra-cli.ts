// vectra-cli.ts

import fs from "fs";
import { LocalDocumentIndex } from "./LocalDocumentIndex";
import { WebFetcher } from "./WebFetcher";
import { OpenAIEmbeddings } from "./OpenAIEmbeddings";
import { Colorize } from "./internals";

//TODO: use index to update the catalog later
export async function createIndex(index: string, apiKey: string) {
  const indexInstance = new LocalDocumentIndex({
    apiKey: apiKey,
  });
  console.log(Colorize.output(`creating index on lightlink`));
  await indexInstance.createIndex({
    version: 1,
    deleteIfExists: true,
    apiKey: apiKey,
  });
}

export async function deleteIndex(index: string) {
  const folderPath = index;
  console.log(Colorize.output(`deleting index at ${folderPath}`));
  // const indexInstance = new LocalDocumentIndex({ folderPath });
  // await indexInstance.deleteIndex();
}

export async function addDocuments(
  indexName: string,
  apiKey: string,
  keys: string,
  uris: string[],
  chunkSize: number
) {
  console.log("Adding Web Pages to Index");
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
  for (const uri of uris) {
    console.log(uri);
    try {
      console.log(Colorize.progress(`fetching ${uri}`));
      const fetcher = webFetcher;
      await fetcher.fetch(uri, async (uri, text, docType) => {
        console.log(Colorize.replaceLine(Colorize.progress(`indexing ${uri}`)));

        await indexInstance.upsertDocument(uri, text, docType);
        console.log(Colorize.replaceLine(Colorize.success(`added ${uri}`)));
        return true;
      });
    } catch (err: unknown) {
      console.log(
        Colorize.replaceLine(
          Colorize.error(`Error adding: ${uri}\n${(err as Error).message}`)
        )
      );
    }
  }
}

export async function removeDocuments(
  index: string,
  apiKey: string,
  list: string,
  uris: string[]
) {
  const folderPath = index;
  const indexInstance = new LocalDocumentIndex({
    apiKey: apiKey,
  });
  // Remove documents
  for (const uri of uris) {
    console.log(`removing ${uri}`);
    await indexInstance.deleteDocument(uri);
  }
  await updateURIFile(list, uris);
}

// Function to update the file containing the URIs after deleting documents
async function updateURIFile(uriFile: string, urisToDelete: string[]) {
  try {
    let uriContents = await fs.readFileSync(uriFile, "utf-8");
    for (const uri of urisToDelete) {
      //   uriContents = uriContents.replace(`${uri}\n`, "");
    }
    await fs.writeFileSync(uriFile, uriContents);
    console.log("URI file updated successfully.");
  } catch (error) {
    console.error(`Error updating URI file: ${error}`);
  }
}

export async function getIndexStats(index: string, apiKey: string) {
  const indexInstance = new LocalDocumentIndex({ apiKey });
  const stats = await indexInstance.getCatalogStats();
  console.log(Colorize.title("Index Stats"));
  console.log(Colorize.output(stats));
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

  // return indexInstance;

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
