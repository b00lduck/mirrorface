import { useEffect, useState } from "react";

interface UseMirrorImageParams {
  sourceImage: string | null;
  mirrorPosition: number; // percentage 0-100
  mode: "left" | "right"; // which side to mirror
  deadZone: number; // percentage of non-mirrored area around mirror line
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
}: UseMirrorImageParams) {
  const [mirroredImage, setMirroredImage] = useState<string | null>(null);

  // Clamp mirrorPosition to avoid 0% or 100%
  useEffect(() => {
    if (sourceImage) {
      // Clamp between 1 and 99
      const safeMirrorPosition = Math.max(1, Math.min(99, mirrorPosition));
      processMirrorEffect(sourceImage, safeMirrorPosition, mode, deadZone);
    } else {
      setMirroredImage(null);
    }
  }, [sourceImage, mirrorPosition, mode, deadZone]);

  const processMirrorEffect = (
    imageSrc: string,
    mirrorLinePosition: number,
    mode: "left" | "right" = "left",
    deadZone: number = 0,
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

      if (mode === "left") {
        const leftWidth = mirrorX - dzHalf;
        const rightWidth = leftWidth;
        canvas.width = leftWidth + rightWidth - 1;

        // Draw left side (original)
        ctx.drawImage(
          img,
          0,
          0,
          leftWidth,
          img.height,
          0,
          0,
          leftWidth,
          img.height,
        );

        // Draw dead zone (transparent)
        // No need to draw, canvas is transparent by default

        // Draw right side (mirrored)
        ctx.save();
        ctx.translate(leftWidth + dz + rightWidth, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
          img,
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

        // Draw left side (mirrored)
        ctx.save();
        ctx.translate(leftWidth, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
          img,
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

        // Draw dead zone (transparent)
        // No need to draw, canvas is transparent by default

        // Draw right side (original)
        ctx.drawImage(
          img,
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
