export const isDemoMode = import.meta.env.VITE_DEMO_AUTH !== 'false';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || '/auth/login';
const REGISTER_PATH = import.meta.env.VITE_REGISTER_PATH || '/auth/register';
const demoAccounts = new Map();

async function post(path, body) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Confira se o backend está ativo.');
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || result.mensagem || 'Não foi possível concluir a solicitação.');
  }

  return result.usuario || result.user || result;
}

export async function login(email, senha) {
  const emailNormalizado = email.trim().toLowerCase();

  if (isDemoMode) {
    const account = demoAccounts.get(emailNormalizado);
    if (!account || account.senha !== senha) {
      throw new Error('E-mail ou senha incorretos. Cadastre-se nesta sessão para continuar.');
    }
    return { nome: account.nome, email: emailNormalizado };
  }

  const result = await post(LOGIN_PATH, { email: emailNormalizado, senha });
  return { ...result, nome: result.nome || result.name || emailNormalizado.split('@')[0] };
}

export async function cadastro(nome, email, senha) {
  const emailNormalizado = email.trim().toLowerCase();

  if (isDemoMode) {
    if (demoAccounts.has(emailNormalizado)) {
      throw new Error('Este e-mail já foi cadastrado nesta sessão. Entre com sua conta.');
    }
    const account = { nome: nome.trim(), senha };
    demoAccounts.set(emailNormalizado, account);
    return { nome: account.nome, email: emailNormalizado };
  }

  const result = await post(REGISTER_PATH, { nome: nome.trim(), email: emailNormalizado, senha });
  return { ...result, nome: result.nome || result.name || nome.trim() };
}
