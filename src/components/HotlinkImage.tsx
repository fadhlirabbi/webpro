import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface HotlinkImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export const HotlinkImage: React.FC<HotlinkImageProps> = ({
  src,
  alt,
  className = 'w-10 h-10 rounded-md object-cover',
  fallbackText = '?',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-cyan-600 to-blue-600 text-white flex items-center justify-center font-semibold select-none border border-slate-700`}
        style={{
          borderRadius: className.includes('full') ? '50%' : undefined
        }}
      >
        {fallbackText ? (
          <span className={className.includes('full') ? 'text-sm' : 'text-xs'}>
            {fallbackText.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <ImageOff className="w-4 h-4 text-white/60" />
        )}
      </div>
    );
  }

  return (
    <div className="relative group inline-block overflow-hidden" style={{
      borderRadius: className.includes('full') ? '50%' : undefined
    }}>
      {isLoading && (
        <div className={`${className} bg-slate-800 animate-pulse flex items-center justify-center`}>
          <span className="text-[10px] text-gray-500">...</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`${className} ${isLoading ? 'hidden' : 'block'} object-cover transition-transform duration-200 group-hover:scale-105`}
      />
    </div>
  );
};
