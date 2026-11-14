"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowDownUp, ArrowUp } from "lucide-react";

export interface DataColumn<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number | boolean | null | undefined;
  className?: string;
  sortable?: boolean;
}

function readPath(row: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined, row);
}

function comparable(value: unknown): string | number {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    return /^\d{4}-\d{2}-\d{2}/.test(value) && Number.isFinite(timestamp) ? timestamp : value.toLocaleLowerCase();
  }
  return "";
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  loading = false,
  emptyTitle = "No records found",
  emptyDescription = "Create a record or adjust your filters.",
  onRowClick,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}) {
  const [sort, setSort] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column) return rows;
    return [...rows].sort((a, b) => {
      const left = comparable(column.sortValue ? column.sortValue(a) : readPath(a, column.key));
      const right = comparable(column.sortValue ? column.sortValue(b) : readPath(b, column.key));
      const order = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
      return sort.direction === "asc" ? order : -order;
    });
  }, [rows, columns, sort]);

  function toggleSort(key: string) {
    setSort((current) => current?.key === key
      ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
      : { key, direction: "asc" });
  }

  const visibleColumns = columns.length;
  return <div className="overflow-x-auto">
    <table className="w-full min-w-[720px] border-collapse text-left">
      <thead><tr className="border-b border-[#edf0f5] bg-[#fafbfd] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8995a7]">
        {columns.map((column) => <th key={column.key} className={`whitespace-nowrap px-5 py-3 ${column.className ?? ""}`}>
          {column.sortable === false ? column.label : <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex items-center gap-1.5 rounded-sm text-left outline-none hover:text-[#4c61c1] focus-visible:ring-2 focus-visible:ring-[#8292df]" aria-label={`Sort by ${column.label}`}>
            {column.label}{sort?.key === column.key ? sort.direction === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ArrowDownUp className="size-3 opacity-40" />}
          </button>}
        </th>)}
      </tr></thead>
      <tbody className="divide-y divide-[#f0f2f6]">
        {loading ? Array.from({ length: 5 }, (_, index) => <tr key={`loading-${index}`} className="animate-pulse"><td colSpan={visibleColumns} className="px-5 py-5"><div className="h-5 rounded bg-[#f0f2f6]" /></td></tr>) : sortedRows.length ? sortedRows.map((row) => <tr
          key={row.id}
          onClick={() => onRowClick?.(row)}
          onKeyDown={(event) => { if (onRowClick && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onRowClick(row); } }}
          role={onRowClick ? "link" : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          className={`transition hover:bg-[#fafbfe] ${onRowClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#8292df]" : ""}`}
        >{columns.map((column) => <td key={`${row.id}-${column.key}`} className={`max-w-[320px] px-5 py-3.5 text-xs text-[#53627a] ${column.className ?? ""}`}>
          {column.render ? column.render(row) : String(readPath(row, column.key) ?? "—")}
        </td>)}</tr>) : <tr><td colSpan={visibleColumns} className="px-5 py-16 text-center"><p className="text-sm font-semibold text-[#3d4d67]">{emptyTitle}</p><p className="mt-1 text-xs text-[#8f9aac]">{emptyDescription}</p></td></tr>}
      </tbody>
    </table>
  </div>;
}
