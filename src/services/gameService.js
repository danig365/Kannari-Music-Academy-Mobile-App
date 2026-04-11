/**
 * Game Service for Kannari Music Academy (React Native)
 * Copied from frontend/src/services/gameService.js
 * Changed: hardcoded API URLs → ENDPOINTS from endpoints.js, axios → axiosInstance
 */

import axiosInstance from '../api/axiosConfig';
import { API_BASE, ENDPOINTS } from '../api/endpoints';

const API_BASE_NORMALIZED = String(API_BASE || '').replace(/\/+$/, '');
const toAbsoluteApiUrl = (path) => `${API_BASE_NORMALIZED}/${String(path || '').replace(/^\/+/, '')}`;

export const seedPhase1Games = () =>
  axiosInstance.post(ENDPOINTS.GAMES_SEED);

export const getGames = () =>
  axiosInstance.get(ENDPOINTS.GAMES_LIST);

export const getStudentGamesOverview = (studentId) =>
  axiosInstance.get(ENDPOINTS.STUDENT_GAMES_OVERVIEW(studentId));

export const getStudentSonaraCoins = (studentId) =>
  axiosInstance.get(ENDPOINTS.STUDENT_SONARA_COINS(studentId));

export const startGameSession = (studentId, gameType, level = 1) =>
  axiosInstance.post(ENDPOINTS.STUDENT_GAME_START(studentId, gameType), { level });

export const submitGameAttempt = (sessionId, payload) =>
  axiosInstance.post(ENDPOINTS.GAME_SESSION_ATTEMPT(sessionId), payload);

export const finishGameSession = (sessionId, payload = {}) =>
  axiosInstance.post(ENDPOINTS.GAME_SESSION_FINISH(sessionId), payload);

export const getNextQuestion = (sessionId) =>
  axiosInstance.get(ENDPOINTS.GAME_SESSION_NEXT_QUESTION(sessionId));

export const getSessionQuestions = (sessionId) =>
  axiosInstance.get(ENDPOINTS.GAME_SESSION_QUESTIONS(sessionId));

export const getGameLeaderboard = (gameType) =>
  axiosInstance.get(ENDPOINTS.GAME_LEADERBOARD(gameType));

// ── Teacher endpoints ──
export const getTeacherStudentsGamePerformance = (teacherId, params = {}) => {
  const query = new URLSearchParams();
  if (params.game_type) query.append('game_type', params.game_type);
  if (params.search) query.append('search', params.search);
  if (params.sort) query.append('sort', params.sort);
  if (params.dir) query.append('dir', params.dir);
  const qs = query.toString();
  return axiosInstance.get(`${ENDPOINTS.TEACHER_GAMES_PERFORMANCE(teacherId)}${qs ? '?' + qs : ''}`);
};

export const exportTeacherGamePerformanceCSV = (teacherId, params = {}) => {
  const query = new URLSearchParams({ export: 'csv' });
  if (params.game_type) query.append('game_type', params.game_type);
  if (params.search) query.append('search', params.search);
  if (params.sort) query.append('sort', params.sort);
  if (params.dir) query.append('dir', params.dir);
  return toAbsoluteApiUrl(`${ENDPOINTS.TEACHER_GAMES_PERFORMANCE(teacherId)}?${query.toString()}`);
};

// ── Admin endpoints ──
export const getAdminGamesAnalytics = () =>
  axiosInstance.get(ENDPOINTS.ADMIN_GAMES_ANALYTICS);

export const exportAdminGameStatsCSV = () =>
  toAbsoluteApiUrl(`${ENDPOINTS.ADMIN_GAMES_ANALYTICS}?export=game_stats_csv`);

export const exportAdminTopStudentsCSV = () =>
  toAbsoluteApiUrl(`${ENDPOINTS.ADMIN_GAMES_ANALYTICS}?export=top_students_csv`);
