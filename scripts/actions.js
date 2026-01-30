import { playErrorSound } from './audio-utils.js';
import { MODULE_ID } from './constants.js';

let savedLightStates = null;

export function getSortedDoorDocuments() {
    const scene = game.scenes.active;
    if (!scene) return [];
    const walls = scene.walls?.contents || scene.walls || [];
    const doorDocs = walls.filter((w) => (w.document?.door ?? w.door ?? 0) > 0);

    return doorDocs.slice().sort((a, b) => {
        const ac = a.document?.c || a.c || [0, 0];
        const bc = b.document?.c || b.c || [0, 0];
        const ax = ac[0],
            ay = ac[1];
        const bx = bc[0],
            by = bc[1];
        return ax - bx || ay - by;
    });
}

export function getDoorPreferredLabel(doorDoc) {
    const doc = doorDoc?.document || doorDoc;
    const flags = doc?.flags || {};
    const tagger = flags['tagger']?.tags || [];
    const our = flags['alien-mu-th-ur'] || {};
    const name = doc?.name || '';
    const tags = [].concat(name ? [name] : [], tagger, our.tags || [], our.airlockTag || []);
    const ad = tags.find((t) => /^AD/i.test(String(t)));
    return ad || name || '';
}

export function getDoorsByPrefix(prefix) {
    const all = getSortedDoorDocuments();
    return all.filter((d) => {
        const label = getDoorPreferredLabel(d);
        return label && new RegExp(`^${prefix}`, 'i').test(label);
    });
}

export async function applyDoorAction(doorDoc, action) {
    if (!doorDoc) return;
    const doc = doorDoc.document || doorDoc;
    let targetState = doc.ds ?? doc.document?.ds;
    if (action === 'LOCK') targetState = 2;
    if (action === 'UNLOCK') targetState = 1;
    try {
        if (doc.update) {
            await doc.update({ ds: targetState });
        }
    } catch (e) {
        console.error('MUTHUR Actions | Error applying door action:', e);
    }
}

export async function applyLightsAction(action) {
    const scene = game.scenes.active;
    if (!scene) return 'No active scene.';
    const lights = scene.lights?.contents || scene.lights || [];

    if (action === 'SHUTDOWN') {
        savedLightStates = lights.map((l) => ({
            id: l.id || l.document?.id,
            bright: l.document?.bright ?? l.bright,
            dim: l.document?.dim ?? l.dim,
            hidden: l.document?.hidden ?? l.hidden,
            alpha: l.document?.alpha ?? l.alpha,
        }));
        for (const l of lights) {
            const doc = l.document || l;
            await doc.update({ hidden: true, alpha: 0 });
        }
        return game.i18n.localize('MUTHUR.lightsShutdown') || 'Lights shutdown complete.';
    }

    if (action === 'DIM') {
        if (!savedLightStates) {
            savedLightStates = lights.map((l) => ({
                id: l.id || l.document?.id,
                bright: l.document?.bright ?? l.bright,
                dim: l.document?.dim ?? l.dim,
                hidden: l.document?.hidden ?? l.hidden,
                alpha: l.document?.alpha ?? l.alpha,
            }));
        }
        for (const l of lights) {
            const doc = l.document || l;
            const curBright = doc.bright ?? doc.document?.bright ?? 1;
            const curDim = doc.dim ?? doc.document?.dim ?? 1;
            await doc.update({
                hidden: false,
                alpha: 0.5,
                bright: Math.max(0, curBright * 0.5),
                dim: Math.max(0, curDim * 0.5),
            });
        }
        return game.i18n.localize('MUTHUR.lightsDimmed') || 'Lights dimmed.';
    }

    if (action === 'RESTORE') {
        if (!savedLightStates) return game.i18n.localize('MUTHUR.noSavedLights') || 'No saved lights state to restore.';
        const byId = new Map(savedLightStates.map((s) => [s.id, s]));
        for (const l of lights) {
            const doc = l.document || l;
            const s = byId.get(doc.id);
            if (!s) continue;
            await doc.update({
                hidden: s.hidden,
                alpha: s.alpha,
                bright: s.bright,
                dim: s.dim,
            });
        }
        return game.i18n.localize('MUTHUR.lightsRestored') || 'Lights restored.';
    }
    return 'OK';
}

export async function applySealDeck(deck) {
    const doors = getSortedDoorDocuments();
    let count = 0;
    for (const d of doors) {
        await applyDoorAction(d, 'LOCK');
        count++;
    }
    return count;
}

export async function triggerAlarm(withOverlay = true) {
    if (withOverlay) {
        const overlay = document.createElement('div');
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

        setTimeout(() => {
            overlay.remove();
            style.remove();
        }, 10000);
    }

    try {
        const soundPath = game.settings.get(MODULE_ID, 'alarmSoundPath');
        if (soundPath) {
            AudioHelper.play({ src: soundPath, volume: 0.8, loop: true }, true);
        }
    } catch (e) {}
}

export async function performZoneScan(zoneLabel) {
    const scene = game.scenes.active;
    if (!scene) return '0 ' + (game.i18n.localize('MUTHUR.lifeformsDetected') || 'lifeforms detected') + ': -';
    const tiles = canvas?.tiles?.placeables || [];
    const regions = canvas?.regions?.placeables || [];
    const targets = [];
    const upper = (zoneLabel || '').toUpperCase();
    for (const t of tiles) {
        const label = (t.document?.name || t.document?.texture?.src || '').toUpperCase();
        if (label.startsWith('ALIEN') && (upper === '' || label.includes(upper))) {
            const x = t.document?.x ?? t.x ?? t.center?.x ?? 0;
            const y = t.document?.y ?? t.y ?? t.center?.y ?? 0;
            const w = t.document?.width ?? t.w ?? t.document?.texture?.width ?? 0;
            const h = t.document?.height ?? t.h ?? t.document?.texture?.height ?? 0;
            targets.push({ x: x + w / 2, y: y + h / 2, w, h });
        }
    }
    for (const r of regions) {
        const label = (r.document?.name || '').toUpperCase();
        if (label.startsWith('ALIEN') && (upper === '' || label.includes(upper))) {
            const x = r.document?.x ?? r.x ?? r.center?.x ?? 0;
            const y = r.document?.y ?? r.y ?? r.center?.y ?? 0;
            const w = r.document?.width ?? r.w ?? 0;
            const h = r.document?.height ?? r.h ?? 0;
            targets.push({ x: x + w / 2, y: y + h / 2, w, h });
        }
    }
    if (!targets.length) return '0 ' + (game.i18n.localize('MUTHUR.lifeformsDetected') || 'lifeforms detected') + ': -';
    const tokens = canvas?.tokens?.placeables || [];
    const isInside = (tok, Z) => {
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
        return isHuman ? t.name || 'Unknown' : game.i18n.localize('MUTHUR.unknownEntity') || 'Unknown entity';
    });
    const count = names.length;
    const joined = names.join(', ');
    return `${count} ${game.i18n.localize('MUTHUR.lifeformsDetected') || 'lifeforms detected'}: ${joined || '-'}.`;
}

export function getPoisonedEffect() {
    try {
        const effects = CONFIG.statusEffects ?? [];
        const list = Array.isArray(effects) ? effects : Array.from(effects.values?.() || []);
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
    } catch (e) {
        return { id: null, icon: 'icons/svg/poison.svg' };
    }
}

export function getUnconsciousEffect() {
    try {
        const effects = CONFIG.statusEffects ?? [];
        const list = Array.isArray(effects) ? effects : Array.from(effects.values?.() || []);
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
    } catch (e) {
        return { id: null, icon: 'icons/svg/sleep.svg' };
    }
}

export async function applyGasEffect() {
    const token = canvas?.tokens?.controlled?.[0] || canvas?.tokens?.hover;
    const center = token?.center || token?.document?.center || { x: 0, y: 0 };
    const radius = 500;
    const tokens = canvas?.tokens?.placeables || [];
    let affected = 0;
    for (const t of tokens) {
        const dist = Math.hypot(t.center.x - center.x, t.center.y - center.y);
        if (dist <= radius) {
            affected++;
            try {
                await t.document?.setFlag?.('alien-mu-th-ur', 'gas', { poisoned: true, unconscious: true });
            } catch (e) {}
        }
    }
    try {
        await playErrorSound();
    } catch (e) {}
    return affected;
}

export async function applyPoisonToTokens(tokens) {
    const list = Array.from(tokens || []);
    let affected = 0;
    for (const t of list) {
        try {
            const poisoned = getPoisonedEffect();
            if (typeof t.toggleStatusEffect === 'function') {
                await t.toggleStatusEffect(poisoned.id || poisoned.icon, { active: true, overlay: false });
            }
            affected++;
        } catch (e) {}
    }
    return affected;
}

export async function applyCryoEffect(targetName) {
    const tokens = canvas?.tokens?.placeables || [];
    let matched = null;
    if (targetName) {
        matched = tokens.find((t) => (t.name || '').toUpperCase() === targetName.toUpperCase());
    } else {
        matched = canvas?.tokens?.controlled?.[0] || null;
    }
    if (!matched) return '';

    try {
        await matched.document?.setFlag?.('alien-mu-th-ur', 'cryo', { stasis: true });
        const eff = getUnconsciousEffect();
        if (typeof matched.toggleStatusEffect === 'function') {
            await matched.toggleStatusEffect(eff.id || eff.icon, { active: true, overlay: true });
        }
    } catch (e) {}

    return matched.name || 'TARGET';
}

export async function releaseCryoForTokens(tokenList) {
    let released = 0;
    const eff = getUnconsciousEffect();
    for (const tok of tokenList) {
        try {
            await tok.document?.unsetFlag?.('alien-mu-th-ur', 'cryo');
            if (typeof tok.toggleStatusEffect === 'function') {
                await tok.toggleStatusEffect(eff.id || eff.icon, { active: false, overlay: false });
            }
            released++;
        } catch (e) {}
    }
    return released;
}
