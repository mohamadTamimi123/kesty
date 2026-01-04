"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { ErrorProvider } from "../contexts/ErrorContext";
import RouteLoading from "./RouteLoading";
import ToastProvider from "./ToastProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ErrorProvider>
        <RouteLoading />
        <ToastProvider />
        {children}
      </ErrorProvider>
    </AuthProvider>
  );
}

