import React from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { UpcomingTasks } from '../components/UpcomingTasks';
import { useTaskManager } from '../hooks/useTaskManager';

export const TasksPage: React.FC = () => {
  const { completedTasks, toggleTask, deleteTask } = useTaskManager();

  return (
    <DashboardLayout>
      <div className="mb-8 animate-fade-in-up">
        <h2 className="text-3xl font-extrabold headline-text text-white">All Tasks</h2>
        <p className="text-on-surface-variant mt-2">Manage your study workflow.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <UpcomingTasks />
        </div>
        
        <div className="animate-fade-in-up delay-200">
          <section className="bg-surface-container-low rounded-2xl p-6 sm:p-8 h-full flex flex-col border border-white/5 opacity-80">
            <h3 className="text-xl font-bold headline-text text-white mb-8 flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">check_circle</span>
              Completed Tasks
            </h3>

            <div className="space-y-4 overflow-y-auto max-h-[500px]">
              {completedTasks.length === 0 ? (
                <div className="text-center py-10 text-on-surface-variant">
                  No completed tasks yet. Keep studying!
                </div>
              ) : (
                completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-surface-container-high transition-all"
                  >
                    <div 
                      onClick={() => toggleTask(task.id)}
                      className="mt-1 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/30"
                    >
                      <span className="material-symbols-outlined text-primary text-xs">done</span>
                    </div>
                    <div className="flex-1 line-through text-on-surface-variant">
                      <h4 className="font-bold mb-1">{task.title}</h4>
                      <p className="text-xs">{task.description}</p>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-error/40 hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TasksPage;
