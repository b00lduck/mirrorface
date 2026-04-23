import { useState, useEffect, useRef } from "react";
import ImageUpload from "../components/ImageUpload";
import { useMirrorImage } from "../components/MirrorImage";
import "./Home.css";

interface CropRect {
  x: number; // percentage
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
}

function Home() {
  const [rotation, setRotation] = useState<number>(0);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
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

  // Use the mirror image hook for step 3 - both modes
  const leftMirrorResult = useMirrorImage({
    sourceImage: croppedImage,
    mirrorPosition: linePosition,
    mode: "left",
  });

  const rightMirrorResult = useMirrorImage({
    sourceImage: croppedImage,
    mirrorPosition: linePosition,
    mode: "right",
  });

  // Load the image once when uploadedImage changes
  useEffect(() => {
    if (uploadedImage) {
      console.log("Loading image:", uploadedImage.substring(0, 50));

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
    }
  }, [uploadedImage]);

  // Handle paste events for clipboard images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              console.log("Pasted image from clipboard");
              setUploadedImage(dataUrl);
            };
            reader.readAsDataURL(blob);
          }
          e.preventDefault();
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

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

  // Crop and rotate the image when cropRect or rotation changes (reuse loaded image)
  useEffect(() => {
    if (loadedImageRef.current) {
      console.log("Cropping with rect:", cropRect, "rotation:", rotation);
      cropImage(loadedImageRef.current, cropRect, rotation);
    } else {
      console.log("No loaded image in ref");
    }
  }, [cropRect, rotation]);

  const cropImage = (
    img: HTMLImageElement,
    rect: CropRect,
    rotation: number = 0,
  ) => {
    // 1. Rotate the full image onto a temp canvas
    const radians = (rotation * Math.PI) / 180;
    let tempWidth = img.width;
    let tempHeight = img.height;
    if (rotation !== 0) {
      tempWidth =
        Math.abs(img.width * Math.cos(radians)) +
        Math.abs(img.height * Math.sin(radians));
      tempHeight =
        Math.abs(img.width * Math.sin(radians)) +
        Math.abs(img.height * Math.cos(radians));
    }
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = tempWidth;
    tempCanvas.height = tempHeight;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      console.error("Could not get temp canvas context");
      return;
    }
    tempCtx.save();
    tempCtx.translate(tempWidth / 2, tempHeight / 2);
    tempCtx.rotate(radians);
    tempCtx.drawImage(img, -img.width / 2, -img.height / 2);
    tempCtx.restore();

    // 2. Calculate crop rectangle in the rotated image
    const cropX = (tempWidth * rect.x) / 100;
    const cropY = (tempHeight * rect.y) / 100;
    const cropWidth = (tempWidth * rect.width) / 100;
    const cropHeight = (tempHeight * rect.height) / 100;

    // 3. Scale cropped region to fit 300px max
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

    // 4. Draw the cropped region to the output canvas
    const canvas = document.createElement("canvas");
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get output canvas context");
      return;
    }
    try {
      ctx.drawImage(
        tempCanvas,
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
      setCroppedImage(croppedDataUrl);
    } catch (error) {
      console.error("Error drawing to canvas (CORS tainted?):", error);
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
          const newYNW = Math.max(
            0,
            Math.min(cropRect.y + deltaY, cropRect.y + cropRect.height - 10),
          );
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
      <p className="home-description">
        Select a photo from your device, paste from clipboard, or enter an image
        URL.
        <br />
        <small style={{ fontSize: "0.85em", opacity: 0.8 }}>
          Tip: Copy an image and press Ctrl+V (or Cmd+V) to paste it here.
          External URLs may not work due to CORS restrictions.
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
                <div
                  style={{
                    display: "inline-block",
                    maxWidth: 300,
                    maxHeight: 300,
                    borderRadius: 12,
                    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                    border: "4px solid rgba(255,255,255,0.2)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <img
                    ref={displayedImageRef}
                    src={uploadedImage}
                    alt="Source image"
                    className="uploaded-image"
                    draggable={false}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: "transform 0.2s",
                      display: "block",
                      maxWidth: 300,
                      maxHeight: 300,
                    }}
                    onLoad={() => {
                      console.log("Displayed image loaded!");
                      if (displayedImageRef.current) {
                        loadedImageRef.current = displayedImageRef.current;
                        cropImage(
                          displayedImageRef.current,
                          cropRect,
                          rotation,
                        );
                      }
                    }}
                    onError={() => {
                      console.error("Failed to display image");
                      setUploadedImage(null);
                      alert(
                        "Failed to load image. It may be blocked by CORS policy or the URL is invalid. Please try uploading a file instead.",
                      );
                    }}
                  />
                </div>
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
              {/* Rotation slider */}
              <div className="slider-container" style={{ marginTop: 16 }}>
                <label
                  htmlFor="rotation-slider"
                  style={{ display: "block", marginBottom: 4 }}
                >
                  Rotation: {rotation}&deg;
                </label>
                <input
                  id="rotation-slider"
                  type="range"
                  min="-30"
                  max="30"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="rotation-slider"
                  style={{ width: "100%" }}
                />
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
          </div>

          {/* Step 3: RESULTS */}
          <div className="image-column result-column">
            <h3>3. RESULT</h3>
            <p className="step-description">Final processed images</p>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "1rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <div>
                <h4
                  style={{
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                    opacity: 0.9,
                    textAlign: "center",
                  }}
                >
                  Left Mirror
                </h4>
                <div className="image-container">
                  {leftMirrorResult ? (
                    <img
                      src={leftMirrorResult}
                      alt="Left mirror result"
                      className="result-image"
                    />
                  ) : (
                    <div className="processing-message">Processing...</div>
                  )}
                </div>
              </div>
              <hr />
              <div>
                <h4
                  style={{
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                    opacity: 0.9,
                    textAlign: "center",
                  }}
                >
                  Right Mirror
                </h4>
                <div className="image-container">
                  {rightMirrorResult ? (
                    <img
                      src={rightMirrorResult}
                      alt="Right mirror result"
                      className="result-image"
                    />
                  ) : (
                    <div className="processing-message">Processing...</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
