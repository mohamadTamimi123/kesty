/**
 * Patched version of react-dom with findDOMNode polyfill
 * This is used as a webpack alias to replace react-dom for react-quill compatibility
 */

import * as ReactDOM from "react-dom";

// Polyfill for findDOMNode (removed in React 19)
if (!ReactDOM.findDOMNode) {
  (ReactDOM as any).findDOMNode = function findDOMNode(componentOrElement: any): Element | Text | null {
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
    
    // Try to find DOM node from React component instance
    // This is a simplified version - react-quill should handle the rest
    return null;
  };
}

export default ReactDOM;
export * from "react-dom";

