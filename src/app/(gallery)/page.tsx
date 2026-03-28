import { demos } from "@/demos";
import { DemoCard } from "@/components/demo-card";

export default function Home() {
  return (
    <div>
      <section className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Demo Gallery</h1>
        <p className="mt-2 text-gray-400">
          Multimodal AI demos powered by MiniMax. Pick one to try, or{" "}
          <a
            href="https://github.com/yongkangzhao/eazo-weekend-jam-hackathon/issues/new?template=app-idea.yml"
            className="text-indigo-400 underline hover:text-indigo-300"
          >
            submit an idea
          </a>{" "}
          for a new demo.
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {demos.map((demo) => (
          <DemoCard key={demo.slug} demo={demo} />
        ))}
      </div>

      {demos.length === 0 && (
        <p className="text-center text-gray-500 py-20">
          No demos yet. Submit an idea to get started!
        </p>
      )}
    </div>
  );
}
