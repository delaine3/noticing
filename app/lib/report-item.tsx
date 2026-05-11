export type ReportItem = {
  label: string;
  status: "gold" | "check" | "warning" | "code-red" | "demerit" | "neutral";
  emoji: string;
  message: string;
};
