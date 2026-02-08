import { playAlarmSound, playErrorSound } from './audio-utils.js';
import { getGame, MODULE_ID } from './constants.js';

type TaggerFlag = { tags?: string[] };
type AlienMuThurFlag = { tags?: string[]; airlockTag?: string[] };
type DoorFlags = { tagger?: TaggerFlag; 'alien-mu-th-ur'?: AlienMuThurFlag };
type StatusEffectLike = { id?: string; label?: string; name?: string; icon?: string };
type PlaceableLike = {
    document?: {
        name?: string;
        texture?: { src?: unknown; width?: number; height?: number };
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    center?: { x: number; y: number };
    name?: string;
    actor?: { type?: string };
};
type TargetRect = { x: number; y: number; w: number; h: number };
export type TokenLike = PlaceableLike & {
    id?: string;
    document?: PlaceableLike['document'] & {
        setFlag?: (scope: string, key: string, value: unknown) => Promise<unknown> | void;
        unsetFlag?: (scope: string, key: string) => Promise<unknown> | void;
        center?: { x: number; y: number };
    };
    center?: { x: number; y: number };
    toggleStatusEffect?: (effect: string, options: { active: boolean; overlay: boolean }) => Promise<unknown> | void;
};

const getStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const savedLightStates: Record<string, AmbientLightDocument['_source']> = {};
let currentAlarmSound: foundry.audio.Sound | null = null;

export function getSortedDoorDocuments() {
    const scene: Scene | undefined = game.scenes?.active;
    if (!scene) return [];

    const walls: WallDocument[] = scene.walls?.contents || scene.walls || [];
    const doorDocs: WallDocument[] = walls.filter((wall) => (wall._source.door ?? wall.door ?? 0) > 0);

    return doorDocs.slice().sort((a, b) => {
        const ac = a._source.c || a.c || [0, 0];
        const bc = a._source.c || b.c || [0, 0];
        const ax = ac[0],
            ay = ac[1];
        const bx = bc[0],
            by = bc[1];
        return ax - bx || ay - by;
    });
}

export function getDoorPreferredLabel(doorDoc: WallDocument): string {
    const flags = (doorDoc.flags || {}) as DoorFlags;
    const tagger = getStringArray(flags.tagger?.tags);
    const our = flags['alien-mu-th-ur'];
    const ourTags = getStringArray(our?.tags);
    const airlockTags = getStringArray(our?.airlockTag);
    const name = doorDoc.name || '';
    const tags: string[] = ([] as string[]).concat(name ? [name] : [], tagger, ourTags, airlockTags);
    const ad = tags.find((t) => /^AD/i.test(String(t)));
    return ad || name || '';
}

export function getDoorsByPrefix(prefix: string): WallDocument[] {
    const all = getSortedDoorDocuments();
    const pattern = new RegExp(`^${prefix}`, 'i');
    return all.filter((d) => {
        const label = getDoorPreferredLabel(d);
        return label && pattern.test(label);
    });
}

export async function applyDoorAction(doorDoc: WallDocument, action: 'LOCK' | 'UNLOCK'): Promise<void> {
    let targetState = doorDoc.ds;
    if (!targetState) return;

    if (action === 'LOCK') targetState = CONST.WALL_DOOR_STATES.LOCKED;
    if (action === 'UNLOCK') targetState = CONST.WALL_DOOR_STATES.CLOSED;
    try {
        await doorDoc.update({ ds: targetState });
    } catch (e) {
        console.error('MUTHUR Actions | Error applying door action:', e);
    }
}

export function applyLightsAction(action: 'SHUTDOWN' | 'DIM' | 'RESTORE'): string {
    const scene: Scene | undefined = getGame().scenes?.active;
    if (!scene) return 'No active scene.';
    const lights: AmbientLightDocument[] = scene.lights?.contents || scene.lights || [];
    switch (action) {
        case 'SHUTDOWN':
            lights.forEach((light) => {
                void light.update({ hidden: true, config: { alpha: 0 } });
            });
            return getGame().i18n?.localize('MUTHUR.lightsShutdown') || 'Lights shutdown complete.';
        case 'DIM':
            lights.forEach((light) => {
                const savedLight = savedLightStates[light.id || 'unknown'];
                const savedBright = savedLight?.config?.bright ?? 0;
                const savedDim = savedLight?.config?.bright ?? 0;
                void light.update({
                    hidden: false,
                    config: {
                        alpha: 0.5,
                        bright: Math.max(0, savedBright * 0.5),
                        dim: Math.max(0, savedDim * 0.5),
                    },
                });
            });
            return getGame().i18n?.localize('MUTHUR.lightsDimmed') || 'Lights dimmed.';
        case 'RESTORE':
            lights.forEach((light) => {
                const savedLight = savedLightStates[light.id || 'unknown'];
                void light.update(savedLight);
            });
            return 'Lights restored.';
        default:
            return 'OK';
    }
}

export async function applySealDeck(deck: string): Promise<number> {
    void deck;
    const doors = getSortedDoorDocuments();
    let count = 0;
    for (const d of doors) {
        await applyDoorAction(d, 'LOCK');
        count++;
    }
    return count;
}

export function triggerAlarm(withOverlay: boolean = true): void {
    if (withOverlay) {
        const overlay = document.createElement('div');
        overlay.id = 'muthur-alarm-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 0, 0, 0.2);
            z-index: 9999;
            pointer-events: none;
            animation: alarmPulse 2s infinite;
        `;
        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes alarmPulse {
                0% { opacity: 0; }
                50% { opacity: 1; }
                100% { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    try {
        const soundPath = getGame().settings.get(MODULE_ID, 'alarmSoundPath');
        if (!soundPath) return;
        void playAlarmSound(0.8).then((sound) => {
            if (sound) currentAlarmSound = sound;
        });
    } catch (error) {
        console.error('MUTHUR Actions | Error playing alarm:', error);
    }
}

export function stopAlarm(): void {
    const overlay = document.getElementById('muthur-alarm-overlay');
    if (overlay) overlay.remove();
    document.querySelectorAll('style').forEach((style) => {
        if (style.textContent?.includes('@keyframes alarmPulse')) {
            style.remove();
        }
    });
    if (currentAlarmSound) {
        void currentAlarmSound.stop();
        currentAlarmSound = null;
    }
}

export function performZoneScan(zoneLabel: string): string {
    const scene = getGame().scenes?.active;
    if (!scene) return '0 ' + (getGame().i18n?.localize('MUTHUR.lifeformsDetected') || 'lifeforms detected') + ': -';
    const tiles = (canvas?.tiles?.placeables ?? []) as PlaceableLike[];
    const regions = (canvas?.regions?.placeables ?? []) as PlaceableLike[];
    const targets: TargetRect[] = [];
    const upper = (zoneLabel || '').toUpperCase();
    for (const t of tiles) {
        const rawLabel = t.document?.name ?? t.document?.texture?.src;
        const label = (typeof rawLabel === 'string' ? rawLabel : '').toUpperCase();
        if (label.startsWith('ALIEN') && (upper === '' || label.includes(upper))) {
            const x = t.document?.x ?? t.x ?? t.center?.x ?? 0;
            const y = t.document?.y ?? t.y ?? t.center?.y ?? 0;
            const w = t.document?.width ?? t.w ?? t.document?.texture?.width ?? 0;
            const h = t.document?.height ?? t.h ?? t.document?.texture?.height ?? 0;
            targets.push({ x: x + w / 2, y: y + h / 2, w, h });
        }
    }
    for (const r of regions) {
        const regionName = r.document?.name;
        const label = (typeof regionName === 'string' ? regionName : '').toUpperCase();
        if (label.startsWith('ALIEN') && (upper === '' || label.includes(upper))) {
            const x = r.document?.x ?? r.x ?? r.center?.x ?? 0;
            const y = r.document?.y ?? r.y ?? r.center?.y ?? 0;
            const w = r.document?.width ?? r.w ?? 0;
            const h = r.document?.height ?? r.h ?? 0;
            targets.push({ x: x + w / 2, y: y + h / 2, w, h });
        }
    }
    if (!targets.length)
        return '0 ' + (getGame().i18n?.localize('MUTHUR.lifeformsDetected') || 'lifeforms detected') + ': -';
    const tokens = (canvas?.tokens?.placeables ?? []) as PlaceableLike[];
    const isInside = (tok: PlaceableLike, Z: TargetRect): boolean => {
        const tx = tok.document?.x ?? tok.x ?? tok.center?.x ?? 0;
        const ty = tok.document?.y ?? tok.y ?? tok.center?.y ?? 0;
        const tw = tok.document?.width ?? tok.w ?? tok.document?.texture?.width ?? tok.w ?? 0;
        const th = tok.document?.height ?? tok.h ?? tok.document?.texture?.height ?? tok.h ?? 0;
        const cx = tx + tw / 2;
        const cy = ty + th / 2;
        return cx >= Z.x - Z.w / 2 && cx <= Z.x + Z.w / 2 && cy >= Z.y - Z.h / 2 && cy <= Z.y + Z.h / 2;
    };
    const inside = tokens.filter((t) => targets.some((Z) => isInside(t, Z)));
    const names = inside.map((t) => {
        const actorType = t.actor?.type || '';
        const isHuman =
            /human|pc|npc|colonist|crew/i.test(actorType) || /ripley|bishop|hudson|hicks|crew/i.test(t.name || '');
        return isHuman ? t.name || 'Unknown' : getGame().i18n?.localize('MUTHUR.unknownEntity') || 'Unknown entity';
    });
    const count = names.length;
    const joined = names.join(', ');
    return `${count} ${getGame().i18n?.localize('MUTHUR.lifeformsDetected') || 'lifeforms detected'}: ${joined || '-'}.`;
}

export function getPoisonedEffect(): { id: string | null; icon: string } {
    try {
        const effects = CONFIG.statusEffects ?? [];
        const list = (Array.isArray(effects) ? effects : []) as StatusEffectLike[];
        const match =
            list.find((e) => {
                const id = (e.id || e.label || e.name || '').toString().toLowerCase();
                const label = (e.label || e.name || '').toString().toLowerCase();
                return (
                    id.includes('poison') || label.includes('poison') || id.includes('toxic') || label.includes('toxic')
                );
            }) || {};
        const id = match.id || match.label || match.name || null;
        const icon = match.icon || 'icons/svg/poison.svg';
        return { id, icon };
    } catch {
        return { id: null, icon: 'icons/svg/poison.svg' };
    }
}

export function getUnconsciousEffect(): { id: string | null; icon: string } {
    try {
        const effects = CONFIG.statusEffects ?? [];
        const list = (Array.isArray(effects) ? effects : []) as StatusEffectLike[];
        const match =
            list.find((e) => {
                const id = (e.id || e.label || e.name || '').toString().toLowerCase();
                const label = (e.label || e.name || '').toString().toLowerCase();
                return (
                    id.includes('unconscious') ||
                    id.includes('inconscient') ||
                    label.includes('unconscious') ||
                    label.includes('inconscient') ||
                    id.includes('sleep') ||
                    id.includes('stasis')
                );
            }) || {};
        const id = match.id || match.label || match.name || null;
        const icon = match.icon || 'icons/svg/sleep.svg';
        return { id, icon };
    } catch {
        return { id: null, icon: 'icons/svg/sleep.svg' };
    }
}

export async function applyGasEffect(): Promise<number> {
    const token = (canvas?.tokens?.controlled?.[0] ?? canvas?.tokens?.hover) as TokenLike | undefined;
    const center = token?.center || token?.document?.center || { x: 0, y: 0 };
    const radius = 500;
    const tokens = (canvas?.tokens?.placeables ?? []) as TokenLike[];
    let affected = 0;
    for (const t of tokens) {
        const tokenCenter = t.center || t.document?.center;
        if (!tokenCenter) continue;
        const dist = Math.hypot(tokenCenter.x - center.x, tokenCenter.y - center.y);
        if (dist <= radius) {
            affected++;
            try {
                await t.document?.setFlag?.('alien-mu-th-ur', 'gas', { poisoned: true, unconscious: true });
            } catch (error) {
                console.error('MUTHUR Actions | Error applying gas flag:', error);
            }
        }
    }
    try {
        await playErrorSound();
    } catch (error) {
        console.error('MUTHUR Actions | Error playing gas sound:', error);
    }
    return affected;
}

export async function applyPoisonToTokens(tokens: TokenLike[]): Promise<number> {
    const list = Array.from(tokens || []);
    let affected = 0;
    for (const t of list) {
        try {
            const poisoned = getPoisonedEffect();
            if (typeof t.toggleStatusEffect === 'function') {
                await t.toggleStatusEffect(poisoned.id || poisoned.icon, { active: true, overlay: false });
            }
            affected++;
        } catch (error) {
            console.error('MUTHUR Actions | Error applying poison effect:', error);
        }
    }
    return affected;
}

export async function applyCryoEffect(targetName: string): Promise<string> {
    const tokens = (canvas?.tokens?.placeables ?? []) as TokenLike[];
    let matched: TokenLike | null;
    if (targetName) {
        matched = tokens.find((t) => (t.name || '').toUpperCase() === targetName.toUpperCase()) ?? null;
    } else {
        matched = (canvas?.tokens?.controlled?.[0] as TokenLike | undefined) ?? null;
    }
    if (!matched) return '';

    try {
        await matched.document?.setFlag?.('alien-mu-th-ur', 'cryo', { stasis: true });
        const eff = getUnconsciousEffect();
        if (typeof matched.toggleStatusEffect === 'function') {
            await matched.toggleStatusEffect(eff.id || eff.icon, { active: true, overlay: true });
        }
    } catch (error) {
        console.error('MUTHUR Actions | Error applying cryo effect:', error);
    }

    return matched.name || 'TARGET';
}

export async function releaseCryoForTokens(tokenList: TokenLike[]): Promise<number> {
    let released = 0;
    const eff = getUnconsciousEffect();
    for (const tok of tokenList) {
        try {
            await tok.document?.unsetFlag?.('alien-mu-th-ur', 'cryo');
            if (typeof tok.toggleStatusEffect === 'function') {
                await tok.toggleStatusEffect(eff.id || eff.icon, { active: false, overlay: false });
            }
            released++;
        } catch (error) {
            console.error('MUTHUR Actions | Error releasing cryo effect:', error);
        }
    }
    return released;
}
