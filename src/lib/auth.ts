import { loadJSON, saveJSON } from './storage';
import type { AnalystUser } from '../types';

const USERS_KEY = 'users';
const SESSION_KEY = 'session';

function seedDefaultUser(): AnalystUser[] {
  const users: AnalystUser[] = [
    {
      email: 'dev@mulai.com',
      password: 'fraud123',
      name: 'Lead Fraud Analyst',
      createdAt: Date.now(),
    },
  ];
  saveJSON(USERS_KEY, users);
  return users;
}

export function getUsers(): AnalystUser[] {
  const users = loadJSON<AnalystUser[]>(USERS_KEY, []);
  if (users.length === 0) return seedDefaultUser();
  return users;
}

export function login(email: string, password: string): AnalystUser | null {
  const user = getUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (user) saveJSON(SESSION_KEY, user.email);
  return user ?? null;
}

export function inviteAnalyst(email: string, password: string, name: string): { ok: boolean; error?: string } {
  const users = getUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: 'An analyst with that email already exists.' };
  }
  users.push({ email, password, name, createdAt: Date.now() });
  saveJSON(USERS_KEY, users);
  return { ok: true };
}

export function getSession(): AnalystUser | null {
  const email = loadJSON<string | null>(SESSION_KEY, null);
  if (!email) return null;
  return getUsers().find((u) => u.email === email) ?? null;
}

export function logout(): void {
  saveJSON(SESSION_KEY, null);
}
