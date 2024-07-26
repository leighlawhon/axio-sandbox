
import { Inter } from "next/font/google";
import "./globals.css";
import "./header.css";

import Header from "./components/header";
import { AppStateProvider } from "./components/app-state-provider";
import { ThemeProvider } from "next-themes";
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ChangeEvent, useState } from "react";
import { AuthProvider } from "./components/AuthContext";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }, pageProps: any) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Header />
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child, { ...pageProps });
              }
              return child;
            })}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
