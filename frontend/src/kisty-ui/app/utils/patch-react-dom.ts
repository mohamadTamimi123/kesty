/**
 * Global polyfill for ReactDOM.findDOMNode
 * This must be imported before any component that uses react-quill
 */

if (typeof window !== "undefined") {
  // Patch react-dom module before react-quill loads
  const originalRequire = (window as any).require || require;
  
  // Intercept react-dom require
  const Module = require("module");
  const originalRequireFn = Module.prototype.require;
  
  Module.prototype.require = function(id: string) {
    const result = originalRequireFn.apply(this, arguments);
    
    if (id === "react-dom" || id === "react-dom/client") {
      // Patch findDOMNode if it doesn't exist
      if (result && !result.findDOMNode) {
        result.findDOMNode = function findDOMNode(componentOrElement: any): Element | Text | null {
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
          
          return null;
        };
      }
      
      // Also patch default export
      if (result.default && !result.default.findDOMNode) {
        result.default.findDOMNode = result.findDOMNode;
      }
    }
    
    return result;
  };
}

