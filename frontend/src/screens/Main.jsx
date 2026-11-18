import { useCallback, useEffect, useState } from 'react';
import * as api from '../api.js';

const NOMES_TIPO = api.TIPOS.map(([nome]) => nome);
const hoje = (dia) => { const d = new Date(); d.setDate(d.getDate() + dia); return d; };

function AddForm({ fields, initial, submitLabel, onSubmit, onCancel }) {
  const [v, setV] = useState(() => ({ ...Object.fromEntries(fields.filter((f) => f.options).map((f) => [f.name, f.options[0]])), ...initial }));
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const ok = fields.every((f) => String(v[f.name] ?? '').trim() !== '');
  return (
    <form className="af" onSubmit={(e) => { e.preventDefault(); if (ok) onSubmit(v); }}>
      {fields.map((f, i) => (
        <label key={f.name} className="af-f">
          <span className="lbl">{f.label}</span>
          {f.options
            ? <select value={v[f.name]} onChange={set(f.name)}>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
            : <input type={f.type || 'text'} min={f.type === 'number' ? 0 : undefined} value={v[f.name] ?? ''} onChange={set(f.name)} autoFocus={i === 0 || undefined} />}
        </label>
      ))}
      <div className="af-b"><button type="submit" className="btn-w" disabled={!ok}>{submitLabel}</button><button type="button" className="btn-o" onClick={onCancel}>Cancelar</button></div>
    </form>
  );
}

const Vazio = ({ children }) => <p className="mut vazio">{children}</p>;

export default function Main({ user, onLogout }) {
  const [ref, setRef] = useState([]);
  const [ex, setEx] = useState([]);
  const [rec, setRec] = useState([]);
  const [sugeridas, setSugeridas] = useState([]);
  const [sugeridasCarregadas, setSugeridasCarregadas] = useState(false);
  const [carregandoSugeridas, setCarregandoSugeridas] = useState(false);
  const [erroSugeridas, setErroSugeridas] = useState('');
  const [resumo, setResumo] = useState(null);
  const [form, setForm] = useState(null);
  const [preset, setPreset] = useState({});
  const [tab, setTab] = useState('minha');
  const [dia, setDia] = useState(0);
  const [erro, setErro] = useState('');
  const [erroResumo, setErroResumo] = useState('');

  const d = hoje(dia);
  const iso = d.toLocaleDateString('sv-SE');
  const data = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  const carregar = useCallback(async () => {
    const [m, e, r] = await Promise.all([api.listMeals(iso), api.listExercises(iso), api.listRecipes()]);
    setRef(m); setEx(e); setRec(r);
  }, [iso]);

  useEffect(() => { carregar().catch((e) => setErro(e.message)); }, [carregar]);

  const carregarResumo = useCallback(async () => {
    setResumo(null);
    try {
      setResumo(await api.getNutritionSummary(iso));
      setErroResumo('');
    } catch (e) {
      setErroResumo(e.message);
    }
  }, [iso]);

  useEffect(() => { carregarResumo(); }, [carregarResumo]);

  useEffect(() => {
    if (tab !== 'sugerida' || sugeridasCarregadas) return;
    let ativa = true;
    setCarregandoSugeridas(true);
    setErroSugeridas('');
    api.listSuggestedRecipes()
      .then((data) => {
        if (ativa) {
          setSugeridas(data);
          setSugeridasCarregadas(true);
        }
      })
      .catch((e) => {
        if (ativa) setErroSugeridas(e.message);
      })
      .finally(() => {
        if (ativa) setCarregandoSugeridas(false);
      });
    return () => { ativa = false; };
  }, [tab, sugeridasCarregadas]);

  const abrir = (qual, p = {}) => {
    setForm(qual); setPreset(p);
    if (qual === 'ref') document.getElementById('h-ref')?.scrollIntoView({ behavior: 'smooth' });
  };
  // Executa a ação no backend, recarrega as listas e fecha o formulário.
  const agir = (fn) => async (...args) => {
    try { setErro(''); await fn(...args); await carregar(); setForm(null); }
    catch (e) { setErro(e.message); }
    await carregarResumo();
  };
  const addRef = agir((v) => api.addMeal({ ...v, date: iso }));
  const addEx = agir((v) => api.addExercise({ ...v, date: iso }));
  const addRec = agir(async (v) => { await api.addRecipe(v); setTab('minha'); });
  const delRef = agir((r) => api.removeMeal(r.prefix, r.id));
  const delEx = agir((e) => api.removeExercise(e.id));
  const delRec = agir((r) => api.removeRecipe(r.id));

  return (
    <div className="app">
      <header className="top">
        <div className="logo d">healther<span className="acc">.</span></div>
        <div className="datenav">
          <button className="btn-o sq" aria-label="Dia anterior" onClick={() => setDia(dia - 1)}>←</button>
          <span className="lbl dtl" aria-live="polite">{data}</span>
          <button className="btn-o sq" aria-label="Próximo dia" onClick={() => setDia(dia + 1)}>→</button>
        </div>
        <div className="who"><span className="lbl">Olá, {user?.nome}</span><button className="lk" onClick={onLogout}>Sair</button></div>
      </header>
      {erro && <p className="err banner" role="alert">{erro}</p>}
      {erroResumo && <p className="err banner" role="alert">{erroResumo}</p>}

      <section className="hero">
        <div>
          <div className="lbl dk">Consumidas hoje</div>
          <h1 className="big d">{resumo ? resumo.consumed_calories.toLocaleString('pt-BR') : '—'}</h1>
          <div className="metaline">
            <div className="d" style={{ fontSize: 24, fontWeight: 500 }}>
              de {resumo ? resumo.goal_calories.toLocaleString('pt-BR') : '—'} kcal de meta
            </div>
          </div>
        </div>
        <div>
          <div className="st">
            <span className="lbl dk">Queimadas</span>
            <span className="d">{resumo ? resumo.burned_calories.toLocaleString('pt-BR') : '—'}</span>
          </div>
          <div className="st">
            <span className="lbl dk">Restam</span>
            <span className="d">{resumo ? resumo.remaining_calories.toLocaleString('pt-BR') : '—'}</span>
          </div>
          {[
            ['Proteína', 'protein'],
            ['Carboidrato', 'carbohydrate'],
            ['Gordura', 'fat'],
          ].map(([nome, key]) => {
            const macro = resumo?.macros[key];
            const percentual = macro && macro.target > 0
              ? Math.min(100, (macro.consumed / macro.target) * 100)
              : 0;
            const valores = macro
              ? `${macro.consumed} / ${macro.target} g`
              : '— / — g';
            return (
              <div className="mb" key={key}>
                <div className="lbl dk"><span>{nome}</span><span>{valores}</span></div>
                <div className="t"><i style={{ width: `${percentual}%` }} /></div>
              </div>
            );
          })}
        </div>
      </section>

      <main className="cols">
        <section className="col" aria-labelledby="h-ref">
          <div className="ch"><h2 id="h-ref" className="d">Refeições</h2><button className="btn-w" onClick={() => abrir('ref')}>+ Adicionar alimento</button></div>
          {form === 'ref' && <AddForm fields={[{ name: 'tipo', label: 'Refeição', options: NOMES_TIPO }, { name: 'desc', label: 'O que você comeu' }, { name: 'amount', label: 'Quantidade (g)', type: 'number' }, { name: 'kcal', label: 'Calorias', type: 'number' }]} initial={{ amount: '100', ...preset }} submitLabel="Salvar refeição" onSubmit={addRef} onCancel={() => setForm(null)} />}
          {ref.length === 0 && <Vazio>Nenhuma refeição registrada hoje. Adicione a primeira.</Vazio>}
          {ref.map((r) => (
            <div className="row" key={r.key}>
              <div><b>{r.tipo}</b><small>{r.desc}</small></div>
              <div className="rr"><span className="k">{r.kcal}</span><button className="rm" aria-label={`Remover ${r.tipo}`} onClick={() => delRef(r)}>✕</button></div>
            </div>
          ))}
          {!ref.some((r) => r.prefix === 'dinner') && form !== 'ref' && (
            <div className="row"><div><b>Jantar</b><small>Nada registrado</small></div><button className="btn-o" onClick={() => abrir('ref', { tipo: 'Jantar' })}>+ Registrar</button></div>
          )}
        </section>

        <section className="col" aria-labelledby="h-ex">
          <div className="ch"><h2 id="h-ex" className="d">Exercícios</h2><button className="btn-o" onClick={() => abrir('ex')}>+ Registrar</button></div>
          {form === 'ex' && <AddForm fields={[{ name: 'nome', label: 'Exercício' }, { name: 'min', label: 'Minutos', type: 'number' }, { name: 'kcal', label: 'Calorias queimadas', type: 'number' }]} submitLabel="Salvar exercício" onSubmit={addEx} onCancel={() => setForm(null)} />}
          {ex.length === 0 && <Vazio>Nenhum exercício hoje. Registre o primeiro.</Vazio>}
          {ex.map((e) => (
            <div className="row" key={e.id}>
              <div><b>{e.nome}</b><small>{e.min} min</small></div>
              <div className="rr"><span className="k lime">−{e.kcal}</span><button className="rm" aria-label={`Remover ${e.nome}`} onClick={() => delEx(e)}>✕</button></div>
            </div>
          ))}
        </section>

        <section className="col" aria-labelledby="h-rec">
          <div className="ch"><h2 id="h-rec" className="d">Receitas</h2><button className="btn-w" onClick={() => abrir('rec')}>+ Nova</button></div>
          <div className="tabs" role="tablist">
            {[['minha', 'Minhas'], ['sugerida', 'Sugeridas']].map(([k, n]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={'tab' + (tab === k ? ' on' : '')} onClick={() => setTab(k)}>{n}</button>
            ))}
          </div>
          {form === 'rec' && <AddForm fields={[{ name: 'nome', label: 'Nome da receita' }, { name: 'kcal', label: 'Calorias por porção', type: 'number' }, { name: 'steps', label: 'Modo de preparo' }]} submitLabel="Salvar receita" onSubmit={addRec} onCancel={() => setForm(null)} />}
          {tab === 'sugerida' && erroSugeridas && <p className="err" role="alert">{erroSugeridas}</p>}
          {tab === 'sugerida' && carregandoSugeridas && <Vazio>Carregando receitas sugeridas…</Vazio>}
          {!carregandoSugeridas && !erroSugeridas && (tab === 'minha' ? rec : sugeridas).length === 0 && (
            <Vazio>{tab === 'minha' ? 'Você ainda não criou receitas. Toque em + Nova.' : 'Nenhuma receita sugerida disponível.'}</Vazio>
          )}
          {(tab === 'minha' ? rec : sugeridas).map((r) => (
            <div className="row" key={r.id}>
              <div><b>{r.nome}</b><small><span className="teal">{r.kcal} kcal</span> por porção</small></div>
              <div className="rr">
                <button className="btn-o" onClick={() => abrir('ref', { tipo: 'Almoço', desc: r.nome, kcal: String(r.kcal) })}>Adicionar</button>
                {tab === 'minha' && <button className="rm" aria-label={`Remover ${r.nome}`} onClick={() => delRec(r)}>✕</button>}
              </div>
            </div>
          ))}
        </section>
      </main>

    </div>
  );
}
