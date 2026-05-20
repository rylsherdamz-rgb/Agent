import { create } from 'zustand';
import { TaskDB } from '../services/database';
import { scheduleTaskReminder, cancelReminder } from '../services/notificationService';
import { v4 as uuid } from 'uuid';
import type { Task, SubTask, Attachment, TaskFilter } from '../types';

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  filter: TaskFilter;
  selectedTask: Task | null;
  error: string | null;

  loadTasks: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  removeSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  addAttachment: (taskId: string, attachment: Attachment) => Promise<void>;
  removeAttachment: (taskId: string, attachmentId: string) => Promise<void>;
  setFilter: (filter: Partial<TaskFilter>) => void;
  selectTask: (task: Task | null) => void;
  getFilteredTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,
  filter: {
    status: 'all',
    priority: 'all',
    tag: null,
    search: '',
    sortBy: 'dueDate',
    sortOrder: 'asc',
    showCompleted: false,
  },
  selectedTask: null,
  error: null,

  loadTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await TaskDB.getAll();
      set({ tasks, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  addTask: async (partial) => {
    const now = Date.now();
    const task: Task = {
      id: uuid(),
      title: partial.title || 'New Task',
      description: partial.description || '',
      status: partial.status || 'pending',
      priority: partial.priority || 'medium',
      dueDate: partial.dueDate || null,
      startDate: partial.startDate || null,
      tags: partial.tags || [],
      subtasks: partial.subtasks || [],
      attachments: partial.attachments || [],
      source: partial.source || 'manual',
      sourceId: partial.sourceId || null,
      isRecurring: partial.isRecurring || false,
      recurrenceRule: partial.recurrenceRule || null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      sortOrder: partial.sortOrder || 0,
    };

    await TaskDB.create(task);

    if (task.dueDate) {
      await scheduleTaskReminder(task);
    }

    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, changes) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const updated = {
      ...task,
      ...changes,
      updatedAt: Date.now(),
      completedAt:
        changes.status === 'completed' ? Date.now() : task.completedAt,
    };

    await TaskDB.update(updated);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
      selectedTask: state.selectedTask?.id === id ? updated : state.selectedTask,
    }));
  },

  deleteTask: async (id) => {
    await TaskDB.delete(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
    }));
  },

  toggleTaskComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await get().updateTask(id, { status: newStatus });
  },

  addSubtask: async (taskId, title) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const subtask: SubTask = {
      id: uuid(),
      taskId,
      title,
      completed: false,
      createdAt: Date.now(),
    };

    const updated = {
      ...task,
      subtasks: [...task.subtasks, subtask],
      updatedAt: Date.now(),
    };

    await TaskDB.update(updated);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      selectedTask: state.selectedTask?.id === taskId ? updated : state.selectedTask,
    }));
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updated = {
      ...task,
      subtasks: task.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      ),
      updatedAt: Date.now(),
    };

    await TaskDB.update(updated);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      selectedTask: state.selectedTask?.id === taskId ? updated : state.selectedTask,
    }));
  },

  removeSubtask: async (taskId, subtaskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updated = {
      ...task,
      subtasks: task.subtasks.filter((s) => s.id !== subtaskId),
      updatedAt: Date.now(),
    };

    await TaskDB.update(updated);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      selectedTask: state.selectedTask?.id === taskId ? updated : state.selectedTask,
    }));
  },

  addAttachment: async (taskId, attachment) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updated = {
      ...task,
      attachments: [...task.attachments, attachment],
      updatedAt: Date.now(),
    };

    await TaskDB.update(updated);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      selectedTask: state.selectedTask?.id === taskId ? updated : state.selectedTask,
    }));
  },

  removeAttachment: async (taskId, attachmentId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updated = {
      ...task,
      attachments: task.attachments.filter((a) => a.id !== attachmentId),
      updatedAt: Date.now(),
    };

    await TaskDB.update(updated);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      selectedTask: state.selectedTask?.id === taskId ? updated : state.selectedTask,
    }));
  },

  setFilter: (partial) => {
    set((state) => ({
      filter: { ...state.filter, ...partial },
    }));
  },

  selectTask: (task) => set({ selectedTask: task }),

  getFilteredTasks: () => {
    const { tasks, filter } = get();
    let result = [...tasks];

    if (filter.status !== 'all') {
      result = result.filter((t) => t.status === filter.status);
    }
    if (filter.priority !== 'all') {
      result = result.filter((t) => t.priority === filter.priority);
    }
    if (filter.tag) {
      result = result.filter((t) => t.tags.includes(filter.tag!));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    if (!filter.showCompleted) {
      result = result.filter((t) => t.status !== 'completed');
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (filter.sortBy) {
        case 'dueDate':
          cmp = (a.dueDate || Infinity) - (b.dueDate || Infinity);
          break;
        case 'priority': {
          const p = { urgent: 4, high: 3, medium: 2, low: 1 };
          cmp = (p[a.priority] || 0) - (p[b.priority] || 0);
          break;
        }
        case 'createdAt':
          cmp = a.createdAt - b.createdAt;
          break;
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
      }
      return filter.sortOrder === 'desc' ? -cmp : cmp;
    });

    return result;
  },
}));