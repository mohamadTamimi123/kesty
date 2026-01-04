"use client";

import { useEffect } from "react";

export default function WebVitals() {
  useEffect(() => {
    // Dynamically import web-vitals to avoid build errors if not installed
    import("web-vitals")
      .then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
        // Track Core Web Vitals
        onCLS((metric) => {
          console.log("CLS:", metric);
          // Send to analytics service if needed
          // Example: sendToAnalytics('CLS', metric.value);
        });

        onFID((metric) => {
          console.log("FID:", metric);
          // sendToAnalytics('FID', metric.value);
        });

        onFCP((metric) => {
          console.log("FCP:", metric);
          // sendToAnalytics('FCP', metric.value);
        });

        onLCP((metric) => {
          console.log("LCP:", metric);
          // sendToAnalytics('LCP', metric.value);
        });

        onTTFB((metric) => {
          console.log("TTFB:", metric);
          // sendToAnalytics('TTFB', metric.value);
        });

        onINP((metric) => {
          console.log("INP:", metric);
          // sendToAnalytics('INP', metric.value);
        });
      })
      .catch((error) => {
        // Silently fail if web-vitals is not installed
        // This allows the app to work without the package
        console.warn("web-vitals package not found. Performance monitoring disabled.");
      });
  }, []);

  return null;
}

