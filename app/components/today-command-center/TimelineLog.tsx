import { getEffectEmoji } from "../../lib/daily-rules";
import { DailyLog } from "../../lib/log-types";

type TimelineLogProps = {
  log: DailyLog;
};

export function TimelineLog({ log }: TimelineLogProps) {
  return (
    <article className="bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-md font-semibold text-green-700">
            {log.log_type} {getEffectEmoji(log.effect)}
          </p>

          <h4 className="mt-1 font-semibold text-black-950">
            {log.title || "Untitled action"}
          </h4>

          {log.treadmill_duration_minutes && log.treadmill_distance_km ? (
            <p className="mt-1 text-md font-medium text-[var(--leaf-dark)]">
              {log.treadmill_duration_minutes} min · {log.treadmill_distance_km}{" "}
              km
              {log.treadmill_pace_min_per_km
                ? ` · ${log.treadmill_pace_min_per_km.toFixed(2)} min/km`
                : ""}
            </p>
          ) : null}

          {log.workout_name ? (
            <p className="mt-1 text-md font-medium text-[var(--leaf-dark)]">
              {log.workout_name}
            </p>
          ) : null}

          {log.notes ? (
            <p className="mt-3 text-md leading-6 text-black-700">{log.notes}</p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          {log.water_amount_ml ? (
            <p className="text-md font-medium text-[var(--leaf-dark)]">
              {log.water_amount_ml}ml
            </p>
          ) : null}

          <p className="text-md text-black-500">
            {log.action_time ? log.action_time.slice(0, 5) : "No time"}
          </p>
        </div>
      </div>
    </article>
  );
}
