"use client";

import { useEffect, useState } from "react";

function getCurrentTimeValue() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function TimeField() {
  const [time, setTime] = useState("");

  useEffect(() => {
    setTime(getCurrentTimeValue());
  }, []);

  return (
    <label className="block">
      <span className="text-md font-medium text-[var(--ink)]">Time</span>

      <div className="mt-2 flex gap-2">
        <input
          name="action_time"
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          className="w-full rounded border border-[var(--border-soft)] bg-white/75 px-4 py-3 text-[var(--ink)] outline-none transition focus:border-[var(--leaf)] focus:bg-white"
        />

        <button
          type="button"
          onClick={() => setTime(getCurrentTimeValue())}
          className="rounded border border-[var(--border-soft)] bg-white/60 px-4 py-3 text-sm font-semibold text-[var(--leaf-dark)] transition hover:bg-white/85"
        >
          Now
        </button>
      </div>

      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Prefilled with now. Change it if you’re logging something from earlier.
      </p>
    </label>
  );
}
