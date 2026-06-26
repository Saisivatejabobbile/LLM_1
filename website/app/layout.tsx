import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SLM Forge — Fine-Tune AI Models Without Code",
  description:
    "The world's most powerful no-code platform for fine-tuning small language models. Train Phi-3, Gemma, Llama, and more using LoRA/QLoRA — no ML expertise required.",
  keywords: [
    "fine-tuning",
    "LLM",
    "small language models",
    "LoRA",
    "QLoRA",
    "AI platform",
    "no-code AI",
    "Phi-3",
    "Gemma",
    "Llama",
  ],
  authors: [{ name: "SLM Forge Team" }],
  openGraph: {
    title: "SLM Forge — Fine-Tune AI Models Without Code",
    description: "Train powerful AI models on your domain data. Export to Ollama in one click.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-[#0B1120] text-slate-100 selection:bg-violet-500/30 selection:text-violet-200`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
