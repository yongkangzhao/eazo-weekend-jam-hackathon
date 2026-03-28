import Link from "next/link";

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Eazo Weekend Jam
        </Link>
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
    </>
  );
}
