"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Drawer from "./Drawer";

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  bottomNavItems?: Array<{
    label: string;
    icon: ReactNode;
    href: string;
  }>;
}

export default function MobileLayout({
  children,
  showBottomNav = false,
  bottomNavItems = [],
}: MobileLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const defaultBottomNavItems = [
    {
      label: "خانه",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      href: "/",
    },
    {
      label: "پروژه‌ها",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: "/dashboard",
    },
    {
      label: "پیام‌ها",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      href: "/messages",
    },
    {
      label: "پروفایل",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      href: "/profile",
    },
  ];

  const navItems = bottomNavItems.length > 0 ? bottomNavItems : defaultBottomNavItems;

  return (
    <div className="min-h-screen bg-brand-off-white flex flex-col">


      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>

      {/* Bottom Navigation Bar (Mobile Only) */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-medium-gray z-30 md:hidden">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full text-brand-medium-blue hover:text-brand-dark-blue transition-colors"
              >
                {item.icon}
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

