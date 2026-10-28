import { useState } from "react";
import { send } from "../api.js";
import BulbCard from "../components/BulbCard.jsx";
import Meter from "../components/Meter.jsx";

export default function Bulbs({ state }) {
  const bulbs = state?.lamps ?? [];
  const [error, setError] = useState(null);
  const [newIp, setNewIp] = useState("");
  const [searching, setSearching] = useState(false);
  const online = bulbs.filter((bulb) => bulb.online).length;
  const lit = bulbs.filter((bulb) => bulb.props?.power === "on").length;

  const run = (action) =>
    send(action).then(
      () => setError(null),
      (err) => setError(err.message),
    );

  const discover = () => {
    setSearching(true);
    run({ kind: "discover" }).finally(() => setSearching(false));
  };

  const add = () => {
    run({ kind: "add", ip: newIp.trim() });
    setNewIp("");
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Устройства</span>
          <h1>Лампы</h1>
          <p className="lead">Управление яркостью, цветом и температурой.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-ghost" type="button" onClick={discover} disabled={searching}>
            {searching && <span className="spinner" />}
            {searching ? "Ищем в сети…" : "Найти в сети"}
          </button>
        </div>
      </div>

      <section className="stats">
        <div className="stat">
          <span>Всего ламп</span>
          <b>{bulbs.length}</b>
        </div>
        <div className="stat">
          <span>В сети</span>
          <b className={online ? "ok" : ""}>{online}</b>
        </div>
        <div className="stat">
          <span>Горят</span>
          <b className={lit ? "ok" : ""}>{lit}</b>
        </div>
        <Meter
          label="Онлайн"
          value={bulbs.length ? online / bulbs.length : 0}
          hint={`${online} из ${bulbs.length}`}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div className="card-heading">
            <span className="icon-chip">+</span>
            <h2>Добавить лампу</h2>
          </div>
        </div>
        <div className="settings">
          <label className="field">
            IP-адрес
            <input value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="192.168.1.50" />
          </label>
          <div className="connection-actions">
            <button className="btn btn-primary" type="button" onClick={add} disabled={!newIp.trim()}>
              Добавить
            </button>
          </div>
        </div>
      </section>

      {error && <div className="notice">{error}</div>}

      {bulbs.length === 0 ? (
        <div className="empty">Ламп пока нет. Добавьте IP-адрес или выполните поиск в сети.</div>
      ) : (
        <div className="bulb-list">
          {bulbs.map((bulb) => (
            <BulbCard key={bulb.ip} bulb={bulb} onAction={run} />
          ))}
        </div>
      )}
    </>
  );
}
