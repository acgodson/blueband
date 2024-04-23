import Image from "next/image";
import { useEffect, useState } from "react";

import { CommentCard, SamplePromptsCard } from "@/components/molecules/";
import Nav from "@/components/organisms/Nav";
import { useChatHook } from "@/hooks/useChat";
import { isEmpty } from "@/utils";
// import { listUserDocs } from "@/utils/api";
import TextareaAutosize from "react-textarea-autosize";
import { BiSend } from "react-icons/bi";
import { useRouter } from "next/router";

const explorer = () => {
  const [bodyText, setBodyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [responsePair, setResponsePair] = useState<any>([]);
  const router = useRouter();
  const { tempPairs, value, responding, setValue, askQuestion } =
    useChatHook(responsePair);

  useEffect(() => {
    const loadResponsePair = async () => {
      setLoading(true);
      const responsePairs: any = ""; // or from localhost storage;
      if (responsePairs && responsePairs.length > 0) {
        setResponsePair(responsePairs);
      }
      setLoading(false);
    };
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full">
      <Nav />

      <div className="flex">
        <div className="flex-1 flex flex-col gap-4 items-center px-8 pb-60 ">
          {isEmpty(tempPairs) ? (
            <div className="flex flex-col gap-8 items-center mt-24 max-w-[48.5rem]">
              {/* 194237 */}
              <p className="max-w-prose text-balance text-center font-bellota text-sm font-bold text-[brown]">
                connecting to remote local-subnet...
                <br />
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <div
                // style={{
                //   cursor: "pointer",
                // }}
                >
                  <SamplePromptsCard
                    title={"Chat-Health Demo"}
                    body={"Enugu State Health Policy Document"}
                  />
                </div>
              </div>
            </div>
          ) : (
            tempPairs.map((pair: any, index: number) => {
              return (
                <div
                  className={"flex w-full my-8 gap-8  max-w-[48.5rem] flex-col"}
                  key={index}
                >
                  <ChatBubble name="You" message={pair.human_message} isUser />
                  {pair.ai_message ? (
                    <ChatBubble name="Health AI" message={pair.ai_message} />
                  ) : (
                    // <div>loading</div>
                    <ChatBubble name="Health AI" message={undefined} />
                  )}
                </div>
              );
            })
          )}

          <div className=" flex flex-col justify-end gap-4 bg-white p-4 fixed bottom-4 max-w-[48.5rem] w-full h-min rounded-[20px] shadow-[0_0_50px_7px_rgba(0,0,0,0.08)]">
            <div className="w-full bg-white p-3 rounded shadow-[0_0_50px_7px_rgba(0,0,0,0.08)]">
              <div className="relative">
                <TextareaAutosize
                  maxRows={4}
                  style={{
                    background: "transparent",
                    width: "100%",
                    outline: "none",
                  }}
                  placeholder="Ask me anything about the document..."
                  value={value}
                  onChange={(e) => {
                    setBodyText(e.target.value);
                    setValue(e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="flex justify-between align-center">
              <div
                className="h-min bg-[green] px-[18px] py-1 rounded-3xl text-white grid place-items-center cursor-pointer"
                onClick={() => {
                  setBodyText("");
                  askQuestion();
                }}
              >
                <BiSend
                  onClick={() => {
                    setBodyText("");
                    askQuestion();
                  }}
                  color="white"
                  size={32}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatBubble = (chat: {
  name: string;
  message: string | undefined;
  isUser?: boolean;
}) => {
  return (
    <div className=" flex w-full gap-2 pr-5 ">
      <div className="w-12 h-12 p-6  max-w-[70px] max-h-[70px]  overflow-hidden rounded-full relative">
        <Image
          src={chat.isUser ? "/icon.png" : "/icon.png"}
          style={{
            objectFit: "cover",
            zIndex: -1,
            background: "white",
            backgroundRepeat: "no-repeat",
            backgroundSize: "80%",
            backgroundPosition: "center center",
            backgroundColor: "white",
            filter: !chat.isUser ? "none" : "grayscale(100%)",
          }}
          fill
          priority
          alt={`something`}
        />
      </div>

      <CommentCard
        name={chat.name}
        message={chat.message}
        isUser={chat.isUser}
      />
    </div>
  );
};

export default explorer;
