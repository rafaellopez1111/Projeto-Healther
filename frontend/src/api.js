// Cliente do backend Java: tudo vai em POST {BASE}/api com { action, userid, data }.
const BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const MSG = {
  'Email already registered': 'Este e-mail já está cadastrado. Entre com a sua conta.',
  'Invalid email or password': 'E-mail ou senha incorretos.',
  'Database error': 'O servidor teve um erro no banco de dados. Tente de novo.',
  'Food API unavailable': 'A busca de alimentos está indisponível agora.',
  'User not found': 'Usuário não encontrado. Entre de novo.',
};

let sess = { id: 0, nome: '' };

async function call(action, data = {}, userid = sess.id) {
  let r;
  try {
    const res = await fetch(`${BASE}/api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, userid, data }),
    });
    r = await res.json().catch(() => ({ success: false }));
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Confira se o backend está ativo.');
  }
  if (!r.success) throw new Error(MSG[r.message] || r.message || 'Não foi possível concluir a solicitação.');
  return r;
}

const pick = (o, ...keys) => { for (const k of keys) if (o?.[k] !== undefined) return o[k]; };

/* conta */
export async function login(email, senha) {
  const r = await call('user_login', { user_email: email.trim().toLowerCase(), user_password: senha }, 0);
  sess = { id: r.user_id, nome: r.user_name };
  return { id: r.user_id, nome: r.user_name, goal: r.user_goal };
}
export async function cadastro(nome, email, senha) {
  const r = await call('user_create', { user_name: nome.trim(), user_email: email.trim().toLowerCase(), user_password: senha }, 0);
  sess = { id: r.user_id, nome: nome.trim() };
  return { id: r.user_id, nome: sess.nome };
}
export const logout = () => { sess = { id: 0, nome: '' }; };
export const saveProfile = ({ goal, age, weight }) => call('user_update', { user_goal: goal, user_age: age, user_weight: weight });

/* refeições */
export const TIPOS = [
  ['Café da manhã', 'breakfast'],
  ['Almoço', 'lunch'],
  ['Lanche', 'afternoon_snack'],
  ['Jantar', 'dinner'],
];
export async function listMeals(date) {
  const r = await call('meal_getall', { reference_date: date });
  return TIPOS.flatMap(([tipo, prefix]) =>
    (r.data?.[prefix] || []).map((f, i) => ({
      key: `${prefix}-${pick(f, 'meal_id', 'mealId')}-${i}`,
      id: pick(f, 'meal_id', 'mealId'),
      prefix, tipo,
      desc: pick(f, 'specific_food', 'specificFood'),
      kcal: pick(f, 'total_calories', 'totalCalories'),
    })));
}
export const addMeal = ({ tipo, desc, amount, kcal, date }) =>
  call(`${TIPOS.find(([t]) => t === tipo)[1]}_create`, {
    reference_date: date,
    foods: [{ specific_food: desc, food_amount: Number(amount), total_calories: Number(kcal) }],
  });
export const removeMeal = (prefix, id) => call(`${prefix}_delete`, { meal_id: id });

/* exercícios */
export async function listExercises(date) {
  const r = await call('exercise_getall', { exercise_date: date });
  return (r.data || []).map((e) => ({
    id: pick(e, 'exercise_id', 'exerciseId'),
    nome: pick(e, 'exercise_name', 'exerciseName'),
    min: pick(e, 'total_minutes', 'totalMinutes'),
    kcal: pick(e, 'total_calories', 'totalCalories'),
  }));
}
export const addExercise = ({ nome, min, kcal, date }) =>
  call('exercise_create', { exercise_name: nome, total_minutes: Number(min), total_calories: Number(kcal), exercise_date: date });
export const removeExercise = (id) => call('exercise_delete', { exercise_id: id });

/* receitas */
export async function listRecipes() {
  const r = await call('recipe_getall');
  return (r.data || []).map((x) => ({
    id: pick(x, 'recipe_id', 'recipeId'),
    nome: pick(x, 'recipe_name', 'recipeName'),
    kcal: pick(x, 'calories_portion', 'caloriesPortion'),
    steps: pick(x, 'recipe_steps', 'recipeSteps'),
  }));
}
export const addRecipe = ({ nome, kcal, steps }) =>
  call('recipe_create', { recipe_name: nome, calories_portion: Number(kcal), recipe_steps: steps, created_by: sess.nome });
export const removeRecipe = (id) => call('recipe_delete', { recipe_id: id });

/* exemplos fixos, falta conexao com json */
export const SUGERIDAS = [
  { id: 's1', nome: 'Salada de grão-de-bico', kcal: 310 },
  { id: 's2', nome: 'Crepioca com queijo', kcal: 260 },
  { id: 's3', nome: 'Sopa de legumes', kcal: 180 },
];
