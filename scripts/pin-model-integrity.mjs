import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { prebuiltAppConfig } from "@mlc-ai/web-llm";

const pinnedCommits = {
  "SmolLM2-360M-Instruct-q4f16_1-MLC": "3a622fd89e0216e8bb10c410c007c786baa8a033",
  "SmolLM2-1.7B-Instruct-q4f16_1-MLC": "84f57f8580a9d8d623266b600ad4273bb9fd84c1",
};

async function sri(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error("Asset could not be verified (" + response.status + "): " + url);
  const data = new Uint8Array(await response.arrayBuffer());
  if (!data.length) throw new Error("Zero-length model asset: " + url);
  return "sha256-" + createHash("sha256").update(data).digest("base64");
}

const manifest = {};
for (const [modelId, commit] of Object.entries(pinnedCommits)) {
  const model = prebuiltAppConfig.model_list.find((entry) => entry.model_id === modelId);
  if (!model) throw new Error("Missing prebuilt model: " + modelId);
  if (!model.model.startsWith("https://huggingface.co/mlc-ai/")) {
    throw new Error("Unexpected publisher for " + modelId);
  }
  if (!/^https:\/\//.test(model.model_lib)) throw new Error("Invalid WASM URL");
  const modelUrl = model.model.replace(/\/$/, "") + "/resolve/" + commit;
  const configUrl = modelUrl + "/mlc-chat-config.json";
  const [configHash, wasmHash] = await Promise.all([sri(configUrl), sri(model.model_lib)]);
  const config = await (await fetch(configUrl, { signal: AbortSignal.timeout(30000) })).json();
  const tokenizers = {};
  for (const file of config.tokenizer_files || []) {
    if (typeof file !== "string" || !/^[\w.-]+$/.test(file)) {
      throw new Error("Unexpected tokenizer path in " + modelId);
    }
    tokenizers[file] = await sri(modelUrl + "/" + file);
  }
  manifest[modelId] = {
    modelUrl,
    modelLibUrl: model.model_lib,
    integrity: {
      config: configHash,
      model_lib: wasmHash,
      tokenizer: tokenizers,
      onFailure: "error",
    },
  };
}
await writeFile("app/lib/webllm-integrity.json", JSON.stringify(manifest, null, 2) + "\n");
console.log("Pinned model configuration, tokenizer and WASM hashes for", Object.keys(manifest));
