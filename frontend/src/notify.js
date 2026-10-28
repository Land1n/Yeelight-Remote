import { useEffect, useState } from "react";

// Мини-стор: очередь уведомлений + счётчик выполняемых запросов для индикаторов.
let seq = 0;
let busy = 0;
let toasts = [];
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

export function dismiss(id) {
  toasts = toasts.filter((item) => item.id !== id);
  emit();
}

// kind: info | ok | warn | error
export function notify(text, kind = "info") {
  const id = ++seq;
  toasts = [...toasts.slice(-4), { id, text, kind, time: new Date().toLocaleTimeString() }];
  emit();
  setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4000);
  return id;
}

// Возвращает функцию «готово»: пока запрос в полёте, индикаторы заняты.
export function begin() {
  busy += 1;
  emit();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    busy = Math.max(0, busy - 1);
    emit();
  };
}

export function useNotices() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return { toasts, busy, dismiss };
}
