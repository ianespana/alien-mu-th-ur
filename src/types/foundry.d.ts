/// <reference types="fvtt-types" />

export {};

interface MuthurAPI {
    showMuthurInterface: () => HTMLElement | undefined;
    showSpectatorInterface: (
        activeUserId: string,
        activeUserName: string,
        skipWelcomeMessage?: boolean,
    ) => HTMLElement | undefined;
    toggleMuthurChat: () => void;
    hacking: typeof hacking;
    actions: typeof actions;
    muteForSpectator?: boolean;
}

declare global {
    interface Window {
        Muthur?: MuthurAPI;
        MUTHUR?: MuthurAPI;
        showMuthurInterface?: () => HTMLElement | undefined;
        showSpectatorInterface?: (
            activeUserId: string,
            activeUserName: string,
            skipWelcomeMessage?: boolean,
        ) => HTMLElement | undefined;
        toggleMuthurChat?: () => void;
        showGMSpectatorSelectionDialog?: (activeUserId: string, activeUserName: string) => void;
        showBootSequence?: (isSpectator?: boolean) => Promise<void>;
        currentMuthurSession?: {
            active: boolean;
            userId: string | null;
            userName: string | null;
        };
        simulateHackingAttempt?: (chatLog: HTMLElement) => Promise<boolean>;
        clearHackingElements?: () => void;
        createHackingWindows?: () => () => void;
        stopHackingWindows?: () => void;
    }

    interface SettingConfig {
        // Client
        'alien-mu-th-ur.enableTypingSounds': boolean;
        'alien-mu-th-ur.soundVolume': number;
        'alien-mu-th-ur.enableScanline': boolean;
        'alien-mu-th-ur.scanlineSize': number;
        'alien-mu-th-ur.enableTypewriter': boolean;

        // Post-Hack Phase flags (World)
        'alien-mu-th-ur.phShowInHelp': boolean;
        'alien-mu-th-ur.phSpecialOrders': boolean;
        'alien-mu-th-ur.phCerberus': boolean;
        'alien-mu-th-ur.phDoors': boolean;
        'alien-mu-th-ur.phLights': boolean;
        'alien-mu-th-ur.phAlarm': boolean;
        'alien-mu-th-ur.phGas': boolean;
        'alien-mu-th-ur.phCryo': boolean;

        // Alarm (World)
        'alien-mu-th-ur.alarmSoundPath': foundry.data.fields.FilePathField;

        // World (GM controls)
        'alien-mu-th-ur.allowHack': boolean;
        'alien-mu-th-ur.hackDecisionByGM': boolean;
        'alien-mu-th-ur.allowDragGM': boolean;
        'alien-mu-th-ur.allowDragPlayers': boolean;

        // Status (World)
        'alien-mu-th-ur.currentStatusKey':
            | 'normal'
            | 'anomalyDetected'
            | 'systemOffline'
            | 'degradedPerformance'
            | 'fireDetected'
            | 'quarantine'
            | 'lockdown'
            | 'intrusion'
            | 'networkIssue'
            | 'custom';
        'alien-mu-th-ur.customStatusText': string;

        // Roles (World)
        'alien-mu-th-ur.captainUserIds': string[];
        'alien-mu-th-ur.allowCaptainSpecialOrders': boolean;
    }
}
