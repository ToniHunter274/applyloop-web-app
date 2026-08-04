import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFilter,
  FiMoreHorizontal,
  FiSearch,
  FiX,
} from 'react-icons/fi';

const toneClasses = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  red: 'bg-rose-50 text-rose-700 border-rose-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  purple: 'bg-violet-50 text-violet-700 border-violet-100',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
};

export const Card = ({ children, className = '', padded = true }) => (
  <section className={`rounded-xl border border-slate-200 bg-white shadow-none ${padded ? 'p-4 lg:p-[18px]' : ''} ${className}`}>
    {children}
  </section>
);

export const SectionHeading = ({ title, subtitle, action }) => (
  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-[14px] font-semibold text-slate-950">{title}</h2>
      {subtitle && <p className="mt-1 text-[10px] text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Badge = ({ children, tone, className = '' }) => {
  const normalized = String(children || '').toLowerCase();
  let resolved = tone;
  if (!resolved) {
    if (/active|approved|offered|completed|resolved|submitted|confirmed|low/.test(normalized)) resolved = 'green';
    else if (/rejected|critical|overdue|past due|blocked|high/.test(normalized)) resolved = 'red';
    else if (/pending|revision|medium|capacity|paused|investigating/.test(normalized)) resolved = 'amber';
    else if (/review|interview|progress|draft/.test(normalized)) resolved = 'blue';
    else resolved = 'gray';
  }
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-[4px] border px-2 py-1 text-[9px] font-medium ${toneClasses[resolved] || toneClasses.gray} ${className}`}>
      {children}
    </span>
  );
};

export const Avatar = ({ name = 'ApplyLoop User', size = 'md' }) => {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  const sizes = { sm: 'h-7 w-7 text-[9px]', md: 'h-8 w-8 text-[10px]', lg: 'h-10 w-10 text-[11px]' };
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 font-bold text-white ${sizes[size] || sizes.md}`}>
      {initials}
    </span>
  );
};

export const StatCard = ({ label, value, change, icon: Icon, tone = 'blue', note }) => {
  const positive = !String(change || '').trim().startsWith('-');
  const iconTone = toneClasses[tone] || toneClasses.blue;
  return (
    <Card className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">{label}</p>
          <p className="mt-3 text-[21px] font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        {Icon && <span className={`rounded-lg border p-2 ${iconTone}`}><Icon className="h-4 w-4" /></span>}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px]">
        {change && (
          <span className={`inline-flex items-center gap-1 font-semibold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {positive ? <FiArrowUpRight /> : <FiArrowDownRight />}{change}
          </span>
        )}
        {note && <span className="truncate text-slate-400">{note}</span>}
      </div>
    </Card>
  );
};

export const ProgressBar = ({ value = 0, label, tone = 'blue' }) => {
  const bars = {
    blue: 'bg-blue-600', green: 'bg-emerald-500', red: 'bg-rose-500', amber: 'bg-amber-500', purple: 'bg-violet-500',
  };
  return (
    <div className="min-w-[90px]">
      {label && <div className="mb-1 flex items-center justify-between text-[9px] text-slate-500"><span>{label}</span><span>{value}%</span></div>}
      <div className="h-[6px] overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bars[tone] || bars.blue}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
};

export const Sparkline = ({ values = [], height = 90 }) => {
  const points = useMemo(() => {
    if (!values.length) return '';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return values.map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 90 - ((value - min) / range) * 68;
      return `${x},${y}`;
    }).join(' ');
  }, [values]);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full" style={{ height }} aria-label="Trend chart">
      <defs>
        <linearGradient id="sparkGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={`0,100 ${points} 100,100`} fill="url(#sparkGradient)" stroke="none" />
      <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2.3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const BarChart = ({ values = [], labels = [] }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-44 items-end gap-2.5 pt-4">
      {values.map((value, index) => (
        <div key={`${value}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="group relative flex h-36 w-full items-end rounded-lg bg-slate-50 px-1.5">
            <div className="w-full rounded-md bg-blue-600 transition-all group-hover:bg-blue-700" style={{ height: `${Math.max(8, (value / max) * 100)}%` }} />
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white group-hover:block">{value}</span>
          </div>
          <span className="truncate text-[10px] text-slate-400">{labels[index] || index + 1}</span>
        </div>
      ))}
    </div>
  );
};

export const Donut = ({ value = 75, label = 'Complete', sublabel }) => (
  <div className="flex items-center gap-5">
    <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: `conic-gradient(#2563eb ${value * 3.6}deg, #e2e8f0 0deg)` }}>
      <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
        <span className="text-[18px] font-semibold text-slate-950">{value}%</span>
      </div>
    </div>
    <div>
      <p className="font-bold text-slate-900">{label}</p>
      {sublabel && <p className="mt-1 text-[10px] leading-5 text-slate-500">{sublabel}</p>}
    </div>
  </div>
);

export const Toolbar = ({ search, setSearch, filters = [], primaryAction, secondaryAction }) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative block w-full max-w-xl">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, ID, company, or role" className="h-[38px] w-full rounded-[4px] border border-slate-200 bg-white pl-10 pr-4 text-[11px] outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
      </label>
      {filters.map((filter) => (
        <select key={filter.label} value={filter.value} onChange={(event) => filter.onChange(event.target.value)} className="h-[38px] rounded-[4px] border border-slate-200 bg-white px-3 text-[11px] text-slate-600 outline-none focus:border-blue-400">
          <option value="">{filter.label}</option>
          {filter.options.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      ))}
      {filters.length > 0 && <button className="inline-flex h-[38px] items-center justify-center gap-2 rounded-[4px] border border-slate-200 px-3 text-[10px] font-medium text-slate-600 hover:bg-slate-50"><FiFilter /> Filters</button>}
    </div>
    <div className="flex items-center gap-2">
      {secondaryAction}
      {primaryAction}
    </div>
  </div>
);

export const DataTable = ({ columns, rows, empty = 'No records found.', rowKey = 'id', onRowClick, pageSize = 7 }) => {
  const [page, setPage] = useState(1);
  const rowSignature = rows.map((row) => row[rowKey]).join('|');

  useEffect(() => {
    setPage(1);
  }, [rowSignature]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((column) => <th key={column.key} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-[0.06em] text-slate-500 ${column.className || ''}`}>{column.label}</th>)}
              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row[rowKey]} onClick={() => onRowClick?.(row)} className={`border-b border-slate-100 last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-blue-50/30' : 'hover:bg-slate-50/60'}`}>
                {columns.map((column) => <td key={column.key} className={`px-4 py-3 text-[10px] text-slate-700 ${column.cellClassName || ''}`}>{column.render ? column.render(row[column.key], row) : row[column.key]}</td>)}
                <td className="px-3 py-3"><button onClick={(event) => event.stopPropagation()} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><FiMoreHorizontal /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="px-6 py-14 text-center text-[11px] text-slate-500">{empty}</div>}
      </div>
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500">
        <span>Showing {rows.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, rows.length)} of {rows.length}</span>
        <div className="flex items-center gap-1">
          <button disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><FiChevronLeft /></button>
          <span className="px-3 font-semibold text-slate-700">{safePage} / {totalPages}</span>
          <button disabled={safePage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><FiChevronRight /></button>
        </div>
      </div>
    </div>
  );
};

export const Button = ({ children, variant = 'primary', icon: Icon, className = '', ...props }) => {
  const variants = {
    primary: 'border-blue-700 bg-blue-700 text-white hover:bg-blue-800',
    secondary: 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
    success: 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700',
  };
  return <button className={`inline-flex h-[36px] items-center justify-center gap-2 rounded-[4px] border px-3 text-[10px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{Icon && <Icon className="h-4 w-4" />}{children}</button>;
};

export const ExportButton = () => <Button variant="secondary" icon={FiDownload}>Export</Button>;

export const Modal = ({ open, onClose, title, children, footer, width = 'max-w-xl' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div className={`max-h-[90vh] w-full ${width} overflow-y-auto rounded-xl bg-white shadow-xl`} onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-[14px] font-semibold text-slate-950">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><FiX /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
};

export const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="mb-2 block text-[10px] font-medium text-slate-700">{label}</span>
    {children}
    {hint && <span className="mt-1.5 block text-[9px] text-slate-400">{hint}</span>}
  </label>
);
