
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Canvas from './Canvas';
import { Layer, CanvasConfig } from '../types';
import { X, Printer, Move, Grid, RotateCw, Smartphone, Monitor } from 'lucide-react';

interface PrintSheetProps {
  queue: { id: string; layers: Layer[] }[];
  config: CanvasConfig;
  onClose: () => void;
  onRemoveFromQueue: (index: number) => void;
  onReorderQueue: (newQueue: { id: string; layers: Layer[] }[]) => void;
  onPrint: () => void;
}

const PrintSheet: React.FC<PrintSheetProps> = ({ queue, config, onClose, onRemoveFromQueue, onReorderQueue }) => {
  // --- LAYOUT STATE ---
  const [marginTop, setMarginTop] = useState(25);
  const [marginLeft, setMarginLeft] = useState(25);
  const [gapX, setGapX] = useState(10);
  const [gapY, setGapY] = useState(10);
  const [scale, setScale] = useState(0.42);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // --- DRAG AND DROP HANDLERS ---
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
      setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;
      
      const newQueue = [...queue];
      const draggedItem = newQueue[draggedIndex];
      newQueue.splice(draggedIndex, 1);
      newQueue.splice(index, 0, draggedItem);
      
      onReorderQueue(newQueue);
      setDraggedIndex(index);
  };

  const handleDrop = () => {
      setDraggedIndex(null);
  };

  // --- DIRECT PRINT EXECUTION ---
  const handlePrint = () => {
      // 1. Force focus to window (helps with some browser blockers)
      window.focus();
      // 2. Trigger print
      window.print();
  };

  // Helper for Landscape transform
  const getTransform = () => {
      if (orientation === 'landscape') {
          return `translateX(${config.height * scale}px) rotate(90deg) scale(${scale})`;
      }
      return `scale(${scale})`;
  };

  // --- PORTAL CONTENT ---
  const renderPortalContent = () => (
    <div className="fixed inset-0 z-[9999] flex h-full w-full bg-[#E5E5E5] text-gray-800 font-sans print-sheet-container">
      
      {/* SIDEBAR: PRINT CONTROLS (Hidden on Print) */}
      <div className="w-[300px] bg-white border-r border-gray-300 flex flex-col z-20 print:hidden shadow-lg h-full">
          <div className="p-6 border-b border-gray-200">
             <h2 className="text-xl font-bold font-serif text-gray-900 flex items-center gap-2">
                 <Printer size={20} className="text-[#D4AF37]" /> Print Layout
             </h2>
             <p className="text-xs text-gray-500 mt-1">Configure 8.5" x 11" Sheet</p>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              {/* PAGE MARGINS */}
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2"><Move size={12}/> Page Margins</label>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Top (px)</label>
                          <input type="number" value={marginTop} onChange={e => setMarginTop(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-[#D4AF37] outline-none" />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Left (px)</label>
                          <input type="number" value={marginLeft} onChange={e => setMarginLeft(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-[#D4AF37] outline-none" />
                      </div>
                  </div>
              </div>

              {/* LABEL SPACING */}
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2"><Grid size={12}/> Label Spacing</label>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Horizontal Gap</label>
                          <input type="number" value={gapX} onChange={e => setGapX(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-[#D4AF37] outline-none" />
                      </div>
                      <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Vertical Gap</label>
                          <input type="number" value={gapY} onChange={e => setGapY(parseInt(e.target.value))} className="w-full border border-gray-300 rounded-sm p-2 text-sm focus:border-[#D4AF37] outline-none" />
                      </div>
                  </div>
              </div>

              {/* ORIENTATION */}
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-3 flex items-center gap-2"><RotateCw size={12}/> Orientation</label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-sm">
                      <button 
                        onClick={() => setOrientation('portrait')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-sm text-xs font-bold transition-all ${orientation === 'portrait' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                          <Smartphone size={14} /> Vertical
                      </button>
                      <button 
                        onClick={() => setOrientation('landscape')}
                        className={`flex items-center justify-center gap-2 py-2 rounded-sm text-xs font-bold transition-all ${orientation === 'landscape' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                          <Monitor size={14} /> Horizontal
                      </button>
                  </div>
              </div>

              {/* SCALE */}
              <div>
                  <label className="text-xs font-bold uppercase text-gray-500 mb-3 block">Label Size (Scale)</label>
                  <input 
                    type="range" 
                    min="0.3" max="1.5" step="0.01" 
                    value={scale} 
                    onChange={e => setScale(parseFloat(e.target.value))}
                    className="w-full accent-[#D4AF37]" 
                  />
                  <div className="text-right text-xs text-gray-500 mt-1">{Math.round(scale * 100)}%</div>
              </div>
          </div>

          <div className="p-6 border-t border-gray-200 bg-gray-50">
             <button 
                onClick={handlePrint}
                className="w-full bg-[#D4AF37] hover:bg-[#b38f20] text-black py-3 rounded-sm font-bold uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-2"
             >
                <Printer size={18} /> Print Now
             </button>
             <button 
                onClick={onClose}
                className="w-full mt-3 text-gray-500 hover:text-gray-800 text-xs font-bold uppercase tracking-widest py-2"
             >
                Back to Editor
             </button>
          </div>
      </div>

      {/* PREVIEW AREA */}
      <div className="flex-1 overflow-auto flex justify-center p-8 custom-scrollbar print:p-0 print:overflow-visible">
        
        {/* PHYSICAL SHEET (8.5in x 11in) */}
        <div 
            id="print-sheet-root"
            className="bg-white shadow-2xl relative print:shadow-none print:m-0"
            style={{ 
                width: '8.5in', 
                height: '11in', 
                paddingTop: `${marginTop}px`,
                paddingLeft: `${marginLeft}px`,
                boxSizing: 'border-box',
                display: 'flex',
                flexWrap: 'wrap',
                alignContent: 'flex-start',
                gap: `${gapY}px ${gapX}px`, 
            }}
        >
             {queue.map((item, index) => (
                 <div 
                    key={`${item.id}-${index}`} 
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={handleDrop}
                    className="relative bg-white group cursor-move print:cursor-auto"
                    style={{
                        width: (orientation === 'landscape' ? config.height : config.width) * scale,
                        height: (orientation === 'landscape' ? config.width : config.height) * scale,
                    }}
                 >
                    {/* Remove Button */}
                    <button 
                        onClick={() => onRemoveFromQueue(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50 print:hidden shadow-sm"
                    >
                        <X size={10} />
                    </button>

                    {/* Canvas Wrapper */}
                    <div style={{ 
                        width: config.width, 
                        height: config.height,
                        transform: getTransform(), 
                        transformOrigin: 'top left',
                     }}>
                        <Canvas 
                            layers={item.layers}
                            config={config}
                            selectedLayerId={null}
                            onSelectLayer={() => {}}
                            onUpdateLayer={() => {}}
                            onUpdateLayerPosition={() => {}}
                            onUpdateConfig={() => {}}
                            viewMode="batch"
                            scale={1} 
                            minimal={true}
                        />
                    </div>
                 </div>
             ))}
        </div>
      </div>

      <style>{`
        @media print {
            @page { margin: 0; size: letter; }
            
            /* HIDE THE MAIN APP (The Portal's Sibling) */
            body > #root {
                display: none !important;
            }

            /* ENSURE BODY IS CLEAN */
            body { 
                background: white !important; 
                margin: 0 !important; 
                overflow: visible !important; 
            }
            
            /* FORCE COLORS */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            /* HIDE UI INSIDE PORTAL */
            .print-sheet-container > div:first-child { 
                display: none !important; 
            }
            
            /* SHOW THE PORTAL CONTAINER */
            .print-sheet-container { 
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 9999;
                background: white !important;
                display: block !important; /* Block flow for printing */
                overflow: visible !important;
            }

            /* SHOW THE SHEET */
            #print-sheet-root { 
                visibility: visible !important; 
                box-shadow: none !important;
                margin: 0 !important;
            }
            
            /* Ensure contents are visible */
            #print-sheet-root * {
                visibility: visible !important;
            }
        }
      `}</style>
    </div>
  );

  // --- RENDER VIA PORTAL ---
  // We use createPortal to move this entire UI outside of the #root App container
  // This allows us to hide #root completely during print, solving all CSS nesting issues.
  return createPortal(renderPortalContent(), document.body);
};

export default PrintSheet;
