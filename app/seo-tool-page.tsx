import type { Metadata } from "next";

const origin = "https://formatflow.n178ths.chatgpt.site";

export const seoTools = {
  "image-converter": {
    title: "Free Private Image Converter — JPG, PNG & WebP",
    description: "Convert, resize and rotate JPG, PNG and WebP images privately in your browser. No upload or account required.",
    tool: "images",
    heading: "Private image converter",
    intro: "Convert JPG, PNG and WebP images without sending them to a server. FormatFlow processes each image inside your browser, then lets you download one result or a complete ZIP.",
    formats: ["JPG to PNG", "PNG to WebP", "WebP to JPG", "Resize images", "Rotate images"],
    steps: ["Choose one or more images.", "Select the output format, width, rotation and quality.", "Convert and download the finished files."],
    faq: [["Are my images uploaded?", "No. Image conversion happens locally in your browser."], ["Can I convert multiple images?", "Yes. Add up to 20 images and download the results individually or in one ZIP."], ["Which format should I choose?", "Use JPG for photographs, PNG for lossless transparency, and WebP for smaller web images."]],
  },
  "pdf-tools": {
    title: "Free Private PDF Tools — Merge, Split & Rotate",
    description: "Merge, split, rotate and extract PDF pages privately in your browser without uploading your documents.",
    tool: "pdf",
    heading: "Private PDF tools",
    intro: "Merge PDF files, split documents, rotate pages, extract selected pages or create a PDF from images. Your documents remain on your device while you work.",
    formats: ["Merge PDFs", "Split PDF", "Rotate PDF", "Extract PDF pages", "Images to PDF"],
    steps: ["Choose the PDF action.", "Add files and enter page numbers if required.", "Process and download the result."],
    faq: [["Do you store PDF files?", "No. FormatFlow processes supported PDF actions in your browser."], ["Can I rearrange files before merging?", "Yes. Use the arrow controls to set the correct order."], ["Are password-protected PDFs supported?", "Password-protected documents are not currently supported."]],
  },
  "json-to-csv": {
    title: "JSON to CSV Converter — Free & Private",
    description: "Convert JSON to CSV, TSV or XML and back directly in your browser. Edit, copy and download structured data privately.",
    tool: "data",
    heading: "JSON, CSV, TSV and XML converter",
    intro: "Move structured data between JSON, CSV, TSV and XML formats. Paste data or open a local file, review the editable result, then copy or download it.",
    formats: ["JSON to CSV", "CSV to JSON", "JSON to XML", "TSV to JSON", "CSV to XML"],
    steps: ["Choose the input and output formats.", "Paste data or open a supported file.", "Convert, review and copy or download the result."],
    faq: [["Is my data uploaded?", "No. Structured-data conversion runs locally in your browser."], ["Does CSV support quoted commas?", "Yes. Quoted fields, embedded commas, new lines and Unicode are supported."], ["Can I edit the result?", "Yes. The input is editable and the converted output can be copied or downloaded."]],
  },
  "text-tools": {
    title: "Free Online Text Tools — Encode, Decode & Format",
    description: "Transform text with Base64, URL encoding, case conversion and line tools privately in your browser.",
    tool: "text",
    heading: "Private text tools",
    intro: "Encode, decode and clean up text instantly. FormatFlow includes Base64, URL encoding, letter-case and line operations with editable input and downloadable results.",
    formats: ["Base64 encode", "Base64 decode", "URL encode", "URL decode", "Change text case"],
    steps: ["Choose a text operation.", "Paste or type the input.", "Transform, review and copy or download the result."],
    faq: [["Is Base64 encryption?", "No. Base64 is an encoding format and does not protect confidential information."], ["Can I download transformed text?", "Yes. Copy the result or download it as a text file."], ["Does the tool count words?", "Yes. Character and word totals update as you type."]],
  },
  "qr-code-generator": {
    title: "Free QR Code Generator — PNG & SVG",
    description: "Create QR codes for links, text and Wi-Fi networks. Download a sharp PNG or printable SVG without an account.",
    tool: "qr",
    heading: "Free QR code generator",
    intro: "Create a QR code for a website, text message or Wi-Fi network. Choose the size, verify the result with your phone and download it as PNG or SVG.",
    formats: ["URL QR code", "Text QR code", "Wi-Fi QR code", "PNG QR code", "SVG QR code"],
    steps: ["Choose link, text or Wi-Fi content.", "Enter the details and select a PNG size.", "Generate, test and download the QR code."],
    faq: [["Which download format is best?", "PNG is convenient for messages and websites. SVG stays sharp when printed at large sizes."], ["Can QR codes contain Wi-Fi passwords?", "Yes, but anyone who scans that QR code may be able to view and use the credentials."], ["Do I need an account?", "No account or sign-in is required."]],
  },
  "unit-converter": {
    title: "Free Unit Converter — Length, Weight & Temperature",
    description: "Convert common length, weight, temperature and other measurements instantly with a simple browser-based unit converter.",
    tool: "utilities",
    heading: "Everyday unit converter",
    intro: "Convert common measurements, number bases and colour values in one accessible utility. Results update immediately and can be copied with one button.",
    formats: ["Length converter", "Weight converter", "Temperature converter", "Number base converter", "Colour converter"],
    steps: ["Choose a measurement group.", "Enter a value and select the source and target units.", "Review and copy the converted result."],
    faq: [["Which measurements are supported?", "The tool covers frequently used length, weight, temperature and other everyday units."], ["Can it convert binary and hexadecimal?", "Yes. The utilities section includes exact integer conversion between binary, octal, decimal and hexadecimal."], ["Does it support colour values?", "Yes. Convert between HEX, RGB and HSL colour formats."]],
  },
  "date-time-converter": {
    title: "Free Date and Unix Timestamp Converter",
    description: "Convert ISO dates, UTC time and Unix timestamps in seconds or milliseconds privately in your browser.",
    tool: "time",
    heading: "Date and timestamp converter",
    intro: "Convert readable dates, ISO 8601 values and Unix timestamps without sending information to a server. Copy ISO, UTC, local, seconds or milliseconds instantly.",
    formats: ["Date to Unix timestamp", "Unix timestamp to date", "ISO 8601 converter", "UTC converter", "Milliseconds converter"],
    steps: ["Choose the input format.", "Enter a date or Unix timestamp.", "Copy the date or timestamp format you need."],
    faq: [["What is a Unix timestamp?", "It is the number of seconds or milliseconds elapsed since 1 January 1970 UTC."], ["Which timezone is used?", "Explicit timezone offsets are respected. Dates without a timezone use your device timezone."], ["Is my date sent anywhere?", "No. Conversion happens locally in your browser."]],
  },
  "developer-tools": {
    title: "Free Developer Tools — UUID, Password and SHA-256",
    description: "Generate secure passwords, UUID v4 identifiers and SHA-256 text fingerprints locally in your browser.",
    tool: "developer",
    heading: "Private developer tools",
    intro: "Generate secure passwords and UUID v4 identifiers or calculate a SHA-256 text fingerprint. Every operation runs locally in your browser.",
    formats: ["Password generator", "UUID v4 generator", "SHA-256 text hash", "Secure random values", "Copy-ready output"],
    steps: ["Choose the generator or fingerprint tool.", "Enter settings or source text.", "Generate and copy the result."],
    faq: [["Are passwords generated securely?", "Yes. FormatFlow uses the browser cryptography API rather than Math.random."], ["Can a SHA-256 hash be reversed?", "No. SHA-256 is designed as a one-way fingerprint, though weak input can still be guessed."], ["Are generated values stored?", "No. They exist only in the current browser session."]],
  },
} as const;

export type SeoSlug = keyof typeof seoTools;

export function metadataFor(slug: SeoSlug): Metadata {
  const page = seoTools[slug];
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${slug}` },
    openGraph: { type: "website", url: `/${slug}`, title: page.title, description: page.description, siteName: "FormatFlow" },
  };
}

export function SeoToolPage({ slug }: { slug: SeoSlug }) {
  const page = seoTools[slug];
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: page.heading,
    url: `${origin}/${slug}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    description: page.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
  return <main className="seo-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    <header className="seo-header"><a href="/" aria-label="FormatFlow home"><span aria-hidden="true">◇</span>FormatFlow</a><span>Files stay on your device</span></header>
    <article>
      <p className="seo-eyebrow">FREE BROWSER TOOL</p>
      <h1>{page.heading}</h1>
      <p className="seo-lead">{page.intro}</p>
      <a className="seo-cta" href={`/?tool=${page.tool}`}>Open {page.heading}</a>
      <section><h2>What you can do</h2><ul className="seo-features">{page.formats.map(item=><li key={item}>{item}</li>)}</ul></section>
      <section><h2>How to use it</h2><ol className="seo-steps">{page.steps.map((step,index)=><li key={step}><span>{index+1}</span>{step}</li>)}</ol></section>
      <section><h2>Frequently asked questions</h2><div className="seo-faq">{page.faq.map(([question,answer])=><div key={question}><h3>{question}</h3><p>{answer}</p></div>)}</div></section>
      <nav className="seo-related" aria-label="Other FormatFlow tools"><strong>Explore more tools</strong>{Object.entries(seoTools).filter(([key])=>key!==slug).map(([key,value])=><a key={key} href={`/${key}`}>{value.heading}</a>)}</nav>
    </article>
  </main>;
}
