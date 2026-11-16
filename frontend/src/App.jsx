import { useState } from 'react';
import * as api from './api.js';
import Login from './screens/Login.jsx';
import Cadastro from './screens/Cadastro.jsx';
import Onboarding from './screens/Onboarding.jsx';
import Main from './screens/Main.jsx';

export default function App() {
  const [tela, setTela] = useState('login');
  const [user, setUser] = useState(null);

  const entrar = (u) => { setUser(u); setTela('main'); };
  const iniciarOnboarding = (u) => { setUser(u); setTela('onboarding'); };

  if (tela === 'cadastro') return <Cadastro onDone={iniciarOnboarding} onLogin={() => setTela('login')} />;
  if (tela === 'onboarding') return <Onboarding onDone={() => setTela('main')} />;
  if (tela === 'main') return <Main user={user} onLogout={() => { api.logout(); setUser(null); setTela('login'); }} />;
  return <Login onDone={entrar} onCadastro={() => setTela('cadastro')} />;
}
