import { RouterDemo } from "@/components/router-demo.js";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <div className="eyebrow">Vercel AI Gateway reference implementation</div>
        <h1>Route intent, risk and modality. Not just provider traffic.</h1>
        <p>
          Hard policy gates run before a hybrid semantic router. Clear requests stay local; ambiguous
          requests use a small classifier. Text-only and image-capable routes are separate, budgets
          cannot undercut the policy floor, and an operator override is server-authorized.
        </p>
        <div className="flow" aria-label="Routing flow">
          <span>validate</span><b>→</b><span>policy</span><b>→</b><span>modality</span><b>→</b>
          <span>heuristic</span><b>→</b><span>classifier?</span><b>→</b><span>cost guard</span><b>→</b>
          <span>Gateway</span>
        </div>
      </section>
      <RouterDemo />
      <section className="principles">
        <article><strong>Company-owned policy</strong><p>Data classes, minimum quality, provider contracts and overrides live outside vendor model names.</p></article>
        <article><strong>Measured choices</strong><p>Model candidates combine Vercel price/capability data with independent Artificial Analysis benchmarks and an internal evaluation set.</p></article>
        <article><strong>Safe defaults</strong><p>Restricted data is denied, prompts are not logged, image content is detected from the payload, and dry-run is the default.</p></article>
      </section>
    </main>
  );
}

