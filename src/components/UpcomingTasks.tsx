import React, { useState } from 'react';
import type { Task } from '../data/mockData';
import { useTaskManager } from '../hooks/useTaskManager';

interface AddTaskModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onAdd: (title: string, description: string, priority: Task['priority'], time: string) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('normal');
  const [time, setTime] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, description, priority, time || 'No time set');
    setTitle('');
    setDescription('');
    setPriority('normal');
    setTime('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-container-high rounded-2xl p-8 w-full max-w-md border border-white/10 shadow-2xl animate-scale-in">
        <h3 className="text-xl font-bold headline-text text-white mb-6">Add New Task</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg py-3 px-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Task title..."
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-container border border-white/10 rounded-lg py-3 px-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Brief description..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                className="w-full bg-surface-container border border-white/10 rounded-lg py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="high">High Priority</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 block">Time</label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-surface-container border border-white/10 rounded-lg py-3 px-4 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="e.g. 3:00 PM"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-white/10 text-on-surface-variant font-bold text-sm hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary-container rounded-lg font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const UpcomingTasks: React.FC = () => {
  const { incompleteTasks, toggleTask, deleteTask, addTask } = useTaskManager();
  const [showModal, setShowModal] = useState(false);

  const priorityStyles: Record<string, string> = {
    high: 'bg-error/10 text-error',
    normal: 'bg-primary/10 text-primary',
    low: 'bg-outline/10 text-outline',
  };

  const priorityLabels: Record<string, string> = {
    high: 'High Priority',
    normal: 'Normal',
    low: 'Low',
  };

  return (
    <aside className="col-span-12 lg:col-span-4 animate-fade-in-up delay-200">
      <section className="bg-surface-container-low rounded-2xl p-6 sm:p-8 h-full flex flex-col border border-white/5">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold headline-text text-white">Upcoming Tasks</h3>
          <button className="text-primary text-sm font-bold hover:underline">View All</button>
        </div>

        <div className="space-y-4 sm:space-y-6 flex-1 overflow-y-auto max-h-[400px]">
          {incompleteTasks.map((task, index) => (
            <div
              key={task.id}
              className={`group flex items-start gap-4 p-4 rounded-lg bg-surface-container-high transition-all hover:-translate-y-1 hover:shadow-lg animate-slide-in-right ${
                task.priority === 'low' ? 'opacity-70' : ''
              }`}
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <div
                onClick={() => toggleTask(task.id)}
                className="mt-1 w-6 h-6 rounded border-2 border-primary flex items-center justify-center cursor-pointer group-hover:bg-primary/10 transition-colors shrink-0"
              >
                <span className="material-symbols-outlined text-transparent group-hover:text-primary text-xs">check</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-white mb-1">{task.title}</h4>
                <p className="text-xs text-on-surface-variant">{task.description}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 font-black uppercase rounded ${priorityStyles[task.priority]}`}>
                    {priorityLabels[task.priority]}
                  </span>
                  <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    {task.time}
                  </span>
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-error/60 hover:text-error shrink-0"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}

          {incompleteTasks.length === 0 && (
            <div className="text-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 block opacity-30">task_alt</span>
              <p className="text-sm">All tasks completed! 🎉</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full mt-8 py-3 rounded-lg border-2 border-dashed border-outline/30 text-outline font-bold text-sm hover:border-primary/50 hover:text-primary transition-all"
        >
          + Add New Task
        </button>
      </section>

      <AddTaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addTask}
      />
    </aside>
  );
};

export default UpcomingTasks;
