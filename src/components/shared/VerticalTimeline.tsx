import { useState } from "react";
import type { TimelineEvent } from "@/api/types";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  Factory, 
  ShieldAlert, 
  Package, 
  ChevronRight,
  MapPin,
  Building
} from "lucide-react";

interface VerticalTimelineProps {
  events: TimelineEvent[];
  selectedEventId?: string | null;
  onSelectEvent?: (event: TimelineEvent) => void;
}

export function VerticalTimeline({ events, selectedEventId, onSelectEvent }: VerticalTimelineProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    events[0]?.eventId || null
  );

  const activeId = selectedEventId !== undefined ? selectedEventId : internalSelectedId;

  const handleEventClick = (event: TimelineEvent) => {
    setInternalSelectedId(event.eventId);
    onSelectEvent?.(event);
  };

  const getIcon = (type: string, isSelected: boolean) => {
    switch (type) {
      case "BATCH_CREATED":
      case "BATCH_MANUFACTURED":
        return <Factory className={isSelected ? "w-5 h-5 text-emerald-600" : "w-5 h-5 text-blue-500"} />;
      case "EXPIRY_ALERT":
      case "EXPIRY_WARNING":
      case "BATCH_EXPIRED":
        return <Clock className={isSelected ? "w-5 h-5 text-amber-600" : "w-5 h-5 text-amber-500"} />;
      case "DISPATCHED_TO_DISTRIBUTOR":
      case "DELIVERED_TO_RETAILER":
      case "STOCK_RECEIVED":
      case "RETURN_INITIATED":
      case "DISTRIBUTOR_RECEIVED":
        return <Truck className={isSelected ? "w-5 h-5 text-emerald-600" : "w-5 h-5 text-blue-500"} />;
      case "CONDITION_DENATURED":
      case "DESTRUCTION_SCHEDULED":
      case "DESTRUCTION_COMPLETED":
        return <CheckCircle2 className={isSelected ? "w-5 h-5 text-emerald-600" : "w-5 h-5 text-green-500"} />;
      case "FRAUD_ALERT":
        return <ShieldAlert className={isSelected ? "w-5 h-5 text-red-600" : "w-5 h-5 text-red-500"} />;
      default:
        return <Package className={isSelected ? "w-5 h-5 text-emerald-600" : "w-5 h-5 text-gray-500"} />;
    }
  };

  if (!events || events.length === 0) {
    return <div className="text-xs text-gray-400 p-4 text-center">No timeline events recorded.</div>;
  }

  return (
    <div className="relative border-l-2 border-emerald-100 ml-4 space-y-4 pb-4">
      {events.map((event, index) => {
        const isSelected = activeId === event.eventId;

        return (
          <div
            key={event.eventId}
            onClick={() => handleEventClick(event)}
            className={`relative pl-8 pr-3 py-3 rounded-xl transition-all cursor-pointer group ${
              isSelected 
                ? "bg-emerald-50/80 border border-emerald-200 shadow-sm ring-2 ring-emerald-400/30" 
                : "hover:bg-gray-50/80 border border-transparent"
            }`}
          >
            {/* Timeline node icon */}
            <div
              className={`absolute -left-[17px] top-3.5 p-1 rounded-full border transition-transform group-hover:scale-110 ${
                isSelected 
                  ? "bg-emerald-100 border-emerald-400 ring-4 ring-emerald-100" 
                  : "bg-white border-gray-200"
              }`}
            >
              {getIcon(event.eventType, isSelected)}
            </div>

            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isSelected ? "text-emerald-900 font-mono" : "text-gray-900"}`}>
                    {event.eventType.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    Step {index + 1}
                  </span>
                </div>
                
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  {format(new Date(event.timestamp), "MMM dd, yyyy • HH:mm:ss")}
                </span>
                
                <div className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium text-gray-800 flex items-center gap-1">
                    <Building className="w-3 h-3 text-gray-400" />
                    {event.actor}
                  </span>
                  {event.location && (
                    <span className="text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {event.location}
                    </span>
                  )}
                  {event.quantity && (
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100/70 text-emerald-800">
                      {event.quantity} units
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className={`w-4 h-4 mt-1 transition-transform ${
                isSelected ? "text-emerald-600 translate-x-1" : "text-gray-300 group-hover:text-gray-500"
              }`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
