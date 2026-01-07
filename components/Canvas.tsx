
import React, { useState, useRef, useEffect } from 'react';
import { Layer, CanvasConfig } from '../types';
import AutoFitText from './AutoFitText';
import { Move } from 'lucide-react';

interface CanvasProps {
  layers: Layer[];
  selectedLayerId: string | null;
  config: CanvasConfig;
  onSelectLayer: (id: string) => void;
  onUpdateLayerPosition: (id: string, x: number, y: number) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onUpdateConfig: (updates: Partial<CanvasConfig>) => void;
  viewMode: 'batch' | 'architecture' | 'vault';
  scale?: number;
  minimal?: boolean; // New prop for Print Sheet
}

// --- BADGE RENDERER ---
const BadgeRenderer: React.FC<{ id: string, content?: string }> = ({ id, content }) => {
    if (id === 'badge-points-group') {
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full pointer-events-none">
                 <circle cx="50" cy="50" r="48" fill="#7B1E36" stroke="#D4AF37" strokeWidth="2" />
                 <circle cx="50" cy="50" r="44" fill="none" stroke="#D4AF37" strokeWidth="1" strokeDasharray="3 2" />
                 <text x="50" y="45" textAnchor="middle" fill="#D4AF37" fontSize="38" fontWeight="800" fontFamily="Oswald">{content || '94'}</text>
                 <text x="50" y="62" textAnchor="middle" fill="#D4AF37" fontSize="10" fontWeight="700" fontFamily="Montserrat" letterSpacing="1">POINTS</text>
                 <text x="50" y="78" textAnchor="middle" fill="#D4AF37" fontSize="8" fontWeight="600" fontFamily="Montserrat">Whisky Advocate</text>
            </svg>
        );
    }
    return null;
}

// --- RESIZE HANDLE ---
const ResizeHandle: React.FC<{ cursor: string; style: React.CSSProperties; onMouseDown: (e: React.MouseEvent) => void }> = ({ cursor, style, onMouseDown }) => (
    <div
        onMouseDown={onMouseDown}
        className={`absolute w-3 h-3 bg-white border border-blue-600 z-[60] hover:scale-125 transition-transform shadow-sm pointer-events-auto ${cursor}`}
        style={style}
    />
);

// --- INTERACTIVE LAYER WRAPPER ---
const InteractiveLayer: React.FC<{
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateSize: (id: string, w: number, h: number) => void;
  viewMode: string;
  minimal?: boolean;
  children: React.ReactNode;
}> = ({ layer, isSelected, onSelect, onUpdatePosition, onUpdateSize, viewMode, minimal, children }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [resizeDir, setResizeDir] = useState<string | null>(null);
  
  const startRef = useRef({ x: 0, y: 0, w: 0, h: 0, layerX: 0, layerY: 0 });

  const isArchitecture = viewMode === 'architecture';
  const isBatch = viewMode === 'batch';
  
  // DRAG PERMISSIONS
  // Architecture: All layers draggable
  // Batch: Only badges/groups/images draggable
  // Minimal: NONE
  const canDrag = !minimal && (isArchitecture || (isBatch && (layer.id.startsWith('badge') || layer.type === 'group' || layer.type === 'image')));
  
  // RESIZE PERMISSIONS
  // Architecture: All layers resizable
  // Batch: Only images resizable (for custom badges)
  // Minimal: NONE
  const canResize = !minimal && (isArchitecture || (isBatch && layer.type === 'image'));

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(layer.id);
    if (canDrag) {
        setIsDragging(true);
        startRef.current = { x: e.clientX, y: e.clientY, w: 0, h: 0, layerX: layer.x, layerY: layer.y };
    }
  };

  const handleResizeStart = (e: React.MouseEvent, dir: string) => {
    if (!canResize) return;
    e.stopPropagation();
    setResizeDir(dir);
    startRef.current = { 
        x: e.clientX, y: e.clientY, 
        w: layer.style.width || 100, 
        h: layer.style.height || 50,
        layerX: layer.x, layerY: layer.y 
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && canDrag) {
        const dx = e.clientX - startRef.current.x;
        const dy = e.clientY - startRef.current.y;
        onUpdatePosition(layer.id, startRef.current.layerX + dx, startRef.current.layerY + dy);
      }
      
      if (resizeDir && canResize) {
        const dx = e.clientX - startRef.current.x;
        const dy = e.clientY - startRef.current.y;
        let newX = startRef.current.layerX;
        let newY = startRef.current.layerY;
        let newW = startRef.current.w;
        let newH = startRef.current.h;

        if (resizeDir.includes('e')) newW = Math.max(20, startRef.current.w + dx);
        if (resizeDir.includes('w')) {
            const possibleW = startRef.current.w - dx;
            if (possibleW > 20) {
                newW = possibleW;
                newX = startRef.current.layerX + dx;
            }
        }
        if (resizeDir.includes('s')) newH = Math.max(20, startRef.current.h + dy);
        if (resizeDir.includes('n')) {
            const possibleH = startRef.current.h - dy;
            if (possibleH > 20) {
                newH = possibleH;
                newY = startRef.current.layerY + dy;
            }
        }
        onUpdateSize(layer.id, newW, newH);
        if (newX !== layer.x || newY !== layer.y) {
            onUpdatePosition(layer.id, newX, newY);
        }
      }
    };

    const handleMouseUp = () => { setIsDragging(false); setResizeDir(null); };

    if (isDragging || resizeDir) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, resizeDir, layer.id, onUpdatePosition, onUpdateSize, canDrag, canResize]);

  const isText = layer.type === 'text';
  const displayStyle: React.CSSProperties = {
      position: 'absolute',
      left: layer.x,
      top: layer.y,
      width: layer.style.width,
      height: layer.style.height,
      zIndex: layer.style.zIndex || 10,
      cursor: canDrag ? (isDragging ? 'grabbing' : 'grab') : 'default',
      pointerEvents: 'auto',
  };

  return (
    <div 
        className={`group absolute ${isSelected ? 'z-50' : ''}`}
        style={displayStyle}
        onMouseDown={handleMouseDown}
    >
        <div className={`w-full h-full relative ${isSelected && (isArchitecture || layer.type === 'image') && !minimal ? 'outline outline-1 outline-blue-500 shadow-xl border-dashed border border-blue-400' : (canDrag && !minimal ? 'hover:outline hover:outline-1 hover:outline-blue-500/30' : '')}`}>
            <div className="w-full h-full overflow-hidden" style={{ pointerEvents: 'none' }}>
                {isText ? (
                    <AutoFitText 
                        content={layer.content || ''}
                        maxFontSize={layer.style.fontSize || 100}
                        minFontSize={10}
                        style={{ ...(layer.style as React.CSSProperties), width: '100%', height: '100%' }}
                    />
                ) : (
                    children
                )}
            </div>
            {isSelected && canResize && !minimal && (
                <>
                    <ResizeHandle cursor="cursor-nw-resize" style={{ top: '-5px', left: '-5px' }} onMouseDown={(e) => handleResizeStart(e, 'nw')} />
                    <ResizeHandle cursor="cursor-ne-resize" style={{ top: '-5px', right: '-5px' }} onMouseDown={(e) => handleResizeStart(e, 'ne')} />
                    <ResizeHandle cursor="cursor-sw-resize" style={{ bottom: '-5px', left: '-5px' }} onMouseDown={(e) => handleResizeStart(e, 'sw')} />
                    <ResizeHandle cursor="cursor-se-resize" style={{ bottom: '-5px', right: '-5px' }} onMouseDown={(e) => handleResizeStart(e, 'se')} />
                </>
            )}
        </div>
    </div>
  );
};

const Canvas: React.FC<CanvasProps> = React.memo(({ layers, selectedLayerId, config, onSelectLayer, onUpdateLayerPosition, onUpdateLayer, onUpdateConfig, viewMode, scale = 1, minimal = false }) => {
  const [draggingSplit, setDraggingSplit] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isInteractive = viewMode === 'architecture' && !minimal;

  const handleSplitMouseDown = (e: React.MouseEvent) => {
      if (!isInteractive) return;
      e.stopPropagation();
      setDraggingSplit(true);
  };

  useEffect(() => {
      const handleSplitMove = (e: MouseEvent) => {
          if (!draggingSplit || !canvasRef.current) return;
          const rect = canvasRef.current.getBoundingClientRect();
          const relativeY = (e.clientY - rect.top) / scale; 
          const ratio = Math.min(0.9, Math.max(0.1, relativeY / config.height));
          onUpdateConfig({ splitRatio: ratio });
      };
      const handleSplitUp = () => setDraggingSplit(false);
      if (draggingSplit) { window.addEventListener('mousemove', handleSplitMove); window.addEventListener('mouseup', handleSplitUp); }
      return () => { window.removeEventListener('mousemove', handleSplitMove); window.removeEventListener('mouseup', handleSplitUp); };
  }, [draggingSplit, config.height, scale, onUpdateConfig]);

  const activeBadges = layers.filter(l => l.id.startsWith('badge-'));
  const standardLayers = layers.filter(l => !l.id.startsWith('badge-'));

  // RENDER CONTENT ONLY (For reusable logic)
  // CHANGED: id="canvas-root" -> className="canvas-root" to allow multiple instances
  const renderContent = () => (
    <div className="canvas-root relative shadow-2xl bg-white overflow-hidden flex flex-col print:shadow-none"
        ref={canvasRef}
        style={{ width: config.width, height: config.height }}
        onMouseDown={() => !minimal && onSelectLayer('')}
    >
        <div className="absolute top-0 left-0 w-full" style={{ height: `${config.splitRatio * 100}%`, backgroundColor: config.backgroundTop }} />
        <div className="absolute bottom-0 left-0 w-full" style={{ height: `${(1 - config.splitRatio) * 100}%`, backgroundColor: config.backgroundBottom }} />
        
        {isInteractive && (
                <div className="absolute left-0 w-full h-1 cursor-row-resize z-[45] group hover:bg-blue-500/50 transition-colors print:hidden" style={{ top: `${config.splitRatio * 100}%`, transform: 'translateY(-50%)' }} onMouseDown={handleSplitMouseDown}>
                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-4 bg-white/20 backdrop-blur-md rounded-full border border-white/50 flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg pointer-events-none group-hover:pointer-events-auto">
                    <Move size={10} className="text-white"/>
                    </div>
                </div>
        )}
        <div className="absolute inset-4 border-[2px] border-[#D4AF37] pointer-events-none z-40 border-gold-foil" />

        {standardLayers.map(layer => {
            if (layer.id === 'inner-border') return null;

            if (layer.id === 'header-combined') {
                return (
                    <InteractiveLayer key={layer.id} layer={layer} isSelected={selectedLayerId === layer.id} onSelect={onSelectLayer} onUpdatePosition={onUpdateLayerPosition} onUpdateSize={(id, w, h) => onUpdateLayer(id, { style: { ...layer.style, width: w, height: h } })} viewMode={viewMode} minimal={minimal}>
                        <div className="flex items-center justify-center w-full h-full px-4 gap-4">
                            <div className="h-[2px] bg-[#D4AF37] flex-1 min-w-[20px] bg-gold-foil"></div>
                            <span style={{ 
                                ...(layer.style as React.CSSProperties), 
                                width: 'auto', 
                                height: 'auto',
                                position: 'relative', 
                                top: 'auto', 
                                left: 'auto', 
                                flex: '0 0 auto'
                            }}>
                                {layer.content}
                            </span>
                            <div className="h-[2px] bg-[#D4AF37] flex-1 min-w-[20px] bg-gold-foil"></div>
                        </div>
                    </InteractiveLayer>
                );
            }

            return (
                <InteractiveLayer key={layer.id} layer={layer} isSelected={selectedLayerId === layer.id} onSelect={onSelectLayer} onUpdatePosition={onUpdateLayerPosition} onUpdateSize={(id, w, h) => onUpdateLayer(id, { style: { ...layer.style, width: w, height: h } })} viewMode={viewMode} minimal={minimal}>
                    {layer.type === 'shape' && (
                        <div className={`w-full h-full ${layer.className || ''}`} style={{ backgroundColor: layer.style.backgroundColor, clipPath: layer.style.clipPath }} />
                    )}
                    {layer.type === 'image' && layer.content && (
                        <img src={layer.content} className="w-full h-full object-contain pointer-events-none" alt={layer.name} />
                    )}
                    {layer.type === 'group' && layer.id === 'badge-points-group' && (
                            <BadgeRenderer id="badge-points-group" content={layer.content} />
                    )}
                </InteractiveLayer>
            );
        })}
        {activeBadges.map(badge => (
            <InteractiveLayer key={badge.id} layer={badge} isSelected={selectedLayerId === badge.id} onSelect={onSelectLayer} onUpdatePosition={onUpdateLayerPosition} onUpdateSize={(id, w, h) => onUpdateLayer(id, { style: { ...badge.style, width: w, height: h } })} viewMode={viewMode} minimal={minimal}>
                <BadgeRenderer id={badge.id} />
            </InteractiveLayer>
        ))}
    </div>
  );

  // If Minimal (Print Mode), just return content without editor chrome
  if (minimal) {
      return renderContent();
  }

  // Normal Editor View - Wrapped in .single-canvas-mode for CSS targeting
  return (
    <div className="single-canvas-mode flex items-center justify-center p-8 min-h-full overflow-auto bg-[#0a0a0a] print:p-0 print:bg-white">
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', marginTop: `${(scale - 1) * 20}px`, marginBottom: '100px' }}>
         {renderContent()}
      </div>
    </div>
  );
});

export default Canvas;
