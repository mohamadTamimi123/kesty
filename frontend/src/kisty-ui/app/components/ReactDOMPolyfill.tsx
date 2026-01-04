"use client";

/**
 * Global polyfill for ReactDOM.findDOMNode
 * This must run immediately (not in useEffect) to patch react-dom before react-quill loads
 */

if (typeof window !== "undefined") {
  try {
    const ReactDOM = require("react-dom");
    
    // Create findDOMNode polyfill
    const findDOMNodePolyfill = function findDOMNode(componentOrElement: any): Element | Text | null {
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
      // This is a simplified polyfill
      return null;
    };
    
    // Patch named export
    if (!ReactDOM.findDOMNode) {
      ReactDOM.findDOMNode = findDOMNodePolyfill;
    }
    
    // Patch default export
    if (ReactDOM.default) {
      if (!ReactDOM.default.findDOMNode) {
        ReactDOM.default.findDOMNode = findDOMNodePolyfill;
      }
    } else {
      // If there's no default, create one
      ReactDOM.default = { ...ReactDOM, findDOMNode: findDOMNodePolyfill };
    }
    
    // Patch the module cache to ensure all imports get the patched version
    const moduleCache = require.cache[require.resolve("react-dom")];
    if (moduleCache && moduleCache.exports) {
      if (!moduleCache.exports.findDOMNode) {
        moduleCache.exports.findDOMNode = findDOMNodePolyfill;
      }
      if (moduleCache.exports.default) {
        if (!moduleCache.exports.default.findDOMNode) {
          moduleCache.exports.default.findDOMNode = findDOMNodePolyfill;
        }
      } else {
        moduleCache.exports.default = { ...moduleCache.exports, findDOMNode: findDOMNodePolyfill };
      }
    }
  } catch (e) {
    console.warn("Failed to patch ReactDOM.findDOMNode:", e);
  }
}

export default function ReactDOMPolyfill() {
  // This component does nothing, the polyfill runs at module load time
  return null;
}

