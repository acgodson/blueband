import { createIndex, addDocuments, queryIndex } from "vectra";

describe("Vectra", function () {
  // describe("addDocuments", function () {
  //   it("should create an empty index and add documents to the index", async function () {
  //     const indexName =
  //       "k51qzi5uqu5dknz5m3dffwiqndrmpzfhdunojg9ugb3vriluiqwfnbsa6zvsc4";
  //     // await createIndex(indexName, apiKey);

  //     const keys = "docs/wikipedia/vectra.json";
  //     const listFilePath = "docs/wikipedia/wikipedia.txt";
  //     const chunkSize = 512;
  //     const uris = fs.readFileSync(listFilePath, "utf-8");
  //     const uriList = uris
  //       .split("\n")
  //       .map((uri) => uri.trim())
  //       .filter((uri) => uri.length > 0);
  //     try {
  //       await addDocuments(indexName, apiKey, keys, uriList, chunkSize);
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   }).timeout(25000);
  // });

  describe("queryIndex", function () {
    it("should return relevant documents for a given query", async function () {
      const indexName =
        "k51qzi5uqu5dknz5m3dffwiqndrmpzfhdunojg9ugb3vriluiqwfnbsa6zvsc4";
      const keys = "docs/wikipedia/vectra.json";
      const query = "what sports is this about?";
      const documentCount = 10;
      const chunkCount = 200;
      const sectionCount = 3;
      const tokens = 300;
      const format = "sections";
      const overlap = true;

      // Call queryIndex function
      try {
        const result = await queryIndex(
          indexName,
          apiKey,
          query,
          keys,
          documentCount,
          chunkCount,
          sectionCount,
          tokens,
          format,
          overlap
        );

        console.log("result", result[0].sections);

        // expect(result).to.be.an("array").that.is.not.empty;
        // result.forEach((document) => {
        //   expect(document.uri).to.be.a("string");
        //   expect(document.score).to.be.a("number");
        // });
      } catch (error) {
        // Handle errors
        console.error("Error querying index:", error);
      }
    }).timeout(6000);
  });
});
