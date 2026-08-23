"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { Check, X, AlertTriangle, Info, Loader2 } from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      offset={16}
      gap={10}
      visibleToasts={4}
      closeButton
      icons={{
        success: (
          <div className="apple-toast-icon apple-toast-icon-success">
            <Check className="w-3.5 h-3.5 stroke-[3] text-white" />
          </div>
        ),
        error: (
          <div className="apple-toast-icon apple-toast-icon-error">
            <X className="w-3.5 h-3.5 stroke-[3] text-white" />
          </div>
        ),
        warning: (
          <div className="apple-toast-icon apple-toast-icon-warning">
            <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5] text-white" />
          </div>
        ),
        info: (
          <div className="apple-toast-icon apple-toast-icon-info">
            <Info className="w-3.5 h-3.5 stroke-[2.5] text-white" />
          </div>
        ),
        loading: (
          <div className="apple-toast-icon apple-toast-icon-loading">
            <Loader2 className="w-3.5 h-3.5 animate-spin stroke-[2.5] text-white" />
          </div>
        ),
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "apple-toast-item",
          title: "apple-toast-title",
          description: "apple-toast-desc",
          actionButton: "apple-toast-action",
          cancelButton: "apple-toast-cancel",
          closeButton: "apple-toast-close",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
