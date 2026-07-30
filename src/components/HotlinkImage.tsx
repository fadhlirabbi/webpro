import React, { useState } from 'react';
import { ImageOff, ExternalLink, Code } from 'lucide-react';

interface HotlinkImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  showHotlinkAction?: boolean;
  onCopyHotlink?: (code: string) => void;
}

export const HotlinkImage: React.FC<HotlinkImageProps> = ({
  src,
  alt,
  className = 'w-10 h-10 rounded-md object-cover',
  fallbackText = '?',
  showHotlinkAction = false,
  onCopyHotlink,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    return (
      <div
        className={`${className} bg-[#2a2a2a] text-[#c4c7c8] flex items-center justify-center font-medium text-xs select-none border border-[#353534] shadow-inner`}
        title={`Failed to load hotlink: ${src || 'No URL'}`}
      >
        {fallbackText ? (
          <span>{fallbackText.slice(0, 2).toUpperCase()}</span>
        ) : (
          <ImageOff className="w-4 h-4 text-gray-500" />
        )}
      </div>
    );
  }

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const htmlCode = `<img src="${src}" alt="${alt}" loading="lazy" />`;
    if (onCopyHotlink) {
      onCopyHotlink(htmlCode);
    } else {
      navigator.clipboard.writeText(htmlCode);
      alert('HTML Hotlink Tag disalin:\n' + htmlCode);
    }
  };

  return (
    <div className="relative group inline-block overflow-hidden rounded-md">
      {isLoading && (
        <div className={`${className} bg-[#201f1f] animate-pulse flex items-center justify-center`}>
          <span className="text-[10px] text-gray-500">Loading...</span>
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

      {showHotlinkAction && !isLoading && !hasError && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
          <button
            type="button"
            onClick={handleCopy}
            title="Salin HTML <img /> tag hotlink"
            className="p-1.5 bg-[#00eefc] text-black rounded hover:bg-cyan-300 transition-colors text-xs font-semibold flex items-center gap-1 shadow-lg"
          >
            <Code className="w-3 h-3" />
            <span className="text-[10px] hidden sm:inline">HTML</span>
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka gambar asli"
            className="p-1.5 bg-[#2a2a2a] text-white rounded hover:bg-gray-700 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
};
