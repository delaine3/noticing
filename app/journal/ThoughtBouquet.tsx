"use client";

import type { Flower } from "../lib/thought-garden";

function Bloom({ flower, x, y, index }: { flower: Flower; x: number; y: number; index: number }) {
  return (
    <g>
      <title>Reflection flower {index + 1}: {flower.label}</title>
      <path d={`M ${x} ${y + 7} Q ${x + flower.tilt * 0.4} ${y + 105} 215 390`}
        stroke="#578468" strokeWidth={4} strokeLinecap="round" fill="none" />
      <path d={`M ${x + 7} ${y + 68} q 22 -34 44 -18 q -18 23 -44 18`}
        fill="#7ca982" opacity={0.82} />
      {Array.from({ length: flower.petals }, (_, p) => (
        <ellipse key={p} cx={x} cy={y - 19} rx={12} ry={22}
          transform={`rotate(${p * (360 / flower.petals) + flower.tilt} ${x} ${y})`}
          fill={flower.color} opacity={0.98} stroke="#fff9f0" strokeWidth={1.3}/>
      ))}
      <circle cx={x} cy={y} r={11.5} fill="#f7da88" stroke={flower.center} strokeWidth={2} />
      <circle cx={x - 3} cy={y - 2} r={1.4} fill="#a47643" />
      <circle cx={x + 2} cy={y + 3} r={1.4} fill="#a47643" />
    </g>
  );
}

export function ThoughtBouquet({ month, flowers, total }: {
  month: string; flowers: Flower[]; total: number;
}) {
  const monthText = new Date(month + "-01T12:00:00Z").toLocaleDateString("en-US", {
    month: "long", year: "numeric", timeZone: "UTC",
  });
  const positions = [
    [148, 190], [220, 132], [295, 190],
    [100, 239], [335, 239], [175, 251],
    [264, 252], [210, 225], [223, 300],
  ] as const;
  function saveBouquet() {
    const drawing = document.getElementById("hoolayah-thought-bouquet");
    if (!(drawing instanceof SVGSVGElement)) return;
    const content = new XMLSerializer().serializeToString(drawing);
    const blob = new Blob([content], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hoolayah-thought-bouquet-${month}.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="mt-5 flex flex-col items-center gap-4">
      <svg id="hoolayah-thought-bouquet" xmlns="http://www.w3.org/2000/svg"
        width="440" height="515" viewBox="0 0 440 515"
        className="w-full max-w-[440px] rounded-3xl border border-[#efdad0] bg-[#fffcf5]"
        role="img" aria-label={`A hand-drawn flower bouquet representing ${total} journal reflections from ${monthText}`}>
        <defs>
          <linearGradient id="bouquet-paper" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f4ddd7" />
            <stop offset="1" stopColor="#f4b6bc" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="440" height="515" rx={18} fill="#fffcf5"/>
        <text x="220" y="46" textAnchor="middle" fontSize="16" fontFamily="Georgia,serif" fill="#80565a">
          Hoolayah · Thought Bouquet
        </text>
        <text x="220" y="73" textAnchor="middle" fontSize="24" fontFamily="Georgia,serif" fill="#3c6a50">
          {monthText}
        </text>
        <g opacity={0.72} fill="#b8cba2">
          <ellipse cx="125" cy="305" rx="12" ry="40" transform="rotate(-35 125 305)" />
          <ellipse cx="321" cy="310" rx="12" ry="45" transform="rotate(37 321 310)" />
          <ellipse cx="145" cy="342" rx="12" ry="40" transform="rotate(-47 145 342)" />
          <ellipse cx="293" cy="342" rx="12" ry="40" transform="rotate(47 293 342)" />
        </g>
        {flowers.slice(0, 9).map((flower, index) => (
          <Bloom key={flower.id} flower={flower}
            x={positions[index][0]} y={positions[index][1]} index={index}/>
        ))}
        <path d="M 95 328 Q 215 356 345 328 L 253 448 Q 215 471 187 448 Z"
          fill="url(#bouquet-paper)" opacity={0.95} stroke="#d9a8ab" strokeWidth={2}/>
        <path d="M 103 325 Q 215 364 335 325" fill="none"
          stroke="#b78085" strokeWidth={3} opacity={0.7}/>
        <path d="M 198 391 Q 220 379 235 393 Q 224 406 211 411 Q 193 402 198 391 Z"
          fill="#ac6b79"/>
        <path d="M 211 401 q -35 25 -18 27 q 16 -4 18 -27 M 211 401 q 34 27 39 18 q -2 -15 -39 -18"
          stroke="#ab6e7c" fill="#e9a3aa" strokeWidth={2}/>
        <text x="220" y="484" textAnchor="middle" fontSize="13" fontFamily="Georgia,serif" fill="#80565a">
          {total} {total === 1 ? "thought" : "thoughts"} kept · grown from your words
        </text>
      </svg>
      <button type="button" className="secondary-button" onClick={saveBouquet}>
        Save my bouquet as an SVG image
      </button>
      <p className="max-w-md text-center text-xs text-[#806d68]">
        The flowers and colors represent your written entries. No journal text is sent to an image service.
        You can keep this image on your device.
      </p>
    </div>
  );
}
