import { ImageResponse } from "next/og";
import { LumenIconMark } from "@/lib/app-icon-mark";

// Android crops maskable icons into a circle/squircle/rounded square
// depending on the launcher, so the orb needs to stay well inside the
// center safe zone instead of filling the tile like the "any" icons do.
export function GET() {
  return new ImageResponse(<LumenIconMark size={512} orbScale={0.36} />, { width: 512, height: 512 });
}
