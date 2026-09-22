export function BrandMark({ className = "h-6 w-6" }: { className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/cloud-uko-mark.png" alt="" className={`${className} shrink-0 object-contain`} />;
}
