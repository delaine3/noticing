"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CSSProperties,
  MouseEvent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import Spinner from "./Spinner";

type LoadingLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
  spinnerLabel?: string;
  onClick?: () => void;
};

export default function LoadingLink({
  href,
  children,
  className,
  contentClassName = "inline-flex items-center gap-2",
  style,
  spinnerLabel = "Opening page",
  onClick,
}: LoadingLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return;
    }

    if (href === pathname) {
      onClick?.();
      setLoading(false);
      return;
    }

    event.preventDefault();
    onClick?.();
    setLoading(true);
    router.push(href);
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={loading}
      className={className}
      style={style}
    >
      <span className={contentClassName}>
        {loading && (
          <span className="mb-2 inline-flex items-center gap-2">
            <Spinner label={spinnerLabel} />
          </span>
        )}

        {children}
      </span>
    </Link>
  );
}
