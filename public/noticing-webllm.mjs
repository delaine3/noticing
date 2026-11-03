/* WebLLM is executed by the user's browser. Nothing here sends text to
 * a server. The module and model files are downloaded from public hosts
 * (the hosts may observe the download request/IP, never the prompt).
 *
 * Runtime URL is pinned to a specific WebLLM release, with no cloud
 * inference provider or fallback.
 */
const WEBLLM_VERSION = "0.2.87";
const MODEL_IDS = Object.freeze([
  "SmolLM2-1.7B-Instruct-q4f16_1-MLC",
  "SmolLM2-360M-Instruct-q4f16_1-MLC",
]);
let modulePromise = null;
let enginePromise = null;
let runningModel = null;

async function getWebLLM() {
  if (!modulePromise) {
    modulePromise = import("https://esm.run/@mlc-ai/web-llm@0.2.87");
  }
  return modulePromise;
}

function isWebGPUAvailable() {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

async function loadModel(modelId, onProgress = () => {}) {
  if (!MODEL_IDS.includes(modelId)) throw new Error("Unknown local model.");
  if (!isWebGPUAvailable()) throw new Error("WebGPU is unavailable on this browser or device. Use Offline basic mode.");
  if (enginePromise && runningModel === modelId) return enginePromise;

  // Loading is explicit. No AI files are downloaded until the user clicks Load.
  const load = (async () => {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("No compatible WebGPU adapter was found. Use Offline basic mode.");
    if (!adapter.features.has("shader-f16")) {
      throw new Error("This model needs WebGPU shader-f16 support. Use Offline basic mode.");
    }
    onProgress("Downloading local AI model and preparing graphics memory…");
    const webllm = await getWebLLM();
    const registered = webllm.prebuiltAppConfig.model_list.some((entry) => entry.model_id === modelId);
    if (!registered) throw new Error("This WebLLM version does not contain the selected model.");
    const loaded = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (progress) => {
        if (progress && typeof progress.text === "string") onProgress(progress.text);
      },
    });
    onProgress("Local model ready. All inference runs on this device.");
    return loaded;
  })();
  enginePromise = load;
  runningModel = modelId;
  try {
    return await load;
  } catch (error) {
    enginePromise = null;
    runningModel = null;
    throw error;
  }
}

const kinds = [
  "Daily check-in","Sleep","Focused work","Job follow-up","Interview",
  "Creative time","Home improvement","Personal observation","First meal",
  "Job application","Woke up","Cook","Wash Dishes","Clean","Meal",
  "Updated Resume","Applied to Job","Yard Work","Dessert eaten",
  "Dessert craving","Water","Coffee","Hygiene","Sunlight","Movement",
  "Exercise","Treadmill walk","Strength training","Reading","App work",
  "TikTok used","TikTok avoided","Plant care","Recurring thought",
  "Social interaction","Rest","Family system",
];
const measurements = [
  "water_amount_ml","treadmill_distance_km","treadmill_duration_minutes",
  "sleep_hours","duration_minutes","mood_score","energy_score","intensity_score",
];

async function analyzeLocal({ messages, localDate, timeZone, modelId, onProgress }) {
  const engine = await loadModel(modelId, onProgress);
  const prompt = [
    "You are Noticing, a private on-device life-logging assistant.",
    "Extract ACTUALLY COMPLETED first-person activities from the conversation.",
    "NEVER treat hypothetical statements, intentions, quoted stories or other people's experiences as completed personal actions.",
    "Do not invent dates, quantities, scores, causes or personal details.",
    "If the user explicitly says today use " + localDate + " (" + timeZone + ").",
    "If yesterday, use the previous calendar day; otherwise set action_date to empty string when uncertain.",
    "Use 24-hour HH:MM or empty for action_time. Numeric unknowns MUST be null, not zero.",
    "Use no more than 4 proposals. Only these log_type values: " + kinds.join(" | ") + ".",
    "Return a complete updated set of proposals when follow-up answers are received, avoiding duplicate events.",
    "Ask at most ONE question when a missing fact is important. Do not over-question.",
    "For sensitive private details about others, do not propose a record.",
    "Output ONLY a single JSON object with exactly these keys:",
    "{\"reply\":\"short description\",\"follow_up_question\":null,\"proposed_records\":[{\"log_type\":\"Movement\",\"title\":\"Walked 8 km\",\"notes\":\"\",\"action_date\":\"\",\"action_time\":\"\",\"water_amount_ml\":null,\"treadmill_distance_km\":null,\"treadmill_duration_minutes\":null,\"sleep_hours\":null,\"duration_minutes\":null,\"mood_score\":null,\"energy_score\":null,\"intensity_score\":null,\"evidence\":\"I walked 8km\",\"uncertainty\":\"Confirm date\"}]}",
    "Use the same complete field set for EACH proposal. If nothing happened, return an empty list.",
    "Never state a record was saved. All proposals are only drafts for user approval.",
  ].join("\n");
  const transcript = messages.slice(-6).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 800),
  }));
  const reply = await engine.chat.completions.create({
    messages: [{ role: "system", content: prompt }, ...transcript],
    temperature: 0.1,
    max_tokens: 1000,
    response_format: { type: "json_object" },
  });
  const raw = reply.choices?.[0]?.message?.content;
  if (typeof raw !== "string" || !raw.trim()) throw new Error("Local model returned no text. Try again or switch to Offline basic mode.");
  return raw;
}

// The sole bridge to application code. It deliberately contains no fetch()
// or network-based inference fallback.
window.__noticingLocalLLM = {
  loadModel,
  analyzeLocal,
  isWebGPUAvailable,
  models: [...MODEL_IDS],
  version: WEBLLM_VERSION,
};
window.dispatchEvent(new Event("noticing-local-llm-ready"));
