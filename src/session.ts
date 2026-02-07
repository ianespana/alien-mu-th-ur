import { SESSION_INITIAL_STATE, SessionState } from './constants.js';

let currentMuthurSession: SessionState = { ...SESSION_INITIAL_STATE };

export function getSession(): SessionState {
    return currentMuthurSession;
}

export function updateSession(updates: Partial<SessionState>): SessionState {
    Object.assign(currentMuthurSession, updates);
    return currentMuthurSession;
}

export function resetSession(): SessionState {
    currentMuthurSession = { ...SESSION_INITIAL_STATE };
    return currentMuthurSession;
}

export function setSession(session: SessionState): void {
    currentMuthurSession = session;
}
