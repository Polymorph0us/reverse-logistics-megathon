import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

interface RiskBadgeProps {
  level: RiskLevel | string;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const getRiskColor = (r: string) => {
    switch (r) {
      case "LOW":
        return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200";
      case "CRITICAL":
        return "bg-red-600 text-white hover:bg-red-700 border-red-700 font-bold";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
    }
  };

  return (
    <Badge variant="outline" className={cn(getRiskColor(level), className)}>
      {level}
    </Badge>
  );
}
