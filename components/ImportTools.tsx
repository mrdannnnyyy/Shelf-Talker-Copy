
import React, { useState, useRef, useEffect } from 'react';
// @ts-ignore
import Papa from 'papaparse';
import { Upload, Settings, ArrowRight, Save } from 'lucide-react';
import { Product, ColumnMapping } from '../types';

interface ImportToolsProps {
  onProductsImported: (products: Product[]) => void;
  onMappingChanged: (mapping: ColumnMapping) => void;
  initialMapping: ColumnMapping;
}

// Fixed System Fields (Updated with Category)
const SYSTEM_FIELDS = [
  { id: 'product-name-1', label: 'Product Name' },
  { id: 'product-name-2', label: 'Brand / Subtitle' },
  { id: 'active-price', label: 'Price (Active)' },
  { id: 'was-price', label: 'Sale Price (Was)' },
  { id: 'size-label', label: 'Size / Format' },
  { id: 'category-label', label: 'Category / Header' }, // ALIGNED ID
  { id: 'tasting-notes', label: 'Description / Notes' },
];

const ImportTools: React.FC<ImportToolsProps> = ({
  onProductsImported,
  onMappingChanged,
  initialMapping,
}) => {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [showMapper, setShowMapper] = useState(false);
  const [tempMapping, setTempMapping] = useState<ColumnMapping>(initialMapping);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('std_saved_mapping');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            setTempMapping(parsed);
            onMappingChanged(parsed); 
        } catch (e) {
            console.error("Failed to load saved mapping", e);
        }
    }
  }, [onMappingChanged]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          const data = results.data;
          const meta = results.meta;
          if (data && data.length > 0) {
            if (meta && meta.fields) {
              setCsvHeaders(meta.fields);
              setShowMapper(true); 
            }
            onProductsImported(data);
          }
        },
      });
    }
  };

  const handleMappingChange = (layerId: string, csvHeader: string) => {
    setTempMapping((prev) => ({
      ...prev,
      [layerId]: csvHeader,
    }));
  };

  const saveMapping = () => {
    onMappingChanged(tempMapping);
    localStorage.setItem('std_saved_mapping', JSON.stringify(tempMapping));
    setShowMapper(false);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
        id="csv-upload-input"
      />

      {showMapper && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-8 backdrop-blur-sm">
          <div className="bg-[#121212] border border-[#333] w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl rounded-md relative overflow-hidden">
            <div className="p-6 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
              <div>
                <h2 className="text-2xl text-white serif tracking-wider mb-1">DATA MAPPING</h2>
                <p className="text-[#D4AF37] text-xs uppercase tracking-widest">Connect CSV Columns to Design Elements</p>
              </div>
              <Settings className="text-[#333]" size={24} />
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-[#121212]">
                <div className="space-y-2">
                    {SYSTEM_FIELDS.map((field) => (
                        <div key={field.id} className="grid grid-cols-12 gap-4 items-center p-3 border rounded-sm border-[#222] bg-[#181818]">
                             <div className="col-span-4 text-right">
                                <label className="text-xs text-gray-400 font-bold uppercase tracking-widest">{field.label}</label>
                             </div>
                             <div className="col-span-1 flex justify-center">
                                <ArrowRight size={14} className="text-[#444]" />
                             </div>
                             <div className="col-span-7">
                                 <select
                                    value={tempMapping[field.id] || ''}
                                    onChange={(e) => handleMappingChange(field.id, e.target.value)}
                                    className="w-full p-2 bg-[#0C0C0C] border border-[#333] text-white text-xs focus:border-[#D4AF37] outline-none rounded-sm transition-colors cursor-pointer font-mono"
                                 >
                                    <option value="" className="text-gray-600">-- Select CSV Header --</option>
                                    {csvHeaders.map((header) => (
                                    <option key={header} value={header}>
                                        {header}
                                    </option>
                                    ))}
                                </select>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-6 border-t border-[#333] bg-[#1a1a1a] flex justify-between items-center">
                <div className="flex items-center gap-2 text-[#D4AF37] opacity-80">
                     <Save size={14} />
                     <span className="text-[10px] uppercase font-bold">Auto-Saving to Memory</span>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setShowMapper(false)}
                        className="px-6 py-2 text-gray-500 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={saveMapping}
                        className="px-8 py-2 bg-[#D4AF37] hover:bg-[#b38f20] text-black font-bold tracking-widest text-xs uppercase shadow-lg rounded-sm"
                    >
                        Confirm Mapping
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportTools;
