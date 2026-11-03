"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type LoadingLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  // Retained for backwards compatibility with existing callers.
  spinnerLabel?: string;
  onClick?: () => void;
};

/**
 * Navigation should remain usable even when a route request is slow,
 * blocked or rejects. The previous component kept a spinner active until
 * the destination pathname changed, which may never happen.
 *
 * Let Next.js Link manage navigation without app-owned pending state.
 */
export default function LoadingLink({
  href,
  children,
  className,
  contentClassName = "inline-flex items-center gap-2",
  style,
  onClick,
}: LoadingLinkProps) {
  return (
    <Link href={href} onClick={onClick} className={className} style={style}>
      <span className={contentClassName}>{children}</span>
    </Link>
  );
}
