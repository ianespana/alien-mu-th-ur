import * as actions from './actions.js';
import { playErrorSound } from './audio-utils.js';
import { getGame, MODULE_ID } from './constants.js';
import { getHackStatus, simulateHackingAttempt } from './hacking.js';
import {
    canBypassHackForCommand,
    canBypassHackForSpecialOrder,
    hasAnyLocalCommandPermission,
    hasAnyLocalSpecialOrderPermission,
    SPECIAL_ORDER_CODES,
} from './permissions.js';
import { handleSpecialOrder } from './special-orders.js';
import {
    displayMuthurMessage,
    lockPlayerInput,
    sendToGM,
    startReplyWait,
    syncMessageToSpectators,
} from './ui/ui-utils.js';

export async function handleCommand(input: HTMLInputElement, chatLog: HTMLElement): Promise<void> {
    if (!input.value.trim()) return;

    const rawInput = input.value.trim();
    input.value = '';

    // If it starts with /, it's a special command
    if (!rawInput.startsWith('/')) {
        // All other text is a message to Mother
        const message = rawInput;
        await syncMessageToSpectators(chatLog, message, '> ', '#00ff00', 'command');

        if (!getGame().user?.isGM) {
            sendToGM(message);
            lockPlayerInput();
            startReplyWait(chatLog, getGame().i18n?.localize('MUTHUR.waitingForMother') || 'WAITING FOR MOTHER');
        }

        return;
    }

    const fullCommand = rawInput.substring(1).trim().toUpperCase();
    const words = fullCommand.split(/\s+/);
    const command = words[0];
    const args = words.slice(1);

    await syncMessageToSpectators(chatLog, rawInput, '> ');
    chatLog.scrollTop = chatLog.scrollHeight;

    switch (command) {
        case 'HELP':
            await handleHelp(chatLog);
            break;
        case 'STATUS':
            await handleStatus(chatLog);
            break;
        case 'CLEAR':
            chatLog.innerHTML = '';
            if (!getGame().user?.isGM) {
                getGame().socket?.emit('module.alien-mu-th-ur', {
                    type: 'clearSpectatorChat',
                });
            }
            break;
        case 'EXIT':
            window.toggleMuthurChat?.();
            break;
        case 'HACK':
            await handleHack(chatLog);
            break;
        case 'LOCK':
            if (args[0] === 'DOOR') {
                await handleActionCommand('LOCK', args.slice(1).join(' '), chatLog);
            } else {
                await handleActionCommand('LOCK', args.join(' '), chatLog);
            }
            break;
        case 'UNLOCK':
            if (args[0] === 'DOOR') {
                await handleActionCommand('UNLOCK', args.slice(1).join(' '), chatLog);
            } else {
                await handleActionCommand('UNLOCK', args.join(' '), chatLog);
            }
            break;
        case 'DOORS':
            await handleActionCommand('LIST_DOORS', '', chatLog);
            break;
        case 'SHUTDOWN':
            if (args[0] === 'LIGHTS') {
                await handleActionCommand('SHUTDOWN_LIGHTS', '', chatLog);
            } else {
                await handleActionCommand('SHUTDOWN_LIGHTS', '', chatLog);
            }
            break;
        case 'DIM':
            if (args[0] === 'LIGHTS') {
                await handleActionCommand('DIM_LIGHTS', '', chatLog);
            } else {
                await handleActionCommand('DIM_LIGHTS', '', chatLog);
            }
            break;
        case 'RESTORE':
            if (args[0] === 'LIGHTS') {
                await handleActionCommand('RESTORE_LIGHTS', '', chatLog);
            } else {
                await handleActionCommand('RESTORE_LIGHTS', '', chatLog);
            }
            break;
        case 'ACTIVATE':
            if (args[0] === 'ALARM') {
                await handleActionCommand('ACTIVATE_ALARM', '', chatLog);
            } else {
                await handleActionCommand('ACTIVATE_ALARM', '', chatLog);
            }
            break;
        case 'STOP':
            if (args[0] === 'ALARM') {
                await handleActionCommand('STOP_ALARM', '', chatLog);
            }
            break;
        case 'GAS':
            if (args[0] === 'TARGETS') {
                await handleActionCommand('GAS_TARGETS', '', chatLog);
            } else {
                await handleActionCommand('GAS_TARGETS', '', chatLog);
            }
            break;
        case 'CRYO':
            if (args[0] === 'POD') {
                await handleActionCommand('CRYO_POD', args.slice(1).join(' '), chatLog);
            } else if (args[0] === 'RELEASE') {
                await handleActionCommand('CRYO_RELEASE', '', chatLog);
            } else {
                await handleActionCommand('CRYO_POD', args.join(' '), chatLog);
            }
            break;
        default:
            // Check if it's a Special Order or Cerberus
            if (isSpecialOrder(fullCommand) || isCerberus(fullCommand)) {
                await processSpecialCommand(fullCommand, chatLog);
            } else {
                // Unknown special command
                await syncMessageToSpectators(
                    chatLog,
                    (getGame().i18n?.localize('MUTHUR.unknownCommandPrefix') || 'COMMAND NOT RECOGNIZED : ') +
                        '/' +
                        command,
                    '',
                    '#ff0000',
                    'error',
                );
                if (getGame().settings.get(MODULE_ID, 'enableTypingSounds')) {
                    void playErrorSound();
                }
            }
            break;
    }
}

async function handleActionCommand(action: string, target: string, chatLog: HTMLElement): Promise<void> {
    const isHacked = getHackStatus();
    const hasAccess = isHacked || canBypassHackForCommand(mapActionToCommandKey(action));
    if (!hasAccess) {
        await syncMessageToSpectators(
            chatLog,
            getGame().i18n?.localize('MOTHER.AccessDenied') ||
                '!!! ACCESS DENIED !!!\n\nINSUFFICIENT AUTHORIZATION LEVEL\nADMINISTRATOR IDENTIFICATION REQUIRED\n\nUNAUTHORIZED ACCESS ATTEMPT LOGGED\nERROR CODE: WY-SEC-451',
            '',
            '#ff0000',
            'error',
        );
        return;
    }

    // Map command to action settings key
    const settingMap: Record<string, ClientSettings.KeyFor<'alien-mu-th-ur'>> = {
        LOCK: 'phDoors',
        UNLOCK: 'phDoors',
        LIST_DOORS: 'phDoors',
        SHUTDOWN_LIGHTS: 'phLights',
        DIM_LIGHTS: 'phLights',
        RESTORE_LIGHTS: 'phLights',
        ACTIVATE_ALARM: 'phAlarm',
        STOP_ALARM: 'phAlarm',
        GAS_TARGETS: 'phGas',
        CRYO_POD: 'phCryo',
        CRYO_RELEASE: 'phCryo',
    };

    const settingKey = settingMap[action];
    if (settingKey && !getGame().settings.get(MODULE_ID, settingKey)) {
        await syncMessageToSpectators(
            chatLog,
            getGame().i18n?.localize('MUTHUR.unknownCommand') || "COMMAND NOT RECOGNIZED. TYPE 'HELP' FOR COMMAND LIST",
            '',
            '#ff0000',
            'error',
        );
        return;
    }

    if (action === 'CRYO_RELEASE') {
        getGame().socket?.emit('module.alien-mu-th-ur', {
            type: 'cryoReleaseRequest',
            fromId: getGame().user?.id,
            fromName: getGame().user?.name,
        });
        if (!getGame().user?.isGM) {
            await syncMessageToSpectators(
                chatLog,
                getGame().i18n?.localize('MUTHUR.waitingForMother') || 'WAITING FOR MOTHER',
                '',
                '#00ff00',
                'reply',
            );
            lockPlayerInput();
            startReplyWait(chatLog);
        }
        return;
    }

    // Logic for sending to GM for approval or executing directly if GM
    if (getGame().user?.isGM) {
        await executeAction(action, target, chatLog);
    } else {
        sendToGM(target ? `${action} ${target}` : action, 'action', action);
        await syncMessageToSpectators(
            chatLog,
            getGame().i18n?.localize('MUTHUR.waitingForMother') || 'WAITING FOR MOTHER',
            '',
            '#00ff00',
            'reply',
        );
        lockPlayerInput();
        startReplyWait(chatLog);
    }
}

export async function executeAction(action: string, target: string, chatLog: HTMLElement): Promise<string | null> {
    let resultText = '';
    switch (action) {
        case 'LOCK':
        case 'UNLOCK': {
            const doors = actions.getDoorsByPrefix(target);
            if (doors.length === 0) {
                resultText = getGame().i18n?.localize('MUTHUR.noDoorsFound') || 'No doors found.';
            } else {
                for (const d of doors) {
                    await actions.applyDoorAction(d, action);
                }
                resultText =
                    getGame().i18n?.format(action === 'LOCK' ? 'MUTHUR.doorLocked' : 'MUTHUR.doorUnlocked', {
                        label: target,
                    }) || `door ${target} ${action === 'LOCK' ? 'LOCKED' : 'UNLOCKED'}.`;
            }
            break;
        }
        case 'LIST_DOORS': {
            const allDoors = actions.getSortedDoorDocuments();
            if (allDoors.length === 0) {
                resultText = getGame().i18n?.localize('MUTHUR.noDoorsFound') || 'No doors found.';
            } else {
                resultText =
                    (getGame().i18n?.localize('MUTHUR.doorListHeader') || 'Doors in area:') +
                    '\n' +
                    allDoors.map((d) => actions.getDoorPreferredLabel(d)).join('\n');
            }
            break;
        }
        case 'SHUTDOWN_LIGHTS':
            resultText = actions.applyLightsAction('SHUTDOWN') || '';
            break;
        case 'DIM_LIGHTS':
            resultText = actions.applyLightsAction('DIM') || '';
            break;
        case 'RESTORE_LIGHTS':
            resultText = actions.applyLightsAction('RESTORE') || '';
            break;
        case 'ACTIVATE_ALARM':
            actions.triggerAlarm();
            getGame().socket?.emit('module.alien-mu-th-ur', { type: 'alarmControl', action: 'on' });
            resultText = getGame().i18n?.localize('MUTHUR.alarmActivated') || 'ALARM ACTIVATED.';
            break;
        case 'STOP_ALARM':
            actions.stopAlarm();
            getGame().socket?.emit('module.alien-mu-th-ur', { type: 'alarmControl', action: 'off' });
            resultText = getGame().i18n?.localize('MUTHUR.alarmStopped') || 'ALARM STOPPED.';
            break;
        case 'GAS_TARGETS': {
            const affected = await actions.applyGasEffect();
            resultText = `${affected} ${getGame().i18n?.localize('MUTHUR.entitiesAffected') || 'entities affected'}`;
            break;
        }
        case 'CRYO_POD': {
            const cryoTarget = await actions.applyCryoEffect(target);
            resultText = cryoTarget
                ? getGame().i18n?.format('MUTHUR.cryoApplied', { name: cryoTarget }) ||
                  `CRYO STASIS APPLIED: ${cryoTarget}.`
                : getGame().i18n?.localize('MUTHUR.cryoNoMatch') || 'NO MATCHING CRYO TARGET.';
            break;
        }
        case 'CRYO_RELEASE':
            // This usually needs a dialog for multi-selection, but for command line we might just release all for now
            // or return a message saying it needs GM interface.
            resultText = 'CRYO RELEASE COMMAND RECEIVED. USE GM INTERFACE FOR SELECTION.';
            break;
    }

    if (resultText) {
        await syncMessageToSpectators(chatLog, resultText, '', '#00ff00', 'reply');
    }
    return resultText || null;
}

async function handleHelp(chatLog: HTMLElement): Promise<void> {
    const isGM = getGame().user?.isGM ?? false;
    const isHacked = getHackStatus();
    const hasAnyPerms = hasAnyLocalCommandPermission() || hasAnyLocalSpecialOrderPermission();
    const showPostHack = isGM || isHacked || hasAnyPerms;
    const header = getGame().i18n?.localize('MUTHUR.helpHeader') || 'AVAILABLE COMMANDS:';
    const footer = getGame().i18n?.localize('MUTHUR.helpFooter') || 'AWAITING COMMAND...';

    const lines: string[] = [];
    const baseKeys = ['help', 'status', 'clear', 'exit', 'hack'] as const;
    for (const key of baseKeys) {
        const text = getGame().i18n?.localize(`MUTHUR.helpCommands.${key}`);
        if (text && text !== `MUTHUR.helpCommands.${key}`) {
            lines.push(text);
        }
    }

    if (showPostHack) {
        const canOrders = isGM || isHacked || hasAnyLocalSpecialOrderPermission();
        const canCerberus = isGM || isHacked || canBypassHackForCommand('cerberus');
        const canDoors = isGM || isHacked || canBypassHackForCommand('doors');
        const canLights = isGM || isHacked || canBypassHackForCommand('lights');
        const canAlarm = isGM || isHacked || canBypassHackForCommand('alarm');
        const canGas = isGM || isHacked || canBypassHackForCommand('gas');
        const canCryo = isGM || isHacked || canBypassHackForCommand('cryo');

        if (canOrders) {
            for (const code of SPECIAL_ORDER_CODES) {
                const allowed = isGM || isHacked || canBypassHackForSpecialOrder(code);
                if (!allowed) continue;
                const nameKey = `MOTHER.SpecialOrders.${code}.name`;
                const nameText = getGame().i18n?.localize(nameKey);
                lines.push(nameText && nameText !== nameKey ? nameText : `SPECIAL ORDER ${code}`);
            }
        }

        if (canCerberus) {
            const text = getGame().i18n?.localize('MUTHUR.helpCommands.cerberus');
            if (text && text !== 'MUTHUR.helpCommands.cerberus') lines.push(text);
        }
        if (canDoors) {
            const text = getGame().i18n?.localize('MUTHUR.helpCommands.doors');
            if (text && text !== 'MUTHUR.helpCommands.doors') lines.push(text);
        }
        if (canLights) {
            const text = getGame().i18n?.localize('MUTHUR.helpCommands.lights');
            if (text && text !== 'MUTHUR.helpCommands.lights') lines.push(text);
        }
        if (canAlarm) {
            const text = getGame().i18n?.localize('MUTHUR.helpCommands.alarm');
            if (text && text !== 'MUTHUR.helpCommands.alarm') lines.push(text);
        }
        if (canGas) {
            const text = getGame().i18n?.localize('MUTHUR.helpCommands.gas');
            if (text && text !== 'MUTHUR.helpCommands.gas') lines.push(text);
        }
        if (canCryo) {
            const text = getGame().i18n?.localize('MUTHUR.helpCommands.cryo');
            if (text && text !== 'MUTHUR.helpCommands.cryo') lines.push(text);
            const releaseText = getGame().i18n?.localize('MUTHUR.helpCommands.cryoRelease');
            if (releaseText && releaseText !== 'MUTHUR.helpCommands.cryoRelease') lines.push(releaseText);
        }
    }

    const helpText = `${header}\n- ${lines.join('\n- ')}\n\n${footer}`;
    await syncMessageToSpectators(chatLog, helpText, '', '#00ff00', 'reply');
}

async function handleStatus(chatLog: HTMLElement): Promise<void> {
    if (!getGame().user?.isGM) {
        getGame().socket?.emit('module.alien-mu-th-ur', {
            type: 'statusRequest',
            fromId: getGame().user?.id,
            fromName: getGame().user?.name,
        });
        sendToGM('STATUS', 'command', 'valid');
        await displayMuthurMessage(
            chatLog,
            getGame().i18n?.localize('MUTHUR.waitingResponse') || 'WAITING FOR MOTHER RESPONSE...',
            '',
            '#00ff00',
            'communication',
        );
        lockPlayerInput();
        startReplyWait(chatLog);
        return;
    }

    const statusKey = (getGame().settings.get(MODULE_ID, 'currentStatusKey') as string) || 'normal';
    let statusText: string;

    if (statusKey === 'custom') {
        statusText =
            getGame().settings.get(MODULE_ID, 'customStatusText') ||
            getGame().i18n?.localize('MUTHUR.STATUS.text.normal') ||
            'MUTHUR 6000 v2.1.0\nALL SYSTEMS FUNCTIONAL\nNO ANOMALIES DETECTED';
    } else {
        statusText =
            getGame().i18n?.localize(`MUTHUR.STATUS.text.${statusKey}`) || 'MUTHUR 6000 v2.1.0\nSYSTEM STATUS UNKNOWN';
    }

    await syncMessageToSpectators(chatLog, statusText, '', '#00ff00', 'reply');
}

async function handleHack(chatLog: HTMLElement): Promise<void> {
    if (!getGame().settings.get(MODULE_ID, 'allowHack') && getGame().user !== null) {
        const message =
            getGame().i18n?.format('MUTHUR.HackAttemptMessage', { user: getGame().user?.name ?? '' }) ||
            `${getGame().user?.name ?? 'Unknown user'} attempted to use the HACK command (currently disabled)`;
        await syncMessageToSpectators(chatLog, message, '', '#ff0000', 'error');
        return;
    }

    await simulateHackingAttempt(chatLog);
}

async function processSpecialCommand(command: string, chatLog: HTMLElement): Promise<void> {
    const isHacked = getHackStatus();
    let canAccess = getGame().user?.isGM || isHacked;
    if (!canAccess && isCerberus(command)) {
        canAccess = canBypassHackForCommand('cerberus');
    } else if (!canAccess) {
        const orderKey = command
            .toUpperCase()
            .replace(/^ORDRE\s+SPECIAL\s+/i, '')
            .replace(/^ORDRE\s+SPÃ‰CIAL\s+/i, '')
            .replace(/^ORDER\s+SPECIAL\s+/i, '')
            .replace(/^SPECIAL\s+ORDRE\s+/i, '')
            .replace(/^SPÃ‰CIAL\s+ORDRE\s+/i, '')
            .replace(/^SPECIAL\s+ORDER\s+/i, '')
            .replace(/^ORDRE\s+/i, '')
            .replace(/^ORDER\s+/i, '')
            .replace(/^SPECIAL\s+/i, '')
            .replace(/^SPÃ‰CIAL\s+/i, '')
            .replace(/^PROTOCOLE\s+/i, '')
            .replace(/^PROTOCOL\s+/i, '')
            .trim();
        if ((SPECIAL_ORDER_CODES as readonly string[]).includes(orderKey)) {
            canAccess = canBypassHackForSpecialOrder(orderKey as (typeof SPECIAL_ORDER_CODES)[number]);
        }
    }
    if (!canAccess) {
        await syncMessageToSpectators(
            chatLog,
            getGame().i18n?.localize('MOTHER.AccessDenied') ||
                '!!! ACCESS DENIED !!!\n\nINSUFFICIENT AUTHORIZATION LEVEL\nADMINISTRATOR IDENTIFICATION REQUIRED\n\nUNAUTHORIZED ACCESS ATTEMPT LOGGED\nERROR CODE: WY-SEC-451',
            '',
            '#ff0000',
            'error',
        );
        if (!getGame().user?.isGM) {
            sendToGM(
                getGame().i18n?.format('MUTHUR.SpecialOrderAttempt', { command }) ||
                    `Special order access attempt: ${command}`,
            );
        }
        if (getGame().settings.get(MODULE_ID, 'enableTypingSounds')) {
            void playErrorSound();
        }
        return;
    }

    await handleSpecialOrder(chatLog, command);
}

function mapActionToCommandKey(action: string): 'doors' | 'lights' | 'alarm' | 'gas' | 'cryo' {
    if (action === 'LOCK' || action === 'UNLOCK' || action === 'LIST_DOORS') return 'doors';
    if (action === 'SHUTDOWN_LIGHTS' || action === 'DIM_LIGHTS' || action === 'RESTORE_LIGHTS') return 'lights';
    if (action === 'ACTIVATE_ALARM' || action === 'STOP_ALARM') return 'alarm';
    if (action === 'GAS_TARGETS') return 'gas';
    return 'cryo';
}

function isSpecialOrder(cmd: string): boolean {
    const orderWords = [(getGame().i18n?.localize('MOTHER.Keywords.Order') || 'ORDER').toUpperCase(), 'ORDER'];
    const specialWords = [
        (getGame().i18n?.localize('MOTHER.Keywords.Special') || 'SPECIAL').toUpperCase(),
        (getGame().i18n?.localize('MOTHER.Keywords.Special2') || 'SPECIAL').toUpperCase(),
    ];
    const isValidNumber = (num: string) => /^(937|938|939|\d{3})$/.test(num);

    const words = cmd.split(/\s+/);
    if (words.length === 1) return isValidNumber(words[0]);
    if (words.length === 2) {
        return (orderWords.includes(words[0]) || specialWords.includes(words[0])) && isValidNumber(words[1]);
    }
    if (words.length === 3) {
        return (
            ((orderWords.includes(words[0]) && specialWords.includes(words[1])) ||
                (specialWords.includes(words[0]) && orderWords.includes(words[1]))) &&
            isValidNumber(words[2])
        );
    }
    return false;
}

function isCerberus(cmd: string): boolean {
    const protocolWords = [
        (getGame().i18n?.localize('MOTHER.Keywords.Protocol') || 'PROTOCOL').toUpperCase(),
        'PROTOCOL',
    ];
    const words = cmd.split(/\s+/);
    return (
        words.includes('CERBERUS') ||
        (words.length === 2 && protocolWords.includes(words[0]) && words[1] === 'CERBERUS')
    );
}
