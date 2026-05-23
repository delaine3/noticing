"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";
import LoadingLink from "./LoadingLink";

type Props = {
  displayName: string | null;
  userEmail: string | null;
  avatarUrl: string | null;
  initial: string;
  onLogout: () => void;
  showMobileLinks?: boolean;
};

export default function ProfileDropdown({
  displayName,
  userEmail,
  avatarUrl,
  initial,
  onLogout,
  showMobileLinks = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      window.addEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative z-[9999]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded px-3 py-1 text-white hover:bg-white/20"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName ?? "Profile"}
            className="h-8 w-8 rounded object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 font-bold text-[#455411]">
            {initial}
          </div>
        )}
      </button>

      {open && (
        <div className="fixed left-4 right-4 top-20 z-[9999] rounded bg-white p-3 text-[#4a2c14] shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-64 sm:p-2">
          <div className="border-b border-[#4a2c14]/20 px-3 py-2 text-sm">
            <p className="truncate font-semibold">{displayName}</p>
            <p className="truncate text-xs opacity-60">{userEmail}</p>
          </div>

          {showMobileLinks && (
            <div className="border-b border-[#4a2c14]/20 py-2 sm:hidden">
              <LoadingLink
                href="/"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded px-3 py-3 text-sm hover:bg-[#bed582]/40"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </LoadingLink>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-2 rounded px-3 py-3 text-sm hover:bg-[#bed582]/40 sm:py-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
