import Meter from "../components/Meter.jsx";

export default function Home({ state }) {
  const lamps = state?.lamps ?? [];
  const modes = state?.modes ?? [];
  const running = modes.filter((mode) => mode.running);
  const online = lamps.filter((lamp) => lamp.online).length;
  const lit = lamps.filter((lamp) => lamp.props?.power === "on").length;
  const failed = modes.filter((mode) => mode.last_error);
  const log = state?.log ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Обзор</span>
          <h1>Главная</h1>
          <p className="lead">Состояние агента, ламп и запущенных режимов.</p>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <div className="card-heading">
            <span className="icon-chip">●</span>
            <h2>Агент</h2>
          </div>
          <span className={`pill ${state?.online ? "" : "pill-warn"}`}>
            {state?.online ? "online" : "offline"}
          </span>
        </div>
        <div className="stats stats-4">
          <div className="stat">
            <span>Ламп</span>
            <b>{lamps.length}</b>
          </div>
          <div className="stat">
            <span>В сети</span>
            <b className={online ? "ok" : ""}>{online}</b>
          </div>
          <div className="stat">
            <span>Горят</span>
            <b className={lit ? "ok" : ""}>{lit}</b>
          </div>
          <div className="stat">
            <span>Режимов идёт</span>
            <b className={running.length ? "ok" : ""}>{running.length}</b>
          </div>
        </div>
        <div className="meters">
          <Meter label="Лампы в сети" value={lamps.length ? online / lamps.length : 0} hint={`${online}/${lamps.length}`} />
          <Meter
            label="Включено"
            value={lamps.length ? lit / lamps.length : 0}
            hint={`${lit}/${lamps.length}`}
            fill="linear-gradient(90deg,#5ad1e6,#b6f24a)"
          />
          <Meter
            label="Режимы"
            value={modes.length ? running.length / modes.length : 0}
            hint={`${running.length}/${modes.length}`}
            fill="linear-gradient(90deg,#a78bfa,#b6f24a)"
          />
        </div>
        {running.length > 0 && (
          <p className="section-intro">
            Запущены: {running.map((mode) => `${mode.name} (${mode.running_ip})`).join(", ")}
          </p>
        )}
        {failed.length > 0 && <p className="section-intro danger">Ошибки: {failed.map((m) => m.name).join(", ")}</p>}
      </section>

      <section className="card">
        <div className="card-head">
          <div className="card-heading">
            <span className="icon-chip">≡</span>
            <h2>Последние события</h2>
          </div>
          <span className="pill pill-muted">{log.length}</span>
        </div>
        {log.length === 0 ? (
          <div className="empty">Событий пока нет.</div>
        ) : (
          <pre className="console-output console-output-compact">{log.slice(-6).join("\n")}</pre>
        )}
      </section>

      <div className="nav-cards">
        <span className="nav-card">Лампы: управление яркостью, цветом и температурой.</span>
        <span className="nav-card">Режимы: сценарии с шагами для ламп.</span>
      </div>
    </>
  );
}
