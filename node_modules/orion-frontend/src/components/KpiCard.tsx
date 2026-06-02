import { ReactNode } from "react";

type KpiCardProps = {
  title: string;
  value: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "blue" | "red" | "orange" | "green" | "neutral";
};

const toneMap = {
  blue: "bg-blue-50 text-orion-blue",
  red: "bg-red-50 text-red-600",
  orange: "bg-orange-50 text-orange-600",
  green: "bg-green-50 text-green-600",
  neutral: "bg-slate-100 text-slate-600"
};

export function KpiCard({ title, value, detail, icon, tone = "blue" }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-orion-text">{value}</p>
        </div>
        {icon ? <div className={`rounded-lg p-2.5 ${toneMap[tone]}`}>{icon}</div> : null}
      </div>
      {detail ? <p className="mt-4 text-sm text-slate-500">{detail}</p> : null}
    </div>
  );
}
