# Private, zero-API-cost conversational capture

The authenticated `/capture` page turns natural language into suggested personal records. **Nothing is stored as a Noticing log until the person explicitly approves it.**

## Available modes
- **Offline basic:** deterministic browser-only extraction. No download or WebGPU required.
- **Local AI:** SmolLM2 360M or 1.7B through WebLLM running on the user's own WebGPU-capable device. **No text inference API and no remote model training on chat content.**

## Privacy and executable dependency controls
1. `@mlc-ai/web-llm` is installed as a **pinned, npm-locked package** (`0.2.87`). Next.js bundles its JavaScript into Noticing's own domain; there is no run-time `esm.run` or other third-party JavaScript CDN import.
2. Model repositories are pinned to exact Hugging Face commit hashes in `app/lib/webllm-integrity.json`.
3. WebLLM's **Subresource Integrity** verifies the model configuration, executable WASM file, and listed tokenizer files against committed SHA-256 hashes. Mismatches fail closed (`onFailure: "error"`). CI recomputes the hashes and rejects unexpected changes.
4. The `/capture` page has a restrictive `connect-src` policy allowing its own origin, Supabase, and the explicit model distribution hosts. The site has no cloud inference endpoint or fallback.
5. Browser inference itself never sends the text to Google, OpenAI, Hugging Face or another model inference service. The model weights are not updated during inference.
6. Raw chat text and draft records are transient in browser memory. A **deliberate Save** sends only edited, approved records to the signed-in user's existing Supabase table.

### What is *not* entirely local
- First-time model weights and WASM are still **downloaded from Hugging Face and the MLC GitHub model library repository** (their hosts may see IP address, request time and other normal download metadata). No chat content is included in those download requests.
- Runtime JavaScript is first-party served but includes a pinned upstream npm dependency. Pinning, integrity checking and network restrictions are not equivalent to a full independent source-code audit.
- Serving hundreds of megabytes of model weights through Vercel's free project would increase bandwidth use and risk exhausting free hosting limits. We intentionally **do not proxy model files** through Noticing's server.
- Hosting, login and saving approved records still involve Vercel/Supabase. This is local *AI inference*, not a completely offline application.
- Model weight shards are bound to immutable Hugging Face Git revisions, but WebLLM's built-in SRI currently verifies configuration, compiled WASM and tokenizer files, **not every individual weight shard**. Additional weight-shard checks or user-managed local model files would improve assurance.

## Using the feature
1. Visit `/capture`, enter something you actually did, and select Offline basic or Local AI.
2. In Local AI mode, explicitly click **Download / load model**. The smaller 360M model needs about 376 MB video memory; the 1.7B model about 1.8 GB, plus browser overhead. Both require WebGPU and shader-f16.
3. Inspect the AI's proposed activities and any follow-up question. Correct dates, measurements, category and details.
4. Individually approve entries and click **Save approved records**.

## Remaining limitations and checks
- Small models can produce poor or malformed JSON, miss activities or invent facts. All proposals must be reviewed and all numeric fields/date values are validated again on save.
- Browser WebGPU compatibility, model downloads and successful inference must be manually tested with a real browser, ideally with its Network tab visible. GitHub build/lint checks do **not** test GPU runtime.
- Check that loading the models downloads only approved model files, that inference performs no prompt POSTs, that incorrect WASM/config/tokenizer hashes are rejected and that the basic mode works without WebGPU.
- The current approved-record UUID marker in notes prevents routine duplicates but is not a database unique constraint. Do not claim that concurrent duplicates are impossible.
- Chat data and candidate records are cleared by reloading the page. Previously approved records can be managed in Logs.
- Avoid sharing credentials or other people's sensitive details in the app regardless of processing mode.

## Verifying the project
```
npm ci
node scripts/pin-model-integrity.mjs
git diff --exit-code -- app/lib/webllm-integrity.json
npm run build
npm run lint
```

A new model version or changed artifact requires deliberate review of the new hashes before updating the committed manifest.
