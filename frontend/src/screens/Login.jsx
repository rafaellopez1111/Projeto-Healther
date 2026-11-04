import { useState } from 'react';
import * as api from '../api.js';
import { Field, PasswordField } from '../ui.jsx';

export default function Login({ onDone, onCadastro }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!email.trim() || !senha) return setErro('Preencha o e-mail e a senha.');
    setErro(''); setBusy(true);
    try { onDone(await api.login(email, senha)); }
    catch (error) { setErro(error.message || 'Não foi possível entrar. Confira o e-mail e a senha.'); setBusy(false); }
  }

  return (
    <main className="auth">
      <section className="side">
        <div className="logo d">healther.</div>
        <h1 className="d">Bem-vindo de volta.</h1>
        <p className="lbl" style={{ color: 'inherit', margin: 0 }}>Seu espaço de saúde começa aqui</p>
      </section>
      <form className="pane" onSubmit={enviar} noValidate>
        <div><div className="lbl acc">Entrar</div><h2 className="d">Acesse a sua conta</h2></div>
        {api.isDemoMode && <p className="demo-note">Modo de demonstração: cadastre-se nesta sessão para entrar.</p>}
        <Field id="email" label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <PasswordField id="senha" label="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
        {erro && <p className="err" role="alert">{erro}</p>}
        <button className="btn-w" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <p className="mut">Ainda não tem conta? <button type="button" className="lk" onClick={onCadastro}>Criar conta</button></p>
      </form>
    </main>
  );
}
