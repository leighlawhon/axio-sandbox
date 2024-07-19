
import { Inter } from "next/font/google";
import "./globals.css";
import "./header.css";

import Header from "./components/header";
import { AppStateProvider } from "./components/app-state-provider";
import { ThemeProvider } from "next-themes";
import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>

      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Header title="Axio Sandbox" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
