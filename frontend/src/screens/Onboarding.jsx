import { useState } from 'react';
import * as api from '../api.js';
import { Field } from '../ui.jsx';

const OBJETIVOS = ['emagrecer', 'ganhar massa muscular', 'ganhar peso'];

export default function Onboarding({ onDone }) {
  const [goal, setGoal] = useState(OBJETIVOS[0]);
  const [idade, setIdade] = useState('');
  const [peso, setPeso] = useState('');
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setBusy(true);

    try {
      await api.saveProfile({
        goal,
        age: Number(idade) || 0,
        weight: Number(peso) || 0,
      });
      onDone();
    } catch (err) {
      setErro(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <section className="side">
        <div className="logo d">healther.</div>
        <div>
          <p className="lbl" style={{ color: 'inherit' }}>Primeiro acesso</p>
          <h1 className="d">Vamos começar pelo seu perfil.</h1>
        </div>
      </section>
      <form className="pane" onSubmit={enviar}>
        <div>
          <div className="lbl acc">Seu perfil</div>
          <h2 className="d">Conte um pouco sobre você</h2>
        </div>
        <label className="fld" htmlFor="objetivo">
          <span className="lbl">Objetivo</span>
          <select id="objetivo" value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="emagrecer">Emagrecer</option>
            <option value="ganhar massa muscular">Ganhar massa muscular</option>
            <option value="ganhar peso">Ganhar peso</option>
          </select>
        </label>
        <Field id="idade" label="Idade" type="number" min="0" value={idade} onChange={(e) => setIdade(e.target.value)} />
        <Field id="peso" label="Peso (kg)" type="number" min="0" value={peso} onChange={(e) => setPeso(e.target.value)} />
        {erro && <p className="err" role="alert">{erro}</p>}
        <button className="btn-w" type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Continuar'}</button>
      </form>
    </main>
  );
}
