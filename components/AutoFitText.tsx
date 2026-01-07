
import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';

interface AutoFitTextProps {
  content: string;
  maxFontSize?: number;
  minFontSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

const AutoFitText: React.FC<AutoFitTextProps> = ({
  content,
  maxFontSize = 120, // Increased default max
  minFontSize = 10,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  // Start large and shrink down
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    // 1. Reset to Max to start measuring
    let currentSize = maxFontSize;
    text.style.fontSize = `${currentSize}px`;
    text.style.lineHeight = '1.1'; // Tight line height for better fitting
    
    // 2. Shrink Loop
    // While content overflows width OR height, shrink
    const isOverflowing = () => {
        return (
            text.scrollWidth > container.clientWidth || 
            text.scrollHeight > container.clientHeight
        );
    };

    // Fast reduction for large overflows
    while (isOverflowing() && currentSize > minFontSize) {
        // If vastly overflowing, jump down faster
        if (text.scrollHeight > container.clientHeight * 2) {
            currentSize -= 5;
        } else {
            currentSize -= 1;
        }
        text.style.fontSize = `${currentSize}px`;
    }

    // Safety check: Ensure we didn't go below min
    if (currentSize < minFontSize) currentSize = minFontSize;
    
    setFontSize(currentSize);

  }, [content, maxFontSize, minFontSize, style?.width, style?.height, style?.fontFamily, style?.fontWeight]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full flex items-center justify-center overflow-hidden ${className || ''}`}
      style={{ 
          ...style,
          // Ensure we have a valid box model for calculations
          minHeight: '20px', 
          minWidth: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: style?.textAlign === 'left' ? 'flex-start' : style?.textAlign === 'right' ? 'flex-end' : 'center',
          padding: '2px' // Slight buffer
      }}
    >
      <span 
        ref={textRef} 
        style={{ 
            fontSize: `${fontSize}px`, 
            whiteSpace: 'pre-wrap', // Allow wrapping if needed (e.g. long names)
            wordBreak: 'break-word',
            textAlign: style?.textAlign as any || 'center',
            lineHeight: 1.1,
            display: 'block',
            width: '100%',
            fontFamily: style?.fontFamily,
            fontWeight: style?.fontWeight,
            color: style?.color,
            textDecoration: style?.textDecoration,
            textTransform: style?.textTransform as any,
        }}
      >
        {content}
      </span>
    </div>
  );
};

export default AutoFitText;
