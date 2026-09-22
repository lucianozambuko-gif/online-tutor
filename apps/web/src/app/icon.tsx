import { ImageResponse } from "next/og";
import { LumenIconMark } from "@/lib/app-icon-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<LumenIconMark size={32} />, size);
}
