"use client";

import { InputHTMLAttributes, ReactNode, useState, forwardRef } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: ReactNode;
  iconPosition?: "start" | "end";
  showPasswordToggle?: boolean;
  validation?: (value: string) => string | null;
  onValidationChange?: (isValid: boolean) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      icon,
      iconPosition = "start",
      showPasswordToggle = false,
      validation,
      onValidationChange,
      type = "text",
      className = "",
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    const inputType = type === "password" && showPassword ? "text" : type;
    const displayError = error || internalError;
    const isValid = !displayError && hasInteracted && value && String(value).length > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      
      if (!hasInteracted) {
        setHasInteracted(true);
      }

      // Run validation if provided
      if (validation) {
        const validationError = validation(newValue);
        setInternalError(validationError || null);
        if (onValidationChange) {
          onValidationChange(!validationError);
        }
      }

      if (onChange) {
        onChange(e);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const baseInputClasses = `
      w-full px-4 py-2 
      border rounded-lg 
      bg-white 
      text-brand-dark-blue 
      placeholder:text-brand-medium-gray
      transition-all duration-200
      focus:outline-none
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const stateClasses = displayError
      ? "border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500"
      : isValid
      ? "border-green-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
      : isFocused
      ? "border-brand-medium-blue focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue"
      : "border-brand-medium-gray focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue";

    // Calculate padding based on icons and password toggle
    let inputPadding = "px-4";
    if (icon && iconPosition === "start") {
      inputPadding = "pr-12 pl-4"; // Right padding for start icon (RTL)
    } else if (icon && iconPosition === "end") {
      inputPadding = "pl-12 pr-4"; // Left padding for end icon (RTL)
    }
    
    if (showPasswordToggle && type === "password") {
      // If password toggle exists, add left padding
      if (inputPadding.startsWith("pl-")) {
        // Already has left padding, increase it
        inputPadding = inputPadding.replace(/pl-\d+/, "pl-12");
      } else {
        inputPadding = inputPadding.replace("px-4", "pl-12 pr-4");
      }
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="block text-sm font-medium mb-2 text-brand-dark-blue"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {/* Start Icon */}
          {icon && iconPosition === "start" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-medium-blue pointer-events-none">
              <div className="w-5 h-5 flex items-center justify-center">
                {icon}
              </div>
            </div>
          )}

          <input
            ref={ref}
            type={inputType}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            className={`${baseInputClasses} ${stateClasses} ${inputPadding} ${className}`}
            {...props}
          />

          {/* Password Toggle Icon */}
          {showPasswordToggle && type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-medium-blue hover:text-brand-dark-blue transition-colors focus:outline-none focus:ring-2 focus:ring-brand-medium-blue rounded p-1"
              aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          )}

          {/* End Icon */}
          {icon && iconPosition === "end" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-medium-blue pointer-events-none">
              <div className="w-5 h-5 flex items-center justify-center">
                {icon}
              </div>
            </div>
          )}

          {/* Success Indicator - Only show if no password toggle */}
          {isValid && !displayError && !(showPasswordToggle && type === "password") && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none animate-fade-in">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Helper Text */}
        {helperText && !displayError && (
          <p className="mt-1 text-xs text-brand-medium-blue animate-fade-in">
            {helperText}
          </p>
        )}

        {/* Error Message */}
        {displayError && (
          <p className="mt-1 text-xs text-red-500 animate-fade-in flex items-center gap-1">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{displayError}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

