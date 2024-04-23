import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { NextApiRequest, NextApiResponse } from "next";
import { prompt } from "../../utils/consts";

const openAIApiKey = process.env.OPENAI_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: openAIApiKey,
  });

  const llm = new OpenAI({
    openAIApiKey: openAIApiKey as string,
  });
  const returnedResults = 1;
  const embeddedQuery = await embedQuery(req.body.query, embeddings);

  const docs = await similarityVectorSearch(
    embeddedQuery,
    returnedResults,
    req.body.index
  );

  const messages = req.body.messages;

  let mappedMessages: any = [];

  messages.forEach((message: any, index: number) => {
    if (messages.length > 1 && index !== messages.length - 1) {
      if ("human_message" in message) {
        mappedMessages.push(new HumanMessage(message.human_message));
      }
      if ("ai_message" in message) {
        mappedMessages.push(new AIMessage(message.ai_message));
      }
    }
  });

  mappedMessages.push(new HumanMessage(req.body.query));

  // console.log(mappedMessages);

  const chain = prompt.pipe(llm);
  const result = await chain.invoke({
    input_documents: docs,
    messages: mappedMessages,
    userPrompt: req.body.query,
  });
  console.log("result", result);
  res.status(200).json(result);
}

async function embedQuery(
  query: string,
  embeddings: OpenAIEmbeddings
): Promise<number[]> {
  const embeddedQuery = await embeddings.embedQuery(query);
  return embeddedQuery;
}

async function similarityVectorSearch(
  vectorQuery: number[],
  k = 1,
  indexx: any
): Promise<Document[]> {
  //send query to local-subnet
  const result: [Document, number][] = [];
  // result.push([new Document({ metadata, pageContent }), res.score]);
  return result.map((result) => result[0]);
}
