import React, { useState } from 'react';
import { resolveAssetUrl, TRUST_EMBLEM_LOGO } from '../assets';

export interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  showBrokenPlaceholder?: boolean;
}

/**
 * Builds an ordered list of candidate URLs for an image asset.
 * Tries Vite bundled path first, then multiple public directory fallback paths.
 */
function getCandidateUrls(src: string | undefined | null, fallbackSrc?: string): string[] {
  if (!src) return [];
  if (src.startsWith('data:') || src.startsWith('blob:')) return [src];

  const resolved = resolveAssetUrl(src);
  const candidates: string[] = [];

  // 1. Primary candidate: The Vite bundled URL or resolved path
  candidates.push(resolved);

  // If original src is different from resolved, include it
  if (src && src !== resolved) {
    candidates.push(src);
  }

  // Extract base filename (stripping Vite hash if present)
  const filename = (resolved.split('/').pop() || src.split('/').pop() || '')
    .split('?')[0]
    .split('#')[0];
  const unhashedFilename = filename.replace(/-[A-Za-z0-9_-]{8}\.(jpg|jpeg|png|webp|svg)$/i, '.$1');

  if (unhashedFilename && unhashedFilename.includes('.')) {
    candidates.push(`/assets/images/${unhashedFilename}`);
    candidates.push(`/images/${unhashedFilename}`);
    candidates.push(`/${unhashedFilename}`);
    candidates.push(`/assets/${unhashedFilename}`);
    candidates.push(`/src/assets/images/${unhashedFilename}`);
  }

  // Fallback candidate if specified or default emblem
  if (fallbackSrc) {
    candidates.push(resolveAssetUrl(fallbackSrc));
  } else if (!unhashedFilename.includes('trust_emblem_logo')) {
    candidates.push(TRUST_EMBLEM_LOGO);
    candidates.push('/assets/images/trust_emblem_logo_1790500141646.jpg');
    candidates.push('/images/trust_emblem_logo_1790500141646.jpg');
    candidates.push('/trust_emblem_logo_1790500141646.jpg');
  }

  // Deduplicate while preserving priority order
  return Array.from(new Set(candidates.filter(Boolean)));
}

/**
 * Production-ready Safe Image Component for Vite & Vercel
 *
 * - Automatically resolves legacy or direct asset paths via Vite bundle mapping
 * - Multi-tiered fallback: Vite bundle -> /assets/images/ -> /images/ -> root public -> fallback
 * - Maintains accessibility, lazy-loading, and responsive styles
 */
export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = 'Image',
  fallbackSrc,
  className = '',
  showBrokenPlaceholder = true,
  onError,
  ...rest
}) => {
  const candidates = React.useMemo(() => getCandidateUrls(src, fallbackSrc), [src, fallbackSrc]);
  const [candidateIndex, setCandidateIndex] = useState<number>(0);

  React.useEffect(() => {
    setCandidateIndex(0);
  }, [src, fallbackSrc]);

  const currentSrc = candidates[candidateIndex];

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (candidateIndex < candidates.length - 1) {
      // Try next candidate fallback URL
      setCandidateIndex((prev) => prev + 1);
    } else {
      // All fallback candidates exhausted
      if (onError) {
        onError(e);
      }
      setCandidateIndex(candidates.length);
    }
  };

  if (!currentSrc || candidateIndex >= candidates.length) {
    if (showBrokenPlaceholder) {
      return (
        <div
          className={`bg-slate-100 border border-slate-200 text-slate-500 flex flex-col items-center justify-center p-3 text-center select-none ${className}`}
          role="img"
          aria-label={alt}
        >
          <span className="text-xs font-bold text-slate-600 truncate max-w-full">
            {alt || 'Luv Kush Seva Trust'}
          </span>
        </div>
      );
    }
    return null;
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading={rest.loading || 'lazy'}
      {...rest}
    />
  );
};

export default SafeImage;
