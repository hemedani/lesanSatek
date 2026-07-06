export function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none select-none" aria-hidden="true">
      {/* Blueprint micro-pattern — 48×48px SVG <pattern> with controlled irregularities.
          Frost Link dots at 10% opacity, r=1.2. Static, one <rect> draw call. */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="bp-grid" width="48" height="48" patternUnits="userSpaceOnUse">
            {/* Normal dots — Frost Link at 10% */}
            <g fill="rgba(182, 217, 252, 0.10)">
              { /* Row 0 (y=3): cols 0,1,2,4,5,7 */ }
              <circle cx="3" cy="3" r="1.2" /><circle cx="9" cy="3" r="1.2" />
              <circle cx="15" cy="3" r="1.2" />
              <circle cx="27" cy="3" r="1.2" /><circle cx="33" cy="3" r="1.2" />
              <circle cx="45" cy="3" r="1.2" />
              { /* Row 1 (y=9): cols 0,1,2,3,4,6,7 — omit col 5 (33) */ }
              <circle cx="3" cy="9" r="1.2" /><circle cx="9" cy="9" r="1.2" />
              <circle cx="15" cy="9" r="1.2" /><circle cx="21" cy="9" r="1.2" />
              <circle cx="27" cy="9" r="1.2" /><circle cx="39" cy="9" r="1.2" />
              <circle cx="45" cy="9" r="1.2" />
              { /* Row 2 (y=15): cols 1,2,3,5,6,7 — omit col 0 (3) */ }
              <circle cx="9" cy="15" r="1.2" /><circle cx="15" cy="15" r="1.2" />
              <circle cx="21" cy="15" r="1.2" />
              <circle cx="33" cy="15" r="1.2" /><circle cx="39" cy="15" r="1.2" />
              <circle cx="45" cy="15" r="1.2" />
              { /* Row 3 (y=21): cols 0,1,2,3,4,5,6 */ }
              <circle cx="3" cy="21" r="1.2" /><circle cx="9" cy="21" r="1.2" />
              <circle cx="15" cy="21" r="1.2" /><circle cx="21" cy="21" r="1.2" />
              <circle cx="27" cy="21" r="1.2" /><circle cx="33" cy="21" r="1.2" />
              <circle cx="39" cy="21" r="1.2" />
              { /* Row 4 (y=27): cols 1,2,3,4,5,6,7 — omit col 0 (3) */ }
              <circle cx="9" cy="27" r="1.2" /><circle cx="15" cy="27" r="1.2" />
              <circle cx="21" cy="27" r="1.2" /><circle cx="27" cy="27" r="1.2" />
              <circle cx="33" cy="27" r="1.2" /><circle cx="39" cy="27" r="1.2" />
              <circle cx="45" cy="27" r="1.2" />
              { /* Row 5 (y=33): cols 0,3,4,5,7 — omit col 1 (9); col 6 (39) shifted */ }
              <circle cx="3" cy="33" r="1.2" /><circle cx="21" cy="33" r="1.2" />
              <circle cx="27" cy="33" r="1.2" /><circle cx="33" cy="33" r="1.2" />
              <circle cx="45" cy="33" r="1.2" />
              { /* Row 6 (y=39): cols 0,1,2,3,5,7 — dim col 4 (27) */ }
              <circle cx="3" cy="39" r="1.2" /><circle cx="9" cy="39" r="1.2" />
              <circle cx="15" cy="39" r="1.2" /><circle cx="21" cy="39" r="1.2" />
              <circle cx="33" cy="39" r="1.2" /><circle cx="45" cy="39" r="1.2" />
              { /* Row 7 (y=45): cols 0,3,4,5,6,7 — omit col 1 (9); dim col 2 (15) */ }
              <circle cx="3" cy="45" r="1.2" /><circle cx="21" cy="45" r="1.2" />
              <circle cx="27" cy="45" r="1.2" /><circle cx="33" cy="45" r="1.2" />
              <circle cx="39" cy="45" r="1.2" /><circle cx="45" cy="45" r="1.2" />
            </g>

            {/* Dimmed dots — Frost Link at 5% */}
            <g fill="rgba(182, 217, 252, 0.05)">
              <circle cx="21" cy="3" r="1.2" /><circle cx="39" cy="3" r="1.2" />
              <circle cx="45" cy="21" r="1.2" />
              <circle cx="9" cy="27" r="1.2" />
              <circle cx="27" cy="39" r="1.2" />
              <circle cx="15" cy="45" r="1.2" />
            </g>

            {/* Shifted dots — slight position jitter */}
            <g fill="rgba(182, 217, 252, 0.10)">
              <circle cx="28" cy="15" r="1.2" />
              <circle cx="15" cy="34" r="1.2" />
              <circle cx="40" cy="39" r="1.2" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bp-grid)" />
      </svg>

      {/* Ambient orbs — GPU-composited, behind all content */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  )
}
