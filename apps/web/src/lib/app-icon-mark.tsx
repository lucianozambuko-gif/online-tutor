// Shared visual for every generated app icon (favicon, apple-touch-icon,
// and the manifest PNGs) so they all render the same Lumen mark instead of
// drifting out of sync as separate hand-tuned JSX trees.
//
// `orbScale` controls how much of the tile the gold orb fills. Maskable
// manifest icons need extra breathing room since Android/iOS crop them into
// a circle, squircle, or rounded square depending on the device — content
// outside the center ~66% safe zone can get clipped.
export function LumenIconMark({ size, orbScale = 0.56 }: { size: number; orbScale?: number }) {
  const orb = Math.round(size * orbScale);
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0d1b2e 0%, #1f5f9c 100%)",
      }}
    >
      <div
        style={{
          width: orb,
          height: orb,
          borderRadius: "9999px",
          background: "linear-gradient(135deg, #ecd28f 0%, #a97e26 100%)",
        }}
      />
    </div>
  );
}
