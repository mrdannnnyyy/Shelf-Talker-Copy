import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Layer } from '../types';

interface CanvasLayerProps {
  layer: Layer;
  canvasWidth: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onSnap: (snapped: boolean) => void; // Communication with parent for Blue Line
  customContent?: React.ReactNode;
  showDebug?: boolean;
}

// --- HOOK: AUTO-FIT TEXT ---
const useAutoFitText = (
  content: string | undefined, 
  baseFontSize: number, 
  maxWidth: number | undefined,
  fontFamily: string = 'sans-serif'
) => {
  const [fontSize, setFontSize] = useState(baseFontSize);
  const textRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!content || !maxWidth || !textRef.current) return;

    // Reset to base to measure
    textRef.current.style.fontSize = `${baseFontSize}px`;
    
    let currentSize = baseFontSize;
    // Heuristic reduction: If scrollWidth > maxWidth, shrink.
    // We use a simple loop for "Production Grade" accuracy vs performance
    while (textRef.current.scrollWidth > maxWidth && currentSize > 12) {
      currentSize -= 2;
      textRef.current.style.fontSize = `${currentSize}px`;
    }
    
    setFontSize(currentSize);
  }, [content, maxWidth, baseFontSize, fontFamily]);

  return { fontSize, textRef };
};

const CanvasLayer: React.FC<CanvasLayerProps> = ({
  layer,
  canvasWidth,
  isSelected,
  onSelect,
  onUpdatePosition,
  onSnap,
  customContent,
  showDebug
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  
  // Smart Text Hooks
  const { fontSize, textRef } = useAutoFitText(
    layer.content, 
    layer.style.fontSize || 16, 
    layer.style.maxWidth
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(layer.id);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - layer.x,
      y: e.clientY - layer.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        let newX = e.clientX - dragStartRef.current.x;
        let newY = e.clientY - dragStartRef.current.y;

        // --- SNAP LOGIC ---
        const SNAP_THRESHOLD = 15;
        const canvasCenter = canvasWidth / 2;
        
        // Estimate layer center (using style width or element width if available)
        // For text without fixed width, this is approximate during drag, 
        // but robust enough for visual snapping.
        const layerWidth = layer.style.width || layer.style.maxWidth || 0;
        const layerCenter = newX + (layerWidth / 2);

        if (Math.abs(layerCenter - canvasCenter) < SNAP_THRESHOLD) {
            newX = canvasCenter - (layerWidth / 2);
            onSnap(true);
        } else {
            onSnap(false);
        }

        onUpdatePosition(layer.id, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      onSnap(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, layer.id, onUpdatePosition, canvasWidth, layer.style.width, layer.style.maxWidth, onSnap]);

  const commonStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${layer.x}px`,
    top: `${layer.y}px`,
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
    border: isSelected ? '1px dashed #3b82f6' : (showDebug && layer.type === 'text' ? '1px dotted rgba(255,0,0,0.3)' : '1px solid transparent'),
    ...(layer.style as React.CSSProperties),
    whiteSpace: 'pre-wrap', // Ensure wrapping
    overflowWrap: 'break-word', // Ensure wrapping
    // Apply Smart Font Size if calculated
    fontSize: layer.type === 'text' && layer.style.maxWidth ? fontSize : layer.style.fontSize,
  };

  if (customContent) {
      return (
          <div 
            onMouseDown={handleMouseDown}
            style={commonStyle}
            className={layer.className}
            title={layer.name}
          >
              {customContent}
          </div>
      );
  }

  if (layer.type === 'shape') {
    return (
      <div
        onMouseDown={handleMouseDown}
        style={commonStyle}
        className={layer.className}
        title={layer.name}
      />
    );
  }

  // Text Layer with Smart Ref
  return (
    <div
      ref={textRef}
      onMouseDown={handleMouseDown}
      style={commonStyle}
      className={layer.className}
      title={layer.name}
    >
      {layer.content}
    </div>
  );
};

export default CanvasLayer;