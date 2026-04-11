import { API_BASE } from './api/endpoints'

const normalizedApiBase = String(API_BASE || '').replace(/\/$/, '')

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || normalizedApiBase
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://kannarimusicacademy.com'
export const JITSI_BASE_URL = process.env.EXPO_PUBLIC_JITSI_BASE_URL || 'https://meet.jit.si'
