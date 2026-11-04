"use client";

import type { CaptureMessage } from "./capture-types";
import { createLocalCompletionRequest } from "./local-capture-response";
import { createLocalModelSession } from "./local-model-session";
import pinnedModels from "./webllm-integrity.json";

/**
 * Bundled WebLLM runs locally. Exact-revision model files, WASM and tokenizer
 * integrity protections remain in force. A load now includes a real generation
 * probe, because downloaded weights do not prove an engine is operational.
 */
type Runtime = typeof import("@mlc-ai/web-llm");
type LocalEngine = Awaited<ReturnType<Runtime["CreateMLCEngine"]>>;
let runtimePromise: Promise<Runtime> | null = null;

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

const session = createLocalModelSession<LocalEngine>(async (modelId, onProgress) => {
  if (!isLocalModelId(modelId)) throw new Error("Unknown local model.");
  if (!hasWebGPU()) {
    throw new Error("WebGPU is unavailable. Use Offline basic mode.");
  }

  onProgress("Loading Noticing's bundled WebLLM code…");
  const webllm = await getRuntime();
  const model = webllm.prebuiltAppConfig.model_list.find((record) => record.model_id === modelId);
  if (!model) throw new Error("This WebLLM version does not support this model.");
  const pinned = pinnedModels[modelId];
  if (!pinned.modelUrl.match(/^https:\/\/huggingface\.co\/mlc-ai\/[\w.-]+\/resolve\/[a-f0-9]{40}$/) ||
      !pinned.modelLibUrl.startsWith("https://raw.githubusercontent.com/mlc-ai/")) {
    throw new Error("Unexpected model asset origin or revision. Loading blocked.");
  }

  onProgress("Loading revision-pinned model with executable and tokenizer integrity checks…");
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
        integrity: { ...pinned.integrity, onFailure: "error" },
      }],
      cacheBackend: "cache",
    },
  });

  // The earlier UI reported "ready" after weight loading even if a subsequent
  // generation failed with "Model not loaded". Verify generation immediately.
  try {
    onProgress("Checking that the local model can generate text…");
    const probe = await engine.chat.completions.create({
      messages: [{ role: "user", content: "Reply with one short word." }],
      temperature: 0.1,
      max_tokens: 12,
    });
    if (!probe.choices?.[0]?.message?.content?.trim()) {
      throw new Error("Model produced no text.");
    }
  } catch (error) {
    try { await engine.unload(); } catch { /* GPU might already be lost */ }
    throw new Error(
      "The model files loaded, but text generation failed. Try loading again or use Offline basic. " +
      (error instanceof Error ? error.message : String(error)),
    );
  }
  onProgress("Model verified and ready for on-device text generation.");
  return engine;
});

export async function loadLocalModel(
  modelId: string,
  onProgress: (status: string) => void = () => {},
) {
  return session.load(modelId, onProgress);
}

export async function resetLocalModel(modelId?: string) {
  await session.invalidate(modelId);
}

const logTypes = [
  "Daily check-in", "Sleep", "Bedtime", "Focused work", "Job follow-up", "Interview",
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
    "Keep JSON SHORT so it fits in your response. Required per activity: log_type, title, evidence.",
    "Optionally include notes, action_date, action_time, uncertainty and only explicitly stated measurements.",
    "Measurement names: water_amount_ml, treadmill_distance_km, treadmill_duration_minutes, sleep_hours,",
    "duration_minutes, mood_score, energy_score, intensity_score.",
    "Omit missing measurements entirely. Missing fields will be filled with null in the app.",
    "Example: {\"reply\":\"Found one walk\",\"follow_up_question\":null,\"proposed_records\":[{\"log_type\":\"Movement\",\"title\":\"Walked 8 km\",\"evidence\":\"I walked 8 km\",\"action_date\":\"\",\"uncertainty\":\"Confirm the date\"}]}",
    "No markdown, comments, or explanation outside the JSON object.",
    "No completed activity? Output an empty proposed_records array.",
    "Never say anything was saved. A person must review and approve all entries.",
  ].join("\n");
  const transcript = messages.slice(-6).map((message) => ({
    role: message.role,
    content: String(message.content ?? "").slice(0, 800),
  }));
  const request = createLocalCompletionRequest(prompt, transcript);
  const run = async (engine: LocalEngine) => {
    const response = await engine.chat.completions.create(request);
    const result = response.choices?.[0]?.message?.content;
    if (typeof result !== "string" || !result.trim()) {
      throw new Error("The local model returned no text.");
    }
    return result;
  };

  let engine = await loadLocalModel(modelId, onProgress);
  try {
    return await run(engine);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // The WebGPU device can be lost, or a WebLLM exception can leave its
    // engine unloaded while our UI still thinks it is ready.
    if (!/model not loaded|device lost|gpu device lost|device was lost/i.test(message)) {
      throw error;
    }
    onProgress("The local model session was lost. Reinitializing from the model cache…");
    await resetLocalModel(modelId);
    try {
      engine = await loadLocalModel(modelId, onProgress);
      return await run(engine);
    } catch (retryError) {
      await resetLocalModel(modelId);
      throw new Error(
        "Local model could not recover after reloading. Please select Load model again, " +
        "or use Offline basic. " +
        (retryError instanceof Error ? retryError.message : String(retryError)),
      );
    }
  }
}
