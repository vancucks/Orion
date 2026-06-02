import { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <section className="rounded-lg border border-orion-border bg-white p-5 shadow-soft">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-orion-text">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="h-80">{children}</div>
    </section>
  );
}
