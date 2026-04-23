import { useEffect, useState } from "react";

interface UseMirrorImageParams {
  sourceImage: string | null;
  mirrorPosition: number; // percentage 0-100
  mode?: "left" | "right"; // which side to mirror
}

/**
 * Custom hook to create a mirrored image effect
 * Left side shows original pixels, right side shows mirrored left side
 */
export function useMirrorImage({
  sourceImage,
  mirrorPosition,
  mode = "left",
}: UseMirrorImageParams) {
  const [mirroredImage, setMirroredImage] = useState<string | null>(null);

  useEffect(() => {
    if (sourceImage) {
      console.log(
        "Processing mirror effect at line position:",
        mirrorPosition,
        "mode:",
        mode,
      );
      processMirrorEffect(sourceImage, mirrorPosition, mode);
    } else {
      setMirroredImage(null);
    }
  }, [sourceImage, mirrorPosition, mode]);

  const processMirrorEffect = (
    imageSrc: string,
    mirrorLinePosition: number,
    mode: "left" | "right" = "left",
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

      canvas.height = img.height;

      console.log("Mirror at X:", mirrorX, "of", img.width);

      // Calculate source region based on mode
      const sourceX = mode === "left" ? 0 : mirrorX;
      const sourceWidth = mode === "left" ? mirrorX : img.width - mirrorX;
      const destOriginalX = mode === "left" ? 0 : sourceWidth;
      const mirrorTranslateX = mode === "left" ? 2 * sourceWidth : sourceWidth;

      // Canvas dimensions
      canvas.width = 2 * sourceWidth;

      // Draw the original side
      ctx.drawImage(
        img,
        sourceX,
        0,
        sourceWidth,
        img.height,
        destOriginalX,
        0,
        sourceWidth,
        img.height,
      );

      // Draw the mirrored side
      ctx.save();
      ctx.translate(mirrorTranslateX, 0);
      ctx.scale(-1, 1);

      ctx.drawImage(
        img,
        sourceX,
        0,
        sourceWidth,
        img.height,
        0,
        0,
        sourceWidth,
        img.height,
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
