import { ImageResponse } from "next/og";
import { LumenIconMark } from "@/lib/app-icon-mark";

export function GET() {
  return new ImageResponse(<LumenIconMark size={512} />, { width: 512, height: 512 });
}
