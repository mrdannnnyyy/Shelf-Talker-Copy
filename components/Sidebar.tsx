
import React, { useRef } from 'react';
import { Layer, CanvasConfig } from '../types';
import { 
    AlignLeft, AlignCenter, AlignRight, 
    Type, Bold, Wand2, Palette, Layers, 
    Eye, EyeOff, Trash2, Database, Box, Image as ImageIcon, Plus, DollarSign
} from 'lucide-react';

interface SidebarProps {
  layers: Layer[];
  selectedLayerId: string | null;
  config: CanvasConfig;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onUpdateConfig: (updates: Partial<CanvasConfig>) => void;
  onDeleteLayer?: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onBindLayer: (layerId: string, systemKey: string) => void;
  viewMode: 'batch' | 'architecture' | 'vault';
  customBadges: string[];
  onUploadBadge: (base64: string) => void;
  onAddCustomBadgeLayer: (base64: string) => void;
  layerMapping?: Record<string, string>; // New Prop for synchronization
}

const FONTS = [
    { label: 'Premium Serif (Cinzel)', value: 'Cinzel, serif' },
    { label: 'Modern (Montserrat)', value: 'Montserrat, sans-serif' },
    { label: 'Condensed (Oswald)', value: 'Oswald, sans-serif' },
    { label: 'Classic (Playfair)', value: 'Playfair Display, serif' },
];

const DATA_OPTIONS = [
    { label: 'Product Name', value: 'product-name-1' },
    { label: 'Brand / Subtitle', value: 'product-name-2' },
    { label: 'Price (Active)', value: 'active-price' },
    { label: 'Was Price', value: 'was-price' },
    { label: 'Size / Format', value: 'size-label' },
    { label: 'Category / Header', value: 'category-label' },
    { label: 'Description / Notes', value: 'tasting-notes' },
    { label: 'Points Score', value: 'badge-points-group' }
];

const Sidebar: React.FC<SidebarProps> = ({
  layers,
  selectedLayerId,
  config,
  onUpdateLayer,
  onUpdateConfig,
  onDeleteLayer,
  onSelectLayer,
  onBindLayer,
  viewMode,
  customBadges,
  onUploadBadge,
  onAddCustomBadgeLayer,
  layerMapping = {} // Default empty object
}) => {
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);
  const isArchitecture = viewMode === 'architecture';

  const updateStyle = (key: string, value: any) => {
      if (!selectedLayer) return;
      onUpdateLayer(selectedLayer.id, { style: { ...selectedLayer.style, [key]: value } });
  };
  
  // Safe Font Size Handler
  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value);
      if (!isNaN(val) && val > 0) {
          updateStyle('fontSize', val);
      } else if (e.target.value === '') {
          // Allow clearing
      }
  };

  // --- HELPER: MAPPED GETTER/SETTER ---
  const getMappedContent = (systemKey: string) => {
      // 1. Find a mapped ID that corresponds to an EXISTING layer
      const mappedId = Object.keys(layerMapping).find(id => 
          layerMapping[id] === systemKey && layers.some(l => l.id === id)
      );

      if (mappedId) {
          const l = layers.find(layer => layer.id === mappedId);
          if (l) return l.content || '';
      }
      
      // 2. Fallback to ID match (System Default)
      const fallbackLayer = layers.find(l => l.id === systemKey);
      return fallbackLayer ? (fallbackLayer.content || '') : ''; 
  };
  
  const updateMappedContent = (systemKey: string, val: string) => {
      // 1. Try to find layers explicitly mapped to this key
      const mappedIds = Object.keys(layerMapping).filter(id => layerMapping[id] === systemKey);
      
      let targets = mappedIds.filter(id => layers.some(l => l.id === id));
      
      // 2. If no mapped layers found, try to find a layer with the ID == systemKey
      if (targets.length === 0) {
          const directMatch = layers.find(l => l.id === systemKey);
          if (directMatch) {
              targets.push(directMatch.id);
          }
      }

      // 3. Update all found targets
      if (targets.length > 0) {
          targets.forEach(id => {
              onUpdateLayer(id, { content: val });
          });
      } else {
          // Fallback warning (silent) or handling if needed
      }
  };

  const handleDataBindingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (!selectedLayer) return;
      const systemKey = e.target.value;
      onBindLayer(selectedLayer.id, systemKey);
  };

  // --- SUMMARIZE LOGIC ---
  const handleSummarize = (e: React.MouseEvent) => {
      e.preventDefault(); 
      e.stopPropagation();
      
      let currentText = getMappedContent('tasting-notes');
      
      if (!currentText) {
          const targetLayer = layers.find(l => l.id === 'tasting-notes');
          if (targetLayer) currentText = targetLayer.content || '';
      }
      
      if (!currentText) return;

      const cleanText = currentText.replace(/\s+/g, ' ').trim();
      const words = cleanText.split(' ');
      
      if (words.length <= 3) return;
      const summary = words.slice(0, 3).join(' ') + '...';
      updateMappedContent('tasting-notes', summary);
  };

  // =========================================================
  // ARCHITECTURE MODE (DESIGNER)
  // =========================================================
  if (isArchitecture) {
      if (!selectedLayer) {
        return (
            <aside className="glass-panel flex flex-col h-full overflow-hidden text-gray-200">
                <div className="p-6 border-b border-[rgba(255,255,255,0.05)] bg-[#0C0C0C]">
                    <h2 className="text-[#D4AF37] font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                        <Palette size={14}/> Canvas & Assets
                    </h2>
                </div>
                <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                    {/* Backgrounds */}
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Background Colors</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 glass-input p-1 rounded-sm">
                                <input type="color" value={config.backgroundTop} onChange={e => onUpdateConfig({backgroundTop: e.target.value})} className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"/>
                            </div>
                            <div className="flex items-center gap-2 glass-input p-1 rounded-sm">
                                <input type="color" value={config.backgroundBottom} onChange={e => onUpdateConfig({backgroundBottom: e.target.value})} className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"/>
                            </div>
                        </div>
                    </div>

                    {/* Layer List */}
                    <div className="pt-6 border-t border-gray-800">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3 flex items-center gap-2">
                            <Layers size={12}/> All Layers
                        </label>
                        <div className="space-y-1">
                            {layers.slice().reverse().map((layer) => (
                                <div key={layer.id} onClick={() => onSelectLayer(layer.id)} className="flex items-center gap-3 p-2 rounded-sm cursor-pointer transition-all border border-transparent hover:bg-[#1a1a1a] text-gray-500 hover:text-white">
                                    <span className="text-xs truncate">{layer.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>
        );
      }

      // Selected Layer Architecture Mode
      return (
        <aside className="glass-panel flex flex-col h-full overflow-hidden text-gray-200">
            <div className="p-6 border-b border-[rgba(255,255,255,0.05)] bg-[#0C0C0C] flex justify-between items-center">
                <h2 className="text-white font-bold text-sm tracking-widest uppercase truncate max-w-[150px]">{selectedLayer.name}</h2>
                <button onClick={() => onDeleteLayer && onDeleteLayer(selectedLayer.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* 1. DATA MAPPING */}
                {(selectedLayer.type === 'text' || selectedLayer.type === 'group') && (
                    <div className="space-y-2 pb-4 border-b border-gray-800">
                        <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-2">
                            <Database size={12}/> Data Source
                        </label>
                        <select 
                            onChange={handleDataBindingChange}
                            value={layerMapping[selectedLayer.id] || ''} 
                            className="glass-input w-full p-2 text-xs rounded-sm cursor-pointer text-[#D4AF37] border-[#D4AF37]/50 outline-none"
                        >
                            <option value="">-- No Binding --</option>
                            {DATA_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {(selectedLayer.type === 'text' || selectedLayer.type === 'group') && (
                    <div className="space-y-2">
                         <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Content</label>
                         <textarea className="glass-input w-full p-3 text-sm rounded-sm" rows={3} value={selectedLayer.content || ''} onChange={(e) => onUpdateLayer(selectedLayer.id, { content: e.target.value })} />
                    </div>
                )}
                {selectedLayer.type === 'text' && (
                    <div className="space-y-4 pt-4 border-t border-gray-800">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Type size={12}/> Typography</label>
                        <select value={selectedLayer.style.fontFamily} onChange={(e) => updateStyle('fontFamily', e.target.value)} className="glass-input w-full p-2 text-xs rounded-sm cursor-pointer">
                            {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-3">
                             <div className="flex items-center gap-2 glass-input p-2 rounded-sm justify-between">
                                <span className="text-[10px] text-gray-400">Color</span>
                                <input type="color" value={selectedLayer.style.color} onChange={(e) => updateStyle('color', e.target.value)} className="bg-transparent border-none w-5 h-5 p-0 cursor-pointer"/>
                             </div>
                             <input 
                                type="number" 
                                value={selectedLayer.style.fontSize || ''} 
                                onChange={handleFontSizeChange} 
                                className="glass-input p-2 text-sm rounded-sm" 
                                placeholder="Size" 
                             />
                        </div>
                    </div>
                )}
            </div>
        </aside>
      );
  }

  // =========================================================
  // DATA MODE (FORM EDITOR) - ENSURED NO DISABLED INPUTS
  // =========================================================
  return (
    <aside className="glass-panel flex flex-col h-full overflow-hidden text-gray-200">
        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] bg-[#0C0C0C]">
             <h2 className="text-[#D4AF37] font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                 <Database size={14} /> Product Data
             </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* 1. IDENTITY */}
            <div className="space-y-3">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Product Identity</label>
                <input 
                    type="text" 
                    value={getMappedContent('product-name-1')}
                    onChange={(e) => updateMappedContent('product-name-1', e.target.value)}
                    placeholder="Product Name"
                    className="glass-input w-full p-3 text-sm rounded-sm font-bold text-white placeholder-gray-600 focus:border-[#D4AF37] outline-none"
                />
                <input 
                    type="text" 
                    value={getMappedContent('product-name-2')}
                    onChange={(e) => updateMappedContent('product-name-2', e.target.value)}
                    placeholder="Subtitle / Varietal"
                    className="glass-input w-full p-2 text-xs rounded-sm text-gray-300 placeholder-gray-600 focus:border-[#D4AF37] outline-none"
                />
            </div>

            {/* 2. PRICING */}
            <div className="space-y-3 pt-4 border-t border-gray-800">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Pricing Engine</label>
                <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3 text-[#D4AF37]" />
                    <input 
                        type="text" 
                        value={getMappedContent('active-price')}
                        onChange={(e) => updateMappedContent('active-price', e.target.value)}
                        className="glass-input w-full pl-8 pr-3 py-2 text-xl font-bold font-oswald text-white placeholder-gray-600 focus:border-[#D4AF37] outline-none"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <input 
                        type="text" 
                        value={getMappedContent('was-price')}
                        onChange={(e) => updateMappedContent('was-price', e.target.value)}
                        placeholder="Was Price"
                        className="glass-input w-full p-2 text-xs text-gray-400 placeholder-gray-600 focus:border-[#D4AF37] outline-none"
                    />
                    <input 
                        type="text" 
                        value={getMappedContent('size-label')}
                        onChange={(e) => updateMappedContent('size-label', e.target.value)}
                        placeholder="750ml"
                        className="glass-input w-full p-2 text-xs text-gray-400 placeholder-gray-600 focus:border-[#D4AF37] outline-none"
                    />
                </div>
            </div>

            {/* 3. TASTING NOTES (With Summarize) */}
            <div className="space-y-3 pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sensory Profile</label>
                    <button 
                        type="button" 
                        onClick={handleSummarize}
                        className="text-[10px] text-[#D4AF37] hover:text-white uppercase font-bold flex items-center gap-1 transition-colors"
                    >
                        <Wand2 size={12} /> Summarize
                    </button>
                </div>
                <textarea 
                    rows={4}
                    value={getMappedContent('tasting-notes')}
                    onChange={(e) => updateMappedContent('tasting-notes', e.target.value)}
                    placeholder="Enter tasting notes..."
                    className="glass-input w-full p-3 text-sm text-gray-300 leading-relaxed placeholder-gray-600 focus:border-[#D4AF37] outline-none"
                />
            </div>

            {/* 4. CATEGORY */}
             <div className="space-y-3 pt-4 border-t border-gray-800">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Category</label>
                <input 
                    type="text" 
                    value={getMappedContent('category-label')}
                    onChange={(e) => updateMappedContent('category-label', e.target.value)}
                    placeholder="SINGLE MALT SCOTCH"
                    className="glass-input w-full p-2 text-xs rounded-sm text-gray-300 placeholder-gray-600 focus:border-[#D4AF37] outline-none"
                />
            </div>
        </div>
    </aside>
  );
};

export default Sidebar;
