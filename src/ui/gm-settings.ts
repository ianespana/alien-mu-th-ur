import { getGame, MODULE_ID } from '../constants';

const STATUS_KEYS = [
    'normal',
    'anomalyDetected',
    'systemOffline',
    'degradedPerformance',
    'fireDetected',
    'quarantine',
    'lockdown',
    'intrusion',
    'networkIssue',
    'custom',
] as const;

type StatusKey = (typeof STATUS_KEYS)[number];

function asStatusKey(v: unknown, fallback: StatusKey = 'normal'): StatusKey {
    if (typeof v !== 'string') return fallback;
    return (STATUS_KEYS as readonly string[]).includes(v) ? (v as StatusKey) : fallback;
}

export class MuthurAdminSettingsApp extends foundry.appv1.api.FormApplication {
    static override get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'muthur-admin-settings',
            title: 'MU/TH/UR Admin',
            template: `modules/${MODULE_ID}/templates/muthur-admin-settings.hbs`,
            width: 520,
            closeOnSubmit: true,
        });
    }

    override getData() {
        const game = getGame();
        return {
            allowHack: game.settings.get(MODULE_ID, 'allowHack'),
            allowDragGM: game.settings.get(MODULE_ID, 'allowDragGM'),
            allowDragPlayers: game.settings.get(MODULE_ID, 'allowDragPlayers'),
            allowCaptainSpecialOrders: game.settings.get(MODULE_ID, 'allowCaptainSpecialOrders'),

            phShowInHelp: game.settings.get(MODULE_ID, 'phShowInHelp'),
            phSpecialOrders: game.settings.get(MODULE_ID, 'phSpecialOrders'),
            phCerberus: game.settings.get(MODULE_ID, 'phCerberus'),
            phDoors: game.settings.get(MODULE_ID, 'phDoors'),
            phLights: game.settings.get(MODULE_ID, 'phLights'),
            phAlarm: game.settings.get(MODULE_ID, 'phAlarm'),
            phGas: game.settings.get(MODULE_ID, 'phGas'),
            phCryo: game.settings.get(MODULE_ID, 'phCryo'),

            currentStatusKey: game.settings.get(MODULE_ID, 'currentStatusKey'),
            customStatusText: game.settings.get(MODULE_ID, 'customStatusText'),
            alarmSoundPath: game.settings.get(MODULE_ID, 'alarmSoundPath'),

            // simple: string[] como JSON en textarea
            captainUserIds: JSON.stringify(game.settings.get(MODULE_ID, 'captainUserIds'), null, 2),
        };
    }

    override async _updateObject(_event: Event, formData: Record<string, unknown>) {
        const game = getGame();

        // checkboxes
        const bool = (k: string) => Boolean(formData[k]);

        await game.settings.set(MODULE_ID, 'allowHack', bool('allowHack'));
        await game.settings.set(MODULE_ID, 'allowDragGM', bool('allowDragGM'));
        await game.settings.set(MODULE_ID, 'allowDragPlayers', bool('allowDragPlayers'));
        await game.settings.set(MODULE_ID, 'allowCaptainSpecialOrders', bool('allowCaptainSpecialOrders'));

        await game.settings.set(MODULE_ID, 'phShowInHelp', bool('phShowInHelp'));
        await game.settings.set(MODULE_ID, 'phSpecialOrders', bool('phSpecialOrders'));
        await game.settings.set(MODULE_ID, 'phCerberus', bool('phCerberus'));
        await game.settings.set(MODULE_ID, 'phDoors', bool('phDoors'));
        await game.settings.set(MODULE_ID, 'phLights', bool('phLights'));
        await game.settings.set(MODULE_ID, 'phAlarm', bool('phAlarm'));
        await game.settings.set(MODULE_ID, 'phGas', bool('phGas'));
        await game.settings.set(MODULE_ID, 'phCryo', bool('phCryo'));

        // strings
        const currentStatusKey = asStatusKey(formData.currentStatusKey, 'normal');
        await game.settings.set(MODULE_ID, 'currentStatusKey', currentStatusKey);

        const customStatusText = typeof formData.customStatusText === 'string' ? formData.customStatusText : '';
        await game.settings.set(MODULE_ID, 'customStatusText', customStatusText);

        const alarmSoundPath = typeof formData.alarmSoundPath === 'string' ? formData.alarmSoundPath : '';
        await game.settings.set(MODULE_ID, 'alarmSoundPath', alarmSoundPath);

        /*// captains (string[])
        try {
            const rawCaptainUserIds = typeof formData.captainUserIds === 'string' ? formData.captainUserIds : '';
            const parsed = JSON.parse(rawCaptainUserIds);
            const ids = Array.isArray(parsed) ? parsed.map(String) : [];
            await game.settings.set(MODULE_ID, 'captainUserIds', ids);
        } catch {
            ui.notifications?.warn('Captain User IDs must be valid JSON (array of strings).');
        }*/
    }
}
