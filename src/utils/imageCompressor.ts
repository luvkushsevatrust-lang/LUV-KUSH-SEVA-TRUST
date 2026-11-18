/**
 * Client-side image compression utility to prevent LocalStorage QuotaExceeded errors
 * Scales large mobile phone photos (3-12MB) down to crisp, lightweight web images (30-80KB)
 */

function encodeCanvasWithBudget(
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  initialQuality: number,
  maxBytes = 95 * 1024
): string | null {
  let { width, height } = img;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.max(1, Math.round(width * ratio));
  height = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  let q = initialQuality;
  let result = canvas.toDataURL('image/jpeg', q);

  // Step down quality gently if encoded Base64 still exceeds target byte budget
  while (result.length > maxBytes * 1.37 && q > 0.48) {
    q = Math.max(0.45, Number((q - 0.1).toFixed(2)));
    result = canvas.toDataURL('image/jpeg', q);
  }
  return result;
}

export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.72,
  maxBytes = 95 * 1024
): Promise<string> {
  // If not an image (e.g. PDF file), read as standard data URL
  if (!file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // If already a tiny SVG or icon under 20KB, read directly
  if (file.type === 'image/svg+xml' || (file.size < 20 * 1024 && file.type === 'image/webp')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        resolve('');
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const compressed = encodeCanvasWithBudget(img, maxWidth, maxHeight, quality, maxBytes);
          resolve(compressed || rawDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };

      img.onerror = () => {
        resolve(rawDataUrl);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      resolve('');
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Re-compresses an existing oversized Base64 data URL (used to auto-shrink legacy DB images)
 */
export async function compressBase64DataUrl(
  dataUrl: string,
  maxWidth = 680,
  maxHeight = 680,
  quality = 0.7,
  maxBytes = 85 * 1024
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.startsWith('data:image/svg+xml')) {
    return dataUrl;
  }
  if (dataUrl.length <= maxBytes * 1.37) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const compressed = encodeCanvasWithBudget(img, maxWidth, maxHeight, quality, maxBytes);
        if (compressed && compressed.length < dataUrl.length) {
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
