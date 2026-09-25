import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Package, ChevronRight, ChevronDown, Layers, Cpu, Wrench, Shield, 
  DollarSign, Clock, Plus, GitPullRequest, Search, Info, X 
} from 'lucide-react';

export default function ProductsPage({ onOpenCreateCRWithPart }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bomTree, setBomTree] = useState([]);
  const [allParts, setAllParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Where-used modal inspector state
  const [inspectPart, setInspectPart] = useState(null);
  const [whereUsedData, setWhereUsedData] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Expanded tree node IDs
  const [expandedNodes, setExpandedNodes] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.products);
      if (res.data.products.length > 0) {
        selectProduct(res.data.products[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = async (productId) => {
    setSelectedProductId(productId);
    setLoading(true);
    try {
      const res = await api.get(`/products/${productId}`);
      setSelectedProduct(res.data.product);
      setBomTree(res.data.bomTree || []);
      setAllParts(res.data.parts || []);

      // Expand all root nodes by default
      const defaultExpanded = {};
      (res.data.parts || []).forEach(p => { defaultExpanded[p.id] = true; });
      setExpandedNodes(defaultExpanded);
    } catch (err) {
      console.error('Failed to load product BOM:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (partId) => {
    setExpandedNodes(prev => ({ ...prev, [partId]: !prev[partId] }));
  };

  const handleInspectWhereUsed = async (part) => {
    setInspectPart(part);
    setInspectLoading(true);
    try {
      const res = await api.get(`/parts/${part.id}/where-used`);
      setWhereUsedData(res.data.whereUsed);
    } catch (err) {
      console.error('Failed to trace where-used:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  const categoryIcon = (category) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('elec')) return <Cpu className="w-4 h-4 text-indigo-400" />;
    if (cat.includes('mech')) return <Wrench className="w-4 h-4 text-amber-400" />;
    return <Layers className="w-4 h-4 text-blue-400" />;
  };

  // Render Recursive Tree Node
  const renderTreeNode = (node, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches = node.part_name.toLowerCase().includes(q) || node.part_number.toLowerCase().includes(q) || node.category.toLowerCase().includes(q);
      if (!matches && !hasChildren) return null;
    }

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center justify-between py-2.5 px-3 rounded-xl border mb-1.5 transition ${
            depth === 0 
              ? 'bg-slate-900/90 border-slate-700/80 font-semibold' 
              : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {hasChildren ? (
              <button 
                onClick={() => toggleNode(node.id)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-6 shrink-0" />
            )}

            <div className="shrink-0">{categoryIcon(node.category)}</div>

            <div className="truncate">
              <span className="font-mono text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded mr-2 border border-indigo-500/20">
                {node.part_number}
              </span>
              <span className="text-xs text-slate-100 font-medium">{node.part_name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden sm:inline text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded capitalize">
              {node.category}
            </span>

            <span className="text-xs font-mono text-emerald-400 font-medium">
              ${node.cost}
            </span>

            <span className="hidden md:inline text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {node.lead_time_days}d lead
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={() => handleInspectWhereUsed(node)}
                title="Inspect Where-Used Hierarchy"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700/60 transition flex items-center gap-1"
              >
                <Info className="w-3.5 h-3.5 text-blue-400" /> Where-Used
              </button>

              <button
                onClick={() => onOpenCreateCRWithPart(selectedProductId, node.id)}
                title="Create Change Request against this part"
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition flex items-center gap-1 shadow-sm"
              >
                <GitPullRequest className="w-3.5 h-3.5" /> Propose Change
              </button>
            </div>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-slate-800/80 ml-4 pl-1">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Product Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Product Hierarchy & BOM Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Drill into assemblies, inspect where-used relationships, and trigger change request predictions.
          </p>
        </div>

        {/* Product Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => selectProduct(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedProductId === p.id 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Product Summary & Search */}
      {selectedProduct && (
        <div className="glass-card p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{selectedProduct.name}</h3>
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded">
                {allParts.length} Parts in BOM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{selectedProduct.description}</p>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search part number or name..."
              className="w-full bg-slate-900 border border-slate-700/70 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      )}

      {/* Interactive BOM Tree Container */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span>Bill of Materials (BOM) Tree Hierarchy</span>
          <span>Attributes & Actions</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading BOM structure...</div>
        ) : bomTree.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No parts found in this product BOM.</div>
        ) : (
          <div className="space-y-1">
            {bomTree.map(rootNode => renderTreeNode(rootNode, 0))}
          </div>
        )}
      </div>

      {/* Where-Used Inspector Modal */}
      {inspectPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-100">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Where-Used Hierarchy Inspector</h3>
                  <p className="text-xs text-slate-400">Upstream dependency graph for {inspectPart.part_number}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectPart(null)}
                className="p-1 rounded text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <div className="font-bold text-indigo-300">{inspectPart.part_name} ({inspectPart.part_number})</div>
              <div className="text-slate-400 mt-1">Supplier: {inspectPart.supplier} | Cost: ${inspectPart.cost}</div>
            </div>

            {inspectLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Tracing upward dependencies...</div>
            ) : !whereUsedData || whereUsedData.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">This part is a top-level root assembly with no higher parent parts.</div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {whereUsedData.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200">{item.part.part_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.part.part_number}</div>
                    </div>

                    <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20 text-[11px]">
                      {item.relationship}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setInspectPart(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const pid = inspectPart.product_id;
                  const partId = inspectPart.id;
                  setInspectPart(null);
                  onOpenCreateCRWithPart(pid, partId);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
              >
                Propose Change on Part
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
