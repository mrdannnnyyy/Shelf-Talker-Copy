
import React, { useState } from 'react';
import { HistoryRecord } from '../types';
import { Printer, Clock, Search, Save } from 'lucide-react';

interface VaultProps {
  history: HistoryRecord[];
  onReprint: (record: HistoryRecord) => void;
  onUpdateRecord: (id: string, field: string, value: string) => void;
}

const Vault: React.FC<VaultProps> = ({ history, onReprint, onUpdateRecord }) => {
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredHistory = history.filter(h => 
    h.productName.toLowerCase().includes(filter.toLowerCase()) || 
    h.templateName.toLowerCase().includes(filter.toLowerCase())
  );

  const handleBlur = (id: string, field: string, value: string) => {
    setEditingId(null);
    onUpdateRecord(id, field, value);
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#141414] text-gray-600 p-8 text-center">
        <Printer size={48} className="mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-gray-500">The Vault is Empty</h3>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#141414]">
      {/* TOOLBAR */}
      <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#0C0C0C]">
        <h2 className="text-lg font-bold text-[#D4AF37] flex items-center gap-2 tracking-wider">
          <Clock size={20} /> VAULT
        </h2>
        <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
            <input 
                type="text" 
                placeholder="Filter records..." 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] text-gray-300 text-xs py-2 pl-8 pr-2 rounded-sm outline-none focus:border-[#D4AF37]"
            />
        </div>
      </div>

      {/* DENSE TABLE */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#1A1A1A] text-gray-400 uppercase tracking-widest sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 border-b border-[#333] w-32">Date</th>
              <th className="px-4 py-3 border-b border-[#333]">Product Name (Editable)</th>
              <th className="px-4 py-3 border-b border-[#333] w-48">Layout Used</th>
              <th className="px-4 py-3 border-b border-[#333] w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.slice().reverse().map((record) => (
              <tr key={record.id} className="hover:bg-[#1a1a1a] group border-b border-[#222]">
                <td className="px-4 py-2 text-gray-500 font-mono">
                   {new Date(record.timestamp).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-white">
                   <input 
                        type="text" 
                        defaultValue={record.productName}
                        onBlur={(e) => handleBlur(record.id, 'productName', e.target.value)}
                        className="bg-transparent w-full outline-none focus:text-[#D4AF37] focus:bg-[#000]"
                   />
                </td>
                <td className="px-4 py-2 text-gray-400">
                   {record.templateName}
                </td>
                <td className="px-4 py-2 text-right">
                   <button 
                        onClick={() => onReprint(record)}
                        className="text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black px-3 py-1 rounded-sm uppercase font-bold tracking-widest text-[10px] transition-all"
                    >
                        Load
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Vault;
