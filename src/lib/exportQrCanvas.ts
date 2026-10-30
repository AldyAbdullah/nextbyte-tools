import { CompleteQrConfig, ExportResolution } from '@/types/qrcode';

interface DrawExportOptions {
  qrCanvas: HTMLCanvasElement;
  config: CompleteQrConfig;
  resolution: ExportResolution;
  transparentBackground: boolean;
}

/**
 * Menggambar seluruh elemen (Frame, QR Code, Banner, Text) ke dalam satu Canvas beresolusi tinggi
 */
export async function renderCompositeCanvas(options: DrawExportOptions): Promise<HTMLCanvasElement> {
  const { qrCanvas, config, resolution, transparentBackground } = options;
  const { frame, subText, colors } = config;

  // Base dimensions
  const scale = resolution; // 1 = 300px, 2 = 600px, 4 = 1200px
  const baseQrSize = 300;
  const qrSize = baseQrSize * scale;

  const padding = (frame.style !== 'none' ? Math.max(frame.padding, 16) : (colors.isBackgroundTransparent ? 12 : 24)) * scale;
  const borderRadius = (frame.style !== 'none' ? frame.borderRadius : 16) * scale;
  const borderWidth = (frame.style !== 'none' ? frame.borderWidth : 0) * scale;

  // Frame banner height calculation
  const hasFrameBanner = frame.style !== 'none' && frame.text.trim().length > 0;
  const bannerHeight = hasFrameBanner ? 44 * scale : 0;
  const bannerGap = hasFrameBanner ? 12 * scale : 0;

  // Subtext height calculation
  const hasSubText = subText.enabled && subText.text.trim().length > 0;
  const subTextFontSize = (subText.fontSize || 14) * scale;
  const subTextSpacing = (subText.spacing || 12) * scale;
  const subTextHeight = hasSubText ? (subTextFontSize * 1.4 + subTextSpacing) : 0;

  // Total Canvas Dimensions
  const totalWidth = qrSize + (padding * 2) + (borderWidth * 2);
  let totalHeight = qrSize + (padding * 2) + (borderWidth * 2) + subTextHeight;

  if (hasFrameBanner) {
    totalHeight += bannerHeight + bannerGap;
  }

  // Camera frame extra spacing if needed
  if (frame.style === 'camera-frame') {
    totalHeight += 16 * scale;
  }

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context from canvas');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Draw Card Background
  if (!transparentBackground) {
    const bgColor = (frame.style !== 'none' && frame.backgroundColor) 
      ? frame.backgroundColor 
      : (colors.isBackgroundTransparent ? '#ffffff' : colors.backgroundColor);

    ctx.save();
    ctx.fillStyle = bgColor;

    // Rounded rectangle path
    drawRoundedRect(ctx, borderWidth / 2, borderWidth / 2, totalWidth - borderWidth, totalHeight - borderWidth, borderRadius);
    ctx.fill();

    if (borderWidth > 0 && frame.style !== 'none') {
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = frame.frameColor || '#0f172a';
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Draw Frame Banner (if Top)
  let qrOffsetY = padding + borderWidth;

  if (hasFrameBanner && frame.textPosition === 'top') {
    drawBanner(ctx, {
      text: frame.text,
      textColor: frame.textColor || '#ffffff',
      bannerColor: frame.frameColor || '#0f172a',
      style: frame.style,
      x: padding + borderWidth,
      y: padding + borderWidth,
      width: qrSize,
      height: bannerHeight,
      scale,
      position: 'top',
    });
    qrOffsetY += bannerHeight + bannerGap;
  }

  // 3. Draw Camera Viewfinder Accents if camera-frame
  if (frame.style === 'camera-frame') {
    drawCameraCorners(ctx, {
      x: padding + borderWidth - 6 * scale,
      y: qrOffsetY - 6 * scale,
      size: qrSize + 12 * scale,
      color: frame.frameColor || '#0f172a',
      scale,
    });
  }

  // 4. Draw QR Code
  const qrOffsetX = padding + borderWidth;
  ctx.drawImage(qrCanvas, qrOffsetX, qrOffsetY, qrSize, qrSize);

  // 4.1 Draw Custom Logo Background Badge & High-Resolution Logo
  if (config.logo.logoDataUrl) {
    await drawCustomLogo(ctx, {
      logoDataUrl: config.logo.logoDataUrl,
      logoSize: config.logo.logoSize,
      logoMargin: config.logo.logoMargin,
      logoBackground: config.logo.logoBackground,
      centerQrX: qrOffsetX + (qrSize / 2),
      centerQrY: qrOffsetY + (qrSize / 2),
      qrSize,
      scale,
    });
  }

  let currentY = qrOffsetY + qrSize;

  // 5. Draw Frame Banner (if Bottom)
  if (hasFrameBanner && frame.textPosition === 'bottom') {
    currentY += bannerGap;
    drawBanner(ctx, {
      text: frame.text,
      textColor: frame.textColor || '#ffffff',
      bannerColor: frame.frameColor || '#0f172a',
      style: frame.style,
      x: qrOffsetX,
      y: currentY,
      width: qrSize,
      height: bannerHeight,
      scale,
      position: 'bottom',
    });
    currentY += bannerHeight;
  }

  // 6. Draw SubText below QR Code
  if (hasSubText) {
    currentY += subTextSpacing;
    ctx.save();
    ctx.fillStyle = subText.color || '#64748b';

    const fontStyle = subText.fontWeight === '700' ? 'bold ' : subText.fontWeight === '600' ? '600 ' : '';
    let fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    if (subText.fontFamily === 'mono') fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';
    if (subText.fontFamily === 'serif') fontFamily = 'Georgia, Cambria, serif';
    if (subText.fontFamily === 'display') fontFamily = 'Arial Black, Impact, sans-serif';

    ctx.font = `${fontStyle}${subTextFontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';

    let textX = qrOffsetX + (qrSize / 2);
    if (subText.align === 'left') {
      ctx.textAlign = 'left';
      textX = qrOffsetX;
    } else if (subText.align === 'right') {
      ctx.textAlign = 'right';
      textX = qrOffsetX + qrSize;
    } else {
      ctx.textAlign = 'center';
    }

    ctx.fillText(subText.text, textX, currentY);
    ctx.restore();
  }

  return canvas;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

interface BannerProps {
  text: string;
  textColor: string;
  bannerColor: string;
  style: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  position: 'top' | 'bottom';
}

function drawBanner(ctx: CanvasRenderingContext2D, props: BannerProps) {
  const { text, textColor, bannerColor, style, x, y, width, height, scale, position } = props;

  ctx.save();
  ctx.fillStyle = bannerColor;

  if (style === 'bubble-top' || style === 'bubble-bottom') {
    // Bubble shape with a small triangle pointer
    const r = 12 * scale;
    drawRoundedRect(ctx, x, y, width, height - (4 * scale), r);
    ctx.fill();

    // Small triangle pointer
    ctx.beginPath();
    const centerX = x + width / 2;
    if (position === 'top') {
      ctx.moveTo(centerX - 8 * scale, y + height - 4 * scale);
      ctx.lineTo(centerX + 8 * scale, y + height - 4 * scale);
      ctx.lineTo(centerX, y + height);
    } else {
      ctx.moveTo(centerX - 8 * scale, y);
      ctx.lineTo(centerX + 8 * scale, y);
      ctx.lineTo(centerX, y - 4 * scale);
    }
    ctx.closePath();
    ctx.fill();
  } else if (style === 'card-banner') {
    // Modern pill badge in center
    const badgeWidth = Math.min(width * 0.85, (ctx.measureText(text).width || 120) + 40 * scale);
    const badgeX = x + (width - badgeWidth) / 2;
    drawRoundedRect(ctx, badgeX, y, badgeWidth, height, height / 2);
    ctx.fill();
  } else {
    // Basic rectangle or rounded bar
    const r = 10 * scale;
    drawRoundedRect(ctx, x, y, width, height, r);
    ctx.fill();
  }

  // Draw Text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${Math.round(15 * scale)}px Inter, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), x + width / 2, y + height / 2);

  ctx.restore();
}

function drawCameraCorners(
  ctx: CanvasRenderingContext2D,
  props: { x: number; y: number; size: number; color: string; scale: number }
) {
  const { x, y, size, color, scale } = props;
  const lineLength = 24 * scale;
  const lineWidth = 4 * scale;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Top-left
  ctx.beginPath();
  ctx.moveTo(x, y + lineLength);
  ctx.lineTo(x, y);
  ctx.lineTo(x + lineLength, y);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + size - lineLength, y);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size, y + lineLength);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x, y + size - lineLength);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x + lineLength, y + size);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + size - lineLength, y + size);
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x + size, y + size - lineLength);
  ctx.stroke();

  ctx.restore();
}

const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load logo image'));
    img.src = src;
  });
}

interface DrawCustomLogoProps {
  logoDataUrl: string;
  logoSize: number;
  logoMargin: number;
  logoBackground: 'transparent' | 'white' | 'circle-white' | 'square-white';
  centerQrX: number;
  centerQrY: number;
  qrSize: number;
  scale: number;
}

async function drawCustomLogo(ctx: CanvasRenderingContext2D, props: DrawCustomLogoProps) {
  const {
    logoDataUrl,
    logoSize,
    logoMargin,
    logoBackground,
    centerQrX,
    centerQrY,
    qrSize,
    scale,
  } = props;

  const baseLogoSize = qrSize * logoSize;
  const paddingPx = logoMargin * scale;

  ctx.save();

  // 1. Draw Background Badge Shape
  if (logoBackground === 'circle-white') {
    const badgeRadius = (baseLogoSize / 2) + paddingPx;
    ctx.beginPath();
    ctx.arc(centerQrX, centerQrY, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetY = 1 * scale;
    ctx.fill();

    // Clean subtle edge
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = Math.max(1, 1 * scale);
    ctx.stroke();
  } else if (logoBackground === 'square-white') {
    const badgeSize = baseLogoSize + (paddingPx * 2);
    const badgeX = centerQrX - (badgeSize / 2);
    const badgeY = centerQrY - (badgeSize / 2);
    const badgeRadius = Math.min(14 * scale, badgeSize * 0.22);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetY = 1 * scale;
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(ctx, badgeX, badgeY, badgeSize, badgeSize, badgeRadius);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = Math.max(1, 1 * scale);
    ctx.stroke();
  } else if (logoBackground === 'white') {
    const badgeSize = baseLogoSize + (paddingPx * 2);
    const badgeX = centerQrX - (badgeSize / 2);
    const badgeY = centerQrY - (badgeSize / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(badgeX, badgeY, badgeSize, badgeSize);
  }

  ctx.restore();

  // 2. Draw High-Resolution Logo Image
  try {
    const img = await getCachedImage(logoDataUrl);
    const naturalW = img.naturalWidth || baseLogoSize;
    const naturalH = img.naturalHeight || baseLogoSize;
    const aspect = naturalW / naturalH;

    let drawW = baseLogoSize;
    let drawH = baseLogoSize;
    if (aspect > 1) {
      drawH = baseLogoSize / aspect;
    } else if (aspect < 1) {
      drawW = baseLogoSize * aspect;
    }

    const drawX = centerQrX - (drawW / 2);
    const drawY = centerQrY - (drawH / 2);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  } catch (err) {
    console.warn('Could not draw custom logo image:', err);
  }
}

/**
 * Trigger download file dari canvas
 */
export async function downloadCompositeImage(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpg',
  fileName: string
): Promise<void> {
  let targetCanvas = canvas;

  if (format === 'jpg') {
    // Flatten onto solid white background to avoid black background or black transparent corners in JPEG
    const flattened = document.createElement('canvas');
    flattened.width = canvas.width;
    flattened.height = canvas.height;
    const ctx = flattened.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, flattened.width, flattened.height);
      ctx.drawImage(canvas, 0, 0);
      targetCanvas = flattened;
    }
  }

  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpg' ? 0.98 : 1.0;

  return new Promise((resolve, reject) => {
    targetCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${fileName || 'nextbyte-qrcode'}.${format}`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        resolve();
      },
      mimeType,
      quality
    );
  });
}

/**
 * Salin gambar ke Clipboard sistem
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (err) {
        console.warn('Clipboard write failed:', err);
        resolve(false);
      }
    }, 'image/png');
  });
}
