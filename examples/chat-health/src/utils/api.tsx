

export async function callVectorDBQAChain(
  query: string,
  index: any,
  messages: any[] | any
) {
  const requestBody = {
    query: query,
    index: index,
    messages: messages,
  };

  try {
    const url = process.env.NEXT_PUBLIC_VECTOR_SEARCH_URL as string;
    const vectorSearchResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!vectorSearchResponse.ok) {
      throw new Error("Failed to fetch from vector-search");
    }

    const result = await vectorSearchResponse.json();
    return result;
  } catch (error) {
    console.error(error);
  }
}

export const insertPromptResponse = async (
  userID: string, //collection name instead
  humanMessage: string,
  aiMessage: string
) => {
  const doc = {
    collection: "demo",
    doc: {
      key: `${userID}-${new Date().getTime()}`,
      data: {
        human_message: humanMessage,
        ai_message: aiMessage,
      },
    },
  };

  //we'll add this to localhost storage
  return doc;
};

//conversation history
export const listUserDocs = async (userID: string): Promise<any> => {
  try {
    const responsePairs: any = [];

    //retrieve from localost

    const myList: any =  {
      collection: "demo",
      filter: {
        order: {
          desc: false,
          field: "updated_at",
        },
      },

    }
  
    //   myList.items.filter((item) => item.key.startsWith(`${userID}-`));

  myList.forEach((doc: any) => {
      const { human_message, ai_message } = doc.data;
      responsePairs.push({ human_message, ai_message });
    });

    return responsePairs;
  } catch (error) {
    console.error("Error listing user docs:", error);
    return [];
  }
};
