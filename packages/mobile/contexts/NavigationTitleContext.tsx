import React, { createContext, useContext, useState } from "react";

interface NavigationTitleContextType {
  title: string | null;
  setTitle: (title: string | null) => void;
}

const NavigationTitleContext = createContext<NavigationTitleContextType | undefined>(
  undefined
);

export function NavigationTitleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [title, setTitle] = useState<string | null>(null);

  return (
    <NavigationTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </NavigationTitleContext.Provider>
  );
}

export function useNavigationTitle() {
  const context = useContext(NavigationTitleContext);
  if (context === undefined) {
    throw new Error(
      "useNavigationTitle must be used within a NavigationTitleProvider"
    );
  }
  return context;
}
