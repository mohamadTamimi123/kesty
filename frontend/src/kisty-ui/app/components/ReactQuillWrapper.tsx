"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

// Patch react-dom before react-quill loads
// This patches react-dom's findDOMNode for React 19 compatibility
if (typeof window !== "undefined") {
  // This must run before react-quill is imported
  const ReactDOM = require("react-dom");
  
  // Add findDOMNode polyfill if it doesn't exist
  if (!ReactDOM.findDOMNode) {
    ReactDOM.findDOMNode = function findDOMNode(componentOrElement: any): Element | Text | null {
      if (componentOrElement == null) {
        return null;
      }
      
      // If it's already a DOM node, return it
      if (componentOrElement.nodeType === 1 || componentOrElement.nodeType === 3) {
        return componentOrElement;
      }
      
      // If it's a ref object with current property
      if (componentOrElement.current) {
        return findDOMNode(componentOrElement.current);
      }
      
      // Try to access internal React fiber/node
      // This is a simplified polyfill - react-quill may need more
      return null;
    };
    
    // Also patch default export
    if (ReactDOM.default && !ReactDOM.default.findDOMNode) {
      ReactDOM.default.findDOMNode = ReactDOM.findDOMNode;
    }
  }
}

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { 
  ssr: false,
});

interface ReactQuillWrapperProps {
  value: string;
  onChange: (value: string) => void;
  modules?: any;
  formats?: string[];
  placeholder?: string;
  theme?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ReactQuillWrapper({
  value,
  onChange,
  modules,
  formats,
  placeholder,
  theme = "snow",
  className,
  style,
}: ReactQuillWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div 
        ref={containerRef}
        className={className}
        style={style}
      >
        <div className="w-full px-4 py-3 border border-brand-medium-gray rounded-xl bg-white min-h-[200px] flex items-center justify-center">
          <p className="text-brand-medium-blue">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={className} style={style}>
      <ReactQuill
        theme={theme}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}

