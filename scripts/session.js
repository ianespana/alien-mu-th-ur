import { SESSION_INITIAL_STATE } from './constants.js';

let currentMuthurSession = { ...SESSION_INITIAL_STATE };

export function getSession() {
    return currentMuthurSession;
}

export function updateSession(updates) {
    Object.assign(currentMuthurSession, updates);
    return currentMuthurSession;
}

export function resetSession() {
    currentMuthurSession = { ...SESSION_INITIAL_STATE };
    return currentMuthurSession;
}

export function setSession(session) {
    currentMuthurSession = session;
}
