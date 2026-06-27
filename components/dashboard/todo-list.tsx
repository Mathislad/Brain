"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

type TodoStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TodoPriority = "LOW" | "MEDIUM" | "HIGH";

interface TodoItem {
  id: string;
  title: string;
  context: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string;
  createdAt: string;
}

const STORAGE_KEY = "brain.working.todos.v1";

const statusColumns: { id: TodoStatus; label: string }[] = [
  { id: "TODO", label: "À faire" },
  { id: "IN_PROGRESS", label: "En cours" },
  { id: "DONE", label: "Terminé" },
];

const priorityLabels: Record<TodoPriority, string> = {
  LOW: "Basse",
  MEDIUM: "Moyenne",
  HIGH: "Haute",
};

const priorityClasses: Record<TodoPriority, string> = {
  LOW: "border-zinc-700 text-zinc-400",
  MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  HIGH: "border-red-500/30 bg-red-500/10 text-red-200",
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as TodoItem[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((todo) => todo.id && todo.title);
  } catch {
    return [];
  }
}

function formatDate(value: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

export function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setTodos(loadTodos());
      setIsLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos, isLoaded]);

  const counts = useMemo(
    () =>
      statusColumns.reduce(
        (acc, column) => ({
          ...acc,
          [column.id]: todos.filter((todo) => todo.status === column.id).length,
        }),
        {} as Record<TodoStatus, number>,
      ),
    [todos],
  );

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setTodos((current) => [
      {
        id: createId(),
        title: trimmedTitle,
        context: context.trim(),
        status: "TODO",
        priority,
        dueDate,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    setTitle("");
    setContext("");
    setPriority("MEDIUM");
    setDueDate("");
  }

  function updateStatus(id: string, status: TodoStatus) {
    setTodos((current) =>
      current.map((todo) => (todo.id === id ? { ...todo, status } : todo)),
    );
  }

  function removeTodo(id: string) {
    setTodos((current) => current.filter((todo) => todo.id !== id));
  }

  return (
    <div className="px-4 py-8 sm:px-8 sm:py-10">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-600">
            Working
          </p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight text-white">
            Todolist
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Liste de tâches pour garder le travail en cours visible.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {statusColumns.map((column) => (
            <div
              key={column.id}
              className="min-w-24 rounded-lg border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <p className="text-lg font-medium text-white">
                {counts[column.id] ?? 0}
              </p>
              <p className="text-[11px] uppercase tracking-wider text-zinc-600">
                {column.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <section className="mb-6 rounded-lg border border-zinc-800/80 bg-zinc-950/60">
        <form
          onSubmit={addTodo}
          className="grid gap-3 p-4 lg:grid-cols-[minmax(260px,1.2fr)_minmax(180px,0.8fr)_150px_150px_auto]"
        >
          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-zinc-500">Tâche</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: finaliser la homepage client"
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-zinc-500">Contexte</span>
            <input
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Client, projet, canal..."
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-zinc-600"
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-zinc-500">Priorité</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TodoPriority)}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
            >
              <option value="LOW">Basse</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Haute</option>
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-xs font-medium text-zinc-500">Échéance</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-white outline-none transition-colors focus:border-zinc-600"
            />
          </label>

          <button
            type="submit"
            className="self-end rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            Ajouter
          </button>
        </form>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {statusColumns.map((column) => {
          const columnTodos = todos.filter((todo) => todo.status === column.id);

          return (
            <section
              key={column.id}
              className="min-h-[360px] rounded-lg border border-zinc-800/80 bg-zinc-950/40"
            >
              <div className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-3">
                <h2 className="text-sm font-medium text-white">{column.label}</h2>
                <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                  {columnTodos.length}
                </span>
              </div>

              <div className="grid gap-3 p-3">
                {columnTodos.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-zinc-800 px-4 py-8 text-sm text-zinc-500">
                    Rien ici pour le moment.
                  </p>
                ) : (
                  columnTodos.map((todo) => (
                    <article
                      key={todo.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-white">
                            {todo.title}
                          </h3>
                          {(todo.context || todo.dueDate) && (
                            <p className="mt-1 text-xs text-zinc-500">
                              {[todo.context, formatDate(todo.dueDate)]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTodo(todo.id)}
                          className="rounded-md px-2 py-1 text-xs text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-red-400"
                        >
                          Retirer
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${priorityClasses[todo.priority]}`}
                        >
                          {priorityLabels[todo.priority]}
                        </span>

                        <select
                          value={todo.status}
                          onChange={(event) =>
                            updateStatus(todo.id, event.target.value as TodoStatus)
                          }
                          className="h-8 rounded-lg border border-zinc-800 bg-zinc-950 px-2 text-xs text-white outline-none transition-colors focus:border-zinc-600"
                        >
                          {statusColumns.map((status) => (
                            <option key={status.id} value={status.id}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
