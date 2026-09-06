const CHART_WIDTH = 624;
const CHART_HEIGHT = 220;
const TOP_PADDING = 20;

interface DayActivity {
  label: string;
  count: number;
}

function buildPath(values: number[]) {
  const max = Math.max(...values, 1);
  const step = CHART_WIDTH / (values.length - 1);
  const points = values.map((value, i) => ({
    x: i * step,
    y: CHART_HEIGHT - (value / max) * (CHART_HEIGHT - TOP_PADDING),
    value,
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${CHART_WIDTH},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`;
  return { points, line, area };
}

// Highlights the most recent day that has activity, rather than always the
// single highest peak — that reads more naturally as "here's today" when
// several days tie for the top count.
function pickHighlightIndex(values: number[]) {
  const max = Math.max(...values);
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] === max) return i;
  }
  return values.length - 1;
}

export function StudyActivityChart({ days }: { days: DayActivity[] }) {
  const values = days.map((d) => d.count);
  const totalActivity = values.reduce((a, b) => a + b, 0);

  if (totalActivity === 0) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-ink-500">No study activity yet</p>
        <p className="mt-1 text-xs text-ink-300">Generate a note, flashcard set or quiz to see your activity here.</p>
      </div>
    );
  }

  const { points, line, area } = buildPath(values);
  const highlightIndex = pickHighlightIndex(values);
  const highlight = points[highlightIndex];
  const leftPercent = (highlightIndex / (points.length - 1)) * 100;
  const topPercent = (highlight.y / CHART_HEIGHT) * 100;
  const count = days[highlightIndex].count;

  return (
    <div className="relative mt-5" style={{ height: CHART_HEIGHT }}>
      <svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} preserveAspectRatio="none" className="block overflow-visible">
        <line x1="0" y1="40" x2={CHART_WIDTH} y2="40" stroke="#12233b" strokeOpacity="0.06" />
        <line x1="0" y1="110" x2={CHART_WIDTH} y2="110" stroke="#12233b" strokeOpacity="0.06" />
        <line x1="0" y1="180" x2={CHART_WIDTH} y2="180" stroke="#12233b" strokeOpacity="0.06" />
        <defs>
          <linearGradient id="studyActivityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6fb3e8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6fb3e8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#studyActivityFill)" />
        <path d={line} fill="none" stroke="#2f7dc2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={highlight.x} cy={highlight.y} r="5.5" fill="#ffffff" stroke="#2f7dc2" strokeWidth="3" />
      </svg>

      <div
        className="absolute -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
        style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
      >
        {count} {count === 1 ? "item" : "items"} · {days[highlightIndex].label}
        <div className="absolute bottom-[-4px] left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-ink-900" />
      </div>

      <div className="absolute inset-x-0 -bottom-6 flex justify-between text-[11px] text-ink-300">
        <span>{days[0].label}</span>
        <span>{days[Math.floor(days.length / 3)].label}</span>
        <span>{days[Math.floor((days.length * 2) / 3)].label}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export type { DayActivity };
