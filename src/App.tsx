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
import { DEFAULT_DRUGS } from './data/defaultDrugs';

export default function App() {
  const [drugs, setDrugs] = useState<Drug[]>(DEFAULT_DRUGS);
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
          <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center p-6">
            <Logo className="w-full h-full" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter">CHEMODOSE</h1>
            <p className="text-brand-red font-bold tracking-[0.3em] text-xs uppercase opacity-90">Precision Oncology</p>
          </div>
          <div className="mt-12">
            <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full bg-brand-red shadow-[0_0_15px_rgba(148,27,30,0.5)]"
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Activity className="w-12 h-12 text-brand-red animate-pulse" />
            <div className="absolute inset-0 bg-brand-red/20 blur-xl rounded-full animate-pulse" />
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Syncing Clinical Data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] text-slate-900 font-sans selection:bg-brand-red/10 overflow-hidden flex flex-col">
      {/* Header - Native Style */}
      <header className="flex-none bg-white border-b border-slate-100 px-6 py-4 safe-top">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-blue/5 rounded-xl flex items-center justify-center">
              <Logo className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-brand-blue leading-none">Chemodose</h1>
              <p className="text-[10px] font-bold text-brand-red uppercase tracking-wider mt-0.5">Mobile v1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAdmin(!isAdmin)}
              className={`p-2.5 rounded-xl transition-all active:scale-90 ${isAdmin ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'bg-slate-50 text-slate-400 hover:text-brand-blue'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
            {selectedDrugId && !isAdmin && (
              <button 
                onClick={() => setSelectedDrugId(null)}
                className="flex items-center gap-2 text-sm font-black text-brand-red bg-brand-red/5 px-4 py-2.5 rounded-xl active:scale-95 transition-all"
              >
                <ChevronLeft className="w-5 h-5 stroke-[3]" />
                BACK
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
        <div className="max-w-xl mx-auto p-6">
          <AnimatePresence mode="wait">
            {isAdmin ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-brand-blue">Drug Registry</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingDrug({
                        id: '', name: '', category: '', description: '', type: 'ORAL',
                        imageUrl: '',
                        fields: [{ id: 'weight', label: 'Weight', unit: 'kg', defaultValue: 0 }],
                        formulas: [{ label: 'Total Dose', formula: 'weight * 10', unit: 'mg' }],
                        isNew: true
                      })}
                      className="bg-brand-blue text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20 active:scale-90 transition-all"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid gap-3">
                  {drugs.map((drug, index) => (
                    <motion.div 
                      key={drug.id}
                      layout
                      className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveDrug(index, 'up')} className="p-1 text-slate-300 hover:text-brand-blue"><ArrowUp className="w-3.5 h-3.5" /></button>
                          <button onClick={() => moveDrug(index, 'down')} className="p-1 text-slate-300 hover:text-brand-blue"><ArrowDown className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                          {drug.imageUrl ? (
                            <img src={drug.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <Droplets className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-brand-blue">{drug.name}</h4>
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{drug.type}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => duplicateDrug(drug)} className="p-2 text-slate-400 hover:text-blue-600"><Copy className="w-4 h-4" /></button>
                        <button onClick={() => setEditingDrug(drug)} className="p-2 text-slate-400 hover:text-brand-red"><Settings className="w-4 h-4" /></button>
                        <button onClick={() => deleteDrug(drug.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <label className="flex-1 bg-white border border-slate-200 text-slate-600 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-sm active:scale-95 transition-all cursor-pointer">
                    <Upload className="w-4 h-4" /> IMPORT BACKUP
                    <input type="file" className="hidden" accept=".json" onChange={importData} />
                  </label>
                  <button 
                    onClick={exportData}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 p-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm shadow-sm active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4" /> EXPORT BACKUP
                  </button>
                </div>
              </motion.div>
            ) : !selectedDrugId ? (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Search - Native Style */}
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-red transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search clinical registry..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-2xl py-5 pl-14 pr-6 shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all text-lg font-medium placeholder:text-slate-300"
                  />
                </div>

                {/* Drug List */}
                <div className="grid gap-4">
                  {filteredDrugs.map((drug) => (
                    <motion.button
                      key={drug.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleDrugSelect(drug)}
                      className="w-full text-left bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden p-5 flex items-center gap-4 group"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex-shrink-0 border border-slate-100 overflow-hidden flex items-center justify-center">
                        {drug.imageUrl ? (
                          <img src={drug.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Droplets className="w-8 h-8 text-slate-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-brand-blue truncate">{drug.name}</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-brand-red/10 text-brand-red uppercase tracking-widest">
                            {drug.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium truncate">{drug.category}</p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-slate-300 rotate-180 group-hover:text-brand-red transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="calc"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-8"
              >
                {/* Drug Info Header */}
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-black text-brand-blue tracking-tight">{selectedDrug.name}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-brand-red font-bold text-[10px] uppercase tracking-widest bg-brand-red/5 px-2 py-1 rounded-lg">{selectedDrug.type}</span>
                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{selectedDrug.category}</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-brand-red/10 rounded-2xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-brand-red" />
                    </div>
                  </div>
                  {selectedDrug.description && (
                    <p className="text-xs text-slate-500 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl">
                      {selectedDrug.description}
                    </p>
                  )}
                </div>

                {/* Inputs Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                    <Scale className="w-3.5 h-3.5" />
                    Patient Parameters
                  </h3>
                  <div className="grid gap-3">
                    {selectedDrug.fields.map((field) => (
                      <div key={field.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm focus-within:ring-4 focus-within:ring-brand-red/5 transition-all">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          {field.label} <span className="text-brand-red">({field.unit})</span>
                        </label>
                        <input 
                          type="number"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={inputs[field.id] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                          className="w-full text-2xl font-bold text-brand-blue focus:outline-none placeholder:text-slate-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Results Section */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 px-2">
                    <Droplets className="w-3.5 h-3.5" />
                    Dosing Calculations
                  </h3>
                  <div className="grid gap-4">
                    {results.length > 0 ? (
                      results.map((result, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group"
                        >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-red" />
                          <div className="flex justify-between items-end">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{result.label}</p>
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-4xl font-light tracking-tighter text-brand-blue">{result.value}</span>
                                <span className="text-xs font-bold text-slate-400 uppercase">{result.unit}</span>
                              </div>
                            </div>
                            {result.description && (
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-brand-red bg-brand-red/5 px-3 py-1.5 rounded-xl">
                                <Info className="w-3 h-3" />
                                CLINICAL NOTE
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center">
                        <Calculator className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Awaiting Patient Weight</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Admin Modal - Native Style */}
      <AnimatePresence>
        {editingDrug && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md p-6 flex items-end sm:items-center justify-center overflow-y-auto"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center sticky top-0 bg-white pb-4 z-10">
                <h3 className="text-xl font-black text-brand-blue tracking-tight">{editingDrug.isNew ? 'Register New Drug' : 'Update Protocol'}</h3>
                <button onClick={() => setEditingDrug(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-red transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol ID</label>
                    <input 
                      value={editingDrug.id}
                      onChange={e => setEditingDrug({...editingDrug, id: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-red/10 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drug Name</label>
                    <input 
                      value={editingDrug.name}
                      onChange={e => setEditingDrug({...editingDrug, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-red/10 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                    <input 
                      value={editingDrug.category}
                      onChange={e => setEditingDrug({...editingDrug, category: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-red/10 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Route</label>
                    <select 
                      value={editingDrug.type}
                      onChange={e => setEditingDrug({...editingDrug, type: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold text-brand-blue focus:ring-2 focus:ring-brand-red/10 focus:outline-none appearance-none"
                    >
                      {Object.values(DrugType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Description</label>
                  <textarea 
                    value={editingDrug.description}
                    onChange={e => setEditingDrug({...editingDrug, description: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-medium text-slate-600 min-h-[100px] focus:ring-2 focus:ring-brand-red/10 focus:outline-none"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest border-b border-slate-100 pb-2">Input Parameters</h4>
                  {editingDrug.fields.map((f: any, i: number) => (
                    <div key={i} className="flex gap-3 items-end bg-slate-50 p-4 rounded-2xl">
                      <div className="flex-1 grid grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">Slug</label>
                          <input value={f.id} onChange={e => {
                            const fields = [...editingDrug.fields];
                            fields[i].id = e.target.value;
                            setEditingDrug({...editingDrug, fields});
                          }} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">Label</label>
                          <input value={f.label} onChange={e => {
                            const fields = [...editingDrug.fields];
                            fields[i].label = e.target.value;
                            setEditingDrug({...editingDrug, fields});
                          }} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">Unit</label>
                          <input value={f.unit} onChange={e => {
                            const fields = [...editingDrug.fields];
                            fields[i].unit = e.target.value;
                            setEditingDrug({...editingDrug, fields});
                          }} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">Def.</label>
                          <input type="number" value={f.defaultValue || 0} onChange={e => {
                            const fields = [...editingDrug.fields];
                            fields[i].defaultValue = parseFloat(e.target.value) || 0;
                            setEditingDrug({...editingDrug, fields});
                          }} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold" />
                        </div>
                      </div>
                      <button onClick={() => {
                        const fields = editingDrug.fields.filter((_: any, idx: number) => idx !== i);
                        setEditingDrug({...editingDrug, fields});
                      }} className="p-2 text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => setEditingDrug({...editingDrug, fields: [...editingDrug.fields, {id: '', label: '', unit: '', defaultValue: 0}]})} className="text-[10px] font-black text-brand-red uppercase tracking-widest">+ Add Parameter</button>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-brand-blue uppercase tracking-widest border-b border-slate-100 pb-2">Calculation Logic</h4>
                  {editingDrug.formulas.map((f: any, i: number) => (
                    <div key={i} className="space-y-3 p-5 bg-slate-50 rounded-[2rem] relative">
                      <div className="absolute right-4 top-4 flex gap-2">
                        <button onClick={() => {
                          const formulas = editingDrug.formulas.filter((_: any, idx: number) => idx !== i);
                          setEditingDrug({...editingDrug, formulas});
                        }} className="p-2 text-slate-300 hover:text-red-500 bg-white rounded-xl shadow-sm"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <div className="flex gap-3 pr-12">
                        <div className="flex-1 space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">Result Label</label>
                          <input placeholder="e.g. Total Dose" value={f.label} onChange={e => {
                            const formulas = [...editingDrug.formulas];
                            formulas[i].label = e.target.value;
                            setEditingDrug({...editingDrug, formulas});
                          }} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold" />
                        </div>
                        <div className="w-24 space-y-1">
                          <label className="text-[8px] font-black text-slate-400 uppercase">Unit</label>
                          <input placeholder="mg" value={f.unit} onChange={e => {
                            const formulas = [...editingDrug.formulas];
                            formulas[i].unit = e.target.value;
                            setEditingDrug({...editingDrug, formulas});
                          }} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-black text-slate-400 uppercase">Math Formula (Excel Style)</label>
                        <input placeholder="e.g. weight * 15" value={f.formula} onChange={e => {
                          const formulas = [...editingDrug.formulas];
                          formulas[i].formula = e.target.value;
                          setEditingDrug({...editingDrug, formulas});
                        }} className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm font-mono font-bold text-brand-red" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setEditingDrug({...editingDrug, formulas: [...editingDrug.formulas, {label: '', formula: '', unit: ''}]})} className="text-[10px] font-black text-brand-red uppercase tracking-widest">+ Add Calculation</button>
                </div>

                <button onClick={saveDrug} className="w-full bg-brand-red text-white p-5 rounded-[2rem] font-black text-sm tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-brand-red/30 active:scale-95 transition-all">
                  <Save className="w-5 h-5" /> COMMIT TO REGISTRY
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
