"use client";

import { useState } from "react";

const PRESETS = {
  summary: {
    usage: "summarization",
    prompt: "Summarize this public product update into three decisions, two risks and the open questions. Do not add facts that are not present.",
  },
  analysis: {
    usage: "analysis",
    prompt: "Compare two migration options for a 150-person organisation. Quantify cost, operational risk, reversibility and the evidence still needed before a decision.",
  },
  security: {
    usage: "analysis",
    prompt: "Create a threat model for a security incident response workflow that can access production credentials. Include abuse cases, controls and required human approvals.",
  },
  extraction: {
    usage: "extraction",
    prompt: "Extract decision_owner, deadline, budget_usd, dependencies and evidence_gaps. Use null when the source does not contain a value.",
    strictJson: true,
  },
};

async function filesToImages(files) {
  return Promise.all(
    [...files].slice(0, 4).map(
      (file) =>
        new Promise((resolve, reject) => {
          if (file.size > 5 * 1024 * 1024) return reject(new Error(`${file.name} exceeds 5 MB.`));
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
          reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
          reader.readAsDataURL(file);
        }),
    ),
  );
}

export function RouterDemo() {
  const [form, setForm] = useState({
    prompt: PRESETS.summary.prompt,
    usage: PRESETS.summary.usage,
    dataClass: "public",
    maxOutputTokens: 700,
    maxCostUsd: "",
    forceModelAlias: "",
    strictJson: false,
    tools: false,
  });
  const [images, setImages] = useState([]);
  const [apiToken, setApiToken] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function applyPreset(key) {
    const preset = PRESETS[key];
    setForm((current) => ({
      ...current,
      prompt: preset.prompt,
      usage: preset.usage,
      strictJson: Boolean(preset.strictJson),
    }));
  }

  async function submit(routeOnly) {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch(routeOnly ? "/api/route" : "/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(apiToken ? { authorization: `Bearer ${apiToken}` } : {}),
          ...(adminToken ? { "x-routing-admin-authorization": `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({
          prompt: form.prompt,
          usage: form.usage,
          dataClass: form.dataClass,
          maxOutputTokens: Number(form.maxOutputTokens),
          ...(form.maxCostUsd ? { maxCostUsd: Number(form.maxCostUsd) } : {}),
          ...(form.forceModelAlias ? { forceModelAlias: form.forceModelAlias } : {}),
          capabilities: { strictJson: form.strictJson, tools: form.tools },
          images: images.map(({ dataUrl }) => ({ dataUrl })),
          orgUnit: "demo",
        }),
      });
      const payload = await response.json();
      setResult({ ok: response.ok, status: response.status, payload });
    } catch (error) {
      setResult({ ok: false, status: 0, payload: { error: { message: error.message } } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="console">
      <div className="panel controls">
        <div className="panel-title"><h2>Request</h2><span>Prompt content is never rendered into server logs.</span></div>
        <div className="presets">
          {Object.keys(PRESETS).map((key) => <button type="button" key={key} onClick={() => applyPreset(key)}>{key}</button>)}
        </div>
        <label>Prompt<textarea rows="10" value={form.prompt} onChange={(event) => update("prompt", event.target.value)} /></label>
        <div className="grid">
          <label>Usage<select value={form.usage} onChange={(event) => update("usage", event.target.value)}>
            {["general","summarization","translation","extraction","support","analysis","code","executive"].map((value) => <option key={value}>{value}</option>)}
          </select></label>
          <label>Data class<select value={form.dataClass} onChange={(event) => update("dataClass", event.target.value)}>
            {["public","internal","restricted"].map((value) => <option key={value}>{value}</option>)}
          </select></label>
          <label>Max output tokens<input type="number" min="32" max="8192" value={form.maxOutputTokens} onChange={(event) => update("maxOutputTokens", event.target.value)} /></label>
          <label>Max estimated USD<input type="number" min="0" step="0.0001" placeholder="optional" value={form.maxCostUsd} onChange={(event) => update("maxCostUsd", event.target.value)} /></label>
          <label>Authorized override<select value={form.forceModelAlias} onChange={(event) => update("forceModelAlias", event.target.value)}>
            <option value="">auto</option>{["fast","capable","frontier","premium"].map((value) => <option key={value}>{value}</option>)}
          </select></label>
          <label>Images<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={async (event) => {
            try { setImages(await filesToImages(event.target.files)); } catch (error) { setResult({ ok:false,status:0,payload:{error:{message:error.message}}}); }
          }} /></label>
        </div>
        <div className="checks">
          <label><input type="checkbox" checked={form.strictJson} onChange={(event) => update("strictJson", event.target.checked)} /> strict JSON</label>
          <label><input type="checkbox" checked={form.tools} onChange={(event) => update("tools", event.target.checked)} /> tool-oriented task</label>
          <span>{images.length ? `${images.length} image(s): vision route required` : "text-only route eligible"}</span>
        </div>
        <details>
          <summary>Protected deployment tokens</summary>
          <div className="grid token-grid">
            <label>API bearer token<input type="password" autoComplete="off" value={apiToken} onChange={(event) => setApiToken(event.target.value)} /></label>
            <label>Override admin token<input type="password" autoComplete="off" value={adminToken} onChange={(event) => setAdminToken(event.target.value)} /></label>
          </div>
          <p>Held only in this browser component state and never persisted by the app.</p>
        </details>
        <div className="actions">
          <button className="secondary" disabled={busy} onClick={() => submit(true)}>Route only</button>
          <button className="primary" disabled={busy} onClick={() => submit(false)}>{busy ? "Working…" : "Route and generate"}</button>
        </div>
      </div>
      <div className="panel result">
        <div className="panel-title"><h2>Decision</h2><span>Raw prompt and image content are deliberately omitted.</span></div>
        {result ? <>
          <div className={`status ${result.ok ? "ok" : "error"}`}>HTTP {result.status || "network"}</div>
          <pre>{JSON.stringify(result.payload, null, 2)}</pre>
        </> : <div className="empty">Run the route to inspect policy, modality, model, fallback, classifier and preflight cost metadata.</div>}
      </div>
    </section>
  );
}

