
import React from 'react';
import { Layer, CanvasConfig } from '../types';
import { 
    AlignLeft, AlignCenter, AlignRight, 
    Type, Bold, Wand2, Palette, Layers, 
    Eye, EyeOff, Trash2, Database, Box
} from 'lucide-react';

interface EditorPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  config: CanvasConfig;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onUpdateConfig: (updates: Partial<CanvasConfig>) => void;
  onDeleteLayer?: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onBindLayer: (layerId: string, systemKey: string) => void;
  viewMode: 'batch' | 'architecture' | 'vault';
}

const FONTS = [
    { label: 'Premium Serif (Cinzel)', value: 'Cinzel, serif' },
    { label: 'Modern (Montserrat)', value: 'Montserrat, sans-serif' },
    { label: 'Condensed (Oswald)', value: 'Oswald, sans-serif' },
    { label: 'Classic (Playfair)', value: 'Playfair Display, serif' },
];

const DATA_OPTIONS = [
    { label: 'Static Text (No Binding)', value: '' },
    { label: 'Product Name', value: 'product-name-1' },
    { label: 'Brand / Subtitle', value: 'product-name-2' },
    { label: 'Price (Active)', value: 'active-price' },
    { label: 'Was Price', value: 'was-price' },
    { label: 'Size / Format', value: 'size-label' },
    { label: 'Category / Header', value: 'category-label' },
    { label: 'Description / Notes', value: 'tasting-notes' },
    { label: 'Points Score', value: 'badge-points-group' }
];

const EditorPanel: React.FC<EditorPanelProps> = ({
  layers,
  selectedLayerId,
  config,
  onUpdateLayer,
  onUpdateConfig,
  onDeleteLayer,
  onSelectLayer,
  onBindLayer,
  viewMode
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const isArchitecture = viewMode === 'architecture';

  // --- ROBUST AUTO TRIM LOGIC ---
  const handleAutoTrim = (e: React.MouseEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
      if (!selectedLayer || !selectedLayer.content) return;
      const sentences = selectedLayer.content.match(/[^\.!\?]+[\.!\?]+/g) || [selectedLayer.content];
      const shortText = sentences.slice(0, 2).join(' ').trim();
      onUpdateLayer(selectedLayer.id, { content: shortText });
  };

  const updateStyle = (key: string, value: any) => {
      if (!selectedLayer) return;
      onUpdateLayer(selectedLayer.id, { style: { ...selectedLayer.style, [key]: value } });
  };

  const handleDataBindingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!selectedLayer) return;
      const systemKey = e.target.value;
      onBindLayer(selectedLayer.id, systemKey);
      if (systemKey) {
          const label = DATA_OPTIONS.find(o => o.value === systemKey)?.label;
          onUpdateLayer(selectedLayer.id, { content: `{${label}}` });
      }
  };

  if (!selectedLayer) {
      // --- GLOBAL CONFIG (Design Mode Only) or Layer List ---
      return (
        <aside className="glass-panel flex flex-col h-full overflow-hidden text-gray-200">
            <div className="p-6 border-b border-[rgba(255,255,255,0.05)] bg-[#0C0C0C]">
                <h2 className="text-[#D4AF37] font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                    <Palette size={14}/> {isArchitecture ? 'Canvas Settings' : 'Quick Select'}
                </h2>
            </div>
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {isArchitecture && (
                    <>
                        {/* Backgrounds */}
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Background Colors</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] text-gray-600 mb-1 block">Top</span>
                                    <div className="flex items-center gap-2 glass-input p-1 rounded-sm">
                                        <input type="color" value={config.backgroundTop} onChange={e => onUpdateConfig({backgroundTop: e.target.value})} className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"/>
                                        <span className="text-[10px] font-mono">{config.backgroundTop}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[10px] text-gray-600 mb-1 block">Bottom</span>
                                    <div className="flex items-center gap-2 glass-input p-1 rounded-sm">
                                        <input type="color" value={config.backgroundBottom} onChange={e => onUpdateConfig({backgroundBottom: e.target.value})} className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"/>
                                        <span className="text-[10px] font-mono">{config.backgroundBottom}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Split Ratio */}
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Split Ratio</label>
                            <input 
                                type="range" 
                                min="0" max="1" step="0.05" 
                                value={config.splitRatio} 
                                onChange={(e) => onUpdateConfig({ splitRatio: parseFloat(e.target.value) })}
                                className="w-full accent-[#D4AF37] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </>
                )}

                {/* LAYER LIST */}
                <div className="pt-6 border-t border-gray-800">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                        <Layers size={12}/> All Layers
                    </label>
                    <div className="space-y-1">
                        {layers.slice().reverse().map((layer) => (
                            <div
                            key={layer.id}
                            onClick={() => onSelectLayer(layer.id)}
                            className="flex items-center gap-3 p-2 rounded-sm cursor-pointer transition-all border border-transparent hover:bg-[#1a1a1a] text-gray-500 hover:text-white"
                            >
                            {layer.type === 'text' ? <Type size={14}/> : layer.type === 'group' ? <Database size={14}/> : <Box size={14}/>}
                            <span className="text-xs truncate">{layer.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
      );
  }

  // --- LAYER EDITOR VIEW ---
  return (
    <aside className="glass-panel flex flex-col h-full overflow-hidden text-gray-200">
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] bg-[#0C0C0C] flex justify-between items-center">
            <div>
                <h2 className="text-white font-bold text-sm tracking-widest uppercase truncate max-w-[150px]">
                    {selectedLayer.name}
                </h2>
                <p className="text-[10px] text-[#D4AF37] uppercase mt-1">
                    {selectedLayer.type} Layer
                </p>
            </div>
            {onDeleteLayer && isArchitecture && (
                <button onClick={() => onDeleteLayer(selectedLayer.id)} className="text-red-500 hover:text-red-400">
                    <Trash2 size={16}/>
                </button>
            )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. DATA MAPPING (All Modes) */}
            {(selectedLayer.type === 'text' || selectedLayer.type === 'group') && (
                <div className="space-y-2 pb-4 border-b border-gray-800">
                    <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
                        <Database size={12}/> Data Source
                    </label>
                    <select 
                        onChange={handleDataBindingChange}
                        className="glass-input w-full p-2 text-xs rounded-sm cursor-pointer text-[#D4AF37] border-[#D4AF37]/50"
                        disabled={!isArchitecture} // Lock mapping in Data Mode? Or allow quick re-map? Let's allow quick re-map.
                    >
                        <option value="">-- Select Data Field --</option>
                        {DATA_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* 2. CONTENT EDITOR (All Modes - This is the "Data Mode Edit" feature) */}
            {(selectedLayer.type === 'text' || selectedLayer.type === 'group') && (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Content</label>
                        <button 
                            type="button" 
                            onClick={handleAutoTrim}
                            className="text-[#D4AF37] text-[10px] hover:text-white flex items-center gap-1 uppercase font-bold"
                            title="Trim to 2 sentences"
                        >
                            <Wand2 size={12} /> Auto-Trim
                        </button>
                    </div>
                    <textarea
                        className="glass-input w-full p-3 text-sm rounded-sm"
                        rows={3}
                        value={selectedLayer.content || ''}
                        onChange={(e) => onUpdateLayer(selectedLayer.id, { content: e.target.value })}
                    />
                </div>
            )}

            {/* 3. TYPOGRAPHY (Architecture Mode Only) */}
            {selectedLayer.type === 'text' && isArchitecture && (
                <div className="space-y-4 pt-4 border-t border-gray-800">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Type size={12}/> Typography
                    </label>
                    
                    <select 
                        value={selectedLayer.style.fontFamily} 
                        onChange={(e) => updateStyle('fontFamily', e.target.value)}
                        className="glass-input w-full p-2 text-xs rounded-sm cursor-pointer"
                    >
                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>

                    <div className="grid grid-cols-2 gap-3">
                         <div className="flex items-center gap-2 glass-input p-2 rounded-sm justify-between">
                            <span className="text-[10px] text-gray-400">Color</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={selectedLayer.style.color} 
                                    onChange={(e) => updateStyle('color', e.target.value)} 
                                    className="bg-transparent border-none w-5 h-5 p-0 cursor-pointer"
                                />
                            </div>
                         </div>
                         <button 
                            onClick={() => {
                                const w = selectedLayer.style.fontWeight;
                                updateStyle('fontWeight', w === 700 || w === 'bold' ? 400 : 700);
                            }}
                            className={`glass-input flex items-center justify-center gap-2 text-xs rounded-sm ${selectedLayer.style.fontWeight === 700 || selectedLayer.style.fontWeight === 'bold' ? 'text-[#D4AF37] border-[#D4AF37]' : 'text-gray-400'}`}
                         >
                            <Bold size={14} /> {selectedLayer.style.fontWeight === 700 ? 'Bold' : 'Regular'}
                         </button>
                    </div>

                    <div className="flex bg-[#1a1a1a] p-1 rounded-sm border border-gray-800">
                        {['left', 'center', 'right'].map((align) => (
                            <button
                                key={align}
                                onClick={() => updateStyle('textAlign', align)}
                                className={`flex-1 py-1 flex justify-center ${selectedLayer.style.textAlign === align ? 'bg-[#333] text-white' : 'text-gray-500'}`}
                            >
                                {align === 'left' && <AlignLeft size={14}/>}
                                {align === 'center' && <AlignCenter size={14}/>}
                                {align === 'right' && <AlignRight size={14}/>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. VISIBILITY & LAYOUT (Architecture Mode Only) */}
            {isArchitecture && (
                <div className="space-y-4 pt-4 border-t border-gray-800">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Layers size={12}/> Layout
                    </label>
                    
                    <div className="flex items-center justify-between glass-input p-2 rounded-sm">
                        <span className="text-xs text-gray-300">Visibility</span>
                        <button 
                            onClick={() => updateStyle('display', selectedLayer.style.display === 'none' ? 'block' : 'none')}
                            className="text-gray-400 hover:text-white"
                        >
                            {selectedLayer.style.display === 'none' ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => updateStyle('zIndex', (selectedLayer.style.zIndex || 10) + 1)} className="glass-input p-2 text-xs text-center hover:text-[#D4AF37]">Bring Forward</button>
                        <button onClick={() => updateStyle('zIndex', Math.max(0, (selectedLayer.style.zIndex || 10) - 1))} className="glass-input p-2 text-xs text-center hover:text-[#D4AF37]">Send Backward</button>
                    </div>
                </div>
            )}
        </div>
    </aside>
  );
};

export default EditorPanel;
