import { useState, useEffect, useRef } from "react";
import ImageUpload from "../components/ImageUpload";
import "./Home.css";

interface CropRect {
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

function Home() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageLoadSuccess, setImageLoadSuccess] = useState<boolean>(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [linePosition, setLinePosition] = useState<number>(50);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [cropRect, setCropRect] = useState<CropRect>({
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>("");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);
  const displayedImageRef = useRef<HTMLImageElement | null>(null);

  // Load the image once when uploadedImage changes
  useEffect(() => {
    if (uploadedImage) {
      console.log("Loading image:", uploadedImage.substring(0, 50));
      setImageLoadSuccess(false);

      // If it's already a data URL, use it directly
      if (uploadedImage.startsWith("data:")) {
        loadImageFromDataUrl(uploadedImage);
      } else {
        // Try to fetch as blob first to bypass CORS
        fetchImageAsDataUrl(uploadedImage);
      }
    } else {
      loadedImageRef.current = null;
      setCroppedImage(null);
      setImageLoadSuccess(false);
    }
  }, [uploadedImage]);

  const fetchImageAsDataUrl = async (url: string) => {
    try {
      console.log("Fetching image as blob...");
      const response = await fetch(url, { mode: "cors" });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = reader.result as string;
        console.log("Converted to data URL, length:", dataUrl.length);
        loadImageFromDataUrl(dataUrl);
      };

      reader.onerror = () => {
        console.error("Error converting blob to data URL");
        tryDirectLoad(url);
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error fetching image as blob:", error);
      tryDirectLoad(url);
    }
  };

  const tryDirectLoad = (url: string) => {
    console.log("Trying direct image load...");
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      console.log("Direct load successful:", img.width, "x", img.height);
      loadedImageRef.current = img;
      cropImage(img, cropRect);
    };

    img.onerror = () => {
      console.error("Direct load failed");
      loadedImageRef.current = null;
      setCroppedImage(null);
      alert(
        "Failed to load image. The image may be blocked by CORS policy. Please try uploading a file instead.",
      );
    };

    img.src = url;
  };

  const loadImageFromDataUrl = (dataUrl: string) => {
    const img = new Image();

    img.onload = () => {
      console.log("Image loaded successfully:", img.width, "x", img.height);
      loadedImageRef.current = img;
      cropImage(img, cropRect);
    };

    img.onerror = (error) => {
      console.error("Error loading image", error);
      loadedImageRef.current = null;
      setCroppedImage(null);
    };

    img.src = dataUrl;
  };

  // Crop the image when cropRect changes (reuse loaded image)
  useEffect(() => {
    if (loadedImageRef.current) {
      console.log("Cropping with rect:", cropRect);
      cropImage(loadedImageRef.current, cropRect);
    } else {
      console.log("No loaded image in ref");
    }
  }, [cropRect]);

  // Step 2: Process with line (for now just copy the cropped image)
  useEffect(() => {
    if (croppedImage) {
      console.log("Cropped image updated, length:", croppedImage.length);
      // For now, final result is same as cropped image
      // This is where future processing based on linePosition will happen
      setFinalResult(croppedImage);
    }
  }, [croppedImage, linePosition]);

  const cropImage = (img: HTMLImageElement, rect: CropRect) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    // Calculate crop rectangle in pixels
    const cropX = (img.width * rect.x) / 100;
    const cropY = (img.height * rect.y) / 100;
    const cropWidth = (img.width * rect.width) / 100;
    const cropHeight = (img.height * rect.height) / 100;

    console.log("Cropping:", {
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      imgWidth: img.width,
      imgHeight: img.height,
    });

    // Calculate scaled dimensions to fit 300px max
    const maxDimension = 300;
    let finalWidth = cropWidth;
    let finalHeight = cropHeight;

    if (cropWidth > maxDimension || cropHeight > maxDimension) {
      const scale = Math.min(
        maxDimension / cropWidth,
        maxDimension / cropHeight,
      );
      finalWidth = cropWidth * scale;
      finalHeight = cropHeight * scale;
    }

    console.log("Final dimensions:", { finalWidth, finalHeight });

    // Set canvas size to the scaled dimensions
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    try {
      // Draw the cropped and scaled portion
      ctx.drawImage(
        img,
        cropX,
        cropY, // Source x, y
        cropWidth,
        cropHeight, // Source width, height
        0,
        0, // Destination x, y
        finalWidth,
        finalHeight, // Destination width, height (scaled)
      );

      // Convert to data URL
      const croppedDataUrl = canvas.toDataURL("image/png");
      console.log("Generated cropped image, length:", croppedDataUrl.length);
      setCroppedImage(croppedDataUrl);
    } catch (error) {
      console.error("Error drawing to canvas (CORS tainted?):", error);
      // Show a message but keep the original image visible
      alert(
        "Cannot crop this image due to CORS restrictions. The image is displayed but cannot be processed. Please upload a file instead.",
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Check if click is inside the crop rectangle
    if (
      x >= cropRect.x &&
      x <= cropRect.x + cropRect.width &&
      y >= cropRect.y &&
      y <= cropRect.y + cropRect.height
    ) {
      setIsDragging(true);
      setDragStart({ x: x - cropRect.x, y: y - cropRect.y });
    }
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    handle: string,
  ) => {
    e.stopPropagation();
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;

    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isDragging) {
      // Move the rectangle
      let newX = x - dragStart.x;
      let newY = y - dragStart.y;

      // Constrain to image bounds
      newX = Math.max(0, Math.min(newX, 100 - cropRect.width));
      newY = Math.max(0, Math.min(newY, 100 - cropRect.height));

      setCropRect({ ...cropRect, x: newX, y: newY });
    } else if (isResizing) {
      // Resize the rectangle
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      let newRect = { ...cropRect };

      switch (resizeHandle) {
        case "se": // Bottom-right
          newRect.width = Math.max(
            10,
            Math.min(cropRect.width + deltaX, 100 - cropRect.x),
          );
          newRect.height = Math.max(
            10,
            Math.min(cropRect.height + deltaY, 100 - cropRect.y),
          );
          break;
        case "sw": // Bottom-left
          const newWidth = Math.max(10, cropRect.width - deltaX);
          const newX = Math.max(
            0,
            Math.min(cropRect.x + deltaX, cropRect.x + cropRect.width - 10),
          );
          newRect.x = newX;
          newRect.width = cropRect.width + (cropRect.x - newX);
          newRect.height = Math.max(
            10,
            Math.min(cropRect.height + deltaY, 100 - cropRect.y),
          );
          break;
        case "ne": // Top-right
          const newHeight = Math.max(10, cropRect.height - deltaY);
          const newY = Math.max(
            0,
            Math.min(cropRect.y + deltaY, cropRect.y + cropRect.height - 10),
          );
          newRect.y = newY;
          newRect.height = cropRect.height + (cropRect.y - newY);
          newRect.width = Math.max(
            10,
            Math.min(cropRect.width + deltaX, 100 - cropRect.x),
          );
          break;
        case "nw": // Top-left
          const newHeightNW = Math.max(10, cropRect.height - deltaY);
          const newYNW = Math.max(
            0,
            Math.min(cropRect.y + deltaY, cropRect.y + cropRect.height - 10),
          );
          const newWidthNW = Math.max(10, cropRect.width - deltaX);
          const newXNW = Math.max(
            0,
            Math.min(cropRect.x + deltaX, cropRect.x + cropRect.width - 10),
          );
          newRect.x = newXNW;
          newRect.y = newYNW;
          newRect.width = cropRect.width + (cropRect.x - newXNW);
          newRect.height = cropRect.height + (cropRect.y - newYNW);
          break;
      }

      setCropRect(newRect);
      setDragStart({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle("");
  };

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLinePosition(Number(event.target.value));
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(event.target.value);
  };

  const handleLoadUrl = () => {
    if (imageUrl.trim()) {
      setUploadedImage(imageUrl.trim());
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleLoadUrl();
    }
  };

  return (
    <div className="home">
      <h1 className="home-title">Upload Your Face Photo</h1>
      <p className="home-description">
        Select a photo from your device or enter an image URL.
        <br />
        <small style={{ fontSize: "0.85em", opacity: 0.8 }}>
          Note: External URLs may not work due to CORS restrictions. File upload
          is recommended.
        </small>
      </p>

      <div className="input-methods">
        <ImageUpload onImageUpload={handleImageUpload} />

        <div className="url-input-container">
          <input
            type="text"
            placeholder="Or enter image URL..."
            value={imageUrl}
            onChange={handleUrlChange}
            onKeyDown={handleKeyPress}
            className="url-input"
          />
          <button onClick={handleLoadUrl} className="load-url-button">
            Load URL
          </button>
        </div>
      </div>

      {uploadedImage && (
        <div className="image-display">
          <h2>Image Processing Pipeline</h2>
          <div className="images-wrapper">
            {/* Step 1: CROP */}
            <div className="image-column">
              <h3>1. CROP</h3>
              <p className="step-description">
                Drag the rectangle to select area
              </p>
              <div
                className="image-container"
                ref={imageContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={displayedImageRef}
                  src={uploadedImage}
                  alt="Source image"
                  className="uploaded-image"
                  draggable={false}
                  onLoad={() => {
                    console.log("Displayed image loaded!");
                    setImageLoadSuccess(true);
                    if (displayedImageRef.current) {
                      loadedImageRef.current = displayedImageRef.current;
                      cropImage(displayedImageRef.current, cropRect);
                    }
                  }}
                  onError={() => {
                    console.error("Failed to display image");
                    setImageLoadSuccess(false);
                    setUploadedImage(null);
                    alert(
                      "Failed to load image. It may be blocked by CORS policy or the URL is invalid. Please try uploading a file instead.",
                    );
                  }}
                />
                <div
                  className="crop-rectangle"
                  style={{
                    left: `${cropRect.x}%`,
                    top: `${cropRect.y}%`,
                    width: `${cropRect.width}%`,
                    height: `${cropRect.height}%`,
                    cursor: isDragging ? "grabbing" : "grab",
                  }}
                >
                  <div
                    className="resize-handle resize-handle-nw"
                    onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
                  />
                  <div
                    className="resize-handle resize-handle-ne"
                    onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
                  />
                  <div
                    className="resize-handle resize-handle-sw"
                    onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
                  />
                  <div
                    className="resize-handle resize-handle-se"
                    onMouseDown={(e) => handleResizeMouseDown(e, "se")}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: LINE */}
            <div className="image-column">
              <h3>2. LINE</h3>
              <p className="step-description">Adjust vertical line position</p>
              <div className="image-container">
                {croppedImage ? (
                  <>
                    <img
                      src={croppedImage}
                      alt="Cropped image"
                      className="uploaded-image"
                    />
                    <div
                      className="vertical-line"
                      style={{ left: `${linePosition}%` }}
                    />
                  </>
                ) : (
                  <div className="processing-message">Cropping...</div>
                )}
              </div>
              <div className="slider-container">
                <input
                  id="line-slider"
                  type="range"
                  min="0"
                  max="100"
                  value={linePosition}
                  onChange={handleSliderChange}
                  className="line-slider"
                />
              </div>
            </div>

            {/* Step 3: RESULT */}
            <div className="image-column">
              <h3>3. RESULT</h3>
              <p className="step-description">Final processed image</p>
              <div className="image-container">
                {finalResult ? (
                  <img
                    src={finalResult}
                    alt="Final result"
                    className="uploaded-image"
                  />
                ) : (
                  <div className="processing-message">Processing...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
