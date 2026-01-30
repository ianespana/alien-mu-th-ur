export const MODULE_ID = 'alien-mu-th-ur';

export const SESSION_INITIAL_STATE = {
    active: false,
    userId: null,
    userName: null,
};

export const getHackingSequences = () => [
    '> INITIALIZING BRUTE FORCE ATTACK...',
    'ssh -p 22 root@muthur6000.weyland-corp',
    'TRYING PASSWORD COMBINATIONS...',
];

export const getPostPasswordSequences = () => [
    'PASSWORD FOUND: ********',
    'ACCESS GRANTED TO PRIMARY SYSTEMS',
    '> SWITCHING TO DICTIONARY ATTACK FOR SECONDARY SYSTEMS',
    'ATTEMPTING BYPASS OF SECURITY PROTOCOLS',
    'ACCESSING MAIN COMPUTER...',
];

export const getSuccessSequences = () => [
    {
        text: game.i18n.localize('MOTHER.IntrusionDetected'),
        color: '#ff0000',
        type: 'error',
    },
    {
        text: game.i18n.localize('MOTHER.SecurityProtocol'),
        color: '#ff9900',
        type: 'error',
    },
    {
        text: game.i18n.localize('MOTHER.CountermeasuresAttempt'),
        color: '#00ff00',
        type: 'reply',
    },
    {
        text: game.i18n.localize('MOTHER.CountermeasuresFailed'),
        color: '#ff0000',
        type: 'error',
    },
    {
        text: game.i18n.localize('MOTHER.RootAccess'),
        color: '#ff0000',
        type: 'error',
    },
    {
        text: game.i18n.localize('MOTHER.AdminPrivileges'),
        color: '#00ff00',
        type: 'reply',
    },
    {
        text: game.i18n.localize('MOTHER.SecurityDisabled'),
        color: '#00ff00',
        type: 'reply',
    },
    {
        text: game.i18n.localize('MOTHER.FullAccess'),
        color: '#00ff00',
        type: 'reply',
    },
    {
        text: game.i18n.localize('MOTHER.WelcomeAdmin'),
        color: '#00ff00',
        type: 'reply',
    },
];

export const getFailureSequences = () => [
    {
        text: game.i18n.localize('MOTHER.IntrusionDetected'),
        color: '#ff0000',
        type: 'error',
    },
    {
        text: game.i18n.localize('MOTHER.SecurityProtocol'),
        color: '#ff9900',
        type: 'error',
    },
    {
        text: game.i18n.localize('MOTHER.CountermeasuresActivated'),
        color: '#ff0000',
        type: 'error',
    },
    {
        text: game.i18n.localize('MOTHER.TerminalLocked'),
        color: '#ff0000',
        type: 'error',
    },
    {
        text: game.i18n.localize('MOTHER.LocatingIntruder'),
        color: '#ff9900',
        type: 'reply',
    },
    {
        text: game.i18n.localize('MOTHER.IPRecorded'),
        color: '#ff0000',
        type: 'error',
    },
    {
        text: game.i18n.localize('MOTHER.AccessBlocked'),
        color: '#ff0000',
        type: 'error',
    },
    {
        text: game.i18n.localize('MOTHER.TerminalLocked24'),
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
