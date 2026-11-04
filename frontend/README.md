# Healther frontend

Interface React/Vite para login, cadastro e o resumo inicial do dia.

## Rodar localmente

```sh
npm install
copy .env.example .env.local
npm run dev
```

O frontend inicia em modo de demonstração (`VITE_DEMO_AUTH=true`): cadastre uma conta e entre nela enquanto o backend não está pronto. As contas existem apenas na memória da aba atual e são apagadas ao recarregar a página.

Quando as rotas HTTP do backend estiverem disponíveis, defina `VITE_DEMO_AUTH=false`. O cliente usa `VITE_API_URL` e, por padrão, envia login e cadastro para `POST /auth/login` e `POST /auth/register`. Ajuste os caminhos em `.env.local` com `VITE_LOGIN_PATH` e `VITE_REGISTER_PATH` se necessário.

As requisições enviam JSON nos formatos `{ "email", "senha" }` e `{ "nome", "email", "senha" }`. A tela aceita uma resposta JSON com `nome` ou `name`, ou esses dados dentro de `usuario`/`user`.

O backend presente neste repositório ainda contém apenas classes de estrutura e não implementa servidor HTTP nem essas rotas. Login e cadastro reais vão depender dessa implementação e da configuração de CORS do backend.
