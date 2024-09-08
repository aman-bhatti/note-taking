import React, { useState } from "react";
import { ResizableBox } from "react-resizable";
import "react-resizable/css/styles.css";

interface ResizableImageProps {
  src: string;
  alt: string;
  initialWidth?: number;
  initialHeight?: number;
  onResizeComplete?: (width: number, height: number) => void; // Callback to save dimensions
}

const ResizableImage: React.FC<ResizableImageProps> = ({
  src,
  alt,
  initialWidth = 300,
  initialHeight = 200,
  onResizeComplete,
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [height, setHeight] = useState(initialHeight);

  // Handle resize stop to trigger only after the resize is done
  const handleResizeStop = (e: any, data: any) => {
    setWidth(data.size.width);
    setHeight(data.size.height);

    // Call the parent function to save the final dimensions
    if (onResizeComplete) {
      onResizeComplete(data.size.width, data.size.height);
    }
  };

  return (
    <ResizableBox
      width={width}
      height={height}
      minConstraints={[100, 100]} // Set minimum size
      maxConstraints={[600, 600]} // Set maximum size
      onResizeStop={handleResizeStop} // Use `onResizeStop` instead of `onResize`
      resizeHandles={["se"]}
    >
      <img
        src={src}
        alt={alt}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </ResizableBox>
  );
};

export default ResizableImage;
