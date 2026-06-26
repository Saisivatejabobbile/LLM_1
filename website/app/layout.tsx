import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "SLM Forge — Fine-Tune Small Language Models Without Code",
  description:
    "Train Phi-3, Gemma 2, Llama 3.2, Mistral 7B and Qwen2.5 on your domain data using LoRA/QLoRA. Export GGUF models for Ollama in one click — no ML expertise required.",
  keywords: ["LLM fine-tuning", "LoRA", "QLoRA", "Ollama", "no-code AI", "Phi-3", "Llama", "Gemma"],
  metadataBase: new URL("https://slmforge.ai"),
  openGraph: {
    title: "SLM Forge — Fine-Tune AI Without Code",
    description: "The no-code platform for domain-specific AI fine-tuning.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
