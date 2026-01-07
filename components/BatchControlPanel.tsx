import React from 'react';
import { Layer } from '../types';
import { Leaf, Award, ShieldCheck, Zap, DollarSign, Wand2 } from 'lucide-react';

interface BatchControlPanelProps {
  layers: Layer[];
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onToggleBadge: (badgeId: string) => void;
}

const BatchControlPanel: React.FC<BatchControlPanelProps> = ({ layers, onUpdateLayer, onToggleBadge }) => {
  
  // Find Core Layers
  const activePriceLayer = layers.find(l => l.id === 'active-price');
  const wasPriceLayer = layers.find(l => l.id === 'was-price');
  const productNameLayer = layers.find(l => l.id === 'product-name-1');
  const subtitleLayer = layers.find(l => l.id === 'product-name-2');
  const sizeLayer = layers.find(l => l.id === 'size-label');
  const tastingLayer = layers.find(l => l.id === 'tasting-notes');

  // Helper to check if a draggable badge exists in the layer list
  const isBadgeActive = (id: string) => {
    return layers.some(l => l.id === id);
  };

  // AI Summarize Logic (Fixed)
  const handleSummarize = (e: React.MouseEvent) => {
    e.preventDefault(); // Extra safety
    if (!tastingLayer || !tastingLayer.content) return;
    
    const text = tastingLayer.content;
    // Split by period, keep first 2 sentences
    const sentences = text.split('.');
    // Slice 0-2, join with period, and ensure it ends with a period if it had text
    const summary = sentences.slice(0, 2).join('. ').trim();
    
    const finalContent = summary.length > 0 && !summary.endsWith('.') ? summary + '.' : summary;
    
    onUpdateLayer(tastingLayer.id, { content: finalContent });
  };

  return (
    <div className="h-full bg-[#141414] text-gray-200 flex flex-row overflow-hidden font-sans border-t border-[#333]">
        
        {/* SECTION 1: PRICING ENGINE (POS Style) */}
        <div className="w-[30%] p-5 border-r border-[#222] flex flex-col gap-4 bg-[#0e0e0e]">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
                <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Pricing Engine</h4>
            </div>
            
            <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Active Price</label>
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3 text-[#D4AF37]" />
                    <input 
                        type="text" 
                        value={activePriceLayer?.content || ''}
                        onChange={(e) => activePriceLayer && onUpdateLayer(activePriceLayer.id, { content: e.target.value })}
                        className="w-full pl-8 pr-3 py-2 text-2xl font-bold bg-black border border-[#333] text-white focus:border-[#D4AF37] focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] outline-none rounded-sm font-mono tracking-tight"
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 block">Was Price</label>
                     <input 
                        type="text" 
                        value={wasPriceLayer?.content || ''}
                        onChange={(e) => wasPriceLayer && onUpdateLayer(wasPriceLayer.id, { content: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-[#1A1A1A] border border-[#333] text-gray-400 focus:border-[#D4AF37] outline-none rounded-sm font-mono"
                        placeholder="Was..."
                    />
                </div>
                <div>
                     <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1 block">Size / Format</label>
                     <input 
                        type="text" 
                        value={sizeLayer?.content || ''}
                        onChange={(e) => sizeLayer && onUpdateLayer(sizeLayer.id, { content: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-[#1A1A1A] border border-[#333] text-gray-300 focus:border-[#D4AF37] outline-none rounded-sm"
                        placeholder="750ml"
                    />
                </div>
            </div>
        </div>

        {/* SECTION 2: PRODUCT IDENTITY & SENSORY */}
        <div className="w-[40%] p-5 border-r border-[#222] flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-4 bg-gray-600 rounded-full"></div>
                <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Identity & Sensory</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
                 <input 
                    type="text" 
                    value={productNameLayer?.content || ''}
                    onChange={(e) => productNameLayer && onUpdateLayer(productNameLayer.id, { content: e.target.value })}
                    className="col-span-2 px-3 py-2 text-sm font-bold bg-[#1A1A1A] border border-[#333] text-white focus:border-[#D4AF37] outline-none rounded-sm"
                    placeholder="Product Name"
                />
                 <input 
                    type="text" 
                    value={subtitleLayer?.content || ''}
                    onChange={(e) => subtitleLayer && onUpdateLayer(subtitleLayer.id, { content: e.target.value })}
                    className="col-span-2 px-3 py-2 text-xs bg-[#1A1A1A] border border-[#333] text-gray-400 focus:border-[#D4AF37] outline-none rounded-sm"
                    placeholder="Subtitle / Varietal"
                />
            </div>

            <div className="flex-1 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Tasting Notes</label>
                    <button 
                        type="button" // CRITICAL FIX: Prevent form submission
                        onClick={handleSummarize}
                        className="flex items-center gap-1 text-[10px] text-[#D4AF37] hover:text-white transition-colors uppercase font-bold bg-transparent border-none cursor-pointer"
                        title="Auto-summarize to 2 sentences"
                    >
                        <Wand2 size={12} /> Magic Summarize
                    </button>
                </div>
                <textarea 
                    value={tastingLayer?.content || ''}
                    onChange={(e) => tastingLayer && onUpdateLayer(tastingLayer.id, { content: e.target.value })}
                    className="w-full h-full bg-[#1A1A1A] border border-[#333] text-gray-300 text-sm p-3 focus:border-[#D4AF37] outline-none rounded-sm resize-none leading-relaxed"
                    placeholder="Enter tasting notes..."
                />
            </div>
        </div>

        {/* SECTION 3: BADGES (Dashboard Grid) */}
        <div className="w-[30%] p-5 bg-[#0e0e0e] flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-4 bg-[#D4AF37] rounded-full"></div>
                <h4 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Active Badges</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 h-full content-start">
                
                {/* Gluten Free Toggle */}
                <button 
                    type="button"
                    onClick={() => onToggleBadge('badge-gluten-free')}
                    className={`badge-toggle-btn flex flex-col items-center justify-center p-4 rounded-sm gap-2 ${isBadgeActive('badge-gluten-free') ? 'active' : ''}`}
                >
                    <Award size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Gluten Free</span>
                </button>

                {/* Organic Toggle */}
                <button 
                    type="button"
                    onClick={() => onToggleBadge('badge-organic')}
                    className={`badge-toggle-btn flex flex-col items-center justify-center p-4 rounded-sm gap-2 ${isBadgeActive('badge-organic') ? 'active' : ''}`}
                >
                    <Leaf size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Organic</span>
                </button>

                {/* Sugar Free Toggle */}
                <button 
                    type="button"
                    onClick={() => onToggleBadge('badge-sugar-free')}
                    className={`badge-toggle-btn flex flex-col items-center justify-center p-4 rounded-sm gap-2 ${isBadgeActive('badge-sugar-free') ? 'active' : ''}`}
                >
                    <ShieldCheck size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Sugar Free</span>
                </button>

                 {/* Staff Pick Toggle */}
                 <button 
                    type="button"
                    onClick={() => onToggleBadge('badge-staff-pick')}
                    className={`badge-toggle-btn flex flex-col items-center justify-center p-4 rounded-sm gap-2 ${isBadgeActive('badge-staff-pick') ? 'active' : ''}`}
                >
                    <Zap size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Staff Pick</span>
                </button>

            </div>
        </div>

    </div>
  );
};

export default BatchControlPanel;