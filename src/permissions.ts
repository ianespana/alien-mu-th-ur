import { getGame, MODULE_ID } from './constants.js';

export const SPECIAL_ORDER_CODES = ['754', '899', '931', '937', '939', '966'] as const;
export type SpecialOrderCode = (typeof SPECIAL_ORDER_CODES)[number];

export const POST_HACK_COMMANDS = ['cerberus', 'doors', 'lights', 'alarm', 'gas', 'cryo'] as const;
export type PostHackCommandKey = (typeof POST_HACK_COMMANDS)[number];

export type PlayerPermissions = {
    specialOrders: Record<SpecialOrderCode, boolean>;
    commands: Record<PostHackCommandKey, boolean>;
};

const createDefaultPermissions = (): PlayerPermissions => ({
    specialOrders: {
        '754': false,
        '899': false,
        '931': false,
        '937': false,
        '939': false,
        '966': false,
    },
    commands: {
        cerberus: false,
        doors: false,
        lights: false,
        alarm: false,
        gas: false,
        cryo: false,
    },
});

let localPermissions: PlayerPermissions = createDefaultPermissions();

const clonePermissions = (perms: PlayerPermissions): PlayerPermissions => ({
    specialOrders: { ...perms.specialOrders },
    commands: { ...perms.commands },
});

const normalizePermissions = (perms: Partial<PlayerPermissions> | null | undefined): PlayerPermissions => {
    const defaults = createDefaultPermissions();
    if (!perms) return defaults;
    return {
        specialOrders: { ...defaults.specialOrders, ...perms.specialOrders },
        commands: { ...defaults.commands, ...perms.commands },
    };
};

const getPermissionsMap = (): Record<string, PlayerPermissions> => {
    if (!getGame().user?.isGM) return {};
    try {
        const stored = getGame().settings.get(MODULE_ID, 'permissionsByUser');
        if (stored && typeof stored === 'object') {
            return stored as Record<string, PlayerPermissions>;
        }
    } catch {
        return {};
    }
    return {};
};

const setPermissionsMap = (map: Record<string, PlayerPermissions>): void => {
    if (!getGame().user?.isGM) return;
    void getGame().settings.set(MODULE_ID, 'permissionsByUser', map);
};

export function getPermissionsForUser(userId: string): PlayerPermissions {
    if (getGame().user?.isGM) {
        const map = getPermissionsMap();
        return normalizePermissions(map[userId]);
    }
    return getLocalPermissions();
}

export function setPermissionsForUser(userId: string, perms: PlayerPermissions): void {
    if (!getGame().user?.isGM) return;
    const map = getPermissionsMap();
    map[userId] = clonePermissions(perms);
    setPermissionsMap(map);
}

export function getLocalPermissions(): PlayerPermissions {
    return clonePermissions(localPermissions);
}

export function setLocalPermissions(perms: PlayerPermissions): void {
    localPermissions = normalizePermissions(perms);
}

export function hasLocalCommandPermission(key: PostHackCommandKey): boolean {
    return localPermissions.commands[key];
}

export function hasLocalSpecialOrderPermission(code: SpecialOrderCode): boolean {
    return localPermissions.specialOrders[code];
}

export function canBypassHackForCommand(key: PostHackCommandKey): boolean {
    return getGame().user?.isGM || hasLocalCommandPermission(key);
}

export function canBypassHackForSpecialOrder(code: SpecialOrderCode): boolean {
    return getGame().user?.isGM || hasLocalSpecialOrderPermission(code);
}
