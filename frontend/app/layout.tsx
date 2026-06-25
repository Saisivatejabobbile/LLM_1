import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export const metadata: Metadata = {
  title: 'SLM Forge — Fine-tune Small Language Models',
  description:
    'SLM Forge is a premium platform for fine-tuning small language models with LoRA/QLoRA. Upload datasets, configure training, evaluate and deploy — all in one stunning UI.',
  keywords: 'LLM fine-tuning, LoRA, QLoRA, small language models, AI training, Ollama, HuggingFace',
  openGraph: {
    title: 'SLM Forge',
    description: 'Fine-tune Small Language Models with ease',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-text antialiased" suppressHydrationWarning>
        <TooltipProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
