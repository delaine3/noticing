"use client";

import type { CaptureMessage } from "./capture-types";
import pinnedModels from "./webllm-integrity.json";

/**
 * WebLLM is installed from a version-locked npm dependency. Next.js bundles
 * its JavaScript into Noticing's own first-party assets at build time.
 * Import occurs only on deliberate model load, not at page render.
 *
 * The model weights and compiled WASM remain third-party DOWNLOADS.
 * Model repositories are pinned to exact revisions. Executable WASM,
 * configuration, and tokenizer bytes are checked against committed SHA-256
 * hashes before execution (WebLLM SRI). Downloads never contain chat text.
 * This does not represent an independent source-code security audit.
 */
type Runtime = typeof import("@mlc-ai/web-llm");
let runtimePromise: Promise<Runtime> | null = null;
let enginePromise: Promise<Awaited<ReturnType<Runtime["CreateMLCEngine"]>>> | null = null;
let runningModel: string | null = null;

export const LOCAL_MODEL_IDS = [
  "SmolLM2-360M-Instruct-q4f16_1-MLC",
  "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
] as const;
export type LocalModelId = (typeof LOCAL_MODEL_IDS)[number];

function isLocalModelId(value: string): value is LocalModelId {
  return LOCAL_MODEL_IDS.some((id) => id === value);
}

async function getRuntime(): Promise<Runtime> {
  runtimePromise ??= import("@mlc-ai/web-llm");
  return runtimePromise;
}

function hasWebGPU(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export async function loadLocalModel(
  modelId: string,
  onProgress: (status: string) => void = () => {},
) {
  if (!isLocalModelId(modelId)) throw new Error("Unknown local model.");
  if (!hasWebGPU()) {
    throw new Error("WebGPU is unavailable in this browser. Use Offline basic mode.");
  }
  if (enginePromise && runningModel === modelId) return enginePromise;

  const loading = (async () => {
    // WebGPU support and memory constraints are checked by WebLLM when loading.
    onProgress("Loading Noticing's bundled WebLLM code…");
    const webllm = await getRuntime();
    const model = webllm.prebuiltAppConfig.model_list.find((record) => record.model_id === modelId);
    if (!model) throw new Error("This version of WebLLM does not support that model.");
    const pinned = pinnedModels[modelId];
    if (!pinned.modelUrl.match(/^https:\/\/huggingface\.co\/mlc-ai\/[\w.-]+\/resolve\/[a-f0-9]{40}$/) ||
        !pinned.modelLibUrl.startsWith("https://raw.githubusercontent.com/mlc-ai/")) {
      throw new Error("Unexpected model asset origin or revision. Loading blocked.");
    }
    onProgress("Downloading revision-pinned model. Verifying executable WASM and tokenizers.");
    const engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback(progress) {
        if (typeof progress.text === "string") onProgress(progress.text);
      },
      appConfig: {
        ...webllm.prebuiltAppConfig,
        model_list: [{
          ...model,
          model: pinned.modelUrl,
          model_lib: pinned.modelLibUrl,
          integrity: {
            ...pinned.integrity,
            onFailure: "error",
          },
        }],
        cacheBackend: "cache",
      },
    });
    onProgress("The model is ready. Text generation is on-device.");
    return engine;
  })();

  enginePromise = loading;
  runningModel = modelId;
  try {
    return await loading;
  } catch (error) {
    enginePromise = null;
    runningModel = null;
    throw error;
  }
}

const logTypes = [
  "Daily check-in", "Sleep", "Focused work", "Job follow-up", "Interview",
  "Creative time", "Home improvement", "Personal observation", "First meal",
  "Job application", "Woke up", "Cook", "Wash Dishes", "Clean", "Meal",
  "Updated Resume", "Applied to Job", "Yard Work", "Dessert eaten",
  "Dessert craving", "Water", "Coffee", "Hygiene", "Sunlight", "Movement",
  "Exercise", "Treadmill walk", "Strength training", "Reading", "App work",
  "TikTok used", "TikTok avoided", "Plant care", "Recurring thought",
  "Social interaction", "Rest", "Family system",
];

export async function analyzeLocal({
  messages,
  localDate,
  timeZone,
  modelId,
  onProgress,
}: {
  messages: CaptureMessage[];
  localDate: string;
  timeZone: string;
  modelId: string;
  onProgress: (status: string) => void;
}): Promise<string> {
  const engine = await loadLocalModel(modelId, onProgress);
  const prompt = [
    "You are Noticing, a private on-device life-logging assistant.",
    "Extract ACTUALLY COMPLETED first-person activities from the recent conversation.",
    "NEVER treat hypotheticals, intentions, quoted stories or other people's experiences as the user's completed actions.",
    "Never invent dates, quantities, scores, personal identities or causes.",
    "When user explicitly says today use " + localDate + " (" + timeZone + ").",
    "When yesterday, use the previous local calendar day; otherwise leave action_date empty if unknown.",
    "Use HH:MM only when explicitly reported, else empty. Unknown numerical values MUST be null.",
    "Up to 4 proposals. Only these log_type values: " + logTypes.join(" | "),
    "Return a complete updated set of proposals after a follow-up, without duplicates.",
    "Ask at most ONE question when a missing fact is material.",
    "Do not propose private information about other people.",
    "Output ONLY a JSON object with keys reply, follow_up_question, proposed_records.",
    "Each proposed record requires ALL of the following fields:",
    "log_type, title, notes, action_date, action_time, water_amount_ml,",
    "treadmill_distance_km, treadmill_duration_minutes, sleep_hours,",
    "duration_minutes, mood_score, energy_score, intensity_score, evidence, uncertainty.",
    "All unknown measurements are null; all unknown times and dates are empty strings.",
    "No completed activity? Output an empty proposed_records array.",
    "Never say anything was saved. A person must review and approve all entries.",
  ].join("\n");
  const transcript = messages.slice(-6).map((message) => ({
    role: message.role,
    content: String(message.content ?? "").slice(0, 800),
  }));
  const response = await engine.chat.completions.create({
    messages: [{ role: "system", content: prompt }, ...transcript],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });
  const result = response.choices?.[0]?.message?.content;
  if (typeof result !== "string" || !result.trim()) {
    throw new Error("The local model returned no result. Try Offline basic mode.");
  }
  return result;
}
