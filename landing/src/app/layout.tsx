import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://weave.sundaramsingh.com"),
  title: {
    default: "Arclet — Deterministic AI Agent Runtime for TypeScript",
    template: "%s | Arclet",
  },
  description:
    "A deterministic runtime for LLM agents in TypeScript — typed tools with Zod, multi-provider fallback (OpenAI, Claude, Gemini), state machines, and non-bypassable guardrails.",
  keywords: [
    "Arclet",
    "AI Agent SDK",
    "TypeScript AI Agent",
    "Deterministic AI Agent",
    "LLM Runtime",
    "LangChain Alternative TypeScript",
    "Multi-Provider LLM Fallback",
    "AI Guardrails",
    "Agent State Machine",
    "arclet"
  ],
  authors: [{ name: "Arclet Team", url: "https://weave.sundaramsingh.com" }],
  creator: "Arclet Team",
  publisher: "Arclet",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://weave.sundaramsingh.com",
    siteName: "Arclet",
    title: "Arclet — Deterministic AI Agent Runtime for TypeScript",
    description:
      "A deterministic runtime for LLM agents in TypeScript. Built with a strict finite state machine, ports & adapters architecture, multi-tier cognitive memory, and non-bypassable guardrails.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arclet — Deterministic AI Agent Runtime for TypeScript",
    description:
      "A deterministic runtime for LLM agents in TypeScript. Built with a strict finite state machine, ports & adapters architecture, multi-tier cognitive memory, and non-bypassable guardrails.",
    creator: "@arclet_ai",
  },
  alternates: {
    canonical: "https://weave.sundaramsingh.com",
    types: {
      "text/plain": "https://weave.sundaramsingh.com/llms.txt",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Arclet",
  "operatingSystem": "Cross-platform",
  "applicationCategory": "DeveloperApplication",
  "programmingLanguage": "TypeScript",
  "description":
    "Deterministic runtime for LLM agents in TypeScript — typed tools, provider fallback, state machine, and guardrails.",
  "url": "https://weave.sundaramsingh.com",
  "downloadUrl": "https://www.npmjs.com/package/arclet",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "author": {
    "@type": "Organization",
    "name": "Arclet",
    "url": "https://weave.sundaramsingh.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
