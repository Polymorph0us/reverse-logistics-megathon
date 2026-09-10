import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType = "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "RETURN_INITIATED" | "WITH_DISTRIBUTOR" | "WITH_MANUFACTURER" | "SCHEDULED_FOR_DESTRUCTION" | "DESTROYED" | "CLOSED" | "DISPUTED" | "PENDING" | "RECEIVED" | "COMPLETED" | "UNKNOWN" | "MATCHED" | "DISCREPANCY" | "AWAITING_DISTRIBUTOR" | "RECEIVED_BY_DISTRIBUTOR" | "RECEIVED_MANUFACTURER" | "INITIATED";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case "ACTIVE":
      case "COMPLETED":
      case "MATCHED":
        return "bg-green-100 text-green-800 hover:bg-green-100 border-green-200";
      case "EXPIRING_SOON":
      case "RETURN_INITIATED":
      case "WITH_DISTRIBUTOR":
      case "WITH_MANUFACTURER":
      case "PENDING":
      case "AWAITING_DISTRIBUTOR":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200";
      case "EXPIRED":
      case "DESTROYED":
      case "DISCREPANCY":
      case "DISPUTED":
        return "bg-red-100 text-red-800 hover:bg-red-100 border-red-200";
      case "SCHEDULED_FOR_DESTRUCTION":
      case "RECEIVED":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200";
      case "CLOSED":
      case "UNKNOWN":
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200";
    }
  };

  const formattedStatus = status.replace(/_/g, ' ');

  return (
    <Badge variant="outline" className={cn(getStatusColor(status), className)}>
      {formattedStatus}
    </Badge>
  );
}
