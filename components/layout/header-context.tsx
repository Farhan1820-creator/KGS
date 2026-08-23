"use client";

import React, { createContext, useContext, useState, useMemo } from "react";

export interface HeaderState {
  title?: string;
  description?: string;
  category?: string;
  badge?: string;
  action?: React.ReactNode;
}

interface HeaderContextType {
  header: HeaderState;
  setHeader: (state: HeaderState) => void;
  resetHeader: () => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeaderState] = useState<HeaderState>({});

  const setHeader = (state: HeaderState) => {
    setHeaderState(state);
  };

  const resetHeader = () => {
    setHeaderState({});
  };

  const value = useMemo(
    () => ({ header, setHeader, resetHeader }),
    [header]
  );

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>;
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }
  return context;
}
