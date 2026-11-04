export default function Main({ user, onLogout }) {
  return (
    <div className="app">
      <header className="top">
        <div className="logo d">healther<span className="acc">.</span></div>
        <div className="who"><span className="lbl">Olá, {user?.nome || 'usuário'}</span><button className="lk" onClick={onLogout}>Sair</button></div>
      </header>
      <main>
        <section className="hero">
          <div>
            <div className="lbl dk">Resumo do dia</div>
            <h1 className="big d">Seu dia</h1>
            <p className="hero-copy">Acompanhe sua rotina de saúde em um só lugar.</p>
          </div>
          <div className="summary">
            <div className="st"><span className="lbl dk">Consumidas</span><span className="d">— kcal</span></div>
            <div className="st"><span className="lbl dk">Atividades</span><span className="d">—</span></div>
            <div className="st"><span className="lbl dk">Meta diária</span><span className="d">— kcal</span></div>
          </div>
        </section>
        <section className="main-sections">
          <article className="main-section">
            <div className="section-heading"><h2 className="d">Refeições</h2><span className="lbl">Hoje</span></div>
            <p className="mut">Suas refeições registradas aparecerão aqui.</p>
          </article>
          <article className="main-section">
            <div className="section-heading"><h2 className="d">Atividades</h2><span className="lbl">Hoje</span></div>
            <p className="mut">Suas atividades registradas aparecerão aqui.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
