import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eazo Weekend Jam",
  description: "Multimodal AI demo gallery — powered by MiniMax",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">
            Eazo Weekend Jam
          </a>
          <a
            href="https://github.com/yongkangzhao/eazo-weekend-jam-hackathon/issues/new?template=app-idea.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            Submit an Idea
          </a>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
