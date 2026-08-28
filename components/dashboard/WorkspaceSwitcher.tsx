"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setActiveStoreClient, Store } from "@/lib/features/stores/storesSlice";
import { useGetStoresQuery } from "@/lib/features/stores/storesApi";

interface WorkspaceSwitcherProps {
  onCreateStoreClick: () => void;
}

const AVATAR_COLORS = [
  "bg-indigo-600 text-white",
  "bg-indigo-500 text-white",
  "bg-indigo-400 text-white",
  "bg-violet-600 text-white",
  "bg-blue-600 text-white",
];

export const getAvatarColorClass = (storeId: string) => {
  let hash = 0;
  for (let i = 0; i < storeId.length; i++) {
    hash = storeId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

export function WorkspaceSwitcher({ onCreateStoreClick }: WorkspaceSwitcherProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  
  // Use RTK Query to load stores list
  const { data: stores = [] } = useGetStoresQuery();
  const { activeStore } = useAppSelector((state) => state.stores);
  
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStoreSelect = (storeId: string) => {
    const selected = stores.find((s) => s.id === storeId);
    if (selected) {
      dispatch(setActiveStoreClient(selected));
    }
    setIsOpen(false);
    router.push(`/store/${storeId}`);
  };

  const getStoreInitial = (name: string) => {
    return name.trim().charAt(0).toUpperCase();
  };

  // Safe fallback if activeStore is not set yet
  const currentStoreName = activeStore?.name || "No Store Selected";
  const currentStoreInitial = activeStore ? getStoreInitial(activeStore.name) : "-";
  const currentStoreColor = activeStore ? getAvatarColorClass(activeStore.id) : "bg-slate-100 text-slate-500 border border-[#E4E4F0]";

  return (
    <div className="relative w-full font-sans" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-2.5 rounded-lg border border-[#E4E4F0] bg-transparent hover:bg-[#F7F7FB] transition-all cursor-pointer outline-none text-left"
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className={`flex items-center justify-center h-8 w-8 rounded-md text-sm font-bold shrink-0 ${currentStoreColor}`}>
            {currentStoreInitial}
          </div>
          <span className="text-[14px] font-bold text-[#151328] truncate">
            {currentStoreName}
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-4 w-4 text-[#65637D] shrink-0 ml-1"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-[320px] rounded-xl border border-[#E4E4F0] bg-white p-2 shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Header */}
          <div className="px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wider text-[#65637D]">
            Your Stores
          </div>

          {/* Stores List */}
          <div className="flex flex-col gap-0.5 max-h-[240px] overflow-y-auto mt-1">
            {stores.map((store) => {
              const isActive = activeStore?.id === store.id;
              const isOwner = store.role === "Owner";
              const isManager = store.role === "Manager";

              return (
                <button
                  key={store.id}
                  onClick={() => handleStoreSelect(store.id)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer outline-none ${
                    isActive ? "bg-[#EEF2FF]" : "bg-transparent hover:bg-[#F7F7FB]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Store Avatar */}
                    <div className={`flex items-center justify-center h-7 w-7 rounded-md text-xs font-bold shrink-0 ${getAvatarColorClass(store.id)}`}>
                      {getStoreInitial(store.name)}
                    </div>
                    
                    {/* Store Name and Role */}
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs font-bold text-[#151328] truncate">
                        {store.name}
                      </span>
                      
                      {/* Role Badge */}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#E0E7FF] text-[#4338CA] uppercase">
                        {store.role}
                      </span>
                    </div>
                  </div>

                  {/* Active Store Checkmark */}
                  {isActive && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      stroke="currentColor"
                      className="h-4 w-4 text-[#4338CA] shrink-0"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="h-px bg-[#E4E4F0] my-2" />

          {/* Action Footer */}
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onCreateStoreClick();
              }}
              className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-lg text-left text-xs font-bold text-[#4338CA] hover:bg-[#EEF2FF] transition-colors cursor-pointer outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create New Store
            </button>

            <Link
              href="/dashboard/settings/stores"
              onClick={() => setIsOpen(false)}
              className="flex items-center w-full px-3.5 py-2 rounded-lg text-left text-[11px] font-semibold text-[#65637D] hover:bg-[#F7F7FB] transition-colors cursor-pointer"
            >
              Manage Stores
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
