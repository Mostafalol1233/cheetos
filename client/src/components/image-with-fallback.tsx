import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/lib/queryClient";

export default function ImageWithFallback({ src, alt, className, width, height, sizes }: { src: string; alt: string; className?: string; width?: number; height?: number; sizes?: string }) {
  const [current, setCurrent] = useState<string>(src);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const placeholderSrc = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="%23111827"/><stop offset="1" stop-color="%230f172a"/></linearGradient></defs><rect width="800" height="450" fill="url(%23g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2364748b" font-size="28" font-family="sans-serif">Image unavailable</text></svg>';

  useEffect(() => {
    setCurrent(src);
    setErrorCount(0);
    setIsLoading(true);
  }, [src]);

  const normalizeImageSrc = (imgSrc: string): string => {
    if (!imgSrc) return placeholderSrc;
    
    // If it's already a full URL (http/https), return as is
    if (/^https?:\/\//i.test(imgSrc)) {
      return imgSrc;
    }
    
    // If it starts with /attached_assets/, serve it directly from the public folder
    if (imgSrc.startsWith('/attached_assets/')) {
      return imgSrc;
    }
    
    // If it starts with /, it's a relative path from the root
    if (imgSrc.startsWith('/')) {
      return imgSrc;
    }
    
    // Otherwise, treat as a relative path from the root
    return `/${imgSrc}`;
  };

  const isSupportedFormat = (imgSrc: string): boolean => {
    return /\.(png|jpg|jpeg|svg|webp)$/i.test(imgSrc) || /^https?:\/\//i.test(imgSrc) || /^data:image\//i.test(imgSrc);
  };

  const onError = () => {
    const nextErrorCount = errorCount + 1;
    setErrorCount(nextErrorCount);
    if (current !== placeholderSrc) {
      setIsLoading(true);
      setCurrent(placeholderSrc);
      return;
    }
    setIsLoading(false);
  };
  
  const onLoad: React.ReactEventHandler<HTMLImageElement> = (e) => {
    const img = e.currentTarget;
    if (!isSupportedFormat(current)) {
      onError();
      return;
    }
        setIsLoading(false);
  };
  
  const normalizedSrc = normalizeImageSrc(current);
  
  return (
    <>
      {isLoading && <Skeleton className={`${className} bg-gray-800`} />}
      <img 
        src={normalizedSrc} 
        alt={alt} 
        className={`${className} ${isLoading ? 'hidden' : ''}`} 
        loading="lazy" 
        decoding="async"
        width={width}
        height={height}
        sizes={sizes}
        onLoad={onLoad}
        onError={onError}
        crossOrigin="anonymous"
        data-testid="game-image"
        data-src={src}
      />
    </>
  );
}
