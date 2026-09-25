import { useEffect, useRef, useState, type JSX } from "react";

interface RowMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

export function RowMenu({ items }: { items: RowMenuItem[] }): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return (): void => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="More actions"
        className="rounded-sm px-1 text-text-muted opacity-0 group-hover:opacity-100 hover:bg-surface-3 hover:text-text-primary"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-sm border border-surface-3 bg-surface-2 py-1 text-sm shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`block w-full px-3 py-1 text-left hover:bg-surface-3 ${
                item.danger ? "text-status-server-error" : "text-text-primary"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
