"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store";
import { Toaster } from "sonner";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            {children}
            <Toaster position="top-right" theme="system" richColors />
          </ThemeProvider>
        </SessionProvider>
      </PersistGate>
    </Provider>
  );
}
