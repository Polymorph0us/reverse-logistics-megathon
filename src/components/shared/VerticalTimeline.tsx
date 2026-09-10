import type { TimelineEvent } from "@/api/types";
import { format } from "date-fns";
import { CheckCircle2, Clock, AlertTriangle, Truck, Factory, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerticalTimelineProps {
  events: TimelineEvent[];
}

export function VerticalTimeline({ events }: VerticalTimelineProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "BATCH_CREATED":
        return <Factory className="w-5 h-5 text-blue-500" />;
      case "EXPIRY_ALERT":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "RETURN_INITIATED":
      case "DISTRIBUTOR_RECEIVED":
        return <Truck className="w-5 h-5 text-blue-500" />;
      case "DESTRUCTION_COMPLETED":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "FRAUD_ALERT":
        return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative border-l border-gray-200 ml-3 space-y-6 pb-4">
      {events.map((event, idx) => (
        <div key={event.eventId} className="relative pl-8">
          <div className="absolute -left-3.5 bg-white p-1 rounded-full border border-gray-200">
            {getIcon(event.eventType)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900">
              {event.eventType.replace(/_/g, ' ')}
            </span>
            <span className="text-xs text-gray-500 mb-1">
              {format(new Date(event.timestamp), "MMM dd, yyyy HH:mm")}
            </span>
            <div className="text-sm text-gray-700">
              <span className="font-medium text-gray-900">{event.actor}</span>
              {event.location && ` • ${event.location}`}
              {event.quantity && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  Qty: {event.quantity}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
