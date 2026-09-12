import React, { useState, useMemo } from "react";
import { 
  Users, UserCheck, UserX, MessageSquare, Mail, Search, 
  Plus, Download, Upload, CheckCircle2, DollarSign, Laptop, Edit3, Trash2, 
  Copy, Send, Sparkles, Globe2, Calendar, Check, Filter, X, 
  ChevronDown, CheckSquare, Square, MinusSquare, RefreshCw, 
  FileSpreadsheet, User, Building, Phone, AlertCircle, ArrowRight
} from "lucide-react";
import { 
  getCustomers, 
  saveCustomer, 
  deleteCustomer, 
  bulkImportCustomers, 
  bulkUpdateCustomers,
  bulkDeleteCustomers,
  getStockOffers 
} from "../services/storage";

export default function CustomersCRM() {
  const [customers, setCustomers] = useState(getCustomers());
  const [stockOffers] = useState(getStockOffers());
  const [activeTab, setActiveTab] = useState("all");
  const [marketFilter, setMarketFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Selection State for Bulk Actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Column Filtering System
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(true);
  const [columnFilters, setColumnFilters] = useState({
    name: "",
    market: "all",
    segment: "all",
    source: "all",
    collectedBy: "all",
    status: "all",
    dateAddedFrom: "",
    dateAddedTo: "",
    lastContactFrom: "",
    lastContactTo: ""
  });

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStockOffer, setSelectedStockOffer] = useState(stockOffers[0]?.id || "");
  const [outreachLanguage, setOutreachLanguage] = useState("auto");
  const [toastMessage, setToastMessage] = useState("");

  // Bulk Edit Form State
  const [bulkForm, setBulkForm] = useState({
    status: "KEEP",
    type: "KEEP",
    market: "KEEP",
    source: "KEEP",
    customSource: "",
    collectedBy: "KEEP",
    customCollectedBy: "",
    lastContactOption: "KEEP",
    customDate: ""
  });

  // Bulk Import Visual Mapping State
  const [importStep, setImportStep] = useState(1); // 1: Upload/Paste, 2: Map & Preview
  const [rawCsvInput, setRawCsvInput] = useState("");
  const [parsedHeaders, setParsedHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [importFileName, setImportFileName] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const refreshList = () => {
    setCustomers(getCustomers());
  };

  // Distinct lists for column dropdown filters
  const distinctSources = useMemo(() => {
    const set = new Set();
    customers.forEach(c => { if (c.source) set.add(c.source); });
    ["WhatsApp Direct", "Facebook Ad", "Referral", "Website Inquiry", "Cold Outreach", "Trade Show"].forEach(s => set.add(s));
    return Array.from(set);
  }, [customers]);

  const distinctCollectors = useMemo(() => {
    const set = new Set();
    customers.forEach(c => { if (c.collectedBy) set.add(c.collectedBy); });
    ["Sarah Jenkins", "Carlos Mendoza", "Ruhit"].forEach(c => set.add(c));
    return Array.from(set);
  }, [customers]);

  const distinctStatuses = useMemo(() => {
    const set = new Set();
    customers.forEach(c => { if (c.status) set.add(c.status); });
    ["Needs Outreach", "Offer Sent (WhatsApp)", "Offer Sent (Email)", "Quote Sent", "Negotiation", "Active Buyer"].forEach(s => set.add(s));
    return Array.from(set);
  }, [customers]);

  // Check if any column filter is active
  const hasActiveFilters = useMemo(() => {
    return (
      columnFilters.name !== "" ||
      columnFilters.market !== "all" ||
      columnFilters.segment !== "all" ||
      columnFilters.source !== "all" ||
      columnFilters.collectedBy !== "all" ||
      columnFilters.status !== "all" ||
      columnFilters.dateAddedFrom !== "" ||
      columnFilters.dateAddedTo !== "" ||
      columnFilters.lastContactFrom !== "" ||
      columnFilters.lastContactTo !== ""
    );
  }, [columnFilters]);

  const clearAllFilters = () => {
    setColumnFilters({
      name: "",
      market: "all",
      segment: "all",
      source: "all",
      collectedBy: "all",
      status: "all",
      dateAddedFrom: "",
      dateAddedTo: "",
      lastContactFrom: "",
      lastContactTo: ""
    });
    setSearchQuery("");
    setMarketFilter("all");
    setActiveTab("all");
    showToast("All column filters cleared.");
  };

  // Filtered customers with multi-column filtering
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Top tab segment filter
      if (activeTab === "warm" && c.type !== "warm") return false;
      if (activeTab === "cold" && c.type !== "cold") return false;

      // Top market filter
      if (marketFilter !== "all" && c.market !== marketFilter) return false;

      // Global search bar
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchComp = c.company?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q) || c.whatsapp?.toLowerCase().includes(q);
        const matchSource = c.source?.toLowerCase().includes(q);
        const matchRep = c.collectedBy?.toLowerCase().includes(q);
        if (!matchName && !matchComp && !matchEmail && !matchPhone && !matchSource && !matchRep) return false;
      }

      // 1. Column: Customer & Company Filter
      if (columnFilters.name) {
        const q = columnFilters.name.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(q);
        const matchComp = c.company?.toLowerCase().includes(q);
        if (!matchName && !matchComp) return false;
      }

      // 2. Column: Segment Filter
      if (columnFilters.segment !== "all" && c.type !== columnFilters.segment) {
        return false;
      }

      // 3. Column: Market Filter
      if (columnFilters.market !== "all" && c.market !== columnFilters.market) {
        return false;
      }

      // 4. Column: Lead Source Filter
      if (columnFilters.source !== "all" && c.source !== columnFilters.source) {
        return false;
      }

      // 5. Column: Collected By Filter
      if (columnFilters.collectedBy !== "all" && c.collectedBy !== columnFilters.collectedBy) {
        return false;
      }

      // 6. Column: Status / Stage Filter
      if (columnFilters.status !== "all" && c.status !== columnFilters.status) {
        return false;
      }

      // 7. Column: Date Added Range
      if (columnFilters.dateAddedFrom && c.dateAdded && c.dateAdded < columnFilters.dateAddedFrom) {
        return false;
      }
      if (columnFilters.dateAddedTo && c.dateAdded && c.dateAdded > columnFilters.dateAddedTo) {
        return false;
      }

      // 8. Column: Last Contacted Range
      if (columnFilters.lastContactFrom && c.lastContactDate && c.lastContactDate < columnFilters.lastContactFrom) {
        return false;
      }
      if (columnFilters.lastContactTo && c.lastContactDate && c.lastContactDate > columnFilters.lastContactTo) {
        return false;
      }

      return true;
    });
  }, [customers, activeTab, marketFilter, searchQuery, columnFilters]);

  const warmCount = customers.filter(c => c.type === "warm").length;
  const coldCount = customers.filter(c => c.type === "cold").length;

  // Selection Checkbox Handlers
  const isAllSelected = filteredCustomers.length > 0 && filteredCustomers.every(c => selectedIds.has(c.id));
  const isSomeSelected = filteredCustomers.some(c => selectedIds.has(c.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(selectedIds);
      filteredCustomers.forEach(c => newSet.add(c.id));
      setSelectedIds(newSet);
    }
  };

  const handleToggleRow = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Add & Edit Single Customer
  const handleOpenAdd = () => {
    setSelectedCustomer({
      id: "",
      name: "",
      company: "",
      type: activeTab === "cold" ? "cold" : "warm",
      email: "",
      phone: "",
      whatsapp: "",
      market: "USA",
      location: "",
      source: "WhatsApp Direct",
      collectedBy: "Sarah Jenkins",
      dateAdded: new Date().toISOString().split("T")[0],
      preferredQty: "50-100 units",
      status: "Needs Outreach",
      lastContactDate: new Date().toISOString().split("T")[0],
      notes: "",
      dealValue: "$15,000"
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setSelectedCustomer({ ...customer });
    setIsEditModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove customer? Changes will sync to Supabase cloud database.")) {
      deleteCustomer(id);
      if (selectedIds.has(id)) {
        const next = new Set(selectedIds);
        next.delete(id);
        setSelectedIds(next);
      }
      refreshList();
      showToast("Customer deleted and synced.");
    }
  };

  const handleSaveCustomer = (e) => {
    e.preventDefault();
    if (!selectedCustomer.name || !selectedCustomer.email) {
      alert("Name and email are required.");
      return;
    }
    saveCustomer(selectedCustomer);
    refreshList();
    setIsEditModalOpen(false);
    showToast("Customer saved & synced.");
  };

  // Inline update of Last Contacted date
  const handleUpdateLastContactDate = (cust, newDate) => {
    const updated = { ...cust, lastContactDate: newDate };
    saveCustomer(updated);
    refreshList();
    showToast(`Updated last contact for ${cust.name} to ${newDate}`);
  };

  const handleSetContactToday = (cust) => {
    const today = new Date().toISOString().split("T")[0];
    handleUpdateLastContactDate(cust, today);
  };

  // Bulk Edit Actions
  const handleOpenBulkEdit = () => {
    if (selectedIds.size === 0) return;
    setBulkForm({
      status: "KEEP",
      type: "KEEP",
      market: "KEEP",
      source: "KEEP",
      customSource: "",
      collectedBy: "KEEP",
      customCollectedBy: "",
      lastContactOption: "KEEP",
      customDate: ""
    });
    setIsBulkEditModalOpen(true);
  };

  const handleApplyBulkEdit = (e) => {
    e.preventDefault();
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    const updates = {};
    if (bulkForm.status !== "KEEP") updates.status = bulkForm.status;
    if (bulkForm.type !== "KEEP") updates.type = bulkForm.type;
    if (bulkForm.market !== "KEEP") updates.market = bulkForm.market;

    if (bulkForm.source !== "KEEP") {
      updates.source = bulkForm.source === "CUSTOM" ? bulkForm.customSource : bulkForm.source;
    }
    if (bulkForm.collectedBy !== "KEEP") {
      updates.collectedBy = bulkForm.collectedBy === "CUSTOM" ? bulkForm.customCollectedBy : bulkForm.collectedBy;
    }

    if (bulkForm.lastContactOption === "TODAY") {
      updates.lastContactDate = new Date().toISOString().split("T")[0];
    } else if (bulkForm.lastContactOption === "CUSTOM" && bulkForm.customDate) {
      updates.lastContactDate = bulkForm.customDate;
    }

    if (Object.keys(updates).length === 0) {
      alert("Please choose at least one field to update.");
      return;
    }

    bulkUpdateCustomers(ids, updates);
    refreshList();
    setIsBulkEditModalOpen(false);
    setSelectedIds(new Set());
    showToast(`Bulk updated ${ids.length} customers successfully!`);
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${ids.length} selected customers? This action will sync to Supabase.`)) {
      bulkDeleteCustomers(ids);
      refreshList();
      setSelectedIds(new Set());
      showToast(`Deleted ${ids.length} customers.`);
    }
  };

  const handleBulkExportSelected = () => {
    const listToExport = customers.filter(c => selectedIds.has(c.id));
    if (listToExport.length === 0) return;

    const headers = ["ID", "Name", "Company", "Category", "Email", "Phone", "Market", "Source", "CollectedBy", "DateAdded", "Status", "LastContacted", "Notes"];
    const rows = listToExport.map(c => [
      c.id,
      `"${c.name || ''}"`,
      `"${c.company || ''}"`,
      c.type,
      c.email,
      `"${c.phone || c.whatsapp || ''}"`,
      c.market,
      `"${c.source || ''}"`,
      `"${c.collectedBy || ''}"`,
      c.dateAdded || '',
      `"${c.status || ''}"`,
      c.lastContactDate || '',
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `minztech_selected_${listToExport.length}_customers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${listToExport.length} selected customers.`);
  };

  // Export Filtered CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Company", "Category", "Email", "Phone", "Market", "Source", "CollectedBy", "DateAdded", "Status", "LastContacted", "Notes"];
    const rows = filteredCustomers.map(c => [
      c.id,
      `"${c.name || ''}"`,
      `"${c.company || ''}"`,
      c.type,
      c.email,
      `"${c.phone || c.whatsapp || ''}"`,
      c.market,
      `"${c.source || ''}"`,
      `"${c.collectedBy || ''}"`,
      c.dateAdded || '',
      `"${c.status || ''}"`,
      c.lastContactDate || '',
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `minztech_customers_${activeTab}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported customers CSV.");
  };

  // Outreach Modal
  const handleOpenOutreach = (customer) => {
    setSelectedCustomer(customer);
    setOutreachLanguage(customer.market === "LATAM" ? "es" : "en");
    setIsOutreachModalOpen(true);
  };

  const getOutreachMessage = (channel = "whatsapp") => {
    if (!selectedCustomer) return "";
    const offer = stockOffers.find(o => o.id === selectedStockOffer) || stockOffers[0];
    const isSpanish = outreachLanguage === "es";

    if (isSpanish) {
      return `¡Hola ${selectedCustomer.name}! Un cordial saludo de MiNZTECH, Refurbisher Autorizado por Microsoft (USA y México).

Tenemos una oferta de mayoreo disponible para entrega inmediata desde nuestra bodega en México:

💻 *${offer.brand} ${offer.model}* (${offer.grade})
⚙️ Especificaciones: ${offer.specs}
📦 Disponibles: ${offer.qtyAvailable} pzas (Mínimo: ${offer.minOrderQty} pzas)
💰 Precio de mayoreo: $${offer.priceMxn ? offer.priceMxn.toLocaleString() + ' MXN' : '$' + offer.priceUsd + ' USD'} + IVA
🛡️ Factura mexicana desglosada y garantía directa MiNZTECH.

¿Te apartamos un lote para envío esta semana? Confírmanos por este chat para apartar inventario.`;
    }

    return `Hi ${selectedCustomer.name}! Greetings from MiNZTECH - Microsoft Authorized Laptop Refurbisher.

We have a wholesale bulk lot ready to ship from our warehouse:

💻 *${offer.brand} ${offer.model}* (${offer.grade})
⚙️ Specs: ${offer.specs}
📦 Available: ${offer.qtyAvailable} units (MOQ: ${offer.minOrderQty} units)
💰 Wholesale Tier: $${offer.priceUsd} USD / unit
🛡️ 100% Tested, 90%+ Battery Health & Microsoft MAR Certified.

Would you like a formal quote or lot reservation? Reply directly here to lock it in!`;
  };

  const handleSendWhatsApp = () => {
    if (!selectedCustomer) return;
    const cleanPhone = (selectedCustomer.whatsapp || selectedCustomer.phone || "").replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      alert("Please provide a valid phone or WhatsApp number for this customer.");
      return;
    }
    const message = getOutreachMessage("whatsapp");
    const encoded = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    
    const updated = {
      ...selectedCustomer,
      lastContactDate: new Date().toISOString().split("T")[0],
      status: "Offer Sent (WhatsApp)"
    };
    saveCustomer(updated);
    refreshList();
    
    window.open(waUrl, "_blank");
    showToast("WhatsApp launched & contact history updated!");
    setIsOutreachModalOpen(false);
  };

  const handleSendEmail = () => {
    if (!selectedCustomer?.email) {
      alert("No email found.");
      return;
    }
    const offer = stockOffers.find(o => o.id === selectedStockOffer) || stockOffers[0];
    const subject = encodeURIComponent(`MiNZTECH Wholesale Offer: ${offer.brand} ${offer.model} (Grade A+)`);
    const body = encodeURIComponent(getOutreachMessage("email"));
    const mailto = `mailto:${selectedCustomer.email}?subject=${subject}&body=${body}`;
    
    const updated = {
      ...selectedCustomer,
      lastContactDate: new Date().toISOString().split("T")[0],
      status: "Offer Sent (Email)"
    };
    saveCustomer(updated);
    refreshList();

    window.location.href = mailto;
    showToast("Email client opened & contact history updated.");
    setIsOutreachModalOpen(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Message copied to clipboard!");
  };

  // ==========================================
  // BULK IMPORT & VISUAL COLUMN MAPPING ENGINE
  // ==========================================
  const parseCSVText = (text) => {
    if (!text || !text.trim()) return { headers: [], rows: [] };
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return { headers: [], rows: [] };

    const firstLine = lines[0];
    const delimiter = firstLine.includes("\t") ? "\t" : (firstLine.includes(";") && !firstLine.includes(",")) ? ";" : ",";

    const parseLine = (line) => {
      const result = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(cur.trim().replace(/^["']|["']$/g, ""));
          cur = "";
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^["']|["']$/g, ""));
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseLine(lines[i]);
      if (values.some(v => v !== "")) {
        rows.push(values);
      }
    }
    return { headers, rows };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      setRawCsvInput(content);
      processCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCSV = () => {
    const sample = `Contact Name,Company,Work Email,WhatsApp / Phone,Market,Lead Source,Collected By,Date Added,Pipeline Stage,Notes
Carlos Valenzuela,CompuTech CDMX,carlos@computech.mx,+52 55 1234 5678,LATAM,WhatsApp Direct,Carlos Mendoza,2026-09-12,Active Buyer,Interested in 120 Dell 7420 units
Jennifer Lopez,Silicon IT Supply,jennifer@siliconit.com,+1 415 555 9821,USA,Website Inquiry,Sarah Jenkins,2026-09-11,Negotiation,Needs MAR certificates and 30 day warranty
Marco Rossi,Guadalajara Electro Mayoreo,marco@gdlmayoreo.com,+52 33 9876 5432,LATAM,Facebook Ad,Carlos Mendoza,2026-09-10,Quote Sent,Requires Mexican Factura and local GDL delivery`;
    setRawCsvInput(sample);
    setImportFileName("sample_minztech_customers.csv");
    processCsvContent(sample);
  };

  const processCsvContent = (content) => {
    const { headers, rows } = parseCSVText(content);
    if (headers.length === 0) {
      alert("No valid columns found in CSV.");
      return;
    }
    setParsedHeaders(headers);
    setParsedRows(rows);

    // Auto-map headers intelligently
    const mapping = {};
    const autoMatch = (candidates) => {
      for (const cand of candidates) {
        const idx = headers.findIndex(h => h.toLowerCase().replace(/[^a-z0-9]/g, "").includes(cand));
        if (idx !== -1) return headers[idx];
      }
      return "";
    };

    mapping.name = autoMatch(["name", "contact", "customer", "client", "person"]);
    mapping.company = autoMatch(["company", "business", "org", "account", "empresa"]);
    mapping.email = autoMatch(["email", "mail", "correo"]);
    mapping.phone = autoMatch(["phone", "whatsapp", "mobile", "tel", "celular"]);
    mapping.market = autoMatch(["market", "country", "region", "pais"]);
    mapping.type = autoMatch(["category", "segment", "type", "tipo"]);
    mapping.source = autoMatch(["source", "leadsource", "channel", "origen"]);
    mapping.collectedBy = autoMatch(["collectedby", "collector", "rep", "agent", "responsable", "owner"]);
    mapping.dateAdded = autoMatch(["dateadded", "date", "created", "fecha"]);
    mapping.status = autoMatch(["status", "stage", "pipeline", "estado"]);
    mapping.notes = autoMatch(["notes", "comment", "desc", "notas"]);

    setColumnMapping(mapping);
    setImportStep(2);
  };

  const handleExecuteImport = () => {
    if (!columnMapping.name && !columnMapping.email) {
      alert("Please map at least the Contact Name or Email column to proceed.");
      return;
    }

    const newCustomers = parsedRows.map((row, idx) => {
      const getVal = (field) => {
        const headerName = columnMapping[field];
        if (!headerName) return "";
        const colIdx = parsedHeaders.indexOf(headerName);
        return colIdx !== -1 ? (row[colIdx] || "").trim() : "";
      };

      const name = getVal("name") || `Customer #${idx + 1}`;
      const company = getVal("company") || "Independent Tech Reseller";
      const email = getVal("email") || `customer_${Date.now()}_${idx}@domain.com`;
      const phone = getVal("phone");
      const marketVal = (getVal("market") || "").toUpperCase();
      const market = marketVal.includes("LATAM") || marketVal.includes("MEX") ? "LATAM" : "USA";
      const typeVal = (getVal("type") || "").toLowerCase();
      const type = typeVal.includes("cold") ? "cold" : "warm";
      const source = getVal("source") || "Bulk CSV Import";
      const collectedBy = getVal("collectedBy") || "Sarah Jenkins";
      const dateAdded = getVal("dateAdded") || new Date().toISOString().split("T")[0];
      const status = getVal("status") || "Needs Outreach";
      const notes = getVal("notes") || "Imported via CRM bulk engine.";

      return {
        id: `cust_imp_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        name,
        company,
        email,
        phone: phone || "+1 (555) 000-0000",
        whatsapp: phone || "+1 (555) 000-0000",
        market,
        type,
        source,
        collectedBy,
        dateAdded,
        status,
        lastContactDate: dateAdded,
        preferredQty: "50-100 units",
        dealValue: "$18,000",
        notes,
        created_at: new Date().toISOString()
      };
    });

    bulkImportCustomers(newCustomers);
    refreshList();
    setIsBulkImportModalOpen(false);
    setImportStep(1);
    setRawCsvInput("");
    showToast(`Successfully imported ${newCustomers.length} customers with field mappings!`);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-neon text-brand-black px-4 py-2.5 rounded-xl font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Bottom Bulk Actions Bar (Appears when items are selected) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1a1a1a] border-2 border-brand-neon/80 rounded-2xl shadow-2xl px-5 py-3 flex flex-wrap items-center gap-3.5 backdrop-blur-xl animate-in slide-in-from-bottom-6">
          <div className="flex items-center gap-2 pr-3 border-r border-brand-border/80">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-neon animate-pulse"></span>
            <span className="text-white font-extrabold text-xs">
              {selectedIds.size} {selectedIds.size === 1 ? "Prospect" : "Prospects"} Selected
            </span>
          </div>

          <button
            onClick={handleOpenBulkEdit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-neon hover:bg-brand-lime text-brand-black text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Bulk Edit</span>
          </button>

          <button
            onClick={handleBulkExportSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface hover:bg-brand-hover text-white text-xs font-semibold rounded-xl border border-brand-border transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-brand-lime" />
            <span>Export Selected</span>
          </button>

          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold rounded-xl border border-red-800/50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Selected</span>
          </button>

          <button
            onClick={handleDeselectAll}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-brand-dark transition-colors text-xs"
            title="Deselect all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Primary CRM Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Customer Outreach & Lists</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-surface border border-brand-border text-xs text-brand-neon font-mono font-bold">
              {filteredCustomers.length} Records
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage wholesale laptop buyer pipelines with individual column filters, bulk editing, and mapped CSV bulk imports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Column Filters Toggle Button */}
          <button
            onClick={() => setIsFilterBarOpen(!isFilterBarOpen)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isFilterBarOpen || hasActiveFilters
                ? "bg-brand-neon/15 text-brand-neon border-brand-neon/40"
                : "bg-brand-surface hover:bg-brand-hover text-gray-300 border-brand-border"
            }`}
            title="Toggle individual column filters"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Column Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-brand-neon animate-pulse"></span>
            )}
          </button>

          {/* Bulk Import CSV Button */}
          <button
            onClick={() => {
              setImportStep(1);
              setIsBulkImportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-surface hover:bg-brand-hover text-gray-200 hover:text-white border border-brand-border text-xs font-semibold rounded-xl transition-colors"
            title="Bulk import customers with column mapping"
          >
            <Upload className="w-3.5 h-3.5 text-brand-neon" />
            <span>Bulk Import</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-surface hover:bg-brand-hover text-gray-300 hover:text-white border border-brand-border text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-brand-lime" />
            <span>Export CSV</span>
          </button>

          {/* Add Customer */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-neon hover:bg-brand-lime text-brand-black text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Main Filter & Global Search Card */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Segment Tabs */}
          <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-brand-border text-xs font-medium">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === "all" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              All Contacts ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab("warm")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === "warm" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Warm Prospects ({warmCount})</span>
            </button>
            <button
              onClick={() => setActiveTab("cold")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === "cold" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400 hover:text-white"
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Cold Prospects ({coldCount})</span>
            </button>
          </div>

          {/* Quick Market Filter Tabs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Market:</span>
            <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-brand-border">
              <button
                onClick={() => setMarketFilter("all")}
                className={`px-2.5 py-1 rounded-lg ${
                  marketFilter === "all" ? "bg-brand-surface text-brand-neon font-bold" : "text-gray-400"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMarketFilter("USA")}
                className={`px-2.5 py-1 rounded-lg ${
                  marketFilter === "USA" ? "bg-brand-surface text-brand-neon font-bold" : "text-gray-400"
                }`}
              >
                🇺🇸 USA
              </button>
              <button
                onClick={() => setMarketFilter("LATAM")}
                className={`px-2.5 py-1 rounded-lg ${
                  marketFilter === "LATAM" ? "bg-brand-surface text-brand-neon font-bold" : "text-gray-400"
                }`}
              >
                🇲🇽 Mexico
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-dark hover:bg-red-950/40 text-red-400 text-xs border border-brand-border transition-colors ml-2"
                title="Reset all filters"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, company, email, WhatsApp, lead source, collector..."
            className="w-full pl-10 pr-4 py-2 bg-brand-dark border border-brand-border rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-neon"
          />
        </div>

        {/* ========================================================================= */}
        {/* INDIVIDUAL COLUMN FILTER SYSTEM BAR (USER REQUESTED!) */}
        {/* ========================================================================= */}
        {isFilterBarOpen && (
          <div className="pt-3 border-t border-brand-border/60 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span className="flex items-center gap-1.5 text-brand-neon font-bold uppercase tracking-wider text-[11px]">
                <Filter className="w-3.5 h-3.5" />
                <span>Multi-Column Filters (Live Filter Grid)</span>
              </span>
              <span>Matching {filteredCustomers.length} of {customers.length} records</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 text-xs">
              {/* Filter 1: Customer / Company */}
              <div>
                <label className="block text-[11px] text-gray-400 font-semibold mb-1">Customer / Company</label>
                <input
                  type="text"
                  value={columnFilters.name}
                  onChange={(e) => setColumnFilters({ ...columnFilters, name: e.target.value })}
                  placeholder="Filter name or company..."
                  className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-neon"
                />
              </div>

              {/* Filter 2: Source */}
              <div>
                <label className="block text-[11px] text-gray-400 font-semibold mb-1">Lead Source</label>
                <select
                  value={columnFilters.source}
                  onChange={(e) => setColumnFilters({ ...columnFilters, source: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-medium"
                >
                  <option value="all">All Sources</option>
                  {distinctSources.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Collected By */}
              <div>
                <label className="block text-[11px] text-gray-400 font-semibold mb-1">Collected By</label>
                <select
                  value={columnFilters.collectedBy}
                  onChange={(e) => setColumnFilters({ ...columnFilters, collectedBy: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-medium"
                >
                  <option value="all">All Collectors / Reps</option>
                  {distinctCollectors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Filter 4: Pipeline Stage */}
              <div>
                <label className="block text-[11px] text-gray-400 font-semibold mb-1">Pipeline Stage</label>
                <select
                  value={columnFilters.status}
                  onChange={(e) => setColumnFilters({ ...columnFilters, status: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-medium"
                >
                  <option value="all">All Stages</option>
                  {distinctStatuses.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Filter 5: Date Added (From) */}
              <div>
                <label className="block text-[11px] text-gray-400 font-semibold mb-1">Date Added From</label>
                <input
                  type="date"
                  value={columnFilters.dateAddedFrom}
                  onChange={(e) => setColumnFilters({ ...columnFilters, dateAddedFrom: e.target.value })}
                  className="w-full px-2 py-1 bg-brand-dark border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-mono"
                />
              </div>

              {/* Filter 6: Last Contacted (From) */}
              <div>
                <label className="block text-[11px] text-gray-400 font-semibold mb-1">Last Contacted From</label>
                <input
                  type="date"
                  value={columnFilters.lastContactFrom}
                  onChange={(e) => setColumnFilters({ ...columnFilters, lastContactFrom: e.target.value })}
                  className="w-full px-2 py-1 bg-brand-dark border border-brand-border rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-neon font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enterprise List View Table */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-md w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[1180px] text-left text-xs text-gray-300">
            <thead className="bg-brand-dark/95 text-gray-400 uppercase font-mono text-[11px] border-b border-brand-border select-none">
              <tr>
                {/* Select All Checkbox */}
                <th className="py-3.5 px-3 w-10 text-center">
                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                    title={isAllSelected ? "Deselect all" : "Select all"}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-neon" />
                    ) : isSomeSelected ? (
                      <MinusSquare className="w-4 h-4 text-brand-lime" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </th>

                <th className="py-3.5 px-4 min-w-[210px]">Customer & Company</th>
                <th className="py-3.5 px-3 min-w-[125px]">Segment / Market</th>
                <th className="py-3.5 px-4 min-w-[170px]">Contact Channels</th>
                <th className="py-3.5 px-3 min-w-[130px]">Source</th>
                <th className="py-3.5 px-3 min-w-[130px]">Collected By</th>
                <th className="py-3.5 px-3 min-w-[130px]">Date Added</th>
                <th className="py-3.5 px-3 min-w-[125px]">Pipeline Stage</th>
                <th className="py-3.5 px-3 min-w-[170px]">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-neon" />
                    <span>Last Contacted</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right min-w-[140px]">Outreach Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/40">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto text-gray-600 mb-2" />
                    <p className="text-sm font-semibold text-white">No customer records match your filter criteria</p>
                    <p className="text-xs text-gray-500 mt-1">Try resetting the column filters or adding a new customer.</p>
                    {hasActiveFilters && (
                      <button
                        onClick={clearAllFilters}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-brand-neon text-brand-black text-xs font-bold hover:bg-brand-lime transition-all"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const isWarm = cust.type === "warm";
                  const isSelected = selectedIds.has(cust.id);

                  return (
                    <tr 
                      key={cust.id} 
                      className={`transition-colors group ${
                        isSelected 
                          ? "bg-brand-neon/10 hover:bg-brand-neon/15" 
                          : "hover:bg-brand-hover/40"
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRow(cust.id)}
                          className="p-1 rounded text-gray-400 hover:text-white transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-neon" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
                          )}
                        </button>
                      </td>

                      {/* Customer & Company */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{cust.name}</div>
                        <div className="text-xs text-brand-lime font-medium mt-0.5">{cust.company}</div>
                        {cust.notes && (
                          <div className="text-[11px] text-gray-400 truncate max-w-xs xl:max-w-sm 2xl:max-w-md mt-0.5 italic">
                            "{cust.notes}"
                          </div>
                        )}
                      </td>

                      {/* Segment & Market */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isWarm 
                              ? "bg-brand-neon/20 text-brand-neon border border-brand-neon/30" 
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}>
                            {isWarm ? "🔥 Warm Prospect" : "❄️ Cold Prospect"}
                          </span>
                          <span className="text-[11px] font-mono text-gray-300">
                            {cust.market === "LATAM" ? "🇲🇽 Mexico" : "🇺🇸 USA"}
                          </span>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-mono text-gray-200 text-xs truncate max-w-[200px]">{cust.email}</div>
                          <div className="font-mono text-brand-neon font-medium text-xs">{cust.whatsapp || cust.phone}</div>
                        </div>
                      </td>

                      {/* Lead Source (Replaces Preferred Brands) */}
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-lg bg-brand-dark text-gray-200 font-medium text-[11px] border border-brand-border inline-flex items-center gap-1">
                          <Globe2 className="w-3 h-3 text-brand-lime" />
                          <span>{cust.source || "Direct"}</span>
                        </span>
                      </td>

                      {/* Collected By (Replaces Preferred Brands) */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-1 rounded-lg bg-brand-dark/80 text-gray-300 font-medium text-[11px] border border-brand-border/80 inline-flex items-center gap-1.5">
                          <User className="w-3 h-3 text-brand-neon" />
                          <span>{cust.collectedBy || "Unassigned"}</span>
                        </span>
                      </td>

                      {/* Date Added */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-gray-300 text-[11px]">
                          {cust.dateAdded || "Recent"}
                        </span>
                      </td>

                      {/* Pipeline Stage */}
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded bg-brand-dark text-white font-medium text-[11px] border border-brand-border inline-block whitespace-nowrap">
                          {cust.status}
                        </span>
                      </td>

                      {/* Last Contacted with INLINE UPDATE OPTION */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={cust.lastContactDate || ""}
                            onChange={(e) => handleUpdateLastContactDate(cust, e.target.value)}
                            className="px-2 py-1 bg-brand-dark border border-brand-border rounded-lg text-white text-[11px] font-mono focus:ring-1 focus:ring-brand-neon focus:outline-none cursor-pointer"
                            title="Click to edit date directly"
                          />
                          <button
                            onClick={() => handleSetContactToday(cust)}
                            className="px-2 py-1 rounded-lg bg-brand-dark hover:bg-brand-neon hover:text-brand-black text-brand-neon border border-brand-border text-[10px] font-bold transition-colors"
                            title="Set last contacted to today"
                          >
                            Today
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenOutreach(cust)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-brand-neon hover:bg-brand-lime text-brand-black font-bold text-xs rounded-xl shadow-sm transition-all active:scale-95"
                            title="1-Click WhatsApp or Email stock pitch"
                          >
                            <Send className="w-3 h-3" />
                            <span>Pitch</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(cust)}
                            title="Edit customer"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-neon hover:bg-brand-dark transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(cust.id)}
                            title="Delete customer"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-brand-dark transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BULK EDIT MODAL (USER REQUESTED!) */}
      {/* ========================================================================= */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Bulk Edit Prospects
                </h2>
                <p className="text-xs text-brand-neon font-medium mt-0.5">
                  Updating {selectedIds.size} selected customer records simultaneously
                </p>
              </div>
              <button 
                onClick={() => setIsBulkEditModalOpen(false)} 
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyBulkEdit} className="space-y-3.5 text-xs">
              <p className="text-[11px] text-gray-400">
                Leave any field as <strong>"Keep Unchanged"</strong> to preserve its existing value on selected records.
              </p>

              {/* Status / Stage */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Pipeline Stage</label>
                <select
                  value={bulkForm.status}
                  onChange={(e) => setBulkForm({ ...bulkForm, status: e.target.value })}
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none font-medium"
                >
                  <option value="KEEP">— Keep Unchanged —</option>
                  <option value="Needs Outreach">Needs Outreach</option>
                  <option value="Offer Sent (WhatsApp)">Offer Sent (WhatsApp)</option>
                  <option value="Offer Sent (Email)">Offer Sent (Email)</option>
                  <option value="Quote Sent">Quote Sent</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Active Buyer">Active Buyer</option>
                </select>
              </div>

              {/* Segment & Market */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Category</label>
                  <select
                    value={bulkForm.type}
                    onChange={(e) => setBulkForm({ ...bulkForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                  >
                    <option value="KEEP">— Keep Unchanged —</option>
                    <option value="warm">🔥 Warm Prospect</option>
                    <option value="cold">❄️ Cold Prospect</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Market</label>
                  <select
                    value={bulkForm.market}
                    onChange={(e) => setBulkForm({ ...bulkForm, market: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                  >
                    <option value="KEEP">— Keep Unchanged —</option>
                    <option value="USA">🇺🇸 USA Domestic</option>
                    <option value="LATAM">🇲🇽 Mexico / LATAM</option>
                  </select>
                </div>
              </div>

              {/* Source */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Lead Source</label>
                <select
                  value={bulkForm.source}
                  onChange={(e) => setBulkForm({ ...bulkForm, source: e.target.value })}
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                >
                  <option value="KEEP">— Keep Unchanged —</option>
                  {distinctSources.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="CUSTOM">+ Write New Custom Source...</option>
                </select>
                {bulkForm.source === "CUSTOM" && (
                  <input
                    type="text"
                    required
                    value={bulkForm.customSource}
                    onChange={(e) => setBulkForm({ ...bulkForm, customSource: e.target.value })}
                    placeholder="Enter custom source name..."
                    className="mt-2 w-full px-3 py-1.5 bg-brand-dark border border-brand-neon rounded-xl text-white text-xs focus:outline-none"
                  />
                )}
              </div>

              {/* Collected By */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Reassign Lead (Collected By)</label>
                <select
                  value={bulkForm.collectedBy}
                  onChange={(e) => setBulkForm({ ...bulkForm, collectedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                >
                  <option value="KEEP">— Keep Unchanged —</option>
                  {distinctCollectors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="CUSTOM">+ Write New Rep Name...</option>
                </select>
                {bulkForm.collectedBy === "CUSTOM" && (
                  <input
                    type="text"
                    required
                    value={bulkForm.customCollectedBy}
                    onChange={(e) => setBulkForm({ ...bulkForm, customCollectedBy: e.target.value })}
                    placeholder="Enter collector / rep name..."
                    className="mt-2 w-full px-3 py-1.5 bg-brand-dark border border-brand-neon rounded-xl text-white text-xs focus:outline-none"
                  />
                )}
              </div>

              {/* Last Contacted Option */}
              <div>
                <label className="block text-gray-300 font-semibold mb-1">Update Last Contacted Date</label>
                <select
                  value={bulkForm.lastContactOption}
                  onChange={(e) => setBulkForm({ ...bulkForm, lastContactOption: e.target.value })}
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                >
                  <option value="KEEP">— Keep Unchanged —</option>
                  <option value="TODAY">Set to Today ({new Date().toISOString().split("T")[0]})</option>
                  <option value="CUSTOM">Choose Specific Date...</option>
                </select>
                {bulkForm.lastContactOption === "CUSTOM" && (
                  <input
                    type="date"
                    required
                    value={bulkForm.customDate}
                    onChange={(e) => setBulkForm({ ...bulkForm, customDate: e.target.value })}
                    className="mt-2 w-full px-3 py-1.5 bg-brand-dark border border-brand-neon rounded-xl text-white text-xs focus:outline-none font-mono"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsBulkEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-brand-dark hover:bg-brand-hover text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-neon text-brand-black font-bold hover:bg-brand-lime shadow-md"
                >
                  Apply to {selectedIds.size} Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISUAL BULK IMPORT WITH COLUMN MAPPING (USER REQUESTED!) */}
      {/* ========================================================================= */}
      {isBulkImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-brand-border pb-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-neon/20 text-brand-neon text-[11px] font-semibold mb-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Visual Column Mapping CSV Engine</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  Bulk Import Customer Leads
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Step {importStep} of 2: {importStep === 1 ? "Upload or Paste CSV Data" : "Map Columns & Verify Live Preview"}
                </p>
              </div>
              <button 
                onClick={() => setIsBulkImportModalOpen(false)} 
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: Upload or Paste */}
            {importStep === 1 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload Box */}
                  <div className="p-5 bg-brand-dark/90 border-2 border-dashed border-brand-border hover:border-brand-neon/60 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 transition-colors">
                    <Upload className="w-8 h-8 text-brand-neon" />
                    <div>
                      <span className="font-bold text-white block text-sm">Upload CSV File</span>
                      <span className="text-[11px] text-gray-400">Supports .csv or .tsv files</span>
                    </div>
                    <label className="cursor-pointer px-4 py-2 bg-brand-surface hover:bg-brand-hover text-brand-neon border border-brand-border font-bold rounded-xl transition-all">
                      Choose File
                      <input 
                        type="file" 
                        accept=".csv,.tsv,.txt" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </label>
                    {importFileName && (
                      <span className="text-[11px] text-brand-lime font-mono">Loaded: {importFileName}</span>
                    )}
                  </div>

                  {/* Sample Data Quick Loader */}
                  <div className="p-5 bg-brand-dark/90 border border-brand-border rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <span className="font-bold text-white block text-sm">Try Sample Data</span>
                      <p className="text-[11px] text-gray-400 mt-1">
                        Instantly test the column mapping engine with sample B2B laptop wholesale buyer records.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadSampleCSV}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-neon hover:bg-brand-lime text-brand-black font-bold rounded-xl transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Load Sample Template CSV</span>
                    </button>
                  </div>
                </div>

                {/* Raw Textarea Paste */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-semibold text-gray-300">Or Paste Raw CSV Data:</label>
                    <span className="text-[11px] text-gray-500">First line must contain headers</span>
                  </div>
                  <textarea
                    rows={6}
                    value={rawCsvInput}
                    onChange={(e) => setRawCsvInput(e.target.value)}
                    placeholder="Contact Name,Company,Work Email,WhatsApp,Market,Source,Collected By..."
                    className="w-full p-3 bg-brand-dark border border-brand-border rounded-xl text-white font-mono text-xs focus:ring-1 focus:ring-brand-neon focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkImportModalOpen(false)}
                    className="px-4 py-2 bg-brand-dark hover:bg-brand-hover text-gray-400 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!rawCsvInput.trim()}
                    onClick={() => processCsvContent(rawCsvInput)}
                    className="flex items-center gap-1.5 px-5 py-2 bg-brand-neon hover:bg-brand-lime disabled:opacity-50 text-brand-black font-bold rounded-xl transition-all"
                  >
                    <span>Proceed to Column Mapping</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Visual Column Mapping Grid & Live Preview */}
            {importStep === 2 && (
              <div className="space-y-5 text-xs">
                <div className="p-3 bg-brand-dark/90 rounded-xl border border-brand-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-neon" />
                    <span className="text-white font-semibold">
                      Detected {parsedHeaders.length} Columns & {parsedRows.length} Records in CSV
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImportStep(1)}
                    className="text-brand-lime hover:underline text-[11px]"
                  >
                    ← Change CSV Data
                  </button>
                </div>

                {/* Column Mapping Grid */}
                <div>
                  <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-1.5">
                    <span>1. Map Portal Target Fields to CSV Columns</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-brand-dark/60 rounded-xl border border-brand-border">
                    {/* Customer Name */}
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">
                        Contact Name <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={columnMapping.name || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-brand-neon"
                      >
                        <option value="">— Don't Map / Skip —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Company */}
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Company Name</label>
                      <select
                        value={columnMapping.company || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, company: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-brand-neon"
                      >
                        <option value="">— Don't Map / Skip —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={columnMapping.email || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, email: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-brand-neon"
                      >
                        <option value="">— Don't Map / Skip —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Phone / WhatsApp */}
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">WhatsApp / Phone</label>
                      <select
                        value={columnMapping.phone || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, phone: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-brand-neon"
                      >
                        <option value="">— Don't Map / Skip —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Lead Source */}
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Lead Source</label>
                      <select
                        value={columnMapping.source || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, source: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-brand-neon"
                      >
                        <option value="">— Don't Map / Skip —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Collected By */}
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Collected By</label>
                      <select
                        value={columnMapping.collectedBy || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, collectedBy: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-brand-neon"
                      >
                        <option value="">— Don't Map / Skip —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Date Added */}
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Date Added</label>
                      <select
                        value={columnMapping.dateAdded || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, dateAdded: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-brand-neon"
                      >
                        <option value="">— Don't Map / Skip —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Pipeline Stage */}
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Pipeline Stage</label>
                      <select
                        value={columnMapping.status || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, status: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-brand-neon"
                      >
                        <option value="">— Don't Map / Skip —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Market */}
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Target Market (USA/LATAM)</label>
                      <select
                        value={columnMapping.market || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, market: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-brand-neon"
                      >
                        <option value="">— Don't Map / Skip —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block font-semibold text-gray-300 mb-1">Notes / Preferences</label>
                      <select
                        value={columnMapping.notes || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, notes: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-brand-dark border border-brand-border rounded-lg text-white text-xs font-mono focus:ring-1 focus:ring-brand-neon"
                      >
                        <option value="">— Don't Map / Skip —</option>
                        {parsedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Live Mapped Preview (First 3 rows) */}
                <div>
                  <h3 className="font-bold text-white text-sm mb-2">
                    2. Live 3-Row Data Preview (Verification)
                  </h3>
                  <div className="overflow-x-auto rounded-xl border border-brand-border bg-brand-dark">
                    <table className="w-full text-left text-[11px] text-gray-300 min-w-[700px]">
                      <thead className="bg-black/60 text-gray-400 font-mono">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Company</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Phone</th>
                          <th className="py-2 px-3">Source</th>
                          <th className="py-2 px-3">Rep</th>
                          <th className="py-2 px-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border/40 font-mono">
                        {parsedRows.slice(0, 3).map((row, rIdx) => {
                          const getVal = (f) => {
                            const header = columnMapping[f];
                            if (!header) return "-";
                            const idx = parsedHeaders.indexOf(header);
                            return idx !== -1 ? (row[idx] || "-") : "-";
                          };
                          return (
                            <tr key={rIdx} className="hover:bg-brand-surface/50">
                              <td className="py-2 px-3 text-white font-bold">{getVal("name")}</td>
                              <td className="py-2 px-3 text-brand-lime">{getVal("company")}</td>
                              <td className="py-2 px-3 text-gray-300">{getVal("email")}</td>
                              <td className="py-2 px-3 text-brand-neon">{getVal("phone")}</td>
                              <td className="py-2 px-3">{getVal("source")}</td>
                              <td className="py-2 px-3">{getVal("collectedBy")}</td>
                              <td className="py-2 px-3">{getVal("dateAdded")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                  <button
                    type="button"
                    onClick={() => setImportStep(1)}
                    className="px-4 py-2 bg-brand-dark hover:bg-brand-hover text-gray-300 rounded-xl"
                  >
                    Back to Step 1
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-neon hover:bg-brand-lime text-brand-black font-extrabold rounded-xl shadow-lg transition-transform active:scale-95 text-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Import {parsedRows.length} Customers to CRM</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT SINGLE CUSTOMER MODAL */}
      {/* ========================================================================= */}
      {isEditModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {selectedCustomer.id ? "Edit Customer Record" : "Add New Customer"}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={selectedCustomer.name}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, name: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                    placeholder="e.g. Alex Rivera"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Company Name</label>
                  <input
                    type="text"
                    value={selectedCustomer.company}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, company: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                    placeholder="e.g. Nordic Tech LLC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={selectedCustomer.email}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                    placeholder="buyer@domain.com"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">WhatsApp / Phone *</label>
                  <input
                    type="text"
                    value={selectedCustomer.whatsapp || selectedCustomer.phone}
                    onChange={(e) => setSelectedCustomer({ 
                      ...selectedCustomer, 
                      phone: e.target.value,
                      whatsapp: e.target.value 
                    })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none font-mono"
                    placeholder="+1 512 555 0192 or +52 55..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Category</label>
                  <select
                    value={selectedCustomer.type}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, type: e.target.value })}
                    className="w-full px-2.5 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                  >
                    <option value="warm">🔥 Warm Prospect</option>
                    <option value="cold">❄️ Cold Prospect</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Market</label>
                  <select
                    value={selectedCustomer.market}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, market: e.target.value })}
                    className="w-full px-2.5 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                  >
                    <option value="USA">🇺🇸 USA Domestic</option>
                    <option value="LATAM">🇲🇽 Mexico / LATAM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Stage</label>
                  <select
                    value={selectedCustomer.status}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, status: e.target.value })}
                    className="w-full px-2.5 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                  >
                    <option value="Needs Outreach">Needs Outreach</option>
                    <option value="Offer Sent (WhatsApp)">Offer Sent (WA)</option>
                    <option value="Offer Sent (Email)">Offer Sent (Email)</option>
                    <option value="Quote Sent">Quote Sent</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Active Buyer">Active Buyer</option>
                  </select>
                </div>
              </div>

              {/* Source, Collected By, Date Added */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Lead Source</label>
                  <input
                    type="text"
                    value={selectedCustomer.source || ""}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, source: e.target.value })}
                    placeholder="e.g. WhatsApp Direct"
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Collected By</label>
                  <input
                    type="text"
                    value={selectedCustomer.collectedBy || ""}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, collectedBy: e.target.value })}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Date Added</label>
                  <input
                    type="date"
                    value={selectedCustomer.dateAdded || ""}
                    onChange={(e) => setSelectedCustomer({ ...selectedCustomer, dateAdded: e.target.value })}
                    className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Last Contacted Date</label>
                <input
                  type="date"
                  value={selectedCustomer.lastContactDate || ""}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, lastContactDate: e.target.value })}
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">Notes & Specs Preference</label>
                <textarea
                  rows={2}
                  value={selectedCustomer.notes || ""}
                  onChange={(e) => setSelectedCustomer({ ...selectedCustomer, notes: e.target.value })}
                  placeholder="e.g. Looking for 100x HP 840 G8 with Mexican invoice (Factura)..."
                  className="w-full px-3 py-2 bg-brand-dark border border-brand-border rounded-xl text-white focus:ring-1 focus:ring-brand-neon focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-brand-dark hover:bg-brand-hover text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-neon text-brand-black font-bold hover:bg-brand-lime"
                >
                  Save & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outreach Modal */}
      {isOutreachModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-scaleIn">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-neon/20 text-brand-neon text-[11px] font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Microsoft MAR Stock Offer Dispatcher</span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  Send Stock Offer to {selectedCustomer.name}
                </h2>
                <p className="text-xs text-gray-400">{selectedCustomer.company} • {selectedCustomer.market} Market</p>
              </div>
              <button 
                onClick={() => setIsOutreachModalOpen(false)} 
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Select Laptop Stock Batch:
              </label>
              <select
                value={selectedStockOffer}
                onChange={(e) => setSelectedStockOffer(e.target.value)}
                className="w-full px-3 py-2.5 bg-brand-dark border border-brand-border rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-neon"
              >
                {stockOffers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.brand} {o.model} ({o.grade}) - {o.qtyAvailable} Units - ${o.priceUsd} USD / ${o.priceMxn} MXN
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-semibold">Message Language:</span>
              <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-xl border border-brand-border">
                <button
                  type="button"
                  onClick={() => setOutreachLanguage("en")}
                  className={`px-3 py-1 rounded-lg ${outreachLanguage === "en" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400"}`}
                >
                  🇺🇸 English (US Wholesale)
                </button>
                <button
                  type="button"
                  onClick={() => setOutreachLanguage("es")}
                  className={`px-3 py-1 rounded-lg ${outreachLanguage === "es" ? "bg-brand-neon text-brand-black font-bold" : "text-gray-400"}`}
                >
                  🇲🇽 Español (Bodega México)
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-300">Live Message Preview:</label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getOutreachMessage())}
                  className="text-xs text-brand-neon hover:text-brand-lime flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Text</span>
                </button>
              </div>
              <div className="p-3 bg-brand-dark rounded-xl border border-brand-border text-xs text-gray-200 whitespace-pre-line font-mono max-h-48 overflow-y-auto leading-relaxed">
                {getOutreachMessage()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp ({selectedCustomer.whatsapp || selectedCustomer.phone})</span>
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-brand-neon hover:bg-brand-lime text-brand-black font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>Email ({selectedCustomer.email})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
