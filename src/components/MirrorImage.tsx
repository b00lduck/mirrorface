import { useEffect, useState } from "react";

interface UseMirrorImageParams {
  sourceImage: string | null;
  mirrorPosition: number; // percentage 0-100
}

/**
 * Custom hook to create a mirrored image effect
 * Left side shows original pixels, right side shows mirrored left side
 */
export function useMirrorImage({
  sourceImage,
  mirrorPosition,
}: UseMirrorImageParams) {
  const [mirroredImage, setMirroredImage] = useState<string | null>(null);

  useEffect(() => {
    if (sourceImage) {
      console.log("Processing mirror effect at line position:", mirrorPosition);
      processMirrorEffect(sourceImage, mirrorPosition);
    } else {
      setMirroredImage(null);
    }
  }, [sourceImage, mirrorPosition]);

  const processMirrorEffect = (
    imageSrc: string,
    mirrorLinePosition: number,
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

      // Canvas size: width = 2 * mirrorX, height = cropped image height
      canvas.width = 2 * mirrorX;
      canvas.height = img.height;

      console.log("Mirror at X:", mirrorX, "of", img.width);

      // Draw the left side (everything left of the line) - unchanged
      ctx.drawImage(
        img,
        0,
        0, // Source x, y
        mirrorX,
        img.height, // Source width, height
        0,
        0, // Destination x, y
        mirrorX,
        img.height, // Destination width, height
      );

      // Draw the right side as a mirror of the left
      ctx.save();

      // Position at the mirror line
      ctx.translate(mirrorX * 2, 0);

      // Flip horizontally
      ctx.scale(-1, 1);

      // Calculate how wide the right side is
      const rightWidth = mirrorX;

      // Draw pixels from the left side, but take them from right before the mirror line
      // This ensures continuity at the mirror line
      ctx.drawImage(
        img,
        Math.max(0, mirrorX - rightWidth), // Start taking from this X position
        0, // Source y
        Math.min(rightWidth, mirrorX), // Width to take (don't exceed what's available)
        img.height, // Source height
        0, // Destination x (after transform, this is at mirrorX)
        0, // Destination y
        Math.min(rightWidth, mirrorX), // Destination width
        img.height, // Destination height
      );

      ctx.restore();

      // Convert to data URL
      const mirroredDataUrl = canvas.toDataURL("image/png");
      console.log("Generated mirrored image, length:", mirroredDataUrl.length);
      setMirroredImage(mirroredDataUrl);
    };

    img.onerror = () => {
      console.error("Error loading image for mirror effect");
      setMirroredImage(imageSrc);
    };

    img.src = imageSrc;
  };

  return mirroredImage;
}
