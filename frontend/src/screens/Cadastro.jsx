import { useState } from 'react';
import * as api from '../api.js';
import { Field, PasswordField } from '../ui.jsx';

export default function Cadastro({ onDone, onLogin }) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return setErro('Preencha o nome e o e-mail.');
    if (senha.length < 8) return setErro('A senha precisa ter no mínimo 8 caracteres.');
    setErro(''); setBusy(true);
    try { onDone(await api.cadastro(nome, email, senha)); }
    catch (err) { setErro(err.message); setBusy(false); }
  }

  return (
    <main className="auth rev">
      <form className="pane" onSubmit={enviar} noValidate>
        <div><div className="lbl acc">Criar conta</div><h2 className="d">Comece em um minuto</h2></div>
        <Field id="nome" label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
        <Field id="email" label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <div>
          <PasswordField id="senha" label="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
          <span className="lbl" style={{ display: 'block', marginTop: 6 }}>Mínimo de 8 caracteres</span>
        </div>
        {erro && <p className="err" role="alert">{erro}</p>}
        <button className="btn-w" type="submit" disabled={busy}>{busy ? 'Criando…' : 'Criar conta'}</button>
        <p className="mut">Já tem conta? <button type="button" className="lk" onClick={onLogin}>Entrar</button></p>
      </form>
      <section className="side">
        <div className="logo d" style={{ textAlign: 'right' }}>healther.</div>
        <div>
          <h1 className="d" style={{ marginBottom: 40 }}>Tudo o que você come e treina, em uma tela.</h1>
          <p className="ft">Registre as suas refeições</p>
          <p className="ft">Anote os exercícios do dia</p>
          <p className="ft">Salve e escolha receitas</p>
        </div>
      </section>
    </main>
  );
}
