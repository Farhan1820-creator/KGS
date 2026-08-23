
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function StatsContainer({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setIsVisible(!isVisible)}
          className="flex items-center gap-2"
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {isVisible ? "Hide Stats" : "Preview Stats"}
        </Button>
      </div>

      {isVisible && (
        <div className="space-y-6">
          {children}
        </div>
      )}
    </div>
  );
}

