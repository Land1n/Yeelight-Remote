import { useEffect, useRef, useState } from "react";
import Meter from "./Meter.jsx";

const KELVIN_MIN = 1700;
const KELVIN_MAX = 6500;

// props.rgb приходит целым (0..0xffffff) — переводим в три канала.
function toRgb(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return null;
  }
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const parseHex = (value) => /^#?([0-9a-fA-F]{6})$/.exec(String(value).trim())?.[1] ?? null;

// Карточка лампы: питание, ползунки яркости/температуры/RGB, индикаторы и откат.
// Все изменения уходят через onAction (объект действия), логика не меняется.
export default function BulbCard({ bulb, onAction }) {
  const props = bulb.props ?? {};
  const [bright, setBright] = useState(props.bright ?? 50);
  const [kelvin, setKelvin] = useState(props.ct ?? 4000);
  const [rgb, setRgb] = useState(toRgb(props.rgb) ?? { r: 255, g: 255, b: 255 });
  const [hex, setHex] = useState("#ffffff");
  const [pending, setPending] = useState(false);
  const [last, setLast] = useState("ожидание команд");
  const drag = useRef(false);

  const online = Boolean(bulb.online);
  const color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

  // Значения с лампы подтягиваются, но не мешают тянуть ползунок.
  useEffect(() => !drag.current && props.bright != null && setBright(props.bright), [props.bright]);
  useEffect(() => !drag.current && props.ct != null && setKelvin(props.ct), [props.ct]);
  useEffect(() => {
    if (drag.current) return;
    const current = toRgb(props.rgb);
    if (current) setRgb(current);
  }, [props.rgb]);

  const command = (cmd) =>
    runAction({ kind: "command", command: { ...cmd, ip: bulb.ip } });

  const runAction = (action) => {
    setPending(true);
    onAction(action).then(
      (result) => setLast(`✓ ${result?.message ?? "готово"}`),
      (err) => setLast(`✕ ${err.message}`),
    ).finally(() => setPending(false));
  };

  const applyHex = () => {
    const clean = parseHex(hex);
    if (clean) {
      command({ type: "set_hex", value: clean });
    }
  };

  const slide = (setter) => ({
    onPointerDown: () => {
      drag.current = true;
    },
    onPointerUp: () => {
      drag.current = false;
    },
    onChange: (e) => setter(Number(e.target.value)),
  });

  return (
    <article className={`bulb ${pending ? "is-busy" : ""}`}>
      <div className="bulb-info">
        <span className="bulb-ip">
          <span className={`bulb-dot ${online ? "online" : "offline"}`} /> {bulb.ip}
        </span>
        <span className="bulb-state">
          <span className={`pill ${props.power === "on" ? "" : "pill-muted"}`}>
            {props.power === "on" ? "включена" : props.power === "off" ? "выключена" : "нет данных"}
          </span>
          <span className="pill">{props.bright ?? "—"} %</span>
          <span className="pill">{props.ct ?? "—"} K</span>
          <span className="swatch" style={{ background: color }} title={color} />
        </span>
        <span className="bulb-current">
          {props.name ? `${props.name} · ` : ""}
          {last}
        </span>
        <div className="bulb-meters">
          <Meter label="Яркость" value={(bright || 0) / 100} hint={`${bright}%`} />
          <Meter
            label="Температура"
            value={(kelvin - KELVIN_MIN) / (KELVIN_MAX - KELVIN_MIN)}
            hint={`${kelvin} K`}
            fill="linear-gradient(90deg,#ff9d4d,#fff6e8,#bcd8ff)"
          />
        </div>
      </div>

      <div className="settings">
        <div className="connection-actions">
          <button className="btn btn-primary" type="button" onClick={() => command({ type: "turn_on" })}>
            Вкл
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => command({ type: "turn_off" })}>
            Выкл
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => command({ type: "toggle" })}>
            Переключить
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => runAction({ kind: "undo", ip: bulb.ip })}>
            Откатить
          </button>
          {pending && <span className="spinner" title="Ждём ответ агента" />}
        </div>

        <label className="field">
          Яркость: {bright}%
          <input
            className="range-fill"
            style={{ "--fill": `${bright}%` }}
            type="range"
            min="1"
            max="100"
            value={bright}
            {...slide(setBright)}
            onMouseUp={() => command({ type: "set_brightness", value: bright })}
            onTouchEnd={() => command({ type: "set_brightness", value: bright })}
          />
        </label>

        <label className="field">
          Температура: {kelvin} K
          <input
            className="temperature-slider"
            type="range"
            min={KELVIN_MIN}
            max={KELVIN_MAX}
            step="50"
            value={kelvin}
            {...slide(setKelvin)}
            onMouseUp={() => command({ type: "set_color_temp", kelvin })}
            onTouchEnd={() => command({ type: "set_color_temp", kelvin })}
          />
        </label>

        <div className="color-panel">
          <div className="swatch-big" style={{ background: color }}>
            <span>{hex}</span>
          </div>
          <label className="field">
            Цвет
            <input value={hex} onChange={(e) => setHex(e.target.value)} onBlur={applyHex} />
          </label>
          <input type="color" value={`#${parseHex(hex) ?? "ffffff"}`} onChange={(e) => setHex(e.target.value)} onBlur={applyHex} />
          {["r", "g", "b"].map((channel) => (
            <label className="field" key={channel}>
              {channel.toUpperCase()}: {rgb[channel]}
              <input
                className={`range-fill range-${channel}`}
                style={{ "--fill": `${(rgb[channel] / 255) * 100}%` }}
                type="range"
                min="0"
                max="255"
                value={rgb[channel]}
                onPointerDown={() => {
                  drag.current = true;
                }}
                onChange={(e) => setRgb({ ...rgb, [channel]: Number(e.target.value) })}
                onMouseUp={() => {
                  drag.current = false;
                  command({ type: "set_rgb", ...rgb });
                }}
                onTouchEnd={() => {
                  drag.current = false;
                  command({ type: "set_rgb", ...rgb });
                }}
              />
            </label>
          ))}
        </div>

        <div className="connection-actions">
          <button className="btn btn-ghost" type="button" onClick={() => onAction({ kind: "remove", ip: bulb.ip })}>
            Удалить
          </button>
        </div>
      </div>
    </article>
  );
}
