"use client";

import { useEffect, useRef, useState } from "react";
import "react-quill/dist/quill.snow.css";
import ReactQuillWrapper from "./ReactQuillWrapper";

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  label,
  error,
  helperText,
  placeholder = "متن خود را بنویسید...",
  className = "",
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Configure toolbar with requested features
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "list",
    "bullet",
    "link",
  ];

  // Custom styles for RTL and brand colors
  useEffect(() => {
    if (isMounted && typeof document !== "undefined") {
      const style = document.createElement("style");
      style.textContent = `
        .quill {
          direction: rtl;
        }
        .ql-container {
          font-family: inherit;
          font-size: 1rem;
          direction: rtl;
          text-align: right;
        }
        .ql-editor {
          min-height: 200px;
          direction: rtl;
          text-align: right;
          color: #1e3a5f;
        }
        .ql-editor.ql-blank::before {
          right: 15px;
          left: auto;
          color: #94a3b8;
          font-style: normal;
        }
        .ql-toolbar {
          border-top-right-radius: 0.75rem;
          border-top-left-radius: 0.75rem;
          border-bottom: 1px solid #cbd5e1;
          background: #f8fafc;
          direction: rtl;
        }
        .ql-container {
          border-bottom-right-radius: 0.75rem;
          border-bottom-left-radius: 0.75rem;
        }
        .ql-toolbar .ql-stroke {
          stroke: #475569;
        }
        .ql-toolbar .ql-fill {
          fill: #475569;
        }
        .ql-toolbar button:hover,
        .ql-toolbar button.ql-active {
          color: #2563eb;
        }
        .ql-toolbar button:hover .ql-stroke,
        .ql-toolbar button.ql-active .ql-stroke {
          stroke: #2563eb;
        }
        .ql-toolbar button:hover .ql-fill,
        .ql-toolbar button.ql-active .ql-fill {
          fill: #2563eb;
        }
        .ql-editor.ql-blank::before {
          content: attr(data-placeholder);
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [isMounted]);

  if (!isMounted) {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
            {label}
          </label>
        )}
        <div className="w-full px-4 py-3 border border-brand-medium-gray rounded-xl bg-white min-h-[200px] flex items-center justify-center">
          <p className="text-brand-medium-blue">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium mb-2 text-brand-dark-blue">
          {label}
        </label>
      )}

      <div className="relative">
        <ReactQuillWrapper
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className={`${error ? "border-red-500" : "border-brand-medium-gray"} rounded-xl`}
          style={{
            border: error ? "1px solid #ef4444" : "1px solid #cbd5e1",
          }}
        />
      </div>

      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-1 text-xs text-brand-medium-blue animate-fade-in">
          {helperText}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <p
          role="alert"
          className="mt-1 text-xs text-red-500 animate-fade-in flex items-center gap-1"
        >
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
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

