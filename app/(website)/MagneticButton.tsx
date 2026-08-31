"use client";

import type { ReactNode, ElementType, ComponentPropsWithoutRef } from "react";

type MagneticProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  strength?: number;
} & ComponentPropsWithoutRef<T>;

/**
 * Clean interactive button wrapper without drag or cursor pull effects.
 */
export default function MagneticButton<T extends ElementType = "a">({
  as,
  children,
  className,
  ...rest
}: MagneticProps<T>) {
  const Comp = (as || "a") as ElementType;

  return (
    <Comp
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}
