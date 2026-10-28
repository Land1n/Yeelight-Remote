import { useEffect, useState } from "react";
import { begin, notify } from "./notify.js";

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

export function getState() {
  return request("/api/state");
}

// Короткая подпись действия для уведомлений: «set_brightness · 192.168.1.50».
export function describe(action) {
  const target = action.ip ?? action.command?.ip ?? action.name ?? action.mode?.name ?? "";
  return [action.command?.type ?? action.kind, target].filter(Boolean).join(" · ");
}

async function deliver(action) {
  const created = await request("/api/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(action),
  });
  for (;;) {
    const item = await request(`/api/actions/${created.id}`);
    if (item.status === "done") {
      return item.result;
    }
    if (item.status === "error") {
      throw new Error(item.result?.error || "Ошибка выполнения");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// Отправляет действие, ждёт результата агента (done/error) и сообщает о каждом шаге.
export async function send(action) {
  const label = describe(action);
  const done = begin();
  const started = Date.now();
  notify(`→ ${label}`, "info");
  try {
    const result = await deliver(action);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    notify(`✓ ${label} · ${result?.message ?? "готово"} · ${seconds} с`, "ok");
    return result;
  } catch (err) {
    notify(`✕ ${label}: ${err.message}`, "error");
    throw err;
  } finally {
    done();
  }
}

export function useManagerState() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    let active = true;
    let offline = false;
    let agentOffline;
    const tick = () =>
      getState()
        .then((data) => {
          if (!active) return;
          if (offline) {
            notify("Связь с сервером восстановлена", "ok");
            offline = false;
          }
          if (agentOffline !== undefined && agentOffline !== data.online) {
            notify(data.online ? "Агент подключился" : "Агент отключился", data.online ? "ok" : "error");
          }
          agentOffline = data.online;
          setState(data);
          setUpdated(new Date());
          setError(null);
        })
        .catch((err) => {
          if (!active) return;
          if (!offline) {
            notify(`Нет связи с сервером: ${err.message}`, "error");
            offline = true;
          }
          setError(err.message);
        });
    tick();
    const timer = setInterval(tick, 1500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return { state, error, updated };
}
