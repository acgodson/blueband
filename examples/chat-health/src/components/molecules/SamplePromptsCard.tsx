import Image from "next/image";

const SamplePromptsCard = (card: { title: string; body: string }) => {
  return (
    <div className=" flex flex-col gap-1 rounded-[20px] border-[0.1px] border-[#f4e8c9] p-4 w-min min-w-[20rem] shadow-[0_0_50px_7px_rgba(0,0,0,0.05)] bg-white">


      <div className="flex  gap-2 items-start">
        <Image
          src="/chat.svg"
          width="30"
          height="30"
          priority
          alt="Chat Icon"
        />
        <p className="text-lg text-[#feca7e] font-semibold font-outfit">
          {card.title}
        </p>

      </div>

      <p className=" text-[#4C505F]">{card.body}</p>
    </div>
  );
};

export default SamplePromptsCard;
