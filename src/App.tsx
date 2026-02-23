import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Calculator, 
  Search, 
  Info,
  Activity,
  Droplets,
  Scale,
  Settings,
  Plus,
  Trash2,
  Save,
  X,
  Copy,
  ArrowUp,
  ArrowDown,
  Upload,
  Download
} from 'lucide-react';
import * as math from 'mathjs';
import { Drug, CalculationResult, DrugType } from './types';
import { Logo } from './components/Logo';

export default function App() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [selectedDrugId, setSelectedDrugId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputs, setInputs] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  const [editingDrug, setEditingDrug] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/drugs');
      const data = await res.json();
      setDrugs(data);
    } catch (err) {
      console.error("Failed to fetch drugs", err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedDrug = useMemo(() => 
    drugs.find(d => d.id === selectedDrugId), 
  [selectedDrugId, drugs]);

  const filteredDrugs = useMemo(() => 
    drugs.filter(d => 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  [searchQuery, drugs]);

  const handleDrugSelect = (drug: Drug) => {
    setSelectedDrugId(drug.id);
    const initialInputs: Record<string, number> = {};
    drug.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        initialInputs[field.id] = field.defaultValue;
      }
    });
    setInputs(initialInputs);
  };

  const handleInputChange = (fieldId: string, value: string) => {
    const numValue = parseFloat(value);
    setInputs(prev => ({
      ...prev,
      [fieldId]: isNaN(numValue) ? 0 : numValue
    }));
  };

  const results = useMemo(() => {
    if (!selectedDrug || !inputs.weight) return [];
    
    // @ts-ignore - formulas is added in the DB version
    const formulas = selectedDrug.formulas || [];
    
    return formulas.map((f: any) => {
      try {
        const value = math.evaluate(f.formula, inputs);
        return {
          label: f.label,
          value: typeof value === 'number' ? value.toFixed(2) : String(value),
          unit: f.unit,
          description: f.description
        };
      } catch (err) {
        return { label: f.label, value: 'Error', unit: '', description: 'Invalid formula' };
      }
    });
  }, [selectedDrug, inputs]);

  const saveDrug = async () => {
    const method = editingDrug.isNew ? 'POST' : 'PUT';
    const url = editingDrug.isNew ? '/api/drugs' : `/api/drugs/${editingDrug.id}`;
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDrug)
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditingDrug(null);
      fetchDrugs();
    } catch (err) {
      alert("Failed to save drug. Make sure ID is unique.");
    }
  };

  const deleteDrug = async (id: string) => {
    if (!confirm("Are you sure you want to delete this drug?")) return;
    try {
      await fetch(`/api/drugs/${id}`, { method: 'DELETE' });
      fetchDrugs();
    } catch (err) {
      alert("Failed to delete drug");
    }
  };

  const duplicateDrug = (drug: any) => {
    const newDrug = {
      ...drug,
      id: `${drug.id}_copy_${Date.now()}`,
      name: `${drug.name} (Copy)`,
      isNew: true
    };
    setEditingDrug(newDrug);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingDrug({ ...editingDrug, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const moveItem = (list: any[], index: number, direction: 'up' | 'down') => {
    const newList = [...list];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return list;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    return newList;
  };

  const moveDrug = async (index: number, direction: 'up' | 'down') => {
    const newDrugs = [...drugs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newDrugs.length) return;
    
    [newDrugs[index], newDrugs[targetIndex]] = [newDrugs[targetIndex], newDrugs[index]];
    
    const orders = newDrugs.map((d, i) => ({ id: d.id, sort_order: i }));
    
    try {
      await fetch('/api/drugs/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders })
      });
      fetchDrugs();
    } catch (err) {
      alert("Failed to reorder drugs");
    }
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const importedDrugs = JSON.parse(event.target?.result as string);
          if (!Array.isArray(importedDrugs)) throw new Error("Invalid format");
          
          for (const drug of importedDrugs) {
            await fetch('/api/drugs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...drug, isNew: true })
            });
          }
          fetchDrugs();
          alert("Import successful! Note: Existing IDs were skipped if they already existed.");
        } catch (err) {
          alert("Failed to import data. Ensure the file is a valid Chemodose backup.");
        }
      };
      reader.readAsText(file);
    }
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(drugs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "chemodose_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (showSplash) {
    return (
      <motion.div 
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-blue"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-8"
        >
          <div className="w-32 h-32 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center p-4">
            <Logo className="w-full h-full" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">CHEMODOSE</h1>
            <p className="text-brand-red font-bold tracking-[0.2em] text-sm uppercase">Precision Oncology</p>
          </div>
          <div className="mt-12">
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-full h-full bg-brand-red"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Activity className="w-12 h-12 text-brand-red" />
          <p className="text-gray-400 font-medium">Loading clinical data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans selection:bg-brand-red/10">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-bottom border-black/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-12 drop-shadow-md" />
            <h1 className="text-xl font-semibold tracking-tight text-brand-blue">Chemodose</h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAdmin(!isAdmin)}
              className={`p-2 rounded-lg transition-colors ${isAdmin ? 'bg-brand-red/10 text-brand-red' : 'text-gray-400 hover:bg-gray-100'}`}
              title="Admin Panel"
            >
              <Settings className="w-5 h-5" />
            </button>
            {selectedDrugId && (
              <button 
                onClick={() => setSelectedDrugId(null)}
                className="flex items-center gap-3 text-xl font-black text-brand-red hover:text-brand-red/80 transition-all bg-brand-red/10 px-6 py-3 rounded-3xl shadow-sm active:scale-95"
              >
                <ChevronLeft className="w-8 h-8 stroke-[3]" />
                BACK
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 pb-24">
        <AnimatePresence mode="wait">
          {isAdmin ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Drug Management</h2>
                <div className="flex gap-2">
                  <label className="bg-white border border-black/5 text-gray-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-sm hover:bg-gray-50 transition-all cursor-pointer">
                    <Upload className="w-4 h-4" /> Import
                    <input type="file" className="hidden" accept=".json" onChange={importData} />
                  </label>
                  <button 
                    onClick={exportData}
                    className="bg-white border border-black/5 text-gray-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-sm hover:bg-gray-50 transition-all"
                  >
                    <Download className="w-4 h-4" /> Backup
                  </button>
                  <button 
                    onClick={() => setEditingDrug({
                      id: '', name: '', category: '', description: '', type: 'ORAL',
                      imageUrl: '',
                      fields: [{ id: 'weight', label: 'Weight', unit: 'kg', defaultValue: 0 }],
                      formulas: [{ label: 'Total Dose', formula: 'weight * 10', unit: 'mg' }],
                      isNew: true
                    })}
                    className="bg-brand-red text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-lg shadow-brand-red/20"
                  >
                    <Plus className="w-4 h-4" /> Add Drug
                  </button>
                </div>
              </div>

              {editingDrug && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm p-6 flex items-center justify-center overflow-y-auto">
                  <div className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl space-y-6 my-auto">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">{editingDrug.isNew ? 'New Drug' : 'Edit Drug'}</h3>
                      <button onClick={() => setEditingDrug(null)}><X className="w-6 h-6 text-gray-400" /></button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">ID (slug)</label>
                        <input 
                          value={editingDrug.id}
                          onChange={e => setEditingDrug({...editingDrug, id: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Name</label>
                        <input 
                          value={editingDrug.name}
                          onChange={e => setEditingDrug({...editingDrug, name: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Category</label>
                        <input 
                          value={editingDrug.category}
                          onChange={e => setEditingDrug({...editingDrug, category: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">Route</label>
                        <select 
                          value={editingDrug.type}
                          onChange={e => setEditingDrug({...editingDrug, type: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3"
                        >
                          {Object.values(DrugType).map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Description</label>
                      <textarea 
                        value={editingDrug.description}
                        onChange={e => setEditingDrug({...editingDrug, description: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Drug Photo</label>
                      <div className="flex items-center gap-4">
                        {editingDrug.imageUrl && (
                          <img src={editingDrug.imageUrl} className="w-16 h-16 rounded-xl object-cover border" referrerPolicy="no-referrer" />
                        )}
                        <label className="flex-1 cursor-pointer bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center hover:bg-gray-100 transition-all">
                          <Upload className="w-5 h-5 text-gray-400 mb-1" />
                          <span className="text-xs font-medium text-gray-500">Upload Photo</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                        <input 
                          placeholder="Or paste URL"
                          value={editingDrug.imageUrl || ''}
                          onChange={e => setEditingDrug({...editingDrug, imageUrl: e.target.value})}
                          className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-3 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-sm border-b pb-2">Fields (Variables)</h4>
                      {editingDrug.fields.map((f: any, i: number) => (
                        <div key={i} className="flex gap-2 items-end">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => setEditingDrug({...editingDrug, fields: moveItem(editingDrug.fields, i, 'up')})} className="p-1 hover:bg-gray-100 rounded"><ArrowUp className="w-3 h-3" /></button>
                            <button onClick={() => setEditingDrug({...editingDrug, fields: moveItem(editingDrug.fields, i, 'down')})} className="p-1 hover:bg-gray-100 rounded"><ArrowDown className="w-3 h-3" /></button>
                          </div>
                          <div className="flex-1 grid grid-cols-4 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">ID</label>
                              <input value={f.id} onChange={e => {
                                const fields = [...editingDrug.fields];
                                fields[i].id = e.target.value;
                                setEditingDrug({...editingDrug, fields});
                              }} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Label</label>
                              <input value={f.label} onChange={e => {
                                const fields = [...editingDrug.fields];
                                fields[i].label = e.target.value;
                                setEditingDrug({...editingDrug, fields});
                              }} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Unit</label>
                              <input value={f.unit} onChange={e => {
                                const fields = [...editingDrug.fields];
                                fields[i].unit = e.target.value;
                                setEditingDrug({...editingDrug, fields});
                              }} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2 text-sm" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Default</label>
                              <input type="number" value={f.defaultValue || 0} onChange={e => {
                                const fields = [...editingDrug.fields];
                                fields[i].defaultValue = parseFloat(e.target.value) || 0;
                                setEditingDrug({...editingDrug, fields});
                              }} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-2 text-sm" />
                            </div>
                          </div>
                          <button onClick={() => {
                            const fields = editingDrug.fields.filter((_: any, idx: number) => idx !== i);
                            setEditingDrug({...editingDrug, fields});
                          }} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ))}
                      <button onClick={() => setEditingDrug({...editingDrug, fields: [...editingDrug.fields, {id: '', label: '', unit: '', defaultValue: 0}]})} className="text-xs font-bold text-brand-red">+ Add Field</button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-sm border-b pb-2">Formulas (Excel-like)</h4>
                      {editingDrug.formulas.map((f: any, i: number) => (
                        <div key={i} className="space-y-2 p-4 bg-gray-50 rounded-2xl relative">
                          <div className="absolute right-2 top-2 flex gap-1">
                            <button onClick={() => setEditingDrug({...editingDrug, formulas: moveItem(editingDrug.formulas, i, 'up')})} className="p-1 hover:bg-white rounded shadow-sm"><ArrowUp className="w-3 h-3" /></button>
                            <button onClick={() => setEditingDrug({...editingDrug, formulas: moveItem(editingDrug.formulas, i, 'down')})} className="p-1 hover:bg-white rounded shadow-sm"><ArrowDown className="w-3 h-3" /></button>
                            <button onClick={() => {
                              const formulas = editingDrug.formulas.filter((_: any, idx: number) => idx !== i);
                              setEditingDrug({...editingDrug, formulas});
                            }} className="p-1 text-red-500 hover:bg-white rounded shadow-sm"><Trash2 className="w-3 h-3" /></button>
                          </div>
                          <div className="flex gap-2 pr-20">
                            <input placeholder="Label" value={f.label} onChange={e => {
                              const formulas = [...editingDrug.formulas];
                              formulas[i].label = e.target.value;
                              setEditingDrug({...editingDrug, formulas});
                            }} className="flex-1 bg-white border border-gray-100 rounded-xl p-2 text-sm" />
                            <input placeholder="Unit" value={f.unit} onChange={e => {
                              const formulas = [...editingDrug.formulas];
                              formulas[i].unit = e.target.value;
                              setEditingDrug({...editingDrug, formulas});
                            }} className="w-20 bg-white border border-gray-100 rounded-xl p-2 text-sm" />
                          </div>
                          <input placeholder="Formula (e.g. weight * 15)" value={f.formula} onChange={e => {
                            const formulas = [...editingDrug.formulas];
                            formulas[i].formula = e.target.value;
                            setEditingDrug({...editingDrug, formulas});
                          }} className="w-full bg-white border border-gray-100 rounded-xl p-2 text-sm font-mono" />
                        </div>
                      ))}
                      <button onClick={() => setEditingDrug({...editingDrug, formulas: [...editingDrug.formulas, {label: '', formula: '', unit: ''}]})} className="text-xs font-bold text-brand-red">+ Add Formula</button>
                    </div>

                    <button onClick={saveDrug} className="w-full bg-brand-red text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-red/30">
                      <Save className="w-5 h-5" /> Save Drug Definition
                    </button>
                  </div>
                </div>
              )}

              <div className="grid gap-4">
                {drugs.map((drug, index) => (
                  <div key={drug.id} className="bg-white p-4 rounded-2xl border border-black/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1 mr-2">
                        <button onClick={() => moveDrug(index, 'up')} className="p-1 hover:bg-gray-100 rounded" title="Move Up"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => moveDrug(index, 'down')} className="p-1 hover:bg-gray-100 rounded" title="Move Down"><ArrowDown className="w-4 h-4" /></button>
                      </div>
                      {drug.imageUrl && <img src={drug.imageUrl} className="w-10 h-10 rounded-lg object-cover border" referrerPolicy="no-referrer" />}
                      <div>
                        <h4 className="font-bold text-brand-blue">{drug.name}</h4>
                        <p className="text-xs text-gray-400">{drug.category} • <span className="text-brand-red font-medium">{drug.type}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => duplicateDrug(drug)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Duplicate"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => setEditingDrug(drug)} className="p-2 text-brand-red hover:bg-brand-red/5 rounded-lg" title="Edit"><Settings className="w-4 h-4" /></button>
                      <button onClick={() => deleteDrug(drug.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : !selectedDrugId ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search drugs or categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-black/5 rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all"
                />
              </div>

              {/* Drug List */}
              <div className="grid gap-4">
                {filteredDrugs.map((drug) => (
                  <button
                    key={drug.id}
                    onClick={() => handleDrugSelect(drug)}
                    className="group w-full text-left bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md hover:border-brand-red/20 transition-all overflow-hidden"
                  >
                    <div className="flex items-center p-4 gap-4">
                      {drug.imageUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-black/5">
                          <img 
                            src={drug.imageUrl} 
                            alt={drug.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg truncate text-brand-blue">{drug.name}</span>
                          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-brand-red/10 text-brand-red">
                            {drug.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{drug.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {drug.imageUrl && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(drug.imageUrl, '_blank');
                            }}
                            className="p-2 text-gray-400 hover:text-brand-red hover:bg-brand-red/5 rounded-lg transition-all"
                            title="View Photo"
                          >
                            <Droplets className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredDrugs.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    No drugs found matching your search.
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="calc"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Drug Info Card */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-brand-blue">{selectedDrug.name}</h2>
                    <p className="text-brand-red font-medium text-sm">{selectedDrug.category} • {selectedDrug.type}</p>
                  </div>
                  <div className="bg-brand-red/10 p-3 rounded-2xl">
                    <Activity className="w-6 h-6 text-brand-red" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {selectedDrug.description}
                </p>
              </div>

              {/* Inputs Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Required Inputs
                </h3>
                <div className="grid gap-4">
                  {selectedDrug.fields.map((field) => (
                    <div key={field.id} className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 mb-1">
                          {field.label} ({field.unit})
                        </label>
                        <input 
                          type="number"
                          inputMode="decimal"
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                          value={inputs[field.id] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className="w-full text-lg font-medium focus:outline-none placeholder:text-gray-300"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  Calculated Results
                </h3>
                <div className="grid gap-4">
                  {results.length > 0 ? (
                    results.map((result, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-5 rounded-2xl border border-black/5 shadow-sm relative overflow-hidden group"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-brand-red opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-400 tracking-wider">{result.label}</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-light tracking-tight text-brand-blue">{result.value}</span>
                              <span className="text-sm font-medium text-gray-500">{result.unit}</span>
                            </div>
                          </div>
                          {result.description && (
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                              <Info className="w-3 h-3 text-brand-red" />
                              {result.description}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="bg-gray-100/50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
                      <Calculator className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Enter weight to see calculations</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
