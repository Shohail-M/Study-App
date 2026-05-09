import React, { useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useTimetable } from '../hooks/useTimetable';
import type { TimetableEntry } from '../data/db';
import { AddTimetableModal } from '../components/AddTimetableModal';

export const TimetablePage: React.FC = () => {
  const { timetable, deleteEntry } = useTimetable();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sun'];
  const times = ['05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

  const openAddModal = (day?: string, time?: string) => {
    if (day && time) setSelectedSlot({ day, time });
    else setSelectedSlot(null);
    setIsModalOpen(true);
  };

  // Helper to determine if a slot is currently active
  const isCurrentSession = (day: string, timeSlot: string) => {
    const now = new Date();
    const currentDay = ['Sun', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
    if (currentDay !== day) return false;

    const currentH = now.getHours();
    const startH = Number(timeSlot.split(':')[0]);

    // Active if it's currently that hour
    return currentH === startH;
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex justify-between items-end animate-fade-in-up">
        <div>
          <h2 className="text-3xl font-extrabold headline-text text-white">Timetable</h2>
          <p className="text-on-surface-variant mt-2">Plan your week for maximum focus.</p>
        </div>
        <button
          onClick={() => openAddModal()}
          className="px-6 py-3 bg-primary text-on-primary rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Add Class / Session
        </button>
      </div>

      <div className="bg-surface-container-low rounded-2xl border border-white/5 overflow-hidden overflow-x-auto animate-fade-in-up delay-200">
        <div className="min-w-[1000px]">
          {/* Header Row */}
          <div className="grid grid-cols-8 border-b border-white/5 bg-surface-container-highest/30">
            <div className="p-4 bg-surface-container-highest/20"></div>
            {days.map(day => (
              <div key={day} className="p-4 text-center text-xs font-black text-outline uppercase tracking-widest border-l border-white/5">
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="grid grid-cols-8">
            {/* Time labels column */}
            <div className="col-span-1 bg-surface-container-highest/10 border-r border-white/5">
              {times.map(time => (
                <div key={time} className="h-24 p-4 text-xs font-bold text-on-surface-variant flex items-start justify-end border-b border-white/5 opacity-60">
                  {time}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map(day => (
              <div key={day} className="col-span-1 border-r border-white/5 relative">
                {times.map(time => {
                  const isActive = isCurrentSession(day, time);
                  const entry = timetable?.find((e: TimetableEntry) => e.day === day && e.timeSlot === time);

                  return (
                    <div key={`${day}-${time}`} className={`h-24 p-1 border-b border-white/5 relative group transition-colors ${isActive ? 'bg-primary/5' : ''}`}>
                      {entry ? (
                        <div className={`h-full rounded-xl p-2.5 shadow-sm border-l-4 overflow-hidden relative ${entry.color || 'border-primary bg-primary/20'}`}>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-white text-[11px] leading-tight line-clamp-2">{entry.subject}</h4>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-outline hover:text-error"
                            >
                              <span className="material-symbols-outlined text-xs">close</span>
                            </button>
                          </div>
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-tight mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[10px]">location_on</span> {entry.room}
                          </p>
                          {isActive && (
                            <div className="absolute top-1 right-1">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => openAddModal(day, time)}
                          className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-outline hover:text-white transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddTimetableModal
          onClose={() => setIsModalOpen(false)}
          defaultDay={selectedSlot?.day}
          defaultTime={selectedSlot?.time}
        />
      )}
    </DashboardLayout>
  );
};


export default TimetablePage;
