
import React, { useState, useCallback, useEffect } from 'react';
import Canvas from './components/Canvas';
import Sidebar from './components/Sidebar';
import ImportTools from './components/ImportTools';
import Vault from './components/Vault';
import PrintSheet from './components/PrintSheet';
import { Layer, CanvasConfig, Product, ColumnMapping, HistoryRecord } from './types';
import { INITIAL_LAYERS, CANVAS_CONFIG, STAFF_PICK_LAYERS } from './constants';
import { Layout, Database, History, Printer, ZoomIn, ZoomOut, Upload, Search, Save, CheckSquare, Square, CheckCircle, ArrowRightCircle, X, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  // --- STATE ---
  const [layers, setLayers] = useState<Layer[]>(INITIAL_LAYERS);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
      ...CANVAS_CONFIG,
      backgroundTop: '#F5F0E1', 
      backgroundBottom: '#7B1E36', 
      splitRatio: 0.6,
  });
  
  // VIEW MODE: Added 'print' as a main tab
  const [viewMode, setViewMode] = useState<'batch' | 'vault' | 'architecture' | 'print'>('batch');
  const [zoomLevel, setZoomLevel] = useState(0.85);

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null);
  
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [layerMapping, setLayerMapping] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  
  // UI State
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  // ACTIVE TEMPLATE TRACKING (Fix 1)
  const [activeTemplateId, setActiveTemplateId] = useState<string>('default');

  // PRODUCTION ENGINE STATE
  const [printQueue, setPrintQueue] = useState<{ id: string; layers: Layer[] }[]>([]);
  const [checkedProducts, setCheckedProducts] = useState<Set<number>>(new Set());
  const [customBadges, setCustomBadges] = useState<string[]>([]); // Base64 strings

  // HELPER: Reset mappings for standard templates to ensure inputs work
  const resetStandardMappings = () => {
        const initLayerMap: Record<string, string> = {};
        // We create a standard map based on known system keys
        // This ensures that if the template has these IDs, they are mapped correctly
        // and clears any "ghost" mappings from previous custom templates
        ['product-name-1', 'product-name-2', 'active-price', 'category-label', 'was-price', 'size-label', 'tasting-notes'].forEach(key => {
            initLayerMap[key] = key;
        });
        setLayerMapping(initLayerMap);
        localStorage.setItem('std_layer_mapping', JSON.stringify(initLayerMap));
        return initLayerMap;
  };

  useEffect(() => {
    const savedMapping = localStorage.getItem('std_mapping');
    if (savedMapping) setColumnMapping(JSON.parse(savedMapping));
    const savedHistory = localStorage.getItem('std_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    // LOAD LAYER MAPPING
    const savedLayerMapping = localStorage.getItem('std_layer_mapping');
    if (savedLayerMapping) {
        setLayerMapping(JSON.parse(savedLayerMapping));
    } else {
        resetStandardMappings();
    }
  }, []);

  // --- SMART MATH HELPER ---
  const recalculateSmartLayers = (currentLayers: Layer[]): Layer[] => {
      const getPrice = (id: string) => {
          let targetLayer = currentLayers.find(x => x.id === id);
          if (!targetLayer) {
             const mappedId = Object.keys(layerMapping).find(key => layerMapping[key] === id);
             if (mappedId) targetLayer = currentLayers.find(x => x.id === mappedId);
          }
          if (!targetLayer || !targetLayer.content) return 0;
          return parseFloat(targetLayer.content.replace(/[^0-9.]/g, '')) || 0;
      };

      const activePrice = getPrice('active-price');
      const wasPrice = getPrice('was-price');
      const savings = wasPrice - activePrice;

      const ribbonBgIndex = currentLayers.findIndex(l => l.id === 'ribbon-bg');
      const ribbonTextIndex = currentLayers.findIndex(l => l.id === 'ribbon-text');

      if (ribbonBgIndex === -1 || ribbonTextIndex === -1) return currentLayers;

      const newLayers = [...currentLayers];
      const ribbonBg = { ...newLayers[ribbonBgIndex], style: { ...newLayers[ribbonBgIndex].style } };
      const ribbonText = { ...newLayers[ribbonTextIndex], style: { ...newLayers[ribbonTextIndex].style } };

      if (wasPrice > activePrice && savings > 0.01) {
          ribbonBg.style.display = 'flex';
          ribbonText.style.display = 'block';
          ribbonText.content = `SAVE $${savings.toFixed(2)}`;
      } else {
          ribbonBg.style.display = 'none';
          ribbonText.style.display = 'none';
      }

      newLayers[ribbonBgIndex] = ribbonBg;
      newLayers[ribbonTextIndex] = ribbonText;
      return newLayers;
  };

  // --- CANVAS HANDLERS ---
  const handleSelectLayer = useCallback((id: string) => {
    setSelectedLayerId(id === selectedLayerId ? null : id);
  }, [selectedLayerId]);

  const handleUpdateLayerPosition = useCallback((id: string, x: number, y: number) => {
      setLayers(prev => prev.map(l => l.id === id ? { ...l, x, y } : l));
  }, []);

  const handleUpdateLayer = useCallback((id: string, updates: Partial<Layer>) => {
      setLayers(prev => {
          let updatedLayers = prev.map(l => l.id !== id ? l : { 
              ...l, ...updates, 
              style: updates.style ? { ...l.style, ...updates.style } : l.style 
          });
          updatedLayers = recalculateSmartLayers(updatedLayers);
          return updatedLayers;
      });
  }, [layerMapping]); 
  
  const handleUpdateConfig = (updates: Partial<CanvasConfig>) => {
      setCanvasConfig(prev => ({ ...prev, ...updates }));
  };

  const handleBindLayer = (layerId: string, systemKey: string) => {
      const newMapping = { ...layerMapping, [layerId]: systemKey };
      setLayerMapping(newMapping);
      localStorage.setItem('std_layer_mapping', JSON.stringify(newMapping));
      
      if (selectedProductIndex !== null && products[selectedProductIndex]) {
           const product = products[selectedProductIndex];
           const csvHeader = columnMapping[systemKey];
           if (csvHeader && product[csvHeader]) {
               handleUpdateLayer(layerId, { content: product[csvHeader] });
           }
      }
  };

  // --- CUSTOM ASSETS ---
  const handleAddCustomBadgeLayer = (base64: string) => {
      const newLayer: Layer = {
          id: `custom-badge-${Date.now()}`,
          type: 'image',
          name: 'Custom Badge',
          content: base64,
          x: 50,
          y: 50,
          style: { width: 80, height: 80, zIndex: 100 }
      };
      setLayers([...layers, newLayer]);
  };

  // --- DATA MAPPING LOGIC ---
  const applyProductToLayers = (product: Product, currentLayers: Layer[], colMap: ColumnMapping, layMap: Record<string, string>) => {
      let nextLayers = currentLayers.map(layer => {
          const systemKey = layMap[layer.id] || layer.id;
          const csvHeader = colMap[systemKey];
          if (csvHeader && product[csvHeader] !== undefined) {
              return { ...layer, content: product[csvHeader] };
          }
          return layer;
      });
      nextLayers = recalculateSmartLayers(nextLayers);
      return nextLayers;
  };

  const handleSelectProduct = (product: Product) => {
      const idx = products.indexOf(product);
      setSelectedProductIndex(idx);
      const newLayers = applyProductToLayers(product, layers, columnMapping, layerMapping);
      setLayers(newLayers);
  };

  const handleMappingChanged = (newMapping: ColumnMapping) => {
      setColumnMapping(newMapping);
      localStorage.setItem('std_mapping', JSON.stringify(newMapping));
      if (selectedProductIndex !== null && products[selectedProductIndex]) {
          const newLayers = applyProductToLayers(products[selectedProductIndex], layers, newMapping, layerMapping);
          setLayers(newLayers);
      }
  };

  // --- QUEUE LOGIC ---
  const toggleCheckProduct = (index: number) => {
      const newSet = new Set(checkedProducts);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      setCheckedProducts(newSet);
  };

  const addCheckedToQueue = () => {
      const newItems: { id: string; layers: Layer[] }[] = [];
      checkedProducts.forEach(idx => {
          const prod = products[idx];
          const renderedLayers = applyProductToLayers(prod, layers, columnMapping, layerMapping);
          newItems.push({
              id: `${Date.now()}-${idx}`,
              layers: renderedLayers
          });
      });
      setPrintQueue([...printQueue, ...newItems]);
      setCheckedProducts(new Set());
      alert(`Sent ${newItems.length} labels to Print Queue`);
  };

  // --- TEMPLATE LOGIC ---
  const handleLoadTemplate = (templateId: string) => {
      if (!templateId) return;
      setActiveTemplateId(templateId);

      // 1. Staff Pick Preset
      if (templateId === 'staff-pick') {
          if (confirm("Load Staff Pick Special layout? This will replace your current design.")) {
              const freshMappings = resetStandardMappings();
              
              setCanvasConfig(prev => ({ 
                  ...prev, 
                  backgroundTop: '#F5F0E1', // Restore default top
                  backgroundBottom: '#7B1E36', // Restore default bottom (overridden by split/shapes)
                  splitRatio: 0.6
              }));
              
              let newLayers = JSON.parse(JSON.stringify(STAFF_PICK_LAYERS));
              
              if (selectedProductIndex !== null) {
                  newLayers = applyProductToLayers(products[selectedProductIndex], newLayers, columnMapping, freshMappings);
              }
              setLayers(newLayers);
          }
          return;
      }

      // 2. Factory Defaults
      if (templateId === 'default' || templateId === 'reset') {
          if (confirm("Reset layout to default?")) {
              const freshMappings = resetStandardMappings();

              setCanvasConfig({ ...CANVAS_CONFIG, backgroundTop: '#F5F0E1', backgroundBottom: '#7B1E36', splitRatio: 0.6 });
              let newLayers = JSON.parse(JSON.stringify(INITIAL_LAYERS));
              if (selectedProductIndex !== null) {
                  newLayers = applyProductToLayers(products[selectedProductIndex], newLayers, columnMapping, freshMappings);
              }
              setLayers(newLayers);
          }
          return;
      } 
      
      // 3. Custom Saved Templates
      const record = history.find(h => h.id === templateId);
      if (record) {
          if (confirm(`Load custom template "${record.templateName}"?`)) {
              if (record.config) {
                  setCanvasConfig(record.config);
              }
              if (record.layerMapping) {
                  setLayerMapping(record.layerMapping);
                  localStorage.setItem('std_layer_mapping', JSON.stringify(record.layerMapping));
              }
              
              let newLayers = JSON.parse(JSON.stringify(record.layers));
              // Re-bind data if a product is currently active
              if (selectedProductIndex !== null && products[selectedProductIndex]) {
                  newLayers = applyProductToLayers(products[selectedProductIndex], newLayers, columnMapping, record.layerMapping || layerMapping);
              }
              setLayers(newLayers);
          }
      }
  };

  // --- VAULT / SAVE TEMPLATE LOGIC ---
  const handleSaveToVault = () => {
      setNewTemplateName("Custom Template");
      setShowSaveModal(true);
  };

  const handleUpdateTemplate = () => {
      // Logic Fix: Ensure we are updating the correct record
      const existingRecordIndex = history.findIndex(h => h.id === activeTemplateId);
      
      if (existingRecordIndex === -1) {
          // Fallback if ID not found (e.g., deleted or default)
          handleSaveToVault();
          return;
      }

      if (confirm("Update existing template with current changes?")) {
          const updatedHistory = [...history];
          updatedHistory[existingRecordIndex] = {
              ...updatedHistory[existingRecordIndex],
              timestamp: Date.now(),
              layers: JSON.parse(JSON.stringify(layers)),
              layerMapping: JSON.parse(JSON.stringify(layerMapping)),
              config: JSON.parse(JSON.stringify(canvasConfig))
          };
          setHistory(updatedHistory);
          localStorage.setItem('std_history', JSON.stringify(updatedHistory));
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
      }
  };

  const executeSaveTemplate = () => {
      if (!newTemplateName.trim()) return;

      const newId = Date.now().toString();
      const record: HistoryRecord = {
          id: newId,
          timestamp: Date.now(),
          productName: "Template", 
          templateName: newTemplateName, // User provided name
          printDate: new Date().toISOString(),
          layers: JSON.parse(JSON.stringify(layers)),
          layerMapping: JSON.parse(JSON.stringify(layerMapping)),
          config: JSON.parse(JSON.stringify(canvasConfig)) // Save Config
      };
      
      const newHistory = [...history, record];
      setHistory(newHistory);
      localStorage.setItem('std_history', JSON.stringify(newHistory));
      
      setActiveTemplateId(newId); // Switch to the new template
      setShowSaveModal(false);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const updateVaultRecord = (id: string, field: string, value: string) => {
      const newHistory = history.map(h => h.id === id ? { ...h, [field]: value } : h);
      setHistory(newHistory);
      localStorage.setItem('std_history', JSON.stringify(newHistory));
  };
  
  const handleLoadFromVault = (record: HistoryRecord) => {
      if (confirm(`Load "${record.templateName || record.productName}"?`)) {
          if (record.layers) {
              setLayers(JSON.parse(JSON.stringify(record.layers)));
              
              if (record.layerMapping) {
                  setLayerMapping(JSON.parse(JSON.stringify(record.layerMapping)));
                  localStorage.setItem('std_layer_mapping', JSON.stringify(record.layerMapping));
              } else {
                  // Fallback for legacy templates without mapping
                  resetStandardMappings();
              }

              if (record.config) {
                  setCanvasConfig(record.config);
              }
              
              setActiveTemplateId(record.id); // IMPORTANT: Track ID to allow updates
              setViewMode('batch'); // Go to Data Mode by default on load from vault
          }
      }
  };

  // --- SEARCH ---
  const filteredProducts = products.filter(p => 
    Object.values(p).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // --- TEMPLATE OPTIONS RENDERER ---
  const renderTemplateOptions = () => (
      <>
          <option value="default">Default Template</option>
          <option value="staff-pick">Staff Pick Special</option>
          <optgroup label="My Saved Templates">
              {history.filter(h => h.templateName).map(h => (
                  <option key={h.id} value={h.id}>{h.templateName}</option>
              ))}
          </optgroup>
          <option value="reset">Reset Layout</option>
      </>
  );

  // Check if current active template is a custom user-saved one
  const isCustomTemplate = history.some(h => h.id === activeTemplateId);

  return (
    <div className="flex flex-col h-screen w-full bg-[#121212] text-gray-200 font-sans overflow-hidden relative">
      
      {/* HEADER */}
      <header className="h-16 border-b border-[rgba(255,255,255,0.08)] bg-[#121212] flex items-center justify-between px-6 z-50 shrink-0">
         <div className="flex items-center gap-4">
            <h1 className="text-xl text-white serif tracking-widest font-bold">CORKED</h1>
            <div className="h-6 w-px bg-gray-700"></div>
            <p className="text-[10px] text-[#D4AF37] tracking-[0.2em] uppercase">Production Engine</p>
         </div>

         {/* NAV PILLS */}
         <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-sm border border-[rgba(255,255,255,0.05)]">
             <button onClick={() => { setViewMode('batch'); setSelectedLayerId(null); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'batch' ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>
                <Database size={12} /> Data Mode
             </button>
             <button onClick={() => setViewMode('architecture')} className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'architecture' ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>
                <Layout size={12} /> Design Mode
             </button>
             <button onClick={() => setViewMode('vault')} className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'vault' ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>
                <History size={12} /> Vault
             </button>
             {/* NEW PRINT TAB */}
             <button onClick={() => setViewMode('print')} className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === 'print' ? 'bg-[#D4AF37] text-black' : 'text-gray-500 hover:text-white'}`}>
                <Printer size={12} /> Print Queue <span className="ml-1 bg-white/20 px-1 rounded-sm text-[9px]">{printQueue.length}</span>
             </button>
         </div>

         <div className="flex items-center gap-4">
             {/* DATA MODE: LOAD TEMPLATE */}
             {viewMode === 'batch' && (
                  <select 
                    value={activeTemplateId}
                    onChange={(e) => handleLoadTemplate(e.target.value)} 
                    className="bg-[#1a1a1a] text-xs text-gray-300 border border-gray-700 rounded-sm px-2 py-1 outline-none w-40"
                  >
                      {renderTemplateOptions()}
                  </select>
             )}

             {/* DESIGN MODE: LOAD & SAVE & UPDATE */}
             {viewMode === 'architecture' && (
                  <div className="flex items-center gap-2">
                      <select 
                        value={activeTemplateId}
                        onChange={(e) => handleLoadTemplate(e.target.value)} 
                        className="bg-[#1a1a1a] text-xs text-gray-300 border border-gray-700 rounded-sm px-2 py-2 outline-none w-32"
                      >
                          <option value="">-- Edit --</option>
                          {renderTemplateOptions()}
                      </select>
                      
                      {/* FIX 1: Toggle Button Logic (Save vs Update) */}
                      {isCustomTemplate ? (
                           <button 
                                onClick={handleUpdateTemplate}
                                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 transition-all border border-gray-600 ${saveStatus === 'saved' ? 'bg-green-600 text-white border-green-500' : 'bg-[#D4AF37] hover:bg-[#b38f20] text-black'}`}
                           >
                                <RefreshCw size={14} /> Update Template
                           </button>
                      ) : (
                           <button 
                                onClick={handleSaveToVault}
                                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm flex items-center gap-2 transition-all border border-gray-600 ${saveStatus === 'saved' ? 'bg-green-600 text-white border-green-500' : 'bg-[#333] hover:bg-[#444] text-white'}`}
                           >
                                <Save size={14} /> Save as Template
                           </button>
                      )}
                  </div>
             )}
         </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex overflow-hidden">
         
         {/* VIEW 1: PRINT SHEET (Full Screen) */}
         {viewMode === 'print' ? (
             <div className="w-full h-full bg-[#E5E5E5]">
                 <PrintSheet 
                    queue={printQueue} 
                    config={canvasConfig} 
                    onClose={() => setViewMode('batch')}
                    onPrint={() => window.print()}
                    onRemoveFromQueue={(i) => setPrintQueue(printQueue.filter((_, idx) => idx !== i))}
                    onReorderQueue={(newQueue) => setPrintQueue(newQueue)}
                  />
             </div>
         ) : viewMode === 'vault' ? (
             // VIEW 2: VAULT
             <div className="flex-1 bg-[#121212]">
                 <Vault history={history} onReprint={handleLoadFromVault} onUpdateRecord={updateVaultRecord} />
             </div>
         ) : (
             // VIEW 3: EDITOR (DATA & DESIGN)
             <>
                {/* LEFT COL: INVENTORY (Only in Data Mode) */}
                {viewMode === 'batch' && (
                    <div className="w-[20%] min-w-[250px] border-r border-[rgba(255,255,255,0.08)] bg-[#121212] flex flex-col">
                        <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[#141414]">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">Inventory</h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={addCheckedToQueue} 
                                        title="Send Checked to Print" 
                                        className="flex items-center gap-1 bg-[#D4AF37] text-black px-2 py-1 rounded-sm text-[10px] font-bold uppercase hover:bg-white transition-colors"
                                    >
                                        <ArrowRightCircle size={12} /> Send to Print
                                    </button>
                                    <label htmlFor="csv-upload-input" className="cursor-pointer text-gray-500 hover:text-white pt-1"><Upload size={14} /></label>
                                </div>
                            </div>
                            <ImportTools 
                                onProductsImported={setProducts}
                                onMappingChanged={handleMappingChanged}
                                initialMapping={columnMapping}
                            />
                            <div className="relative mt-2">
                                <Search size={12} className="absolute left-3 top-2.5 text-gray-600" />
                                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0a0a0a] border border-[#333] text-gray-300 text-xs py-2 pl-8 pr-2 rounded-sm outline-none focus:border-[#D4AF37]" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {products.length === 0 ? (
                                <div className="p-8 text-center text-gray-700 text-xs italic">Upload CSV to begin.</div>
                            ) : (
                                filteredProducts.map((product, idx) => {
                                    let displayName = "Unknown Product";
                                    const mappedNameKey = columnMapping['product-name-1'];
                                    if (mappedNameKey && product[mappedNameKey]) {
                                        displayName = product[mappedNameKey];
                                    } else {
                                        displayName = (Object.values(product)[0] as string) || '---';
                                    }
                                    
                                    const sku = (Object.values(product)[1] as string) || '---';
                                    const isSelected = selectedProductIndex === products.indexOf(product);
                                    const isChecked = checkedProducts.has(products.indexOf(product));

                                    return (
                                        <div key={idx} className={`flex items-center p-2 border-b border-[#222] transition-colors ${isSelected ? 'bg-[#1a1a1a]' : 'hover:bg-[#161616]'}`}>
                                            <button onClick={() => toggleCheckProduct(products.indexOf(product))} className="px-2 text-gray-500 hover:text-[#D4AF37]">
                                                {isChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                                            </button>
                                            <div className="flex-1 cursor-pointer overflow-hidden" onClick={() => handleSelectProduct(product)}>
                                                <div className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>{String(displayName)}</div>
                                                <div className="text-[10px] text-gray-600 font-mono truncate">{String(sku)}</div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* RIGHT COL: SIDEBAR (Properties) */}
                <div className="w-[25%] min-w-[300px] border-r border-[rgba(255,255,255,0.08)] bg-[rgba(18,18,18,0.95)] z-20">
                    <Sidebar
                        layers={layers}
                        selectedLayerId={selectedLayerId}
                        config={canvasConfig}
                        onUpdateLayer={handleUpdateLayer}
                        onUpdateConfig={handleUpdateConfig}
                        onDeleteLayer={(id) => setLayers(l => l.filter(x => x.id !== id))}
                        onSelectLayer={handleSelectLayer}
                        onBindLayer={handleBindLayer}
                        viewMode={viewMode}
                        customBadges={customBadges}
                        onUploadBadge={(b64) => setCustomBadges([...customBadges, b64])}
                        onAddCustomBadgeLayer={handleAddCustomBadgeLayer}
                        layerMapping={layerMapping} 
                    />
                </div>

                {/* CENTER: CANVAS */}
                <div className="flex-1 bg-[#0a0a0a] relative flex flex-col min-w-0">
                    <div className="absolute top-4 right-4 z-20 bg-[rgba(0,0,0,0.5)] backdrop-blur-sm p-1 rounded-full flex items-center border border-[rgba(255,255,255,0.1)]">
                        <button onClick={() => setZoomLevel(Math.max(0.4, zoomLevel - 0.1))} className="p-2 text-gray-400 hover:text-white"><ZoomOut size={14} /></button>
                        <span className="text-[10px] font-mono w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <button onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))} className="p-2 text-gray-400 hover:text-white"><ZoomIn size={14} /></button>
                    </div>
                    
                    <div className="flex-1 overflow-auto relative custom-scrollbar">
                        <Canvas
                            layers={layers}
                            selectedLayerId={selectedLayerId}
                            config={canvasConfig}
                            onSelectLayer={handleSelectLayer}
                            onUpdateLayerPosition={handleUpdateLayerPosition}
                            onUpdateLayer={handleUpdateLayer}
                            onUpdateConfig={handleUpdateConfig}
                            viewMode={viewMode}
                            scale={zoomLevel}
                        />
                    </div>
                </div>
             </>
         )}
      </main>

      {/* SAVE TEMPLATE MODAL */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded-md shadow-2xl w-96 relative">
                <button onClick={() => setShowSaveModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={16}/></button>
                <h3 className="text-lg font-bold text-white serif mb-1">Save Template</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Name your design preset</p>
                
                <input 
                    type="text" 
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-2 text-sm text-white focus:border-[#D4AF37] outline-none rounded-sm mb-6"
                    placeholder="Enter template name..."
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && executeSaveTemplate()}
                />
                
                <div className="flex justify-end gap-3">
                    <button 
                        onClick={() => setShowSaveModal(false)}
                        className="px-4 py-2 text-xs font-bold uppercase text-gray-500 hover:text-white"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={executeSaveTemplate}
                        className="px-6 py-2 bg-[#D4AF37] hover:bg-[#b38f20] text-black text-xs font-bold uppercase rounded-sm shadow-md"
                    >
                        Save Preset
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;
