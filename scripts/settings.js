import { MODULE_ID } from './constants.js';

export function registerSettings() {
    // Add setting to enable/disable sound
    game.settings.register(MODULE_ID, 'enableTypingSounds', {
        name: game.i18n.localize('MUTHUR.SETTINGS.typingSound.name'),
        hint: game.i18n.localize('MUTHUR.SETTINGS.typingSound.hint'),
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: (value) => {
            console.debug(
                'Typing sounds:',
                value
                    ? game.i18n.localize('MUTHUR.SETTINGS.typingSound.enable')
                    : game.i18n.localize('MUTHUR.SETTINGS.typingSound.disable'),
            );
        },
    });

    // Post-Hack Phase Parameters: enable/disable each feature and display in HELP
    const phSettings = [
        { key: 'phShowInHelp', scope: 'world', type: Boolean, def: true },
        { key: 'phSpecialOrders', scope: 'world', type: Boolean, def: true },
        { key: 'phCerberus', scope: 'world', type: Boolean, def: true },
        { key: 'phDoors', scope: 'world', type: Boolean, def: true },
        { key: 'phLights', scope: 'world', type: Boolean, def: true },
        { key: 'phAlarm', scope: 'world', type: Boolean, def: true },
        { key: 'phGas', scope: 'world', type: Boolean, def: true },
        { key: 'phCryo', scope: 'world', type: Boolean, def: true },
    ];
    for (const s of phSettings) {
        game.settings.register(MODULE_ID, s.key, {
            name: game.i18n.localize(`MUTHUR.SETTINGS.postHack.${s.key}.name`),
            hint: game.i18n.localize(`MUTHUR.SETTINGS.postHack.${s.key}.hint`),
            scope: s.scope,
            config: true,
            type: s.type,
            default: s.def,
        });
    }

    // Setting under phAlarm: file selector for alarm sound (GM)
    try {
        game.settings.register(MODULE_ID, 'alarmSoundPath', {
            name: 'MUTHUR – Alarm sound',
            hint: 'Select the alarm sound to play upon activation.',
            scope: 'world',
            config: true,
            type: String,
            default: '/modules/alien-mu-th-ur/sounds/reply/Computer_Reply_1.wav',
            filePicker: true,
        });
    } catch (e) {}

    // Add parameter for volume
    game.settings.register(MODULE_ID, 'typingSoundVolume', {
        name: game.i18n.localize('MUTHUR.SETTINGS.typingSoundVolume.name'),
        hint: game.i18n.localize('MUTHUR.SETTINGS.typingSoundVolume.hint'),
        scope: 'client',
        config: true,
        type: Number,
        range: {
            min: 0,
            max: 1,
            step: 0.1,
        },
        default: 0.2,
    });

    // Scanline
    game.settings.register(MODULE_ID, 'enableScanline', {
        name: game.i18n.localize('MUTHUR.SETTINGS.scanline.name'),
        hint: game.i18n.localize('MUTHUR.SETTINGS.scanline.hint'),
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: (value) => {
            console.debug(
                'Scanline effect:',
                value
                    ? game.i18n.localize('MUTHUR.SETTINGS.scanline.enable')
                    : game.i18n.localize('MUTHUR.SETTINGS.scanline.disable'),
            );
        },
    });

    // scanline size
    game.settings.register(MODULE_ID, 'scanlineSize', {
        name: game.i18n.localize('MUTHUR.SETTINGS.scanlineSize.name'),
        hint: game.i18n.localize('MUTHUR.SETTINGS.scanlineSize.hint'),
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

    // Register module settings
    game.settings.register(MODULE_ID, 'enableTypewriter', {
        name: game.i18n.localize('MUTHUR.SETTINGS.typewriter.name'),
        hint: game.i18n.localize('MUTHUR.SETTINGS.typewriter.hint'),
        scope: 'client',
        config: true,
        type: Boolean,
        default: true,
        onChange: (value) => {
            console.debug(
                'Typewriter effect:',
                value
                    ? game.i18n.localize('MUTHUR.SETTINGS.typewriter.enable')
                    : game.i18n.localize('MUTHUR.SETTINGS.typewriter.disable'),
            );
        },
    });

    game.settings.register(MODULE_ID, 'allowHack', {
        name: game.i18n.localize('MUTHUR.SETTINGS.allowHack.name'),
        hint: game.i18n.localize('MUTHUR.SETTINGS.allowHack.hint'),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        restricted: true,
    });

    // Allow moving terminals on the scene
    game.settings.register(MODULE_ID, 'allowDragGM', {
        name: game.i18n.localize('MUTHUR.SETTINGS.allowDragGM.name'),
        hint: game.i18n.localize('MUTHUR.SETTINGS.allowDragGM.hint'),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        restricted: true,
    });
    game.settings.register(MODULE_ID, 'allowDragPlayers', {
        name: game.i18n.localize('MUTHUR.SETTINGS.allowDragPlayers.name'),
        hint: game.i18n.localize('MUTHUR.SETTINGS.allowDragPlayers.hint'),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        restricted: true,
    });

    // [Roles & Status] World settings (GM only)
    game.settings.register(MODULE_ID, 'currentStatusKey', {
        name: 'MUTHUR.STATUS.current',
        hint: 'MUTHUR.STATUS.currentHint',
        scope: 'world',
        config: true,
        type: String,
        choices: {
            normal: 'MUTHUR.STATUS.presets.normal',
            anomalyDetected: 'MUTHUR.STATUS.presets.anomalyDetected',
            systemOffline: 'MUTHUR.STATUS.presets.systemOffline',
            degradedPerformance: 'MUTHUR.STATUS.presets.degradedPerformance',
            fireDetected: 'MUTHUR.STATUS.presets.fireDetected',
            quarantine: 'MUTHUR.STATUS.presets.quarantine',
            lockdown: 'MUTHUR.STATUS.presets.lockdown',
            intrusion: 'MUTHUR.STATUS.presets.intrusion',
            networkIssue: 'MUTHUR.STATUS.presets.networkIssue',
            custom: 'MUTHUR.STATUS.presets.custom',
        },
        default: 'normal',
        restricted: true,
    });

    game.settings.register(MODULE_ID, 'customStatusText', {
        name: 'MUTHUR.STATUS.customText',
        hint: 'MUTHUR.STATUS.customTextHint',
        scope: 'world',
        config: true,
        type: String,
        default: '',
        restricted: true,
    });

    game.settings.register(MODULE_ID, 'captainUserIds', {
        name: 'MUTHUR.ROLES.captains',
        hint: 'MUTHUR.ROLES.captainsHint',
        scope: 'world',
        config: false,
        type: Array,
        default: [],
        restricted: true,
    });

    game.settings.register(MODULE_ID, 'allowCaptainSpecialOrders', {
        name: 'MUTHUR.ROLES.allowCaptainOrders',
        hint: 'MUTHUR.ROLES.allowCaptainOrdersHint',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        restricted: true,
    });
}
