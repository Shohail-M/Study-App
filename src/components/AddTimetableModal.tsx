import React, { useState } from 'react';
import { useTimetable } from '../hooks/useTimetable';

interface AddTimetableModalProps {
  readonly onClose: () => void;
  readonly defaultDay?: string;
  readonly defaultTime?: string;
}

export const AddTimetableModal: React.FC<AddTimetableModalProps> = ({ onClose, defaultDay, defaultTime }) => {
  const { addEntry } = useTimetable();
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [day, setDay] = useState(defaultDay || 'Monday');
  const [timeSlot, setTimeSlot] = useState(defaultTime || '09:00');
  const [color, setColor] = useState('border-primary bg-primary/20');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sun'];
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  
  const colors = [
    { label: 'Blue', value: 'border-primary bg-primary/20' },
    { label: 'Purple', value: 'border-tertiary bg-tertiary/20' },
    { label: 'Green', value: 'border-success bg-success/20' },
    { label: 'Orange', value: 'border-orange-400 bg-orange-400/20' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    await addEntry({
      day,
      timeSlot,
      subject: subject.trim(),
      room: room.trim() || 'Online',
      color
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-surface-container-high rounded-3xl p-8 border border-white/10 shadow-2xl animate-scale-in">
        <h2 className="text-2xl font-bold text-white mb-6">Add Schedule Entry</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-outline uppercase tracking-widest mb-2 block">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-surface-container border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. Advanced Calculus"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-outline uppercase tracking-widest mb-2 block">Room / Location</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full bg-surface-container border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="e.g. Room 402"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-outline uppercase tracking-widest mb-2 block">Day</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full bg-surface-container border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-outline uppercase tracking-widest mb-2 block">Time</label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full bg-surface-container border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {times.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-outline uppercase tracking-widest mb-3 block">Label Color</label>
            <div className="flex gap-3">
              {colors.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${c.value.split(' ')[1]} ${color === c.value ? 'border-white scale-110' : 'border-transparent opacity-60'}`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold mt-4 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            Save to Timetable
          </button>
        </form>
      </div>
    </div>
  );
};
