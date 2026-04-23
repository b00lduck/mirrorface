import { useEffect, useState } from "react";

interface UseMirrorImageParams {
  sourceImage: string | null;
  mirrorPosition: number; // percentage 0-100
  mode: "left" | "right"; // which side to mirror
  deadZone: number; // percentage of non-mirrored area around mirror line
  contrast?: number; // percent, 100 = normal
  brightness?: number; // percent, 100 = normal
  saturation?: number; // percent, 100 = normal
}

/**
 * Custom hook to create a mirrored image effect
 * Left side shows original pixels, right side shows mirrored left side
 */
export function useMirrorImage({
  sourceImage,
  mirrorPosition,
  mode = "left",
  deadZone,
  contrast = 100,
  brightness = 100,
  saturation = 100,
}: UseMirrorImageParams) {
  const [mirroredImage, setMirroredImage] = useState<string | null>(null);

  // Clamp mirrorPosition to avoid 0% or 100%
  useEffect(() => {
    if (sourceImage) {
      // Clamp between 1 and 99
      const safeMirrorPosition = Math.max(1, Math.min(99, mirrorPosition));
      processMirrorEffect(
        sourceImage,
        safeMirrorPosition,
        mode,
        deadZone,
        contrast,
        brightness,
        saturation,
      );
    } else {
      setMirroredImage(null);
    }
  }, [
    sourceImage,
    mirrorPosition,
    mode,
    deadZone,
    contrast,
    brightness,
    saturation,
  ]);

  const processMirrorEffect = (
    imageSrc: string,
    mirrorLinePosition: number,
    mode: "left" | "right" = "left",
    deadZone: number = 0,
    contrast: number = 100,
    brightness: number = 100,
    saturation: number = 100,
  ) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Could not get canvas context for mirror");
        return;
      }

      // Calculate the mirror line position in pixels
      const mirrorX = (img.width * mirrorLinePosition) / 100;
      // Dead zone is in pixels, centered on mirrorX
      const dz = Math.max(0, Math.min(deadZone, img.width));
      const dzHalf = dz / 2;

      // For left mode: left side is [0, mirrorX - dz/2), right side is [mirrorX + dz/2, mirrorX + dz/2 + (mirrorX - dz/2))
      // For right mode: right side is [mirrorX + dz/2, img.width), left side is [mirrorX - dz/2 - (img.width - (mirrorX + dz/2)), mirrorX - dz/2)

      canvas.height = img.height;

      // Helper to apply contrast/brightness to a region
      function applyAdjustmentsToRegion(
        sx: number,
        sy: number,
        sw: number,
        sh: number,
        dx: number,
        dy: number,
        dw: number,
        dh: number,
      ) {
        const temp = document.createElement("canvas");
        temp.width = sw;
        temp.height = sh;
        const tctx = temp.getContext("2d");
        tctx?.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const imageData = tctx?.getImageData(0, 0, sw, sh);
        if (imageData) {
          const data = imageData.data;
          const c = contrast / 100;
          const b = brightness / 100;
          const s = saturation / 100;
          for (let i = 0; i < data.length; i += 4) {
            // Brightness
            data[i] = Math.min(255, Math.max(0, data[i] * b));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * b));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * b));
            // Contrast
            data[i] = Math.min(255, Math.max(0, (data[i] - 128) * c + 128));
            data[i + 1] = Math.min(
              255,
              Math.max(0, (data[i + 1] - 128) * c + 128),
            );
            data[i + 2] = Math.min(
              255,
              Math.max(0, (data[i + 2] - 128) * c + 128),
            );
            // Saturation
            // Convert to HSL, adjust S, convert back
            let r = data[i] / 255;
            let g = data[i + 1] / 255;
            let b2 = data[i + 2] / 255;
            const max = Math.max(r, g, b2),
              min = Math.min(r, g, b2);
            let h = 0,
              s0 = 0,
              l = (max + min) / 2;
            if (max !== min) {
              const d = max - min;
              s0 = l > 0.5 ? d / (2 - max - min) : d / (max + min);
              switch (max) {
                case r:
                  h = (g - b2) / d + (g < b2 ? 6 : 0);
                  break;
                case g:
                  h = (b2 - r) / d + 2;
                  break;
                case b2:
                  h = (r - g) / d + 4;
                  break;
              }
              h /= 6;
            }
            // Apply saturation
            s0 *= s;
            // Convert back to RGB
            function hue2rgb(p: number, q: number, t: number) {
              if (t < 0) t += 1;
              if (t > 1) t -= 1;
              if (t < 1 / 6) return p + (q - p) * 6 * t;
              if (t < 1 / 2) return q;
              if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
              return p;
            }
            let r1, g1, b1;
            if (s0 === 0) {
              r1 = g1 = b1 = l; // achromatic
            } else {
              const q = l < 0.5 ? l * (1 + s0) : l + s0 - l * s0;
              const p = 2 * l - q;
              r1 = hue2rgb(p, q, h + 1 / 3);
              g1 = hue2rgb(p, q, h);
              b1 = hue2rgb(p, q, h - 1 / 3);
            }
            data[i] = Math.min(255, Math.max(0, r1 * 255));
            data[i + 1] = Math.min(255, Math.max(0, g1 * 255));
            data[i + 2] = Math.min(255, Math.max(0, b1 * 255));
          }
          tctx?.putImageData(imageData, 0, 0);
        }
        if (ctx) {
          ctx.drawImage(temp, 0, 0, sw, sh, dx, dy, dw, dh);
        }
      }

      if (mode === "left") {
        const leftWidth = mirrorX - dzHalf;
        const rightWidth = leftWidth;
        canvas.width = leftWidth + rightWidth - 1;

        // Draw left side (original, with adjustments)
        applyAdjustmentsToRegion(
          0,
          0,
          leftWidth,
          img.height,
          0,
          0,
          leftWidth,
          img.height,
        );

        // Draw right side (mirrored, with adjustments)
        ctx.save();
        ctx.translate(leftWidth + dz + rightWidth, 0);
        ctx.scale(-1, 1);
        applyAdjustmentsToRegion(
          0,
          0,
          leftWidth,
          img.height,
          dz + 1,
          0,
          leftWidth,
          img.height,
        );
        ctx.restore();
      } else {
        // mode === "right"
        const rightWidth = img.width - (mirrorX + dzHalf);
        const leftWidth = rightWidth;
        canvas.width = leftWidth + rightWidth - 1;

        // Draw left side (mirrored, with adjustments)
        ctx.save();
        ctx.translate(leftWidth, 0);
        ctx.scale(-1, 1);
        applyAdjustmentsToRegion(
          mirrorX + dzHalf,
          0,
          rightWidth,
          img.height,
          0,
          0,
          rightWidth,
          img.height,
        );
        ctx.restore();

        // Draw right side (original, with adjustments)
        applyAdjustmentsToRegion(
          mirrorX + dzHalf,
          0,
          rightWidth,
          img.height,
          leftWidth - 1,
          0,
          rightWidth,
          img.height,
        );
      }

      // Convert to data URL
      const mirroredDataUrl = canvas.toDataURL("image/png");
      setMirroredImage(mirroredDataUrl);
    };

    img.onerror = () => {
      setMirroredImage(imageSrc);
    };

    img.src = imageSrc;
  };

  return mirroredImage;
}
