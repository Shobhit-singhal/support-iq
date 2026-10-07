"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Ticket } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import SlaBadge from "./SlaBadge";

export default function TicketTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (tickets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">No tickets found.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {tickets.map((ticket) => {
        const isExpanded = expandedId === ticket._id;
        return (
          <div 
            key={ticket._id} 
            className={`flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all hover:border-slate-600 hover:bg-slate-800/40 cursor-pointer overflow-hidden ${!isExpanded ? 'aspect-square' : 'min-h-[300px]'}`}
            onClick={() => setExpandedId(isExpanded ? null : ticket._id)}
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <StatusBadge status={ticket.status} />
                <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                  {new Date(ticket.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-3 line-clamp-2" title={ticket.subject}>
                {ticket.subject}
              </h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <PriorityBadge priority={ticket.priority} />
                <SlaBadge status={ticket.slaStatus} />
              </div>
              
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-800/60 animate-in fade-in duration-300">
                  <p className="text-xs text-slate-400 mb-1"><span className="font-medium text-slate-300">Category:</span> {ticket.category || "—"}</p>
                  <p className="text-xs text-slate-400 line-clamp-4 mb-4" title={ticket.description}>
                    <span className="font-medium text-slate-300">Description:</span> {ticket.description}
                  </p>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/tickets/${ticket._id}`);
                    }}
                    className="w-full rounded-lg bg-indigo-600/10 text-indigo-400 py-2 text-sm font-medium hover:bg-indigo-600/20 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>
            
            {!isExpanded && (
              <div className="mt-auto pt-4 flex justify-center border-t border-slate-800/30">
                <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">Click to expand</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
