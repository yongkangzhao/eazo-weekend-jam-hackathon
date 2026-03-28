import type { Demo } from "@/demos";

const statusColors = {
  live: "bg-green-500/20 text-green-400",
  wip: "bg-yellow-500/20 text-yellow-400",
  idea: "bg-gray-500/20 text-gray-400",
};

export function DemoCard({ demo }: { demo: Demo }) {
  return (
    <a
      href={`/demos/${demo.slug}`}
      className="group block rounded-xl border border-gray-800 bg-gray-900 p-6 hover:border-indigo-500/50 hover:bg-gray-900/80 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold group-hover:text-indigo-400 transition-colors">
          {demo.title}
        </h2>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[demo.status]}`}
        >
          {demo.status.toUpperCase()}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-400 line-clamp-2">
        {demo.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {demo.apis.map((api) => (
          <span
            key={api}
            className="rounded-md bg-gray-800 px-2 py-1 text-xs text-gray-300"
          >
            {api}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-500">by {demo.author}</p>
    </a>
  );
}
