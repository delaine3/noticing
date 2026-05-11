export const colors = {
  coral: "#ffa9b7",
  blush: "#ffd7df",
  cream: "#fffaf3",
  mint: "#c9f5dd",
  aqua: "#5effe4",
  leaf: "#3f7f63",
  ink: "#1f342d",
  green: "#398b29",
  softInk: "#4f6f63",
  gray: "#5d647395",
  blue: "#18bcbc90",
  warning: "#f4a261",
  gold: "#fbbf24",
  danger: "#d5145198",
};
export const effectStyles = {
  restorative: {
    label: "Restorative",
    emoji: "⭐",
    chartColor: "#f7c96b",
    className: "border-[#f7c96b] bg-[#fff4c7] text-[#101636]",
  },
  helpful: {
    label: "Helpful",
    emoji: "🌿",
    chartColor: "#8ee6be",
    className: "border-[#8ee6be] bg-[#d9f8e8] text-[#101636]",
  },
  neutral: {
    label: "Neutral",
    emoji: "",
    chartColor: "#a2ff85",
    className: "border-[#cdebdc] bg-[#fffaf3] text-[#101636]",
  },
  unhelpful: {
    label: "Unhelpful",
    emoji: "🫠",
    chartColor: "#ffd1c8",
    className: "border-[#ffd1c8] bg-[#fff0e7] text-[#101636]",
  },
  harmful: {
    label: "Harmful",
    emoji: "⚠️",
    chartColor: "#ffb199",
    className: "border-[#ffb199] bg-[#ffe0d6] text-[#8f2f1f]",
  },
  detrimental: {
    label: "Detrimental",
    emoji: "🚨",
    chartColor: "#ff7f91",
    className: "border-[#ff7f91] bg-[#ffd7df] text-[#7a1f35]",
  },
} as const;
