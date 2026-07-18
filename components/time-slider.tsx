"use client";

import { useState } from "react";

const PRESETS = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
  { label: "30d", hours: 720 },
  { label: "All", hours: 0 },
];

interface TimeSliderProps {
  onChange: (sinceIso: string | null) => void;
}

export function TimeSlider({ onChange }: TimeSliderProps) {
  const [index, setIndex] = useState(PRESETS.length - 1); // default: All

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const i = parseInt(e.target.value);
    setIndex(i);
    const preset = PRESETS[i];
    if (preset.hours === 0) {
      onChange(null); // no filter
    } else {
      const since = new Date(Date.now() - preset.hours * 3600_000).toISOString();
      onChange(since);
    }
  }

  return (
    <div className="time-slider-wrap">
      <span className="time-slider-label">Time</span>
      <input
        type="range"
        min={0}
        max={PRESETS.length - 1}
        value={index}
        onChange={handleChange}
        className="time-slider"
      />
      <span className="time-slider-value">{PRESETS[index].label}</span>
    </div>
  );
}
