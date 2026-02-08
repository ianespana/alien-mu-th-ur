import { getGame, MODULE_ID } from './constants.js';
import { MuthurAdminSettingsApp } from './ui/gm-settings';

export function registerSettings(): void {
    getGame().settings.registerMenu(MODULE_ID, 'muthurAdmin', {
        name: 'MU/TH/UR Admin',
        label: 'Configure',
        hint: 'Advanced configuration for MU/TH/UR',
        icon: 'fas fa-terminal',
        type: MuthurAdminSettingsApp,
        restricted: true,
    });

    // Add setting to enable/disable sound
    getGame().settings.register(MODULE_ID, 'enableTypingSounds', {
        name: getGame().i18n?.localize('MUTHUR.SETTINGS.typingSound.name') || 'Typing Sounds',
        hint:
            getGame().i18n?.localize('MUTHUR.SETTINGS.typingSound.hint') ||
            'Enables keyboard typing sounds like in the Alien movie',
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: (value) => {
            console.debug(
                'Typing sounds:',
                value
                    ? getGame().i18n?.localize('MUTHUR.SETTINGS.typingSound.enable') || 'Enabled'
                    : getGame().i18n?.localize('MUTHUR.SETTINGS.typingSound.disable') || 'Disabled',
            );
        },
    });

    // Add parameter for volume
    getGame().settings.register(MODULE_ID, 'soundVolume', {
        name: getGame().i18n?.localize('MUTHUR.SETTINGS.soundVolume.name') || 'MUTHUR Volume',
        hint:
            getGame().i18n?.localize('MUTHUR.SETTINGS.soundVolume.hint') ||
            'Adjusts MUTHUR sound volume (0 = mute, 1 = maximum)',
        scope: 'client',
        config: true,
        type: Number,
        range: {
            min: 0,
            max: 1,
            step: 0.1,
        },
        default: 1,
    });

    // Scanline
    getGame().settings.register(MODULE_ID, 'enableScanline', {
        name: getGame().i18n?.localize('MUTHUR.SETTINGS.scanline.name') || 'Scanline Effect',
        hint:
            getGame().i18n?.localize('MUTHUR.SETTINGS.scanline.hint') ||
            'Enables the light scanning effect before text display',
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: (value) => {
            console.debug(
                'Scanline effect:',
                value
                    ? getGame().i18n?.localize('MUTHUR.SETTINGS.scanline.enable') || 'Enabled'
                    : getGame().i18n?.localize('MUTHUR.SETTINGS.scanline.disable') || 'Disabled',
            );
        },
    });

    // scanline size
    getGame().settings.register(MODULE_ID, 'scanlineSize', {
        name: getGame().i18n?.localize('MUTHUR.SETTINGS.scanlineSize.name') || 'Scanline Size',
        hint:
            getGame().i18n?.localize('MUTHUR.SETTINGS.scanlineSize.hint') ||
            'Sets the size of the light point that precedes text display (in pixels)',
        scope: 'client',
        config: true,
        type: Number,
        range: {
            min: 10,
            max: 100,
            step: 5,
        },
        default: 30,
        onChange: (value) => {
            console.debug('Scanline size:', value);
        },
    });

    getGame().settings.register(MODULE_ID, 'enableTypewriter', {
        name: getGame().i18n?.localize('MUTHUR.SETTINGS.typewriter.name') || 'Typewriter Effect',
        hint:
            getGame().i18n?.localize('MUTHUR.SETTINGS.typewriter.hint') ||
            'Enables progressive text display like in the Alien movie',
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: (value) => {
            console.debug(
                'Typewriter effect:',
                value
                    ? getGame().i18n?.localize('MUTHUR.SETTINGS.typewriter.enable') || 'Enabled'
                    : getGame().i18n?.localize('MUTHUR.SETTINGS.typewriter.disable') || 'Disabled',
            );
        },
    });

    const postHackSettings = [
        { key: 'phShowInHelp', scope: 'world', type: Boolean, def: true },
        { key: 'phSpecialOrders', scope: 'world', type: Boolean, def: true },
        { key: 'phCerberus', scope: 'world', type: Boolean, def: true },
        { key: 'phDoors', scope: 'world', type: Boolean, def: true },
        { key: 'phLights', scope: 'world', type: Boolean, def: true },
        { key: 'phAlarm', scope: 'world', type: Boolean, def: true },
        { key: 'phGas', scope: 'world', type: Boolean, def: true },
        { key: 'phCryo', scope: 'world', type: Boolean, def: true },
    ] as const;
    for (const s of postHackSettings) {
        getGame().settings.register(MODULE_ID, s.key, {
            name: getGame().i18n?.localize(`MUTHUR.SETTINGS.postHack.${s.key}.name`) || s.key,
            hint: getGame().i18n?.localize(`MUTHUR.SETTINGS.postHack.${s.key}.hint`) || '',
            scope: s.scope,
            config: false,
            type: s.type,
            default: s.def,
        });
    }

    getGame().settings.register(MODULE_ID, 'alarmSoundPath', {
        name: getGame().i18n?.localize('MUTHUR.SETTINGS.alarmSoundPath.name') ?? 'MUTHUR – Alarm sound',
        hint:
            getGame().i18n?.localize('MUTHUR.SETTINGS.alarmSoundPath.hint') ??
            'Select the alarm sound to play upon activation.',
        scope: 'world',
        config: false,
        type: new foundry.data.fields.FilePathField({
            categories: ['AUDIO'],
            nullable: false,
        } as unknown as foundry.data.fields.FilePathField.DefaultOptions),
        default: '/modules/alien-mu-th-ur/sounds/reply/Computer_Reply_1.wav',
    });

    getGame().settings.register(MODULE_ID, 'allowHack', {
        name: getGame().i18n?.localize('MUTHUR.SETTINGS.allowHack.name') || 'Allow Hacking',
        hint:
            getGame().i18n?.localize('MUTHUR.SETTINGS.allowHack.hint') ||
            'Allows players to use the HACK command to attempt administrator access',
        scope: 'world',
        config: false,
        type: Boolean,
        default: true,
    });

    getGame().settings.register(MODULE_ID, 'hackDecisionByGM', {
        name: getGame().i18n?.localize('MUTHUR.SETTINGS.hackDecisionByGM.name') || 'GM approves hacking',
        hint:
            getGame().i18n?.localize('MUTHUR.SETTINGS.hackDecisionByGM.hint') ||
            'Requires GM approval for HACK attempts instead of random success',
        scope: 'world',
        config: false,
        type: Boolean,
        default: true,
    });

    // Allow moving terminals on the scene
    getGame().settings.register(MODULE_ID, 'allowDragGM', {
        name: getGame().i18n?.localize('MUTHUR.SETTINGS.allowDragGM.name') || 'Move terminal (GM)',
        hint:
            getGame().i18n?.localize('MUTHUR.SETTINGS.allowDragGM.hint') ||
            'Allow MOTHER (GM) to drag the terminal on the scene.',
        scope: 'world',
        config: false,
        type: Boolean,
        default: true,
    });

    getGame().settings.register(MODULE_ID, 'allowDragPlayers', {
        name: getGame().i18n?.localize('MUTHUR.SETTINGS.allowDragPlayers.name') || 'Move terminal (Players/Spectators)',
        hint:
            getGame().i18n?.localize('MUTHUR.SETTINGS.allowDragPlayers.hint') ||
            'Allow players and spectators to drag their terminal on the scene.',
        scope: 'world',
        config: false,
        type: Boolean,
        default: false,
    });

    getGame().settings.register(MODULE_ID, 'currentStatusKey', {
        name: getGame().i18n?.localize('MUTHUR.STATUS.current') || 'System status',
        hint:
            getGame().i18n?.localize('MUTHUR.STATUS.currentHint') || 'Select the status returned by the STATUS command',
        scope: 'world',
        config: false,
        type: String,
        choices: {
            normal: getGame().i18n?.localize('MUTHUR.STATUS.presets.normal') || 'Normal',
            anomalyDetected: getGame().i18n?.localize('MUTHUR.STATUS.presets.anomalyDetected') || 'Anomaly detected',
            systemOffline: getGame().i18n?.localize('MUTHUR.STATUS.presets.systemOffline') || 'System offline',
            degradedPerformance:
                getGame().i18n?.localize('MUTHUR.STATUS.presets.degradedPerformance') || 'Degraded performance',
            fireDetected: getGame().i18n?.localize('MUTHUR.STATUS.presets.fireDetected') || 'Fire detected',
            quarantine: getGame().i18n?.localize('MUTHUR.STATUS.presets.quarantine') || 'Quarantine',
            lockdown: getGame().i18n?.localize('MUTHUR.STATUS.presets.lockdown') || 'Lockdown',
            intrusion: getGame().i18n?.localize('MUTHUR.STATUS.presets.intrusion') || 'Intrusion detected',
            networkIssue: getGame().i18n?.localize('MUTHUR.STATUS.presets.networkIssue') || 'Network issue',
            custom: getGame().i18n?.localize('MUTHUR.STATUS.presets.custom') || 'Custom',
        },
        default: 'normal',
    });

    getGame().settings.register(MODULE_ID, 'customStatusText', {
        name: getGame().i18n?.localize('MUTHUR.STATUS.customText') || 'Custom status text',
        hint:
            getGame().i18n?.localize('MUTHUR.STATUS.customTextHint') ||
            "Enter the text shown when status is set to 'Custom'",
        scope: 'world',
        config: false,
        type: String,
        default: '',
    });

    getGame().settings.register(MODULE_ID, 'captainUserIds', {
        name: getGame().i18n?.localize('MUTHUR.ROLES.captains') || 'Captains',
        hint: getGame().i18n?.localize('MUTHUR.ROLES.captainsHint') || 'List of users authorized as Captains',
        scope: 'world',
        config: false,
        type: Array,
        default: [],
    });

    getGame().settings.register(MODULE_ID, 'allowCaptainSpecialOrders', {
        name: getGame().i18n?.localize('MUTHUR.ROLES.allowCaptainOrders') || 'Captain → Special Orders without HACK',
        hint:
            getGame().i18n?.localize('MUTHUR.ROLES.allowCaptainOrdersHint') ||
            'Allow Captains to access Special Orders without passing HACK',
        scope: 'world',
        config: false,
        type: Boolean,
        default: false,
    });
}
