import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://formatflow.n178ths.chatgpt.site"),
  title: "FormatFlow — Free Private File Converter",
  description: "Convert images, PDFs, documents, audio, video, ZIP files and data securely in your browser. Free tools with no file uploads.",
  keywords: ["free file converter", "private file converter", "image converter", "PDF tools", "JSON to CSV", "QR code generator"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "FormatFlow",
    title: "FormatFlow — Free Private File Converter",
    description: "Convert files and data privately in your browser. Your files never leave your device.",
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "FormatFlow",
    url: "https://formatflow.n178ths.chatgpt.site/",
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    description: "Free browser-based tools for converting images, PDFs, documents, media, archives, structured data and text without uploading files.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}}/>{children}</body></html>;
}
