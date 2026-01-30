import * as actions from './actions.js';
import { playErrorSound } from './audio-utils.js';
import { MODULE_ID } from './constants.js';
import { getHackStatus, simulateHackingAttempt } from './hacking.js';
import { handleSpecialOrder } from './special-orders.js';
import { sendToGM, syncMessageToSpectators } from './ui-utils.js';

export async function handleCommand(input, chatLog) {
    if (!input.value.trim()) return;

    const rawInput = input.value.trim();
    input.value = '';

    // If it starts with /, it's a special command
    if (!rawInput.startsWith('/')) {
        // All other text is a message to Mother
        const message = rawInput;
        await syncMessageToSpectators(chatLog, message, '> ', '#00ff00', 'command');

        if (!game.user.isGM) {
            sendToGM(message);
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
            break;
        case 'EXIT':
            if (window.toggleMuthurChat) window.toggleMuthurChat();
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
                    game.i18n.localize('MUTHUR.unknownCommandPrefix') + '/' + command,
                    '',
                    '#ff0000',
                    'error',
                );
                if (game.settings.get(MODULE_ID, 'enableTypingSounds')) {
                    playErrorSound();
                }
            }
            break;
    }
}

async function handleActionCommand(action, target, chatLog) {
    const isHacked = getHackStatus();
    if (!isHacked && !game.user.isGM) {
        await syncMessageToSpectators(chatLog, game.i18n.localize('MOTHER.AccessDenied'), '', '#ff0000', 'error');
        return;
    }

    // Map command to action settings key
    const settingMap = {
        LOCK: 'phDoors',
        UNLOCK: 'phDoors',
        LIST_DOORS: 'phDoors',
        SHUTDOWN_LIGHTS: 'phLights',
        DIM_LIGHTS: 'phLights',
        RESTORE_LIGHTS: 'phLights',
        ACTIVATE_ALARM: 'phAlarm',
        GAS_TARGETS: 'phGas',
        CRYO_POD: 'phCryo',
        CRYO_RELEASE: 'phCryo',
    };

    const settingKey = settingMap[action];
    if (settingKey && !game.settings.get(MODULE_ID, settingKey)) {
        await syncMessageToSpectators(chatLog, game.i18n.localize('MUTHUR.unknownCommand'), '', '#ff0000', 'error');
        return;
    }

    // Logic for sending to GM for approval or executing directly if GM
    if (game.user.isGM) {
        await executeAction(action, target, chatLog);
    } else {
        sendToGM(target ? `${action} ${target}` : action, 'action', action);
        await syncMessageToSpectators(chatLog, game.i18n.localize('MUTHUR.waitingForMother'), '', '#00ff00', 'reply');
    }
}

export async function executeAction(action, target, chatLog) {
    let resultText = '';
    switch (action) {
        case 'LOCK':
        case 'UNLOCK':
            const doors = actions.getDoorsByPrefix(target);
            if (doors.length === 0) {
                resultText = game.i18n.localize('MUTHUR.noDoorsFound');
            } else {
                for (const d of doors) {
                    await actions.applyDoorAction(d, action);
                }
                resultText = game.i18n.format(action === 'LOCK' ? 'MUTHUR.doorLocked' : 'MUTHUR.doorUnlocked', {
                    label: target,
                });
            }
            break;
        case 'LIST_DOORS':
            const allDoors = actions.getSortedDoorDocuments();
            if (allDoors.length === 0) {
                resultText = game.i18n.localize('MUTHUR.noDoorsFound');
            } else {
                resultText =
                    game.i18n.localize('MUTHUR.doorListHeader') +
                    '\n' +
                    allDoors.map((d) => actions.getDoorPreferredLabel(d)).join('\n');
            }
            break;
        case 'SHUTDOWN_LIGHTS':
            resultText = await actions.applyLightsAction('SHUTDOWN');
            break;
        case 'DIM_LIGHTS':
            resultText = await actions.applyLightsAction('DIM');
            break;
        case 'RESTORE_LIGHTS':
            resultText = await actions.applyLightsAction('RESTORE');
            break;
        case 'ACTIVATE_ALARM':
            await actions.triggerAlarm();
            resultText = game.i18n.localize('MUTHUR.alarmActivated');
            break;
        case 'GAS_TARGETS':
            const affected = await actions.applyGasEffect();
            resultText = `${affected} ${game.i18n.localize('MUTHUR.entitiesAffected')}`;
            break;
        case 'CRYO_POD':
            const cryoTarget = await actions.applyCryoEffect(target);
            resultText = cryoTarget
                ? game.i18n.format('MUTHUR.cryoApplied', { name: cryoTarget })
                : game.i18n.localize('MUTHUR.cryoNoMatch');
            break;
        case 'CRYO_RELEASE':
            // This usually needs a dialog for multi-selection, but for command line we might just release all for now
            // or return a message saying it needs GM interface.
            resultText = 'CRYO RELEASE COMMAND RECEIVED. USE GM INTERFACE FOR SELECTION.';
            break;
    }

    if (resultText) {
        await syncMessageToSpectators(chatLog, resultText, '', '#00ff00', 'reply');
    }
}

async function handleHelp(chatLog) {
    const isHacked = getHackStatus();
    const showPostHack = game.settings.get(MODULE_ID, 'phShowInHelp') && isHacked;

    let helpText = game.i18n.localize('MUTHUR.help');

    if (showPostHack) {
        const sections = [
            'sections.specialOrders',
            'sections.cerberus',
            'sections.doors',
            'sections.lights',
            'sections.alarm',
            'sections.gas',
            'sections.cryo',
            'sections.cryoRelease',
        ];
        let postHackHelp = '\n\n' + game.i18n.localize('MUTHUR.postHack.title');
        for (const s of sections) {
            postHackHelp += '\n- ' + game.i18n.localize(`MUTHUR.helpMenu.${s}.desc`);
        }
        helpText += postHackHelp;
    }

    await syncMessageToSpectators(chatLog, helpText, '', '#00ff00', 'reply');
}

async function handleStatus(chatLog) {
    const statusKey = game.settings.get(MODULE_ID, 'currentStatusKey') || 'normal';
    let statusText = '';

    if (statusKey === 'custom') {
        statusText =
            game.settings.get(MODULE_ID, 'customStatusText') || game.i18n.localize('MUTHUR.STATUS.text.normal');
    } else {
        statusText = game.i18n.localize(`MUTHUR.STATUS.text.${statusKey}`);
    }

    await syncMessageToSpectators(chatLog, statusText, '', '#00ff00', 'reply');
}

async function handleHack(chatLog) {
    if (!game.settings.get(MODULE_ID, 'allowHack')) {
        await syncMessageToSpectators(chatLog, game.i18n.localize('MUTHUR.HackAttemptMessage'), '', '#ff0000', 'error');
        return;
    }

    await simulateHackingAttempt(chatLog);
}

async function processSpecialCommand(command, chatLog) {
    const isCaptain = (() => {
        try {
            const ids = game.settings.get(MODULE_ID, 'captainUserIds') || [];
            return ids.includes(game.user.id);
        } catch (e) {
            return false;
        }
    })();

    const allowCaptain = (() => {
        try {
            return game.settings.get(MODULE_ID, 'allowCaptainSpecialOrders');
        } catch (e) {
            return true;
        }
    })();

    const canAccess = game.user.isGM || getHackStatus() || (allowCaptain && isCaptain);
    if (!canAccess) {
        await syncMessageToSpectators(chatLog, game.i18n.localize('MOTHER.AccessDenied'), '', '#ff0000', 'error');
        if (!game.user.isGM) {
            sendToGM(game.i18n.format('MUTHUR.SpecialOrderAttempt', { command }));
        }
        if (game.settings.get(MODULE_ID, 'enableTypingSounds')) {
            playErrorSound();
        }
        return;
    }

    await handleSpecialOrder(chatLog, command);
}

function isSpecialOrder(cmd) {
    const orderWords = [game.i18n.localize('MOTHER.Keywords.Order').toUpperCase(), 'ORDER'];
    const specialWords = [
        game.i18n.localize('MOTHER.Keywords.Special').toUpperCase(),
        game.i18n.localize('MOTHER.Keywords.Special2').toUpperCase(),
    ];
    const isValidNumber = (num) => /^(937|938|939|\d{3})$/.test(num);

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

function isCerberus(cmd) {
    const protocolWords = [game.i18n.localize('MOTHER.Keywords.Protocol').toUpperCase(), 'PROTOCOL'];
    const words = cmd.split(/\s+/);
    return (
        words.includes('CERBERUS') ||
        (words.length === 2 && protocolWords.includes(words[0]) && words[1] === 'CERBERUS')
    );
}
