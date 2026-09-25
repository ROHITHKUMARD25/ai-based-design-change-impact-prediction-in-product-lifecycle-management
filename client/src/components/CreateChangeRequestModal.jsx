import React, { useState, useEffect } from 'react';
import api from '../api';
import { GitPullRequest, X, AlertTriangle, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function CreateChangeRequestModal({ isOpen, onClose, onSuccess, initialProductId, initialPartId }) {
  const [products, setProducts] = useState([]);
  const [parts, setParts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProductId || '');
  const [selectedPartId, setSelectedPartId] = useState(initialPartId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data.products);
        if (res.data.products.length > 0 && !selectedProductId) {
          setSelectedProductId(res.data.products[0].id);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      }
    };
    fetchProducts();
  }, [isOpen]);

  useEffect(() => {
    if (!selectedProductId) return;
    const fetchParts = async () => {
      try {
        const res = await api.get(`/products/${selectedProductId}`);
        setParts(res.data.parts || []);
        if (res.data.parts.length > 0 && !selectedPartId) {
          // Default to first sub-part if available
          const subPart = res.data.parts.find(p => p.parent_part_id) || res.data.parts[0];
          setSelectedPartId(subPart.id);
        }
      } catch (err) {
        console.error('Failed to load parts:', err);
      }
    };
    fetchParts();
  }, [selectedProductId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !selectedPartId || !title.trim()) {
      setError('Please select a product, target part, and enter a title.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/change-requests', {
        product_id: selectedProductId,
        part_id: selectedPartId,
        title: title.trim(),
        description: description.trim()
      });

      onSuccess(response.data.changeRequest.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit change request.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPart = parts.find(p => p.id === selectedPartId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Engineering Change Request</h3>
              <p className="text-xs text-slate-400">Triggers automated BOM graph impact prediction engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Product Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Product System *</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setSelectedPartId('');
              }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-indigo-500"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Part Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Component / Part *</label>
            <select
              value={selectedPartId}
              onChange={(e) => setSelectedPartId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="">-- Select target part to modify --</option>
              {parts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.part_number} - {p.part_name} ({p.category})
                </option>
              ))}
            </select>

            {selectedPart && (
              <div className="mt-2 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Supplier:</span> <strong className="text-white">{selectedPart.supplier}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Cost:</span> <strong className="text-emerald-400">${selectedPart.cost}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Lead Time:</span> <strong className="text-amber-400">{selectedPart.lead_time_days} days</strong>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">ECN Change Request Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. ECN-2026-92: Material Spec Revision on Motor Mount Bracket"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Technical Engineering Description & Rationale</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the proposed physical, electrical, or software modifications and why the change is requested..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Auto-traverses BOM graph
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? 'Predicting Impact...' : (
                  <>
                    Run Impact Prediction <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
