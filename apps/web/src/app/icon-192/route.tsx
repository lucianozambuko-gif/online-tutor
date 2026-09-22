import { ImageResponse } from "next/og";
import { LumenIconMark } from "@/lib/app-icon-mark";

export function GET() {
  return new ImageResponse(<LumenIconMark size={192} />, { width: 192, height: 192 });
}
