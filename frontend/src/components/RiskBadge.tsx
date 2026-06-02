import { RiskLevel } from "../types";

type RiskBadgeProps = {
  level: RiskLevel | string;
};

export function RiskBadge({ level }: RiskBadgeProps) {
  const styles =
    level === "Alto"
      ? "bg-red-50 text-red-700 border-red-200"
      : level === "Médio"
        ? "bg-orange-50 text-orange-700 border-orange-200"
        : "bg-green-50 text-green-700 border-green-200";

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles}`}>{level}</span>;
}
