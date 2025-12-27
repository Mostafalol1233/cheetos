import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ImageWithFallback({ src, alt, className, width, height, sizes }: { src: string; alt: string; className?: string; width?: number; height?: number; sizes?: string }) {
  const [current, setCurrent] = useState<string>(src);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCurrent(src);
    setErrorCount(0);
    setIsLoading(true);
  }, [src]);

  const normalizeImageSrc = (imgSrc: string): string => {
    if (!imgSrc) return '';
    
    // If it's already a full URL (http/https), return as is
    if (/^https?:\/\//i.test(imgSrc)) {
      return imgSrc;
    }
    
    // If it starts with /, it's a relative path - ensure it's served correctly
    if (imgSrc.startsWith('/')) {
      return imgSrc;
    }
    
    // If it's a Cloudinary URL without protocol, add https
    if (imgSrc.includes('cloudinary.com') && !imgSrc.startsWith('http')) {
      return `https://${imgSrc}`;
    }
    
    // Otherwise, treat as relative path
    return `/${imgSrc}`;
  };

  const isSupportedFormat = (imgSrc: string): boolean => {
    return /\.(png|jpg|jpeg|svg|webp)$/i.test(imgSrc) || /^https?:\/\//i.test(imgSrc) || /^data:image\//i.test(imgSrc);
  };

  const onError = () => {
    setIsLoading(false);
    setErrorCount(errorCount + 1);
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
