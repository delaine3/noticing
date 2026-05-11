export function formatSpeed(speed: number | null) {
  if (speed === null) return "No data";
  return `${speed.toFixed(2)} km/h`;
}

export function formatDistance(distance: number) {
  return `${distance.toFixed(2)} km`;
}

export function formatPace(pace: number | null) {
  if (pace === null) return "No data";

  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);

  return `${minutes}:${String(seconds).padStart(2, "0")} min/km`;
}

export function isSameDay(date: string, target: Date) {
  return date === target.toISOString().slice(0, 10);
}

export function isSameWeek(date: string, target: Date) {
  const value = new Date(`${date}T00:00:00`);
  const diffMs = target.getTime() - value.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays < 7;
}

export function isSameMonth(date: string, target: Date) {
  const value = new Date(`${date}T00:00:00`);

  return (
    value.getFullYear() === target.getFullYear() &&
    value.getMonth() === target.getMonth()
  );
}
export function formatMinutes(minutes: number | null) {
  if (minutes === null) return "No data";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}
