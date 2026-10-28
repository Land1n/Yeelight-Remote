import { useState } from "react";
import { send } from "../api.js";

// Метка времени для строк журнала консоли.
const time = () => new Date().toLocaleTimeString();

// Разбор строки консоли: "on <ip>", "off <ip>", "bright <ip> 50", "color <ip> #ff0000",
// "temp <ip> 4000", "undo <ip>", "toggle <ip>".
export function parseLine(line) {
  const [word, ip, arg] = line.trim().split(/\s+/);
  if (!word || !ip) {
    throw new Error("формат: команда <ip> [значение]");
  }
  const map = {
    on: () => ({ type: "turn_on", ip }),
    off: () => ({ type: "turn_off", ip }),
    toggle: () => ({ type: "toggle", ip }),
    bright: () => ({ type: "set_brightness", ip, value: Number(arg) }),
    color: () => ({ type: "set_hex", ip, value: (arg ?? "").replace("#", "") }),
    temp: () => ({ type: "set_color_temp", ip, kelvin: Number(arg) }),
  };
  if (word === "undo") {
    return { kind: "undo", ip };
  }
  if (!map[word]) {
    throw new Error(`неизвестная команда: ${word}`);
  }
  return { kind: "command", command: map[word]() };
}

export default function Console() {
  const [line, setLine] = useState("");
  const [log, setLog] = useState([]);
  const [pending, setPending] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const text = line.trim();
    if (!text) return;
    let action;
    try {
      action = parseLine(text);
    } catch (err) {
      setLog((prev) => [...prev, `${time()} ${text} → ${err.message}`]);
      return;
    }
    setLine("");
    setPending(true);
    send(action).then(
      (result) => setLog((prev) => [...prev, `${time()} ${text} → ${result?.message ?? result}`]),
      (err) => setLog((prev) => [...prev, `${time()} ${text} → ошибка: ${err.message}`]),
    ).finally(() => setPending(false));
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Ручной ввод</span>
          <h1>Консоль</h1>
          <p className="lead">Команды вида: on 192.168.1.50, bright 192.168.1.50 50.</p>
        </div>
      </div>

      <section className="card">
        <form className="settings" onSubmit={submit}>
          <label className="field">
            Команда
            <input value={line} onChange={(e) => setLine(e.target.value)} placeholder="on 192.168.1.50" />
          </label>
          <div className="connection-actions">
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending && <span className="spinner" />}
              {pending ? "Выполняется…" : "Выполнить"}
            </button>
            <span className="notice">Ответы приходят в журнал ниже и в уведомления.</span>
          </div>
        </form>
        {log.length === 0 ? (
          <div className="empty">Журнал пуст — выполните команду.</div>
        ) : (
          <pre className="console-output console-output-compact">{log.slice(-50).join("\n")}</pre>
        )}
      </section>
    </>
  );
}
