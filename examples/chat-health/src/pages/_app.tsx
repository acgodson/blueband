import "@/styles/globals.css";
import { cn } from "@/utils";
import type { AppProps } from "next/app";

import { Bellota_Text, Inter, Outfit } from "next/font/google";

const bellota_text = Bellota_Text({
  subsets: ["latin"],
  weight: "400",
  preload: true,
  variable: "--font-bellota-text",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "700"],
  preload: true,
  variable: "--font-outfit",
});

const inter = Inter({ subsets: ["latin"], preload: true });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div
      className={cn(bellota_text.variable, outfit.variable, inter.className)}
    >
      <Component {...pageProps} />
    </div>
  );
}
