/**
 * Polyfill for ReactDOM.findDOMNode in React 19+
 * This is needed for react-quill compatibility
 */

if (typeof window !== "undefined") {
  try {
    // Import react-dom
    const ReactDOM = require("react-dom");
    
    // If findDOMNode doesn't exist, create a polyfill
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
        
        // If it's a React component instance, try to find the DOM node
        if (componentOrElement._reactInternalFiber || componentOrElement._reactInternalInstance) {
          const fiber = componentOrElement._reactInternalFiber || componentOrElement._reactInternalInstance;
          if (fiber && fiber.stateNode) {
            return findDOMNode(fiber.stateNode);
          }
        }
        
        // Fallback: try to find the first DOM node in the component
        if (componentOrElement.render) {
          // This is a class component, we can't easily access its DOM node
          // Return null and let react-quill handle the error
          return null;
        }
        
        return null;
      };
    }
    
    // Also patch the default export if it exists
    if (ReactDOM.default && !ReactDOM.default.findDOMNode) {
      ReactDOM.default.findDOMNode = ReactDOM.findDOMNode;
    }
    
    // Patch the module exports
    const originalModule = require.cache[require.resolve("react-dom")];
    if (originalModule && originalModule.exports) {
      if (!originalModule.exports.findDOMNode) {
        originalModule.exports.findDOMNode = ReactDOM.findDOMNode;
      }
      if (originalModule.exports.default && !originalModule.exports.default.findDOMNode) {
        originalModule.exports.default.findDOMNode = ReactDOM.findDOMNode;
      }
    }
  } catch (e) {
    console.warn("Failed to patch react-dom.findDOMNode:", e);
  }
}

