"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Input, { InputProps } from "./Input";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { formatNumberWithCommas, parseFormattedNumber, numberToWords } from "../utils/numberToWords";

export interface PriceInputProps extends Omit<InputProps, "type" | "value" | "onChange" | "icon" | "iconPosition"> {
  value: string | number;
  onChange: (value: string) => void;
  showWords?: boolean;
}

export default function PriceInput({
  value,
  onChange,
  showWords = true,
  label,
  error,
  helperText,
  validation,
  ...restProps
}: PriceInputProps) {
  // Use local state for immediate display while typing - completely independent
  const [localDisplayValue, setLocalDisplayValue] = useState<string>("");
  const [localNumericValue, setLocalNumericValue] = useState<number>(0);
  const isInitializedRef = useRef(false);
  const lastExternalValueRef = useRef<string | number | null>(null);
  const lastSentValueRef = useRef<string | null>(null);

  // Initialize only once on mount
  useEffect(() => {
    if (!isInitializedRef.current && value) {
      const num = typeof value === "string" ? parseFormattedNumber(value) : value;
      if (!isNaN(num) && num > 0) {
        const finalNum = Math.floor(Math.abs(num));
        setLocalDisplayValue(formatNumberWithCommas(finalNum));
        setLocalNumericValue(finalNum);
        isInitializedRef.current = true;
        lastExternalValueRef.current = value;
      }
    }
  }, []); // Only run on mount

  // Sync only when prop changes externally (not from our onChange)
  useEffect(() => {
    const propValueStr = value?.toString() || "";
    const lastExternalValueStr = lastExternalValueRef.current?.toString() || "";
    const lastSentValueStr = lastSentValueRef.current || "";
    
    // Skip if prop hasn't changed
    if (propValueStr === lastExternalValueStr) {
      return;
    }
    
    // Skip if this is our own change (we just sent this value)
    if (propValueStr === lastSentValueStr) {
      lastExternalValueRef.current = value;
      lastSentValueRef.current = null; // Reset after handling
      return;
    }
    
    // This is an external change, sync it
    const num = typeof value === "string" ? parseFormattedNumber(value) : value;
    if (!isNaN(num) && num > 0) {
      const finalNum = Math.floor(Math.abs(num));
      const formatted = formatNumberWithCommas(finalNum);
      
      setLocalDisplayValue(formatted);
      setLocalNumericValue(finalNum);
      lastExternalValueRef.current = value;
    } else if (value === "" || value === null || value === undefined) {
      // Handle empty value
      setLocalDisplayValue("");
      setLocalNumericValue(0);
      lastExternalValueRef.current = value;
    }
  }, [value]); // Depend on value

  // Use local state for display
  const displayValue = localDisplayValue;
  const numericValue = localNumericValue;

  // Convert Persian/Arabic digits to English digits
  const convertToEnglishDigits = (str: string): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let result = str;
    
    // Convert Persian digits
    persianDigits.forEach((persian, index) => {
      result = result.replace(new RegExp(persian, 'g'), index.toString());
    });
    
    // Convert Arabic digits
    arabicDigits.forEach((arabic, index) => {
      result = result.replace(new RegExp(arabic, 'g'), index.toString());
    });
    
    return result;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Convert Persian/Arabic digits to English first
    const englishInput = convertToEnglishDigits(inputValue);
    
    // Remove all non-digit characters and commas
    let cleaned = englishInput
      .replace(/[^\d]/g, "") // Remove all non-digits
      .replace(/,/g, ""); // Remove commas
    
    // Limit to maximum 12 digits (999,999,999,999)
    if (cleaned.length > 12) {
      cleaned = cleaned.slice(0, 12);
    }
    
    if (cleaned === "") {
      setLocalDisplayValue("");
      setLocalNumericValue(0);
      onChange("");
      return;
    }
    
    // Parse as integer to avoid decimal issues
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num >= 0) {
      // Limit to reasonable maximum (999,999,999,999)
      const maxValue = 999999999999;
      const finalNum = Math.min(num, maxValue);
      const formatted = formatNumberWithCommas(finalNum);
      
      // Update local state immediately for responsive typing
      setLocalDisplayValue(formatted);
      setLocalNumericValue(finalNum);
      
      // Notify parent - but don't sync back from prop if it matches
      const valueToSend = finalNum.toString();
      lastSentValueRef.current = valueToSend; // Mark as our change
      
      // Notify parent
      onChange(valueToSend);
    }
    // If invalid, don't update state (keep previous value)
  };

  const priceValidation = (val: string): string | null => {
    // val is the display value (formatted with commas and possibly Persian digits)
    if (!val || val.trim() === "") {
      return "مبلغ پیشنهادی الزامی است";
    }
    
    // Convert Persian/Arabic digits to English first
    const englishVal = convertToEnglishDigits(val);
    
    // Remove commas and non-digit characters, then parse
    const cleaned = englishVal.replace(/,/g, '').replace(/[^\d]/g, '');
    
    if (cleaned === "") {
      return "مبلغ پیشنهادی الزامی است";
    }
    
    const num = parseInt(cleaned, 10);
    
    if (isNaN(num) || num <= 0) {
      return "مبلغ باید یک عدد مثبت باشد";
    }
    
    if (num < 1000) {
      return "مبلغ باید حداقل 1,000 تومان باشد";
    }
    
    // Run custom validation if provided (pass the numeric value as string)
    if (validation) {
      return validation(num.toString());
    }
    
    return null;
  };

  const priceInWords = numericValue > 0 ? numberToWords(numericValue) + " تومان" : "";

  return (
    <div className="w-full">
      <Input
        {...restProps}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        label={label || "مبلغ پیشنهادی (تومان)"}
        icon={<CurrencyDollarIcon className="w-5 h-5" />}
        iconPosition="start"
        error={error}
        helperText={helperText}
        validation={priceValidation}
        placeholder="مثال: 1,000,000"
        className="text-left font-medium font-display tabular-nums"
        style={{ 
          paddingRight: '30px', 
          paddingLeft: '30px'
        }}
      />
      
      {/* Display price in words */}
      {showWords && numericValue > 0 && priceInWords && (
        <div className="mt-2 px-4 py-2 bg-gradient-to-r from-brand-light-sky to-white rounded-lg border border-brand-medium-blue/20 shadow-sm">
          <p className="text-sm text-brand-dark-blue font-medium font-display">
            <span className="text-brand-medium-blue">مبلغ به حروف: </span>
            <span className="text-brand-dark-blue font-semibold">{priceInWords}</span>
          </p>
        </div>
      )}
    </div>
  );
}
