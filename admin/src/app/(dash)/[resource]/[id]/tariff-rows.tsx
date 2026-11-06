"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { initialFormState } from "@/lib/form-state";
import { FormShell } from "@/components/form";
import { saveTariffRows } from "./tariff-rows-actions";

export type TariffRowValue = { cells: string[]; isHighlighted: boolean };

/**
 * The rows of a price table, edited as a grid that matches the table the
 * public site renders.
 *
 * A generic repeating-fields control would show each row as a stack of
 * labelled inputs, which makes it impossible to see that a column of rates
 * lines up. Here the columns on screen are the columns on the website.
 */
export function TariffRows({
  groupId,
  columns,
  initial,
}: {
  groupId: string;
  columns: string[];
  initial: TariffRowValue[];
}) {
  const width = Math.max(columns.length, 1);
  const [rows, setRows] = useState<TariffRowValue[]>(() =>
    initial.map((row) => ({
      cells: Array.from({ length: width }, (_, i) => row.cells[i] ?? ""),
      isHighlighted: row.isHighlighted,
    })),
  );

  const setCell = (rowIndex: number, cellIndex: number, value: string) =>
    setRows((prev) =>
      prev.map((row, i) =>
        i === rowIndex
          ? { ...row, cells: row.cells.map((cell, j) => (j === cellIndex ? value : cell)) }
          : row,
      ),
    );

  const move = (index: number, delta: number) =>
    setRows((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  if (columns.length === 0) {
    return (
      <p className="notice notice-warn">
        Add the column headings above and save the table first. The rows are laid out to match
        them.
      </p>
    );
  }

  return (
    <FormShell action={saveTariffRows} initialState={initialFormState}>
      <input type="hidden" name="groupId" value={groupId} readOnly />
      <input type="hidden" name="rows" value={JSON.stringify(rows)} readOnly />

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} scope="col">
                  {column}
                </th>
              ))}
              <th scope="col" className="w-24">
                Highlight
              </th>
              <th scope="col" className="w-28 text-right">
                <span className="sr-only">Reorder and remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column, cellIndex) => (
                  <td key={cellIndex}>
                    <input
                      type="text"
                      aria-label={`${column}, row ${rowIndex + 1}`}
                      value={row.cells[cellIndex] ?? ""}
                      onChange={(event) => setCell(rowIndex, cellIndex, event.target.value)}
                      className="input"
                    />
                  </td>
                ))}
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Highlight row ${rowIndex + 1}`}
                    checked={row.isHighlighted}
                    onChange={(event) =>
                      setRows((prev) =>
                        prev.map((r, i) =>
                          i === rowIndex ? { ...r, isHighlighted: event.target.checked } : r,
                        ),
                      )
                    }
                    className="checkbox"
                  />
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => move(rowIndex, -1)}
                      disabled={rowIndex === 0}
                      className="btn btn-ghost btn-sm"
                    >
                      ↑<span className="sr-only">Move row {rowIndex + 1} up</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => move(rowIndex, 1)}
                      disabled={rowIndex === rows.length - 1}
                      className="btn btn-ghost btn-sm"
                    >
                      ↓<span className="sr-only">Move row {rowIndex + 1} down</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRows((prev) => prev.filter((_, i) => i !== rowIndex))}
                      className="btn btn-ghost btn-sm text-danger"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      <span className="sr-only">Remove row {rowIndex + 1}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() =>
          setRows((prev) => [...prev, { cells: Array(width).fill(""), isHighlighted: false }])
        }
        className="btn btn-secondary btn-sm mt-3"
      >
        <Plus size={14} aria-hidden="true" />
        Add row
      </button>
    </FormShell>
  );
}
