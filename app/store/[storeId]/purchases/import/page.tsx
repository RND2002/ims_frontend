"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createApiClient } from "@/lib/apiClient";
import { store } from "@/lib/store";
import { apiSlice } from "@/lib/store/apiSlice";
import { API_ENDPOINTS } from "@/app/api/endpoints";
import {
  ImportBatch,
  ImportBatchStatus,
  ImportLineItem,
  ImportMatchStatus,
  ImportResolvedAction,
  ExpenseCategory,
  ProductCreateInput,
  LineItemCommitOverride,
  BatchCommitRequest,
  BatchReviewUpdateRequest
} from "@/lib/types/imports";
import { Party } from "@/lib/types/sales";
import { fetchCategories, fetchUnits, fetchTaxRates } from "@/lib/features/catalog/catalogSlice";
import { CreateProductDialog } from "@/components/purchases/CreateProductDialog";
import { AddContactDialog } from "@/components/ledgers/AddContactDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Upload,
  ArrowLeft,
  Calendar,
  Save,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Plus,
  ArrowDownCircle,
  Receipt,
  FileText,
  FileSpreadsheet,
  X,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatableSelect } from "@/components/ui/creatable-select";

type ActiveState = "UPLOAD" | "PROCESSING" | "REVIEW" | "SUCCESS";

export default function PurchaseImportPipelinePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const storeId = params.storeId as string;
  const dispatch = useAppDispatch();
  const { language, t } = useLanguage();
  const { activeStore } = useAppSelector((state) => state.stores);
  const { units } = useAppSelector((state) => state.catalog);



  const initialBatchId = searchParams.get("batch_id");

  const isCsvFile = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
      const path = url.split("?")[0];
      return path.toLowerCase().endsWith(".csv");
    } catch {
      return false;
    }
  };

  // Flow State
  const [currentScreen, setCurrentScreen] = useState<ActiveState>("UPLOAD");
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Form states inside review workspace
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [billNo, setBillNo] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [suppliers, setSuppliers] = useState<Party[]>([]);

  // Supplier Creation Modal states
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");

  const handleSupplierCreatePrompt = async (name: string): Promise<void> => {
    setNewSupplierName(name);
    setSupplierModalOpen(true);
  };

  const handleSupplierSuccess = (newSupplier: Party) => {
    setSuppliers((prev) => [...prev, newSupplier]);
    setSelectedSupplierId(newSupplier.id);
    setSupplierModalOpen(false);
    markDirty();
  };

  useEffect(() => {
    if (currentScreen === "REVIEW" && units.length === 0) {
      dispatch(fetchUnits());
    }
  }, [currentScreen, units.length, dispatch]);

  // State to hold user review overrides for each line item (keyed by line item ID)
  const [itemResolutions, setItemResolutions] = useState<Record<string, LineItemCommitOverride>>({});

  // Local track of product details created inline
  const [newProducts, setNewProducts] = useState<Record<string, ProductCreateInput>>({});

  // Auto-Save Status
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const isDirty = useRef(false);

  // Zoom / Pan states for Left Pane Image
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Double-Click inline editing
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Product Create Slide-Over trigger
  const [selectedLineForProduct, setSelectedLineForProduct] = useState<ImportLineItem | null>(null);

  // Polling variables
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize catalog parameters
  useEffect(() => {
    if (storeId) {
      dispatch(fetchCategories());
      dispatch(fetchUnits());
      dispatch(fetchTaxRates());
      loadSuppliers();
    }
  }, [storeId, dispatch]);

  // Load suppliers list
  const loadSuppliers = async () => {
    try {
      const client = createApiClient(store.getState);
      const res = await client.get<any>(`${API_ENDPOINTS.backend.parties.base}?party_type=supplier`);
      if (res && "items" in res) {
        setSuppliers(res.items || []);
      } else {
        setSuppliers(Array.isArray(res) ? res : []);
      }
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    }
  };

  // If initialBatchId is provided in URL, load it directly
  useEffect(() => {
    if (initialBatchId) {
      loadExistingBatch(initialBatchId);
    }
  }, [initialBatchId]);

  const loadExistingBatch = async (batchId: string) => {
    setLoading(true);
    setErrorText(null);
    try {
      const client = createApiClient(store.getState);
      const batchData = await client.get<ImportBatch>(API_ENDPOINTS.backend.imports.batchById(batchId));

      setBatch(batchData);
      setSelectedSupplierId(batchData.party_id || "");
      setBillNo(batchData.bill_no || "");
      setInvoiceDate(batchData.invoice_date || new Date().toISOString().split("T")[0]);

      if (batchData.status === ImportBatchStatus.Processing) {
        setCurrentScreen("PROCESSING");
        startPolling(batchId);
      } else if (batchData.status === ImportBatchStatus.PendingReview) {
        // Detail endpoint always returns line_items for review screen
        initializeResolutions(batchData.line_items ?? []);
        setCurrentScreen("REVIEW");
      } else if (batchData.status === ImportBatchStatus.Committed) {
        setCurrentScreen("SUCCESS");
      } else if (batchData.status === ImportBatchStatus.Failed) {
        setCurrentScreen("PROCESSING"); // failed state is inside processing layout
      }
    } catch (err: any) {
      setErrorText(err.message || "Failed to load batch");
    } finally {
      setLoading(false);
    }
  };

  // Setup initial resolutions from batch line items
  const initializeResolutions = (items: ImportLineItem[]) => {
    const resolutions: Record<string, LineItemCommitOverride> = {};
    const createdProds: Record<string, ProductCreateInput> = {};

    let runningTotal = 0;

    items.forEach((item) => {
      // Pre-confirm high-confidence or auto-matched lines
      const isAuto = item.match_status === ImportMatchStatus.AutoMatched ||
        (item.match_status === ImportMatchStatus.Suggested && (item.match_confidence || 0) >= 0.85);

      const action = isAuto ? ImportResolvedAction.MatchedExisting : item.resolved_action;
      const prodId = isAuto ? item.matched_product_id : item.resolved_product_id;
      const unitId = isAuto ? (item.resolved_unit_id || "default_unit") : item.resolved_unit_id; // Default unit fallback if null

      resolutions[item.id] = {
        id: item.id,
        resolved_action: action || ImportResolvedAction.MatchedExisting, // default action fallback
        resolved_product_id: prodId,
        resolved_unit_id: unitId,
        new_product: null,
        quantity: item.raw_qty !== null ? Number(item.raw_qty) : 0,
        unit_cost: item.raw_rate !== null ? Number(item.raw_rate) : 0,
        line_total: item.raw_amount !== null ? Number(item.raw_amount) : 0,
        batch_no: "",
        expiry_date: ""
      };

      runningTotal += item.raw_amount !== null ? Number(item.raw_amount) : 0;
    });

    setItemResolutions(resolutions);
    setAmountPaid(runningTotal);
  };

  // Start polling
  const startPolling = (batchId: string) => {
    if (pollingInterval.current) clearInterval(pollingInterval.current);

    pollingInterval.current = setInterval(async () => {
      try {
        const client = createApiClient(store.getState);
        const batchData = await client.get<ImportBatch>(API_ENDPOINTS.backend.imports.batchById(batchId));

        if (batchData.status !== ImportBatchStatus.Processing) {
          clearInterval(pollingInterval.current!);
          setBatch(batchData);
          setSelectedSupplierId(batchData.party_id || "");
          setBillNo(batchData.bill_no || "");

          if (batchData.status === ImportBatchStatus.PendingReview) {
            initializeResolutions(batchData.line_items ?? []);
            setCurrentScreen("REVIEW");
          } else if (batchData.status === ImportBatchStatus.Failed) {
            // Stay in processing but poll stops, show failed screen
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, []);

  // Upload Action
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setErrorText(null);
    setCurrentScreen("PROCESSING");
    try {
      const client = createApiClient(store.getState);

      const formData = new FormData();
      formData.append("file", file);

      // Perform custom upload with multipart/form-data
      const token = store.getState().auth.accessToken;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (storeId) headers["X-Store-ID"] = storeId;

      const uploadUrl = API_ENDPOINTS.backend.imports.upload;
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }

      const batchData: ImportBatch = await response.json();
      setBatch(batchData);
      setSelectedSupplierId(batchData.party_id || "");
      setBillNo(batchData.bill_no || "");
      setInvoiceDate(batchData.invoice_date || new Date().toISOString().split("T")[0]);

      if (batchData.status === ImportBatchStatus.PendingReview) {
        // Structured CSV: instant review, redirect straight to review screen
        initializeResolutions(batchData.line_items ?? []);
        setCurrentScreen("REVIEW");
      } else {
        // Image/Rough Text: Go to loading page to poll background AI task
        startPolling(batchData.id);
      }
    } catch (err: any) {
      setErrorText(err.message || "Failed to upload file");
      setCurrentScreen("UPLOAD");
    } finally {
      setLoading(false);
    }
  };

  // Heartbeat Autosave
  useEffect(() => {
    if (currentScreen !== "REVIEW" || !batch) return;

    const interval = setInterval(() => {
      if (isDirty.current) {
        autosaveProgress();
      }
    }, 30000);

    const handleBlur = () => {
      if (isDirty.current) {
        autosaveProgress();
      }
    };

    window.addEventListener("blur", handleBlur);

    return () => {
      clearInterval(interval);
      window.removeEventListener("blur", handleBlur);
    };
  }, [currentScreen, batch, itemResolutions, selectedSupplierId, billNo]);

  const autosaveProgress = async () => {
    if (!batch) return;
    setSaveStatus("saving");
    try {
      const client = createApiClient(store.getState);

      const itemsPayload = Object.values(itemResolutions).map((res) => ({
        id: res.id,
        resolved_action: res.resolved_action,
        resolved_product_id: res.resolved_product_id,
        resolved_unit_id: res.resolved_unit_id,
        raw_qty: res.quantity || undefined,
        raw_rate: res.unit_cost || undefined,
        raw_amount: res.line_total || undefined,
      }));

      const payload: BatchReviewUpdateRequest = {
        party_id: selectedSupplierId || null,
        bill_no: billNo || undefined,
        items: itemsPayload,
      };

      await client.put<ImportBatch>(API_ENDPOINTS.backend.imports.review(batch.id), payload);
      isDirty.current = false;
      setSaveStatus("saved");
    } catch (err) {
      console.error("Autosave failed:", err);
      setSaveStatus("unsaved");
    }
  };

  const markDirty = () => {
    isDirty.current = true;
    setSaveStatus("unsaved");
  };

  // Line item change handler
  const handleItemResolutionChange = (lineId: string, updates: Partial<LineItemCommitOverride>) => {
    setItemResolutions((prev) => {
      const existing = prev[lineId] || {};
      let updatedNewProduct = existing.new_product;

      // Sync unit_cost change to new_product.cost_price if new_product exists
      if (updates.unit_cost !== undefined && updatedNewProduct) {
        updatedNewProduct = {
          ...updatedNewProduct,
          cost_price: Number(updates.unit_cost),
        };
        // Keep newProducts react state in sync too
        setNewProducts((prevProds) => ({
          ...prevProds,
          [lineId]: updatedNewProduct!,
        }));
      }

      // Sync new_product if updates contains new_product
      if (updates.new_product !== undefined) {
        updatedNewProduct = updates.new_product;
      }

      const updated = {
        ...prev,
        [lineId]: {
          ...existing,
          ...updates,
          new_product: updatedNewProduct,
        },
      };
      markDirty();
      return updated;
    });
  };

  // Inline Rematch trigger
  const handleRematch = async (lineId: string, newDesc: string) => {
    if (!newDesc.trim()) return;
    try {
      const client = createApiClient(store.getState);
      const updatedItem = await client.post<ImportLineItem>(
        API_ENDPOINTS.backend.imports.reMatch(lineId),
        { raw_description: newDesc }
      );

      // Merge updated candidates list into batch
      setBatch((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          line_items: (prev.line_items ?? []).map((item) =>
            item.id === lineId ? { ...item, ...updatedItem } : item
          ),
        };
      });

      // Update resolution matched product details
      if (updatedItem.matched_product_id) {
        handleItemResolutionChange(lineId, {
          resolved_product_id: updatedItem.matched_product_id,
          resolved_unit_id: updatedItem.resolved_unit_id || "default_unit",
        });
      }
    } catch (err) {
      console.error("Rematch failed:", err);
    }
  };

  // Inline Product Save Callback
  const handleProductCreateSave = (productInput: ProductCreateInput) => {
    if (!selectedLineForProduct) return;
    const lineId = selectedLineForProduct.id;

    // Store product details locally
    setNewProducts((prev) => ({
      ...prev,
      [lineId]: productInput,
    }));

    // Update line resolution action
    handleItemResolutionChange(lineId, {
      resolved_action: ImportResolvedAction.CreatedNew,
      resolved_product_id: null,
      resolved_unit_id: productInput.unit_id,
      new_product: productInput,
    });
  };

  // Discard Batch API call
  const handleDiscard = async () => {
    if (!batch) return;
    if (!confirm(t("imports.review.discardConfirm"))) {
      return;
    }

    try {
      const client = createApiClient(store.getState);
      await client.post(API_ENDPOINTS.backend.imports.discard(batch.id));
      // Invalidate the import batch list cache so purchases page auto-refreshes
      dispatch(apiSlice.util.invalidateTags(["ImportBatch"]) as any);
      router.push(`/store/${storeId}/purchases`);
    } catch (err) {
      console.error("Discard failed:", err);
    }
  };

  // Final Commit API Call
  const handleCommit = async () => {
    if (!batch || !selectedSupplierId) return;

    setLoading(true);
    setErrorText(null);
    try {
      const client = createApiClient(store.getState);

      const commitItems: LineItemCommitOverride[] = (batch.line_items ?? []).map((item) => {
        const res = itemResolutions[item.id];
        return {
          id: item.id,
          resolved_action: res.resolved_action,
          resolved_product_id: res.resolved_product_id || null,
          resolved_unit_id: res.resolved_unit_id || null,
          new_product: res.resolved_action === ImportResolvedAction.CreatedNew ? newProducts[item.id] || null : null,
          quantity: res.quantity !== null ? Number(res.quantity) : null,
          unit_cost: res.unit_cost !== null ? Number(res.unit_cost) : null,
          line_total: res.line_total !== null ? Number(res.line_total) : null,
          batch_no: res.batch_no || undefined,
          expiry_date: res.expiry_date || undefined,
          expense_category: res.resolved_action === ImportResolvedAction.Skipped ? res.expense_category : undefined,
        };
      });

      const payload: BatchCommitRequest = {
        party_id: selectedSupplierId,
        bill_no: billNo || null,
        invoice_date: invoiceDate || null,
        amount_paid: Number(amountPaid),
        items: commitItems,
      };

      await client.post(API_ENDPOINTS.backend.imports.commit(batch.id), payload);
      // Invalidate the import batch list cache so purchases page auto-refreshes
      dispatch(apiSlice.util.invalidateTags(["ImportBatch"]) as any);
      setCurrentScreen("SUCCESS");
    } catch (err: any) {
      setErrorText(err.message || "Failed to finalize and commit purchase ledger.");
    } finally {
      setLoading(false);
    }
  };

  // Bulk confirmation helper
  const handleConfirmAllSuggested = () => {
    if (!batch) return;
    (batch.line_items ?? []).forEach((item) => {
      const isSuggested =
        item.match_status === ImportMatchStatus.Suggested ||
        item.match_status === ImportMatchStatus.AutoMatched;

      if (isSuggested && item.matched_product_id) {
        handleItemResolutionChange(item.id, {
          resolved_action: ImportResolvedAction.MatchedExisting,
          resolved_product_id: item.matched_product_id,
          resolved_unit_id: item.resolved_unit_id || "default_unit",
        });
      }
    });
  };

  // Zoom Toolbar handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag Panning events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Compute stats helper
  const getSubtotal = () => {
    return Object.values(itemResolutions).reduce((sum, res) => sum + Number(res.line_total || 0), 0);
  };

  const getUnresolvedCount = () => {
    if (!batch) return 0;
    // Unresolved if resolved_action is missing, or if it is MatchedExisting but resolved_product_id is missing,
    // or if CreatedNew but new_product details aren't filled.
    return (batch.line_items ?? []).filter((item) => {
      const res = itemResolutions[item.id];
      if (!res) return true;
      if (res.resolved_action === ImportResolvedAction.MatchedExisting && !res.resolved_product_id) return true;
      if (res.resolved_action === ImportResolvedAction.CreatedNew && !newProducts[item.id]) return true;
      if (res.resolved_action === ImportResolvedAction.Skipped && !res.expense_category) return true;
      return false;
    }).length;
  };

  // ----------------------------------------------------
  // 1. RENDER UPLOAD SCREEN STATE
  // ----------------------------------------------------
  if (currentScreen === "UPLOAD") {
    return (
      <div className="flex h-[calc(100vh-6rem)] w-full items-center justify-center bg-[#F7F7FB] px-4 font-sans select-none">
        <div className="w-full max-w-[560px] bg-white rounded-xl border border-[#E4E4F0] p-8 shadow-sm flex flex-col gap-6 text-center">
          <div className="space-y-2">
            <h1 className="text-xl lg:text-2xl font-extrabold text-[#151328] tracking-tight">
              {t("imports.upload.title")}
            </h1>
            <p className="text-xs font-semibold text-[#65637D] leading-relaxed max-w-sm mx-auto">
              {t("imports.upload.subtitle")}
            </p>
          </div>

          {/* Dash border drop zone */}
          <div
            onClick={() => document.getElementById("invoice-file")?.click()}
            className="border-2 border-dashed border-[#C7C7E0] hover:border-[#4338CA] bg-[#F7F7FB] rounded-xl py-12 px-6 flex flex-col items-center gap-3 cursor-pointer group transition-all"
          >
            <div className="h-12 w-12 rounded-full bg-white border border-[#E4E4F0] flex items-center justify-center text-[#4338CA] group-hover:scale-105 transition-transform">
              <Upload className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-extrabold text-[#151328] block">
                {t("imports.upload.dropzoneText")}
              </span>
              <span className="text-[10px] font-semibold text-[#65637D]">
                JPG, PNG, PDF or CSV — up to 10MB
              </span>
            </div>
            <input
              id="invoice-file"
              type="file"
              accept="image/*,application/pdf,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </div>

          {/* Secondary Outline Capture Button (For Mobile Cameras) */}
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("invoice-camera")?.click()}
              className="w-full py-5 text-xs font-bold border-[#E4E4F0] text-[#151328] hover:bg-[#F7F7FB] justify-center cursor-pointer flex items-center gap-2"
            >
              <Upload className="h-4 w-4 text-[#4338CA]" />
              {t("imports.upload.takePhoto")}
            </Button>
            <input
              id="invoice-camera"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </div>

          {errorText && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          <span className="text-[10px] font-semibold text-[#65637D] max-w-sm mx-auto">
            {t("imports.upload.guideline")}
          </span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. RENDER PROCESSING & POLLING SCREEN STATE
  // ----------------------------------------------------
  if (currentScreen === "PROCESSING") {
    const isFailed = batch?.status === ImportBatchStatus.Failed;

    return (
      <div className="flex h-[calc(100vh-6rem)] w-full items-center justify-center bg-[#F7F7FB] font-sans">
        {!isFailed ? (
          <div className="flex flex-col items-center text-center gap-5 max-w-sm px-4">
            {/* Pulsing Scan icon */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-white border border-[#E4E4F0] text-[#4338CA] shadow-sm animate-bounce">
              <Receipt className="h-7 w-7" />
              <div className="absolute inset-0 border-2 border-[#4338CA] rounded-xl animate-ping opacity-25" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-extrabold text-[#151328]">
                {t("imports.process.reading")}
              </h2>
              <p className="text-xs font-semibold text-[#65637D] h-4">
                {t("imports.process.extracting")}
              </p>
            </div>

            {/* Indeterminate progress bar */}
            <div className="h-1.5 w-full bg-[#E4E4F0] rounded-full overflow-hidden relative">
              <div className="h-full bg-[#4338CA] w-1/3 rounded-full absolute left-0 top-0 animate-[shimmer_1.5s_infinite_linear] style-shimmer"
                style={{
                  animationName: "shimmer",
                  animationDuration: "1.5s",
                  animationIterationCount: "infinite",
                  animationTimingFunction: "linear"
                }}
              />
            </div>

            <p className="text-[10px] font-semibold text-slate-400 mt-2">
              {t("imports.process.longTime")}
            </p>
          </div>
        ) : (
          /* Failed state card */
          <div className="w-full max-w-[480px] bg-white rounded-xl border border-[#E4E4F0] p-8 text-center shadow-sm flex flex-col gap-5">
            <div className="h-12 w-12 rounded-full bg-red-100 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <XCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-extrabold text-[#151328]">
                {t("imports.process.failedTitle")}
              </h2>
              <p className="text-xs font-semibold text-[#65637D] max-w-sm mx-auto">
                {t("imports.process.failedSubtitle")}
              </p>
            </div>

            <div className="flex gap-3 border-t border-slate-100 pt-5 mt-2">
              <Button
                onClick={() => setCurrentScreen("UPLOAD")}
                className="flex-1 py-5 text-xs font-bold bg-[#FF6B5B] hover:bg-[#E05344] text-white"
              >
                {t("imports.process.tryAgain")}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/store/${storeId}/catalog`)}
                className="flex-1 py-5 text-xs font-bold border-[#E4E4F0] text-[#151328] hover:bg-[#F7F7FB]"
              >
                {t("imports.process.enterManually")}
              </Button>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes shimmer {
            0% { left: -30%; width: 30%; }
            50% { left: 40%; width: 40%; }
            100% { left: 100%; width: 30%; }
          }
        `}</style>
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. RENDER SUCCESS SCREEN STATE
  // ----------------------------------------------------
  if (currentScreen === "SUCCESS") {
    const subtotal = getSubtotal();
    const payables = subtotal - amountPaid;

    return (
      <div className="flex h-[calc(100vh-6rem)] w-full items-center justify-center bg-[#F7F7FB] px-4 font-sans select-none">
        <div className="w-full max-w-[480px] bg-white rounded-xl border border-[#E4E4F0] p-8 text-center shadow-sm flex flex-col gap-6">
          <div className="h-12 w-12 rounded-full bg-[#D1FAE5] border border-[#A7F3D0] flex items-center justify-center mx-auto text-[#047857]">
            <CheckCircle className="h-6 w-6" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg lg:text-xl font-extrabold text-[#151328] tracking-tight">
              {t("imports.success.title")}
            </h1>
            <p className="text-xs text-[#65637D] font-medium leading-relaxed max-w-sm mx-auto">
              {language === "hi" ? (
                <>
                  आइटम इन्वेंटरी में जोड़ दिए गए हैं। कुल बिल{" "}
                  <span className="font-bold text-[#151328]">₹{subtotal.toFixed(2)}</span>.{" "}
                  {payables > 0 && (
                    <>
                      सप्लायर के बकाया खाते (Khata) में{" "}
                      <span className="font-bold text-[#151328]">₹{payables.toFixed(2)}</span> जोड़
                      दिया गया है।
                    </>
                  )}
                </>
              ) : (
                <>
                  Items have been successfully added to stock inventory. Total purchase value was{" "}
                  <span className="font-bold text-[#151328]">₹{subtotal.toFixed(2)}</span>.{" "}
                  {payables > 0 && (
                    <>
                      ₹{payables.toFixed(2)} balance has been added to supplier khata.
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          <div className="flex gap-3 border-t border-slate-100 pt-5">
            <Button
              onClick={() => router.push(`/store/${storeId}/purchases`)}
              className="flex-1 py-5 text-xs font-bold bg-[#FF6B5B] hover:bg-[#E05344] text-white"
            >
              {t("imports.success.viewPurchases")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setBatch(null);
                setErrorText(null);
                setCurrentScreen("UPLOAD");
              }}
              className="flex-1 py-5 text-xs font-bold border-[#E4E4F0] text-[#151328] hover:bg-[#F7F7FB]"
            >
              {t("imports.success.importAnother")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 4. RENDER REVIEW WORKSPACE SPLIT-PANE STATE
  // ----------------------------------------------------
  const subtotalVal = getSubtotal();
  const unresCount = getUnresolvedCount();
  const isFinalizable = unresCount === 0 && selectedSupplierId !== "";

  // Group line items into Attention vs Auto matched
  const attentionItems: ImportLineItem[] = [];
  const autoMatchedItems: ImportLineItem[] = [];

  if (batch) {
    (batch.line_items ?? []).forEach((item) => {
      const res = itemResolutions[item.id];
      const isUnresolved = !res ||
        (res.resolved_action === ImportResolvedAction.MatchedExisting && !res.resolved_product_id) ||
        (res.resolved_action === ImportResolvedAction.CreatedNew && !newProducts[item.id]) ||
        (res.resolved_action === ImportResolvedAction.Skipped && !res.expense_category);

      const isAttention =
        isUnresolved ||
        item.match_status === ImportMatchStatus.Ambiguous ||
        item.match_status === ImportMatchStatus.NoMatch ||
        item.flagged_reason !== null;

      if (isAttention) {
        attentionItems.push(item);
      } else {
        autoMatchedItems.push(item);
      }
    });
  }

  const supplierOptions = suppliers.map((sup) => ({
    value: sup.id,
    label: sup.phone ? `${sup.name} (${sup.phone})` : sup.name,
  }));

  return (
    <div className="flex flex-col lg:h-[calc(100vh-6rem)] lg:overflow-hidden bg-[#F7F7FB] font-sans -mx-4 -my-4 lg:-mx-8 lg:-my-8">
      {/* ----------------- REVIEW TOP BAR ----------------- */}
      <header className="sticky top-0 bg-white border-b border-[#E4E4F0] px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-30 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/store/${storeId}/purchases`)}
            className="rounded-lg p-1.5 text-[#65637D] hover:bg-[#F7F7FB] hover:text-[#151328] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-extrabold text-[#151328] tracking-tight leading-none">
              {t("imports.review.title")}
            </h1>
            <span className="text-[10px] text-[#65637D] font-medium mt-1 inline-block">
              Reviewing AI-extracted data
            </span>
          </div>
        </div>

        {/* Input Parameters */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 w-full md:w-auto">
          {/* Supplier Dropdown */}
          <div className="col-span-2 sm:w-48 text-left z-40">
            <span className="text-[10px] font-bold text-[#65637D] leading-none text-left block mb-1">
              {t("imports.review.supplier")} *
            </span>
            <CreatableSelect
              value={selectedSupplierId}
              onChange={(val) => {
                setSelectedSupplierId(val || "");
                markDirty();
              }}
              options={supplierOptions}
              placeholder={t("imports.review.selectSupplier")}
              onCreateOption={handleSupplierCreatePrompt}
              createLabel={language === "hi" ? "नया सप्लायर जोड़ें / Add Supplier" : "Add Supplier"}
            />
          </div>

          {/* Bill No Input */}
          <div className="col-span-1 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-[#65637D] leading-none text-left block mb-1">
              {t("imports.review.billNo")}
            </span>
            <input
              type="text"
              value={billNo}
              onChange={(e) => {
                setBillNo(e.target.value);
                markDirty();
              }}
              placeholder="Bill No"
              className="h-8.5 w-full sm:w-24 rounded-lg border border-[#E4E4F0] px-2.5 text-xs font-semibold bg-white text-[#151328] focus:border-[#4338CA] outline-none"
            />
          </div>

          {/* Invoice Date */}
          <div className="col-span-1 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-[#65637D] leading-none text-left block mb-1">
              {t("imports.review.date")}
            </span>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => {
                setInvoiceDate(e.target.value);
                markDirty();
              }}
              className="h-8.5 w-full sm:w-32 rounded-lg border border-[#E4E4F0] px-2.5 text-xs font-semibold bg-white text-[#151328] focus:border-[#4338CA] outline-none"
            />
          </div>
        </div>

        {/* Autosave heartbeat status */}
        <div className="flex items-center gap-1.5 text-xs text-[#65637D] font-medium select-none">
          {saveStatus === "saving" && (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#4338CA]" />
              <span>{t("imports.review.saving")}</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
              <span>{t("imports.review.saved")}</span>
            </>
          )}
          {saveStatus === "unsaved" && (
            <>
              <Save className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>{t("imports.review.unsaved")}</span>
            </>
          )}
        </div>
      </header>

      {/* ----------------- MAIN SPLIT PANE ----------------- */}
      <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden relative">

        {/* LEFT PANE - Image viewer (40%) */}
        <div className="hidden lg:flex lg:w-[40%] border-r border-[#E4E4F0] bg-white flex-col overflow-hidden select-none">
          {/* Zoom Controls Overlay Toolbar */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#65637D] flex items-center gap-1">
              <Receipt className="h-3.5 w-3.5 text-slate-400" />
              {t("imports.review.originalInvoice")}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleZoomOut}
                className="h-7 w-7 rounded-lg border border-[#E4E4F0] bg-white text-[#65637D] hover:bg-[#F7F7FB] flex items-center justify-center transition-all outline-none"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold font-mono text-[#65637D] w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="h-7 w-7 rounded-lg border border-[#E4E4F0] bg-white text-[#65637D] hover:bg-[#F7F7FB] flex items-center justify-center transition-all outline-none"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <button
                onClick={handleZoomReset}
                className="h-7 w-7 rounded-lg border border-[#E4E4F0] bg-white text-xs font-bold text-[#4338CA] hover:bg-brand-light flex items-center justify-center transition-all outline-none"
                title="Reset View"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Interactive Image Container */}
          <div
            className="flex-1 bg-slate-800 relative overflow-hidden flex items-center justify-center"
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {batch?.source_image_url ? (
              isCsvFile(batch.source_image_url) ? (
                <div className="text-white text-center flex flex-col items-center gap-4 p-8 select-none">
                  <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400">
                    <FileSpreadsheet className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-extrabold">
                      {t("imports.review.csvUploadedTitle")}
                    </h3>
                    <p className="text-[11px] text-slate-400 max-w-[280px] leading-relaxed mx-auto">
                      {t("imports.review.csvUploadedDesc")}
                    </p>
                  </div>
                  <a
                    href={batch.source_image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="mt-2 h-9 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <Upload className="h-3.5 w-3.5 rotate-180" />
                    {t("imports.review.csvDownloadAction")}
                  </a>
                </div>
              ) : (
                <img
                  src={batch.source_image_url}
                  alt="Uploaded supplier invoice copy"
                  className="max-w-full max-h-full object-contain pointer-events-none select-none transition-transform duration-75 origin-center"
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                  }}
                />
              )
            ) : (
              <div className="text-white text-xs text-center flex flex-col items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-amber-400 animate-pulse" />
                <span>Image failed to load</span>
              </div>
            )}
          </div>

          <div className="px-4 py-2 bg-slate-50 text-[10px] text-[#65637D] border-t border-slate-100 flex items-center justify-between shrink-0 font-medium">
            <span>{t("imports.review.panningInstructions")}</span>
            <span>Uploaded: {batch ? new Date(batch.created_at).toLocaleDateString() : ""}</span>
          </div>
        </div>

        {/* RIGHT PANE - Line Items Review (60%) */}
        <div className="w-full lg:w-[60%] flex-grow lg:flex-1 flex flex-col lg:overflow-hidden bg-[#F7F7FB]">

          {/* Section Header Controls */}
          <div className="px-6 py-3.5 border-b border-[#E4E4F0] bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 shrink-0 select-none">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold text-[#151328]">
                {t("imports.review.lineItems")}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EEF2FF] text-[#4338CA]">
                {batch ? (batch.line_items?.length ?? 0) : 0} {t("imports.review.totalItemsCount")}
              </span>
              {unresCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse border border-amber-200">
                  {unresCount} {t("imports.review.unresolvedCount")}
                </span>
              )}
            </div>

            {batch && (
              <button
                onClick={handleConfirmAllSuggested}
                className="w-full sm:w-auto text-xs font-bold text-[#4338CA] hover:text-[#372f9f] transition-all cursor-pointer border border-[#E4E4F0] rounded-lg px-3 py-2 sm:py-1.5 shadow-2xs hover:bg-[#F7F7FB] flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {t("imports.review.confirmAllSuggested")}
              </button>
            )}
          </div>

          {/* Scrollable list */}
          <div className="lg:flex-1 lg:overflow-y-auto px-4 sm:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">

            {/* 1. NEEDS ATTENTION GROUP */}
            {attentionItems.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block leading-none flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping inline-block" />
                  {t("imports.review.needsAttention")}
                </span>

                <div className="space-y-3.5">
                  {attentionItems.map((item) => {
                    const res = itemResolutions[item.id] || {};
                    const isEditing = editingLineId === item.id;
                    const candidates = item.candidate_matches || [];

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "bg-[#FFFBEB] border border-amber-200 rounded-xl p-3 sm:p-4 space-y-3 sm:space-y-4 hover:shadow-xs transition-shadow relative overflow-hidden",
                          item.flagged_reason && "border-red-200 bg-red-50/20"
                        )}
                      >
                        {/* Upper row: raw description and inline double-click editing */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 text-left">
                            <span className="text-xs text-slate-400 font-mono font-bold leading-none block mb-1">
                              Line #{item.line_number}
                            </span>

                            {isEditing ? (
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleRematch(item.id, editingText);
                                    setEditingLineId(null);
                                  }
                                }}
                                onBlur={() => {
                                  if (editingText !== item.raw_description) {
                                    handleRematch(item.id, editingText);
                                  }
                                  setEditingLineId(null);
                                }}
                                className="w-full text-sm font-bold text-[#151328] bg-white border border-[#4338CA] rounded px-2 py-0.5 outline-none"
                                autoFocus
                              />
                            ) : (
                              <div
                                onDoubleClick={() => {
                                  setEditingLineId(item.id);
                                  setEditingText(item.raw_description);
                                }}
                                className="group/desc flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 rounded px-1.5 py-0.5 -ml-1.5 transition-colors"
                                title="Double-click to edit description"
                              >
                                <span className="text-sm font-extrabold text-[#151328]">
                                  {item.raw_description}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium opacity-0 group-hover/desc:opacity-100 transition-opacity">
                                  ✎ Double-click
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div className="shrink-0 flex flex-col items-end gap-1.5">
                            {item.match_status === ImportMatchStatus.Ambiguous && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FEF3C7] text-[#B45309]">
                                Ambiguous
                              </span>
                            )}
                            {item.match_status === ImportMatchStatus.NoMatch && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-700">
                                No Match
                              </span>
                            )}
                            {item.flagged_reason && (
                              <div className="flex flex-col items-end">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-red-100 text-red-700 border border-red-200">
                                  <AlertCircle className="h-3 w-3" />
                                  Flagged Rate Conflict
                                </span>
                                <span className="text-[8px] text-red-500 font-semibold mt-0.5 text-right max-w-[150px] leading-tight">
                                  Rate changed from original. Verify.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Middle row: edit quantity, rate and amount values */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 border-y border-slate-200/50 py-2 sm:py-3 bg-white/40 -mx-3 px-3 sm:-mx-4 sm:px-4 select-none">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Qty {(() => {
                                const symbol = units.find((u) => u.id === res.resolved_unit_id)?.symbol || item.raw_unit_text;
                                return symbol ? <span className="text-[#4338CA] font-extrabold normal-case">({symbol})</span> : null;
                              })()}
                            </span>
                            <input
                              type="number"
                              value={res.quantity || ""}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : 0;
                                handleItemResolutionChange(item.id, {
                                  quantity: val,
                                  line_total: val * (res.unit_cost || 0),
                                });
                              }}
                              onWheel={(e) => e.currentTarget.blur()}
                              className="h-8 w-full border border-[#E4E4F0] bg-white rounded-lg px-2 text-xs font-mono font-bold text-[#151328]"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Cost (₹)
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={res.unit_cost || ""}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : 0;
                                handleItemResolutionChange(item.id, {
                                  unit_cost: val,
                                  line_total: (res.quantity || 0) * val,
                                });
                              }}
                              onWheel={(e) => e.currentTarget.blur()}
                              className="h-8 w-full border border-[#E4E4F0] bg-white rounded-lg px-2 text-xs font-mono font-bold text-[#151328]"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Total (₹)
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={res.line_total || ""}
                              onChange={(e) => {
                                const val = e.target.value ? Number(e.target.value) : 0;
                                handleItemResolutionChange(item.id, {
                                  line_total: val,
                                });
                              }}
                              onWheel={(e) => e.currentTarget.blur()}
                              className="h-8 w-full border border-[#E4E4F0] bg-white rounded-lg px-2 text-xs font-mono font-bold text-[#151328]"
                            />
                          </div>
                        </div>

                        {/* Bottom Row Actions / Resolutions */}
                        <div className="space-y-3">
                          {/* 1. If ambiguous: render candidate matching chips */}
                          {item.match_status === ImportMatchStatus.Ambiguous && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-extrabold text-[#65637D] uppercase tracking-wider block text-left">
                                {t("imports.review.ambiguousPrompt")}
                              </span>
                              <div className="flex flex-wrap gap-2 justify-start">
                                {candidates.map((cand) => {
                                  const isSelected = res.resolved_product_id === cand.product_id &&
                                    res.resolved_action === ImportResolvedAction.MatchedExisting;
                                  return (
                                    <button
                                      key={cand.product_id}
                                      type="button"
                                      onClick={() => {
                                        handleItemResolutionChange(item.id, {
                                          resolved_action: ImportResolvedAction.MatchedExisting,
                                          resolved_product_id: cand.product_id,
                                        });
                                      }}
                                      className={cn(
                                        "px-3 py-1.5 text-xs font-extrabold rounded-full border bg-white transition-all cursor-pointer flex items-center gap-1.5",
                                        isSelected
                                          ? "border-[#4338CA] bg-brand-light/30 text-[#4338CA] shadow-2xs"
                                          : "border-[#E4E4F0] text-[#65637D] hover:border-slate-400"
                                      )}
                                    >
                                      <span>{cand.name}</span>
                                      <span className="text-[10px] font-bold opacity-60">
                                        {Math.round(cand.score * 100)}%
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 2. If No Match or general actions buttons */}
                          <div className="flex gap-2 justify-start select-none pt-1 w-full">
                            {/* Resolve button for ambiguous when selected */}
                            {res.resolved_action === ImportResolvedAction.MatchedExisting && res.resolved_product_id && (
                              <span className="text-xs font-extrabold text-[#047857] flex items-center gap-1 py-1 mr-2 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 shrink-0">
                                <Check className="h-4 w-4" />
                                {t("imports.review.linked")}
                              </span>
                            )}

                            {/* Create New Product button */}
                            <Button
                              type="button"
                              onClick={() => setSelectedLineForProduct(item)}
                              variant="outline"
                              className={cn(
                                "flex-1 h-8 px-1.5 sm:px-3.5 border-dashed border-[#C7C7E0] text-[#4338CA] hover:border-[#4338CA] hover:bg-brand-light/20 flex items-center justify-center gap-1 text-[10px] sm:text-xs whitespace-nowrap",
                                (res.resolved_action === ImportResolvedAction.CreatedNew && newProducts[item.id]) && "bg-emerald-50 border-emerald-500 border-solid text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 hover:border-emerald-600"
                              )}
                            >
                              {(res.resolved_action === ImportResolvedAction.CreatedNew && newProducts[item.id]) ? (
                                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              ) : (
                                <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              )}
                              {(res.resolved_action === ImportResolvedAction.CreatedNew && newProducts[item.id])
                                ? t("imports.review.productDetailsFilled")
                                : t("imports.review.createProduct")}
                            </Button>

                            {/* Route to Expense action (Skip) */}
                            <Button
                              type="button"
                              onClick={() => {
                                handleItemResolutionChange(item.id, {
                                  resolved_action: ImportResolvedAction.Skipped,
                                  resolved_product_id: null,
                                });
                              }}
                              variant="outline"
                              className={cn(
                                "flex-1 h-8 px-1.5 sm:px-3.5 border-[#E4E4F0] text-[#65637D] hover:bg-slate-50 flex items-center justify-center gap-1 text-[10px] sm:text-xs whitespace-nowrap",
                                res.resolved_action === ImportResolvedAction.Skipped && "bg-slate-100 border-[#65637D] text-[#151328]"
                              )}
                            >
                              {t("imports.review.routeExpense")}
                            </Button>
                          </div>

                          {/* 3. Expense category selector inline if route selected */}
                          {res.resolved_action === ImportResolvedAction.Skipped && (
                            <div className="p-3.5 rounded-lg border border-[#EEF2FF] bg-[#EEF2FF]/40 space-y-2 text-left">
                              <span className="text-[10px] font-extrabold text-[#4338CA] uppercase tracking-wider block">
                                {t("imports.review.routeExpensePrompt")}
                              </span>
                              <select
                                value={res.expense_category || ""}
                                onChange={(e) => {
                                  handleItemResolutionChange(item.id, {
                                    expense_category: e.target.value as ExpenseCategory,
                                  });
                                }}
                                className="h-8 rounded-lg border border-[#E4E4F0] px-2 text-xs font-semibold bg-white text-[#151328] focus:border-[#4338CA] outline-none"
                              >
                                <option value="">-- Choose Category --</option>
                                <option value={ExpenseCategory.Misc}>Miscellaneous / सामान्य खर्चे</option>
                                <option value={ExpenseCategory.Rent}>Rent / दुकान किराया</option>
                                <option value={ExpenseCategory.Electricity}>Electricity / बिजली बिल</option>
                                <option value={ExpenseCategory.Wages}>Wages / मज़दूरी</option>
                              </select>
                            </div>
                          )}

                          {/* Advanced section for batch expiry details */}
                          <details className="text-left select-none">
                            <summary className="text-[10px] font-extrabold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider cursor-pointer outline-none inline-block">
                              + Advanced Batch & Expiry
                            </summary>
                            <div className="grid grid-cols-2 gap-3 pt-2.5">
                              <Input
                                label="Batch No"
                                value={res.batch_no || ""}
                                onChange={(e) => handleItemResolutionChange(item.id, { batch_no: e.target.value })}
                                placeholder="Optional Batch #"
                                className="h-8 text-xs"
                              />
                              <Input
                                label="Expiry Date"
                                type="date"
                                value={res.expiry_date || ""}
                                onChange={(e) => handleItemResolutionChange(item.id, { expiry_date: e.target.value })}
                                className="h-8 text-xs"
                              />
                            </div>
                          </details>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. AUTO-MATCHED GROUP */}
            {autoMatchedItems.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 block leading-none flex items-center gap-1.5 select-none">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  {language === "hi" ? "ऑटो-मैच (तैयार) / Auto-Matched" : "Auto-Matched (Ready to Confirm)"}
                </span>

                <div className="space-y-2">
                  {autoMatchedItems.map((item) => {
                    const res = itemResolutions[item.id] || {};
                    const isChecked = res.resolved_action === ImportResolvedAction.MatchedExisting && res.resolved_product_id !== null;

                    // Match confidence percentage text
                    const percentText = item.match_confidence ? `${Math.round(item.match_confidence * 100)}% match` : "100% match";

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "bg-white border border-[#E4E4F0] rounded-xl p-3 flex items-center justify-between gap-4 hover:border-emerald-300 transition-all shadow-2xs select-none",
                          !isChecked && "bg-slate-50 border-[#E4E4F0]/60 opacity-70"
                        )}
                      >
                        <div className="text-left space-y-1">
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                            <span className="text-xs text-slate-400 font-mono font-bold">
                              #{item.line_number}
                            </span>
                            <span className="text-xs font-bold text-[#151328]">
                              {item.raw_description}
                            </span>
                            <span className="text-slate-400 font-bold text-[10px]">→</span>
                            <span className="text-xs font-extrabold text-[#4338CA]">
                              {item.candidate_matches?.[0]?.name || "Matched Catalog"}
                            </span>
                          </div>

                          <div className="flex items-center flex-wrap gap-2 text-[10px] text-[#65637D] font-medium font-mono">
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#D1FAE5] text-[#047857]">
                              {percentText}
                            </span>
                            <span>
                              Qty: {res.quantity || 0}{" "}
                              <span className="text-[#4338CA] font-bold">
                                {units.find((u) => u.id === res.resolved_unit_id)?.symbol || item.raw_unit_text || ""}
                              </span>
                            </span>
                            <span>Cost: ₹{(res.unit_cost || 0).toFixed(2)}</span>
                            <span>Total: ₹{(res.line_total || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Confirmation Checkbox */}
                        <div className="shrink-0 flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleItemResolutionChange(item.id, {
                                  resolved_action: ImportResolvedAction.MatchedExisting,
                                  resolved_product_id: item.matched_product_id,
                                  resolved_unit_id: item.resolved_unit_id || "default_unit",
                                });
                              } else {
                                handleItemResolutionChange(item.id, {
                                  resolved_action: ImportResolvedAction.MatchedExisting,
                                  resolved_product_id: null,
                                });
                              }
                            }}
                            className="h-4.5 w-4.5 rounded text-[#4338CA] focus:ring-[#4338CA]/20 border-slate-300 transition-all cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ----------------- BOTTOM EDITING BAR ----------------- */}
          <footer className="sticky bottom-0 bg-white border-t border-[#E4E4F0] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-20 select-none">
            {/* Total breakdown */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto text-left">
              <div className="flex items-center justify-between sm:block border-b sm:border-none pb-2 sm:pb-0 border-slate-100 w-full sm:w-auto">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block leading-none sm:mb-1">
                  {t("imports.review.totalInvoice")}
                </span>
                <span className="text-xl font-extrabold text-[#151328] font-mono">
                  ₹{subtotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Amount Paid input */}
              <div className="flex justify-between items-center sm:flex-col sm:items-start gap-1 w-full sm:w-auto">
                <span className="text-[10px] font-bold text-[#65637D] leading-none text-left">
                  {t("imports.review.paidAmount")}
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="any"
                    value={amountPaid || ""}
                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="h-8.5 w-24 rounded-lg border border-[#E4E4F0] px-2 text-xs font-mono font-bold text-[#151328] bg-white outline-none focus:border-[#4338CA]"
                  />
                  {/* Quick-fill chips */}
                  <button
                    onClick={() => setAmountPaid(subtotalVal)}
                    className="h-7 text-[10px] font-extrabold border border-[#E4E4F0] text-[#4338CA] rounded-md px-2.5 hover:bg-brand-light cursor-pointer transition-colors"
                  >
                    {t("imports.review.full")}
                  </button>
                  <button
                    onClick={() => setAmountPaid(0)}
                    className="h-7 text-[10px] font-extrabold border border-[#E4E4F0] text-[#65637D] rounded-md px-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    {t("imports.review.credit")}
                  </button>
                </div>
              </div>

              {/* Credit warning balance */}
              {subtotalVal - amountPaid > 0 && selectedSupplierId && (
                <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 rounded-md px-2.5 py-1 max-w-full sm:max-w-[200px] leading-tight block">
                  ₹{(subtotalVal - amountPaid).toFixed(2)} balance will be added to Supplier Payable.
                </span>
              )}
            </div>

            {/* CTAs with static helper text */}
            <div className="flex flex-col gap-2.5 w-full md:w-auto">
              {/* {!isFinalizable && (
                <div className="w-full text-center text-[10px] font-extrabold text-[#B45309] bg-amber-50 py-1.5 px-3 rounded border border-amber-200 shadow-2xs self-center md:self-end">
                  {selectedSupplierId === "" 
                    ? t("imports.review.selectSupplierPrompt")
                    : t("imports.review.resolveItemsPrompt").replace("{count}", String(unresCount))}
                </div>
              )} */}

              <div className="flex items-center gap-3 w-full">
                <Button
                  onClick={handleDiscard}
                  variant="outline"
                  className="flex-1 md:flex-none py-5 text-xs font-bold border-[#E4E4F0] text-[#65637D] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  {t("imports.review.discard")}
                </Button>

                <Button
                  onClick={handleCommit}
                  disabled={!isFinalizable || loading}
                  className="flex-1 md:flex-none py-5 text-xs font-extrabold bg-[#FF6B5B] hover:bg-[#E05344] text-white shadow-sm flex items-center justify-center gap-1.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed md:w-44"
                >
                  {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  {t("imports.review.finalizeCommit")}
                </Button>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* CREATE NEW PRODUCT DIALOG MODAL */}
      {selectedLineForProduct && (() => {
        const res = itemResolutions[selectedLineForProduct.id] || {};
        return (
          <CreateProductDialog
            isOpen={selectedLineForProduct !== null}
            onClose={() => setSelectedLineForProduct(null)}
            onSave={handleProductCreateSave}
            initialName={selectedLineForProduct.raw_description}
            initialCostPrice={(res.unit_cost !== undefined && res.unit_cost !== null) ? res.unit_cost : (selectedLineForProduct.raw_rate || 0)}
            existingProduct={newProducts[selectedLineForProduct.id] || null}
          />
        );
      })()}

      {/* CREATE NEW SUPPLIER MODAL */}
      {supplierModalOpen && (
        <AddContactDialog
          isOpen={supplierModalOpen}
          onClose={() => setSupplierModalOpen(false)}
          partyType="supplier"
          onSuccess={handleSupplierSuccess}
          initialName={newSupplierName}
        />
      )}
    </div>
  );
}
