import { useState } from 'react';
import Login from './screens/Login.jsx';
import Cadastro from './screens/Cadastro.jsx';
import Main from './screens/Main.jsx';

export default function App() {
  const [tela, setTela] = useState('login');
  const [user, setUser] = useState(null);

  if (tela === 'cadastro') return <Cadastro onDone={(u) => { setUser(u); setTela('main'); }} onLogin={() => setTela('login')} />;
  if (tela === 'main') return <Main user={user} onLogout={() => { setUser(null); setTela('login'); }} />;
  return <Login onDone={(u) => { setUser(u); setTela('main'); }} onCadastro={() => setTela('cadastro')} />;
}
