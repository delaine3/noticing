# Private, no-API conversational capture

## What is provided
The authenticated `/capture` page accepts natural-language notes about completed activities and turns them into records **only after individual approval**.

Two no-charge processing modes:
1. **Offline basic:** lightweight rules run in browser JavaScript. No model download, WebGPU or AI API account required.
2. **Local open-weight AI:** downloads SmolLM2 weights via WebLLM (on explicit user action) and runs text generation through WebGPU in the user's browser. No text inference request is made to Google, OpenAI or any model service.

## Model requirements and data costs
- SmolLM2 360M quantized: roughly 376 MB video memory requirement, lower quality.
- SmolLM2 1.7B quantized: roughly 1.8 GB video memory requirement, better reasoning but heavier.
- Both model variants require WebGPU and shader-f16; some browsers and devices cannot run them.
- Initial model/runtime downloads consume internet bandwidth. The host sees ordinary download requests, such as your IP address, but no prompts are passed to the download URL by the application.
- Browser cache can hold model files; clearing browser data may require downloading them again.
- GPU/CPU/RAM and electricity are still resources, though there is no inference API charge.

## Privacy
- Natural-language chat text and generated drafts stay in browser memory. The local model runs on the user's device.
- No conversation content is used to train a remote model by Noticing's implementation. Inference with WebLLM does not update the local model's weights.
- The runtime JavaScript module is loaded from a versioned third-party CDN (esm.run) and open model files from public hosting. Third-party code and model hosting are a supply-chain trust surface. For stronger privacy assurance, bundle/audit the runtime in the app and self-host model assets.
- The export importer `/import/chat` also processes raw chats in the browser.
- Only records explicitly approved with the Save button are sent to the logged-in user's Supabase database. Never approve raw passwords, third-party secrets, or intimate details.
- The current duplicate-key approach stores a UUID marker in notes; it is not a database-enforced unique key.

## Process
1. Open `/capture`.
2. Enter a statement like "Today I walked 8 km, watered my garden and sent 3 proposals".
3. Select **Offline basic** or **Open-weight AI on this device**.
4. For AI, click **Download / load model**. This happens only when requested, not silently on opening the page.
5. Click **Analyze on this device**. View the proposed records and follow-up question.
6. Correct dates, categories, measurements and notes, then approve each wanted record.
7. Click **Save approved records**. Only those summaries are persisted.

## Limitations
- Small local models frequently make extraction and JSON formatting errors; candidate fields are validated and must be reviewed. The UI never saves automatically.
- Offline basic uses rules, not a model, and cannot reliably interpret follow-up answers.
- The UI refreshes the complete proposal list after additional local-model turns; edits made to an unapproved draft can be overwritten by subsequent analysis.
- There is no live ChatGPT history sync.
- On a public site, the hosting provider still receives web traffic and account/database requests. "Local AI" applies to the model processing, not all Noticing activity.
- The WebLLM CDN/runtime has not been independently security audited in this work.

## Engineering verification
Run `npm ci`, `npm run build`, and `npm run lint`.
In a compatible WebGPU browser, confirm both listed models actually load (some browsers may lack shader-f16) and yield parseable JSON. Test that the Network tab shows only runtime/weight downloads during inference, with no POST carrying prompts. Confirm the save action sends only approved edited records. Try offline basic without WebGPU, and verify model errors never cause a cloud fallback.

Potential improvement: use a locally bundled, pinned `@mlc-ai/web-llm` npm build with a locked integrity hash, and host model files on a controlled origin. This would reduce dependence on third-party runtime code.
