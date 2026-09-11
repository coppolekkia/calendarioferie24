import React from 'react';
import { format, getDaysInMonth, startOfMonth, isWeekend, getYear, getMonth, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { Person, LeaveRecord, LeaveType, LEAVE_COLORS, LEAVE_DOTS, LEAVE_INITIALS } from '@/types';
import { cn } from '@/lib/utils';

interface MonthTableProps {
  currentDate: Date;
  people: Person[];
  leaves: LeaveRecord;
  activeLeaveType: LeaveType | null;
  editingPersonId: string | null;
  onDayClick?: (personId: string, dateStr: string) => void;
  onUpdatePersonName?: (id: string, name: string) => void;
  onSetEditingPersonId?: (id: string | null) => void;
  onRemovePerson?: (id: string) => void;
  isPrintVersion?: boolean;
  projectName?: string;
  key?: React.Key;
}

export function MonthTable({
  currentDate,
  people,
  leaves,
  activeLeaveType,
  editingPersonId,
  onDayClick,
  onUpdatePersonName,
  onSetEditingPersonId,
  onRemovePerson,
  isPrintVersion = false,
  projectName,
}: MonthTableProps) {
  const daysInMonth = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(getYear(currentDate), getMonth(currentDate), i + 1));

  return (
    <div className={cn(
      "overflow-hidden flex flex-col",
      isPrintVersion 
        ? "bg-white print:break-after-page print:mb-8 border-slate-200"
        : "bg-white/95 backdrop-blur-sm rounded-[2rem] shadow-sm flex-1 border border-white/50"
    )}>
      {isPrintVersion && (
        <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-3xl font-serif font-bold text-slate-800">
            {projectName || 'Pianificazione Ferie'}
          </h2>
          <div className="text-xl text-slate-500 font-medium capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: it })}
          </div>
        </div>
      )}
      <div className={cn("w-full", isPrintVersion ? "overflow-visible" : "overflow-x-auto")}>
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className={cn(
                "text-left p-4 pl-6 text-slate-500 font-semibold border-b border-r border-slate-100 w-64 min-w-[256px]",
                isPrintVersion ? "bg-white" : "sticky left-0 z-20 bg-white/95 backdrop-blur-sm"
              )}>
                Nome
              </th>
              {days.map(d => (
                <th key={d.toISOString()} className={cn(
                  "p-2 text-center border-b border-r border-slate-100 min-w-[40px]",
                  isWeekend(d) ? "bg-[#f4f6f8]" : "bg-white"
                )}>
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold text-slate-700">{format(d, 'd')}</span>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold">{format(d, 'EE', { locale: it })[0]}</span>
                  </div>
                </th>
              ))}
              <th className={cn(
                "text-center p-4 text-slate-500 font-semibold border-b border-l border-slate-100 min-w-[60px]",
                isPrintVersion ? "bg-white" : "sticky right-0 z-20 bg-white/95 backdrop-blur-sm"
              )}>
                Tot
              </th>
            </tr>
          </thead>
          <tbody>
            {people.map(person => {
              const personLeaves = leaves[person.id] || {};
              
              // Calculate total leaves for current month
              let totalMonthLeaves = 0;
              days.forEach(d => {
                if (personLeaves[format(d, 'yyyy-MM-dd')]) {
                  totalMonthLeaves++;
                }
              });

              return (
                <tr key={person.id} className="group">
                  <td className={cn(
                    "p-3 pl-6 border-b border-r border-slate-100 transition-colors",
                    isPrintVersion ? "bg-white" : "sticky left-0 z-10 bg-white/95 backdrop-blur-sm group-hover:bg-slate-50"
                  )}>
                    <div className="flex items-center gap-3 w-full">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0", person.colorClass)}>
                        {person.name ? person.name.charAt(0).toUpperCase() : ''}
                      </div>
                      
                      {!isPrintVersion && editingPersonId === person.id ? (
                        <input 
                          autoFocus
                          defaultValue={person.name}
                          onBlur={(e) => {
                            onUpdatePersonName?.(person.id, e.target.value);
                            onSetEditingPersonId?.(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdatePersonName?.(person.id, e.currentTarget.value);
                              onSetEditingPersonId?.(null);
                            }
                          }}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:border-[#5B60F6]"
                        />
                      ) : (
                        <span className="font-medium text-slate-800 truncate max-w-[120px] min-h-[20px] flex-1 cursor-text" onClick={() => !isPrintVersion && onSetEditingPersonId?.(person.id)}>
                          {person.name}
                        </span>
                      )}

                      {!isPrintVersion && (
                        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => onSetEditingPersonId?.(person.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => onRemovePerson?.(person.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-slate-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {days.map(d => {
                    const dateStr = format(d, 'yyyy-MM-dd');
                    const leaveType = personLeaves[dateStr];
                    const isWE = isWeekend(d);
                    
                    return (
                      <td 
                        key={dateStr}
                        onClick={() => !isPrintVersion && onDayClick?.(person.id, dateStr)}
                        className={cn(
                          "p-1 border-b border-r border-slate-100 text-center relative",
                          isWE && !leaveType ? "bg-[#f4f6f8]" : "bg-white",
                          !isPrintVersion && !leaveType ? "cursor-pointer hover:bg-slate-50 transition-colors" : ""
                        )}
                      >
                        {leaveType && (
                          <div className={cn(
                            "w-full h-8 rounded-md flex items-center justify-center text-[11px] font-bold shadow-sm transition-transform",
                            !isPrintVersion && "hover:scale-105",
                            LEAVE_COLORS[leaveType]
                          )}>
                            {LEAVE_INITIALS[leaveType]}
                          </div>
                        )}
                        {!isPrintVersion && !leaveType && activeLeaveType && (
                           <div className="absolute inset-1 rounded-md opacity-0 hover:opacity-20 transition-opacity pointer-events-none" 
                                style={{ backgroundColor: LEAVE_DOTS[activeLeaveType].replace('bg-[', '').replace(']', '') }} />
                        )}
                      </td>
                    );
                  })}
                  
                  <td className={cn(
                    "p-4 text-center border-b border-l border-slate-100 font-semibold text-slate-800 transition-colors",
                    isPrintVersion ? "bg-white" : "sticky right-0 z-10 bg-white/95 backdrop-blur-sm group-hover:bg-slate-50"
                  )}>
                    {totalMonthLeaves > 0 ? totalMonthLeaves : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
