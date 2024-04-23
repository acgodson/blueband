import fs from "fs";
import { createIndex, addDocuments, queryIndex } from "vector-db";
import {
  defineChain,
  getContract,
  createPublicClient,
  http,
  createWalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";
import dotenv from "dotenv";

dotenv.config();

const chianId = process.env.CHAIN_ID;
const privateKey = process.env.PRIVATE_KEY;
const apiKey = process.env.LIGHTHOUSE_API_KEY;
const BluebandAddress = process.env.BLUEBAND_CONTRACT;

const localhostChain = defineChain({
  ...localhost,
  id: parseInt(chianId),
  url: "http://localhost:8545",
});

const callWriteContract = async (walletClient, abi, functionName, args) => {
  // define  IPC chain
  const localhostChain = defineChain({
    ...localhost,
    id: parseInt(chianId),
    url: "http://localhost:8545/",
  });

  try {
    const transaction = await walletClient.writeContract({
      abi,
      address: BluebandAddress,
      functionName,
      args,
      account: privateKeyToAccount(privateKey),
    });
    console.log("Catalog saved to smart contract", transaction);
  } catch (error) {
    console.error("Error saving catalog to smart contract:", error);
    throw error;
  }
};

describe("Blueband Vector-db", function () {
  let indexName;
  let client;
  let abi;
  let catalog;

  before(async function () {
    client = createWalletClient({
      chain: localhostChain,
      transport: http(),
      account: privateKeyToAccount(privateKey),
    });

    const abiPath = "utils/contract.json";
    const json = fs.readFileSync(abiPath, "utf-8");
    abi = JSON.parse(json).abi;
  });

  describe("createIndex", async function () {
    it("should create an empty index", async function () {
      const result = await createIndex(apiKey, client);
      if (result) {
        indexName = result.ipnsId;
      }
    }).timeout(25000);

    it("should save index catalog on IPC subnet", async function () {
      // const accounts = await client.getAddresses();
      // const account = accounts[0];
      const transaction = await callWriteContract(client, abi, "createIndex", [
        indexName,
      ]);
      console.log("transaction successful:", transaction);
    }).timeout(25000);

    it("should retrieve index IPNS from IPC subnet", async function () {
      const localhostChain = defineChain({
        ...localhost,
        id: parseInt(chianId),
        url: "http://localhost:8545",
      });

      const publicClient = createPublicClient({
        chain: localhostChain,
        transport: http(),
      });

      const accounts = await client.getAddresses();
      const account = accounts[0];
      const data = await publicClient.readContract({
        address: BluebandAddress,
        abi: abi,
        functionName: "getOwnersIndexes",
        args: [account],
      });

      indexName = data[data.length - 1];
      console.log(indexName);
    }).timeout(25000);
  });

  describe("addDocument", async function () {
    it("should upsert new documents and save catalog on subnet", async function () {
      const listFilePath = "docs/wikipedia/wikipedia.txt";
      const chunkSize = 512;
      const uris = fs.readFileSync(listFilePath, "utf-8");
      const uriList = uris
        .split("\n")
        .map((uri) => uri.trim())
        .filter((uri) => uri.length > 0);
      try {
        const catalogResult = await addDocuments(
          indexName,
          apiKey,
          uriList,
          chunkSize
        );
        console.log(catalogResult);
        if (catalogResult) {
          catalog = catalogResult;
          for (let i = 0; i < catalog.uris.length; i++) {
            try {
              const transaction = await client.writeContract({
                abi,
                address: BluebandAddress,
                functionName: "addDocument",
                args: [indexName, catalog.uris[i], catalog.ids[i]],
                account: privateKeyToAccount(privateKey),
              });
              console.log("Catalog registered in smart contract:", transaction);
            } catch (error) {
              console.error(
                "Error registering document in smart contract:",
                error
              );
              throw error;
            }
          }
        }
      } catch (e) {
        console.log(e);
      }
    }).timeout(120000);
  });

  describe("queryIndex", async function () {
    it("should return relevant documents for a given query", async function () {
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
          documentCount,
          chunkCount,
          sectionCount,
          tokens,
          format,
          overlap
        );

        console.log("result", result[0].sections);
      } catch (error) {
        console.error("Error querying index:", error);
      }
    }).timeout(500000);
  });
});
