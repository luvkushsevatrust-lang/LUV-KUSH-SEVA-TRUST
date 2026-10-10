/**
 * Client-side image compression utility to prevent LocalStorage QuotaExceeded errors
 * Scales large mobile phone photos (3-12MB) down to crisp, lightweight web images (30-80KB)
 */

export async function compressImageFile(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
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
          let { width, height } = img;

          // Calculate scaled dimensions maintaining aspect ratio
          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              maxHeight = Math.round(maxHeight);
              height = Math.round((height * maxWidth) / img.width);
            }
          }

          // Ensure minimum valid dimension
          width = Math.max(1, Math.round(width));
          height = Math.max(1, Math.round(height));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawDataUrl);
            return;
          }

          // Fill white background for transparent PNG/WebP being converted to JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Draw scaled image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to compressed JPEG data URL
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          // If canvas processing fails, fallback to raw data
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
