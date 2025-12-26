"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import RouteLoading from "./RouteLoading";
import ToastProvider from "./ToastProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RouteLoading />
      <ToastProvider />
      {children}
    </AuthProvider>
  );
}

