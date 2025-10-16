import React from "react";

interface GaugeSpeedoMeterProps {
  percent: number;            // percentage value (0–100)
  width?: number;             // overall width of the SVG
  height?: number;            // overall height of the SVG
  strokeWidth?: number;       // thickness of the gauge arc
  label?: string;             // label text below the gauge
  main?: string;              // main text in the center
  sub?: string;               // sub text below main
}

const GaugeSpeedoMeter: React.FC<GaugeSpeedoMeterProps> = ({
  percent,
  width = 280,
  height = 160,
  strokeWidth = 18,
  label = "",
  main = "",
  sub = "",
}) => {
  // ensure safe percent range
  const safePercent = Math.max(0, Math.min(percent, 100));

  // calculate arc values
  const radius = (width - strokeWidth) / 2;
  const centerX = width / 2;
  const centerY = height;
  const circumference = Math.PI * radius;
  const arcLength = (safePercent / 100) * circumference;

  return (
    <div style={{ textAlign: "center", width, height }}>
      <svg width={width} height={height / 1.2}>
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${
            centerX + radius
          } ${centerY}`}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${
            centerX + radius
          } ${centerY}`}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>

      {/* Main numeric display */}
      {main && (
        <div style={{ fontSize: 28, fontWeight: 700, marginTop: -8 }}>
          {main}
        </div>
      )}
      {/* Sub text (e.g., 2500 / 5000) */}
      {sub && (
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
          {sub}
        </div>
      )}
      {/* Label (e.g., Turnout Ratio) */}
      {label && (
        <div
          style={{
            fontSize: 14,
            color: "#111827",
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
};

export default GaugeSpeedoMeter;
