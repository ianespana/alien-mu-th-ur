export const MODULE_ID = 'alien-mu-th-ur';

export function getGame(): Game {
    if (!(game instanceof foundry.Game)) {
        throw new Error('game is not initialized yet!');
    }
    return game;
}

export interface SessionState {
    active: boolean;
    userId: string | null;
    userName: string | null;
}

export const SESSION_INITIAL_STATE: SessionState = {
    active: false,
    userId: null,
    userName: null,
};

export const getHackingSequences = (): string[] => [
    '> INITIALIZING BRUTE FORCE ATTACK...',
    'ssh -p 22 root@muthur6000.weyland-corp',
    'TRYING PASSWORD COMBINATIONS...',
];

export const getPostPasswordSequences = (): string[] => [
    'PASSWORD FOUND: ********',
    'ACCESS GRANTED TO PRIMARY SYSTEMS',
    '> SWITCHING TO DICTIONARY ATTACK FOR SECONDARY SYSTEMS',
    'ATTEMPTING BYPASS OF SECURITY PROTOCOLS',
    'ACCESSING MAIN COMPUTER...',
];

export interface SequenceItem {
    text: string;
    color: string;
    type: 'reply' | 'error' | 'system';
}

export const getSuccessSequences = (): SequenceItem[] => [
    {
        text: getGame().i18n?.localize('MOTHER.IntrusionDetected') || '!!! INTRUSION DETECTED !!!',
        color: '#ff0000',
        type: 'error',
    },
    {
        text: getGame().i18n?.localize('MOTHER.SecurityProtocol') || '■ SECURITY PROTOCOL DELTA-7 ACTIVATED ■',
        color: '#ff9900',
        type: 'error',
    },
    {
        text: getGame().i18n?.localize('MOTHER.CountermeasuresAttempt') || 'ATTEMPTING COUNTERMEASURES...',
        color: '#00ff00',
        type: 'reply',
    },
    {
        text: getGame().i18n?.localize('MOTHER.CountermeasuresFailed') || '!!! COUNTERMEASURES FAILED !!!',
        color: '#ff0000',
        type: 'error',
    },
    {
        text: getGame().i18n?.localize('MOTHER.RootAccess') || 'ROOT ACCESS COMPROMISED',
        color: '#ff0000',
        type: 'error',
    },
    {
        text: getGame().i18n?.localize('MOTHER.AdminPrivileges') || '>>> ADMINISTRATOR PRIVILEGES GRANTED',
        color: '#00ff00',
        type: 'reply',
    },
    {
        text: getGame().i18n?.localize('MOTHER.SecurityDisabled') || 'SECURITY PROTOCOLS DISABLED',
        color: '#00ff00',
        type: 'reply',
    },
    {
        text: getGame().i18n?.localize('MOTHER.FullAccess') || 'FULL ACCESS GRANTED',
        color: '#00ff00',
        type: 'reply',
    },
    {
        text: getGame().i18n?.localize('MOTHER.WelcomeAdmin') || 'WELCOME ADMINISTRATOR',
        color: '#00ff00',
        type: 'reply',
    },
];

export const getFailureSequences = (): SequenceItem[] => [
    {
        text: getGame().i18n?.localize('MOTHER.IntrusionDetected') || '!!! INTRUSION DETECTED !!!',
        color: '#ff0000',
        type: 'error',
    },
    {
        text: getGame().i18n?.localize('MOTHER.SecurityProtocol') || '■ SECURITY PROTOCOL DELTA-7 ACTIVATED ■',
        color: '#ff9900',
        type: 'error',
    },
    {
        text: getGame().i18n?.localize('MOTHER.CountermeasuresActivated') || 'COUNTERMEASURES ACTIVATED',
        color: '#ff0000',
        type: 'error',
    },
    {
        text: getGame().i18n?.localize('MOTHER.TerminalLocked') || '!!! TERMINAL LOCKED !!!',
        color: '#ff0000',
        type: 'error',
    },
    {
        text: getGame().i18n?.localize('MOTHER.LocatingIntruder') || 'LOCATING INTRUDER...',
        color: '#ff9900',
        type: 'reply',
    },
    {
        text: getGame().i18n?.localize('MOTHER.IPRecorded') || 'IP COORDINATES RECORDED',
        color: '#ff0000',
        type: 'error',
    },
    {
        text: getGame().i18n?.localize('MOTHER.AccessBlocked') || '!!! ACCESS BLOCKED !!!',
        color: '#ff0000',
        type: 'error',
    },
    {
        text: getGame().i18n?.localize('MOTHER.TerminalLocked24') || 'TERMINAL LOCKED FOR 24 HOURS',
        color: '#ff0000',
        type: 'error',
    },
];

export const SYSTEM_MESSAGES = [
    'WEYLAND-YUTANI CORPORATION - SECURITY SYSTEM',
    'QUARANTINE PROTOCOL ACTIVATED',
    'BIOHAZARD ALERT LEVEL 6',
    'UNAUTHORIZED ACCESS DETECTED',
    'SPECIAL ORDER 937 PROTOCOL INITIALIZATION',
    'DNA ANALYSIS IN PROGRESS...',
    'SPECIMEN XX121 DETECTED',
    'SELF-DESTRUCT SEQUENCE INITIATED',
    'ATMOSPHERIC PURGE IMMINENT',
    'APOLLO NETWORK CONNECTION',
    'DOWNLOADING SENSITIVE DATA',
    'SECURITY PROTOCOL VIOLATION',
    'LIFEFORM ANALYSIS IN PROGRESS',
    'MOTHER OVERRIDE SEQUENCE ACTIVE',
    'PRIORITY ONE: PROTECT COMPANY ASSETS',
    'CREW EXPENDABLE PROTOCOL ENGAGED',
    'HYPERSLEEP CHAMBER MALFUNCTION',
    'MOTION TRACKER SIGNAL DETECTED',
];

export const ERROR_SNIPPETS = [
    'CRITICAL ERROR: CONTAMINATION DETECTED',
    'BIOMETRIC AUTHENTICATION FAILURE',
    'QUARANTINE PROTOCOL VIOLATION',
    'SYSTEM ERROR: ATMOSPHERIC PRESSURE LOSS',
    'CONTAINMENT SYSTEM FAILURE',
    'SECURITY DATA CORRUPTION',
    'LIFE SUPPORT SYSTEMS CRITICAL',
    'EVACUATION SEQUENCE FAILURE',
    'FATAL ERROR: CONTAINMENT BREACH',
    'ACCESS DENIED: SECURITY LOCKDOWN',
    'MAINFRAME CONNECTION LOST',
    'WARNING: HOSTILE ORGANISM DETECTED',
    'EMERGENCY PROTOCOLS ENGAGED',
];
