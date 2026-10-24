"use client";
import { useState, type ReactNode } from "react";
import { DateTime } from "luxon";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { useAnalysis } from "./AnalysisContext";
import "./research.css";

export function Research({
  children,
  kind,
}: {
  children: ReactNode;
  kind: string;
}) {
  return (
    <div className="research-workbench" data-workbench={kind}>
      {children}
    </div>
  );
}
export function Panel({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="research-panel">
      <header>
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}
export function Facts({
  items,
}: {
  items: { label: string; value: ReactNode; note?: string }[];
}) {
  return (
    <dl className="research-facts">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.note && <small>{item.note}</small>}
        </div>
      ))}
    </dl>
  );
}
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { key: T; label: string }[];
  label: string;
}) {
  return (
    <div className="research-tabs" role="group" aria-label={label}>
      {items.map((item) => (
        <button
          type="button"
          key={item.key}
          aria-pressed={value === item.key}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
export function Table({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: ReactNode[][];
}) {
  return (
    <div
      className="research-table"
      tabIndex={0}
      role="region"
      aria-label={caption}
    >
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) =>
                j === 0 ? (
                  <th key={j} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={j}>{cell ?? "—"}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="research-empty">No matching rows in this selection.</p>
      )}
    </div>
  );
}
export function Disclosure({
  title,
  children,
  open = false,
}: {
  title: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="research-disclosure" open={open}>
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}
export function Notes({ items }: { items: readonly string[] }) {
  return (
    <ul className="research-notes">
      {items.map((text, i) => (
        <li key={i}>{text}</li>
      ))}
    </ul>
  );
}
export function Empty({
  text = "Preparing this calculation…",
}: {
  text?: string;
}) {
  return (
    <div className="research-empty" role="status">
      {text}
    </div>
  );
}
export function Meter({
  value,
  max = 100,
  label,
  note,
}: {
  value: number;
  max?: number;
  label: string;
  note?: string;
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="research-meter">
      <div>
        <strong>{label}</strong>
        <span>
          {value.toFixed(1)}
          {max === 100 ? " / 100" : ""}
        </span>
      </div>
      <div className="research-meter-track" aria-hidden="true">
        <i style={{ width: `${percent}%` }} />
      </div>
      {note && <p>{note}</p>}
    </div>
  );
}
export function useResearchCopy() {
  const locale = useLocale();
  return {
    locale,
    hi: locale === "hi",
    L: (en: string, hi: string) => (locale === "hi" ? hi : en),
  };
}
export function useDateLabel() {
  const a = useAnalysis();
  const locale = useLocale();
  return (v: Date | string, time = false) =>
    DateTime.fromJSDate(new Date(v))
      .setZone(a?.zone ?? "Asia/Kolkata")
      .setLocale(locale)
      .toFormat(time ? "dd LLL yyyy · HH:mm" : "dd LLL yyyy");
}
export function EvidenceList({
  items,
}: {
  items: { text: string; points?: number; source?: string }[];
}) {
  return (
    <ul className="research-evidence">
      {items.map((item, i) => (
        <li key={i}>
          <p>{item.text}</p>
          <span>
            {item.source}
            {item.points !== undefined
              ? ` · ${item.points > 0 ? "+" : ""}${item.points}`
              : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
export function Search({
  label,
  onChange,
  value,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <input
      className="research-search"
      type="search"
      value={value}
      placeholder={label}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
export function TopicChips({
  items,
  onSelect,
}: {
  items: string[];
  onSelect: (item: string) => void;
}) {
  const [active, setActive] = useState("");
  return (
    <div className="research-tabs">
      {items.map((item) => (
        <button
          type="button"
          key={item}
          aria-pressed={active === item}
          onClick={() => {
            setActive(item);
            onSelect(item);
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
