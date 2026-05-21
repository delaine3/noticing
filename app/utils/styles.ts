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
    chartColor: "#1F8A00",
    className: "border-[#f7c96b] bg-[#1F8A00BA] text-[#111111]",
  },
  helpful: {
    label: "Helpful",
    emoji: "🌿",
    chartColor: "#4Cc800",
    className: "border-[#8ee6be] bg-[#4Cc800BA] text-[#111111]",
  },
  neutral: {
    label: "Neutral",
    emoji: "",
    chartColor: "#ccff00",
    className: "border-[#cdebdc] bg-[#ccff00BA] text-[#111111]",
  },
  unhelpful: {
    label: "Unhelpful",
    emoji: "🫠",
    chartColor: " #e68a00",
    className: "border-[#ffd1c8] bg-[#e68a00BA] text-[#111111]",
  },
  harmful: {
    label: "Harmful",
    emoji: "⚠️",
    chartColor: "#ab2b00",
    className: "border-[#ffb199] bg-[#ab2b00BA] text-[#EEEEEE]",
  },
  detrimental: {
    label: "Detrimental",
    emoji: "🚨",
    chartColor: "#F00000",
    className: "border-[#ff7f91] bg-[#F00000BA] text-[#EEEEEE]",
  },
} as const;
