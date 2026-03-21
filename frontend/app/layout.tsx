
"use client";
import React, { useEffect, useState } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { usePathname } from "next/navigation";

// Theme Integration
import { ThemeProvider } from "next-themes"; 

import Navbar from "@/components/Navbar";
import GlobalAlertBanner from "@/components/GlobalAlertBanner";
import { ToastProvider } from "@/context/ToastContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for Phrelis OS Auth Token
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, [pathname]); 

  const isLoginPage = pathname === "/login";

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-background min-h-screen flex flex-col transition-colors duration-500`}
        suppressHydrationWarning
      >
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark" 
          enableSystem={false}
        >
          <AuthProvider>
            <ToastProvider>
              {!isLoginPage && isAuthenticated && (
                <>
                  <GlobalAlertBanner />
                  <Navbar />
                </>
              )}

              <main className="flex-grow w-full">
                {children}
              </main>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}