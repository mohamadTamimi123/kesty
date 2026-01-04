"use client";

import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, XMarkIcon, UserIcon } from "@heroicons/react/24/outline";
import apiClient from "../lib/api";

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
}

interface CustomerSearchProps {
  onSelect: (customer: Customer | null) => void;
  selectedCustomer?: Customer | null;
  placeholder?: string;
}

export default function CustomerSearch({
  onSelect,
  selectedCustomer,
  placeholder = "جستجوی مشتری در کیستی...",
}: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If search query is empty, clear results
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Debounce search
    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await apiClient.searchCustomers(searchQuery.trim(), 10);
        setSearchResults(results);
      } catch (error) {
        console.error("Error searching customers:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [searchQuery]);

  const handleSelectCustomer = (customer: Customer) => {
    onSelect(customer);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const handleRemoveCustomer = () => {
    onSelect(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
        جستجوی مشتری در کیستی
        <span className="text-xs text-brand-medium-gray mr-2">(اختیاری)</span>
      </label>
      
      {selectedCustomer ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-1 flex items-center gap-3">
            {selectedCustomer.avatarUrl ? (
              <img
                src={selectedCustomer.avatarUrl}
                alt={selectedCustomer.fullName}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-medium-blue flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-dark-blue">
                {selectedCustomer.fullName}
              </p>
              <p className="text-xs text-brand-medium-gray">{selectedCustomer.phone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveCustomer}
            className="p-1 hover:bg-red-100 rounded-full transition-colors"
            title="حذف انتخاب"
          >
            <XMarkIcon className="w-5 h-5 text-red-600" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-medium-gray" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => {
                if (searchResults.length > 0 || searchQuery.trim()) {
                  setShowResults(true);
                }
              }}
              placeholder={placeholder}
              className="w-full pr-10 pl-4 py-3 border border-brand-medium-gray rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:ring-offset-2 bg-white transition-all"
            />
            {isSearching && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-brand-medium-blue border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {showResults && (searchResults.length > 0 || (searchQuery.trim() && !isSearching)) && (
            <div className="absolute z-50 w-full mt-2 bg-white border border-brand-medium-gray rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full px-4 py-3 hover:bg-brand-off-white transition-colors text-right flex items-center gap-3"
                    >
                      {customer.avatarUrl ? (
                        <img
                          src={customer.avatarUrl}
                          alt={customer.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-medium-blue flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1 text-right">
                        <p className="text-sm font-medium text-brand-dark-blue">
                          {customer.fullName}
                        </p>
                        <p className="text-xs text-brand-medium-gray">{customer.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() && !isSearching ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-brand-medium-gray">
                    مشتری با این مشخصات یافت نشد
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {selectedCustomer && (
        <p className="mt-2 text-xs text-green-600">
          ✓ مشتری انتخاب شده است. می‌توانید درخواست نظر از او داشته باشید.
        </p>
      )}
    </div>
  );
}

