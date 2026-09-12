import React, { useState } from "react";
import { 
  Laptop2, 
  Plus, 
  Search, 
  Warehouse, 
  CheckCircle2, 
  ShieldCheck, 
  Edit3, 
  Trash2, 
  DollarSign, 
  PackageCheck,
  Send,
  Sparkles,
  Layers,
  X,
  Tag
} from "lucide-react";
import { 
  getStockOffers, 
  saveStockOffer, 
  deleteStockOffer,
  getCustomBrands,
  saveCustomBrand,
  deleteCustomBrand
} from "../services/storage";

export default function StockOffers({ setActiveTab }) {
  const [stock, setStock] = useState(getStockOffers());
  const [brandFilter, setBrandFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Custom brands state
  const [customBrands, setCustomBrands] = useState(getCustomBrands());
  const [isAddingBrand, setIsAddingBrand] = useState(false);
  const [newBrandInput, setNewBrandInput] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleAddCustomBrand = (e) => {
    e.preventDefault();
    if (!newBrandInput.trim()) return;
    const name = newBrandInput.trim();
    const updated = saveCustomBrand(name);
    setCustomBrands(updated);
    setBrandFilter(name);
    setNewBrandInput("");
    setIsAddingBrand(false);
    showToast(`Brand "${name}" added to catalog!`);
  };

  const handleDeleteCustomBrand = (name, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete custom brand "${name}"?`)) {
      const updated = deleteCustomBrand(name);
      setCustomBrands(updated);
      if (brandFilter.toLowerCase() === name.toLowerCase()) {
        setBrandFilter("all");
      }
      showToast(`Brand "${name}" removed.`);
    }
  };


  const refreshList = () => {
    setStock(getStockOffers());
  };

  const filteredStock = stock.filter(item => {
    if (brandFilter !== "all" && item.brand.toLowerCase() !== brandFilter.toLowerCase()) return false;
    if (warehouseFilter !== "all" && !item.warehouse.toLowerCase().includes(warehouseFilter.toLowerCase())) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchModel = item.model.toLowerCase().includes(q);
      const matchSpecs = item.specs?.toLowerCase().includes(q);
      if (!matchModel && !matchSpecs) return false;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setSelectedOffer({
      id: "",
      brand: "Dell",
      model: "",
      specs: "",
      grade: "Grade A+ (Like New, 90%+ Battery)",
      qtyAvailable: 100,
      minOrderQty: 10,
      priceUsd: 250,
      priceMxn: 4250,
      warehouse: "USA Warehouse (Texas)",
      readyToShip: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer) => {
    setSelectedOffer({ ...offer });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove this stock offer? Changes will sync online.")) {
      deleteStockOffer(id);
      refreshList();
      showToast("Stock offer deleted and synced.");
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedOffer.model) {
      alert("Model name is required.");
      return;
    }
    saveStockOffer(selectedOffer);
    refreshList();
    setIsModalOpen(false);
    showToast("Stock offer saved & synced to Supabase.");
  };

  return (
    <div className="space-y-6 pb-12">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-neon text-brand-black px-4 py-2.5 rounded-xl font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Wholesale Laptop Stock Catalog</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-xs text-brand-neon font-mono">
              HP • Dell • Lenovo A+
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Enterprise stock lots for USA wholesale buyers and direct dispatch from the Mexico warehouse.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-neon hover:bg-brand-lime text-brand-black text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock Lot</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Brand tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-brand-dark p-1.5 rounded-xl border border-brand-border text-xs">
          <button
            onClick={() => setBrandFilter("all")}
            className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
              brandFilter === "all" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            All Brands
          </button>
          {["Dell", "HP", "Lenovo"].map((b) => (
            <button
              key={b}
              onClick={() => setBrandFilter(b)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                brandFilter.toLowerCase() === b.toLowerCase() ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              {b}
            </button>
          ))}
          {customBrands.map((b) => (
            <div key={b} className="relative group/custom inline-flex items-center">
              <button
                onClick={() => setBrandFilter(b)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all flex items-center gap-1.5 ${
                  brandFilter.toLowerCase() === b.toLowerCase() 
                    ? "bg-brand-neon text-brand-black font-bold" 
                    : "text-gray-300 hover:text-white bg-brand-surface/70 border border-brand-border/60"
                }`}
              >
                <span>{b}</span>
                <span 
                  onClick={(e) => handleDeleteCustomBrand(b, e)}
                  className="w-3.5 h-3.5 rounded hover:bg-black/30 flex items-center justify-center text-[10px] opacity-70 hover:opacity-100 cursor-pointer"
                  title={`Remove ${b}`}
                >
                  ×
                </span>
              </button>
            </div>
          ))}

          {/* Dynamic Brand Adder */}
          {isAddingBrand ? (
            <form onSubmit={handleAddCustomBrand} className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={newBrandInput}
                onChange={(e) => setNewBrandInput(e.target.value)}
                placeholder="Brand name..."
                className="px-2.5 py-1 bg-brand-surface border border-brand-neon rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none w-28 font-semibold"
              />
              <button
                type="submit"
                className="px-2 py-1 bg-brand-neon text-brand-black font-bold text-xs rounded-lg hover:bg-brand-lime"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsAddingBrand(false)}
                className="px-1.5 py-1 text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingBrand(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-brand-border hover:border-brand-neon text-gray-400 hover:text-brand-neon transition-colors text-xs font-semibold"
              title="Add a custom brand (Apple, Asus, Acer, Microsoft, etc.)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Custom Brand</span>
            </button>
          )}
        </div>

        {/* Warehouse Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Warehouse:</span>
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3 py-1.5 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-medium"
          >
            <option value="all">All Warehouses</option>
            <option value="USA">🇺🇸 USA Texas</option>
            <option value="Mexico">🇲🇽 Mexico Guadalajara</option>
            <option value="Dubai">🇦🇪 Dubai Warehouse (UAE)</option>
            <option value="Miami">🇺🇸 Miami Warehouse (Florida)</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search model or specs..."
            className="w-full pl-9 pr-3 py-1.5 bg-brand-dark border border-brand-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-neon"
          />
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 w-full">
        {filteredStock.map((item) => (
          <div 
            key={item.id} 
            className="bg-brand-surface border border-brand-border hover:border-brand-neon/40 rounded-2xl p-6 shadow-md space-y-4 flex flex-col justify-between transition-all"
          >
            <div>
              {/* Header: Brand, Model, Edit/Delete */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-brand-dark text-brand-neon font-bold text-xs uppercase border border-brand-border">
                      {item.brand}
                    </span>
                    <span className="text-xs text-brand-lime font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{item.grade}</span>
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{item.model}</h3>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-neon hover:bg-brand-dark transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-brand-dark transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Specs pill */}
              <div className="mt-3 p-3 bg-brand-dark/90 rounded-xl border border-brand-border/60 text-xs text-gray-300 font-mono leading-relaxed">
                {item.specs}
              </div>

              {/* Pricing & Stock Details */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-brand-border/60 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Wholesale Tier (USD):</span>
                  <span className="text-xl font-extrabold text-brand-neon">${item.priceUsd} <span className="text-xs text-gray-400 font-normal">/ unit</span></span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Mexico Warehouse (MXN):</span>
                  <span className="text-xl font-extrabold text-white">
                    ${item.priceMxn ? item.priceMxn.toLocaleString() : (item.priceUsd * 17).toLocaleString()} <span className="text-xs text-gray-400 font-normal">MXN</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2 text-xs text-gray-300">
                <div className="flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-brand-lime" />
                  <span>{item.warehouse}</span>
                </div>
                <div className="flex items-center justify-end gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-brand-neon" />
                  <span><strong>{item.qtyAvailable}</strong> Units Available</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-brand-border flex items-center gap-2">
              <button
                onClick={() => setActiveTab("customers")}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-brand-neon hover:bg-brand-lime text-brand-black font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Pitch This Lot to Customers</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Stock Modal */}
      {isModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {selectedOffer.id ? "Edit Stock Lot" : "Add New Stock Lot"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Brand *</label>
                  <select
                    value={selectedOffer.brand}
                    onChange={(e) => setSelectedOffer({ ...selectedOffer, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  >
                    <option value="Dell">Dell</option>
                    <option value="HP">HP</option>
                    <option value="Lenovo">Lenovo</option>
                    {customBrands.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    value={selectedOffer.model}
                    onChange={(e) => setSelectedOffer({ ...selectedOffer, model: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                    placeholder="e.g. Latitude 7420 Ultrabook"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Hardware Specifications</label>
                <textarea
                  rows={2}
                  value={selectedOffer.specs}
                  onChange={(e) => setSelectedOffer({ ...selectedOffer, specs: e.target.value })}
                  placeholder="e.g. Intel Core i7-1185G7 | 16GB DDR4 | 512GB SSD | 14.0 FHD | Win 11 Pro MAR"
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Price USD ($)</label>
                  <input
                    type="number"
                    value={selectedOffer.priceUsd}
                    onChange={(e) => setSelectedOffer({ ...selectedOffer, priceUsd: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Price MXN ($)</label>
                  <input
                    type="number"
                    value={selectedOffer.priceMxn}
                    onChange={(e) => setSelectedOffer({ ...selectedOffer, priceMxn: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Available Quantity</label>
                  <input
                    type="number"
                    value={selectedOffer.qtyAvailable}
                    onChange={(e) => setSelectedOffer({ ...selectedOffer, qtyAvailable: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Warehouse Location</label>
                  <select
                    value={selectedOffer.warehouse}
                    onChange={(e) => setSelectedOffer({ ...selectedOffer, warehouse: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-medium"
                  >
                    <option value="USA Warehouse (Texas)">USA Warehouse (Texas)</option>
                    <option value="Mexico Warehouse (Guadalajara)">Mexico Warehouse (Guadalajara)</option>
                    <option value="Dubai Warehouse (UAE)">Dubai Warehouse (UAE)</option>
                    <option value="Miami Warehouse (Florida)">Miami Warehouse (Florida)</option>
                    <option value="Both (USA & Mexico)">Both (USA & Mexico)</option>
                    <option value="All Warehouses (Global Stock)">All Warehouses (Global Stock)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-brand-dark hover:bg-brand-hover text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-neon text-brand-black font-bold hover:bg-brand-lime"
                >
                  Save Stock Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
