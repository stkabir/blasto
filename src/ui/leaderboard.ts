import type { LeaderboardEntry } from '../core/types.js';
import { getDesignSVG } from '../core/utils.js';
import { formatScore } from '../core/constants.js';

export function getLocalLeaderboard(): LeaderboardEntry[] {
  try {
    return JSON.parse(localStorage.getItem('blasto_leaderboard') || '[]');
  } catch {
    return [];
  }
}

export function saveLocalScore(name: string, score: number, designId: string, color: string): LeaderboardEntry[] {
  const lb = getLocalLeaderboard();
  lb.push({ name, score, designId, color, date: Date.now() });
  lb.sort((a, b) => b.score - a.score);
  const trimmed = lb.slice(0, 5);
  localStorage.setItem('blasto_leaderboard', JSON.stringify(trimmed));
  return trimmed;
}

export async function fetchGlobalLeaderboard(): Promise<LeaderboardEntry[] | null> {
  try {
    const res = await fetch('https://api.blasto.pro/api/get-leaderboard?limit=100');
    if (!res.ok) throw new Error('Failed');
    return await res.json();
  } catch {
    return null;
  }
}

export async function submitGlobalScore(name: string, score: number, designId: string, color: string): Promise<void> {
  try {
    await fetch('https://api.blasto.pro/api/submit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score, designId, color }),
    });
  } catch {
  }
}

function escapeHtml(str: string): string {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderLeaderboardRows(
  container: HTMLElement,
  entries: LeaderboardEntry[],
  currentName: string,
  currentScore: number,
  showShip: boolean,
): void {
  container.innerHTML = '';
  if (!entries || entries.length === 0) {
    container.innerHTML = '<div class="lb-empty">Sin puntuaciones aún</div>';
    return;
  }
  entries.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'lb-row';
    const isCurrent = entry.name === currentName && entry.score === currentScore;
    if (isCurrent) row.classList.add('current');
    if (i === 0) row.classList.add('rank-1');
    else if (i === 1) row.classList.add('rank-2');
    else if (i === 2) row.classList.add('rank-3');
    let shipHtml = '';
    if (showShip && entry.designId) {
      const color = entry.color || '#22d3ee';
      shipHtml = `<span class="lb-ship">${getDesignSVG(entry.designId, color)}</span>`;
    }
    row.innerHTML = `
      <span class="lb-rank">${i + 1}</span>
      ${shipHtml}
      <span class="lb-name">${escapeHtml(entry.name)}</span>
      <span class="lb-score">${formatScore(entry.score)}</span>
    `;
    container.appendChild(row);
  });
}

export function renderLocalLeaderboard(container: HTMLElement, currentName: string, currentScore: number): void {
  const lb = getLocalLeaderboard();
  renderLeaderboardRows(container, lb, currentName, currentScore, true);
}

export async function renderGlobalLeaderboard(
  container: HTMLElement,
  currentName: string,
  currentScore: number,
  currentDesignId: string,
  currentColor: string,
): Promise<void> {
  container.innerHTML = '<div class="lb-loading">Cargando...</div>';
  const data = await fetchGlobalLeaderboard();
  if (!data) {
    container.innerHTML = '<div class="lb-empty">No disponible</div>';
    return;
  }

  const found = data.some(e => e.name === currentName && e.score === currentScore);
  if (!found && currentScore > 0) {
    data.push({ name: currentName, score: currentScore, designId: currentDesignId, color: currentColor, date: Date.now() });
    data.sort((a, b) => b.score - a.score);
    if (data.length > 100) data.pop();
  }

  renderLeaderboardRows(container, data, currentName, currentScore, true);
}
