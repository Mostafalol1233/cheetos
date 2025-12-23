import { useState } from "react";

export default function ImageWithFallback({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [current, setCurrent] = useState<string>(src);
  const onError = () => {
    const svg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='#111'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#888' font-size='20'>Image unavailable</text></svg>`);
    setCurrent(`data:image/svg+xml,${svg}`);
  };
  return <img src={current} alt={alt} className={className} loading="lazy" onError={onError} />;
}

