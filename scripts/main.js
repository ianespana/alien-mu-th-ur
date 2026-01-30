import * as actions from './actions.js';
import { MODULE_ID } from './constants.js';
import * as hacking from './hacking.js';
import {
    showGMSpectatorSelectionDialog,
    showMuthurInterface,
    showSpectatorInterface,
    toggleMuthurChat,
} from './interfaces.js';
import { getSession, resetSession, updateSession } from './session.js';
import { registerSettings } from './settings.js';
import { handleSocketMessage } from './socket-handler.js';
import { showBootSequence } from './ui-utils.js';

Hooks.once('init', () => {
    console.log('MUTHUR | Initializing Alien MU/TH/UR 6000');

    // Register module API
    const module = game.modules.get(MODULE_ID);
    if (module) {
        module.api = {
            showMuthurInterface,
            showSpectatorInterface,
            toggleMuthurChat,
            hacking,
            actions,
        };
    }

    registerSettings();

    // Attach to the window for internal module access and backward compatibility
    window.MUTHUR = window.MUTHUR || {};
    window.showMuthurInterface = showMuthurInterface;
    window.showSpectatorInterface = showSpectatorInterface;
    window.toggleMuthurChat = toggleMuthurChat;
    window.showGMSpectatorSelectionDialog = showGMSpectatorSelectionDialog;
    window.showBootSequence = showBootSequence;
    window.currentMuthurSession = getSession();

    // Hacking functions
    window.simulateHackingAttempt = hacking.simulateHackingAttempt;
    window.clearHackingElements = hacking.clearHackingElements;
    window.createHackingWindows = hacking.createHackingWindows;
});

Hooks.once('ready', () => {
    resetSession();
    window.currentMuthurSession = getSession();

    game.socket.on(`module.${MODULE_ID}`, (data) => {
        handleSocketMessage(data);
    });
});

Hooks.on('getSceneControlButtons', (controls) => {
    const toolDef = {
        name: 'muthur',
        title: 'MU/TH/UR 6000',
        icon: 'fas fa-robot',
        visible: true,
        onClick: () => toggleMuthurChat(),
        button: true,
    };

    const controlList = Array.isArray(controls) ? controls : controls.controls;
    if (controlList) {
        const targetGroup = controlList.find((c) => c.name === 'token') || controlList.find((c) => c.name === 'notes');
        if (targetGroup && !targetGroup.tools.some((t) => t.name === toolDef.name)) {
            targetGroup.tools.push(toolDef);
        }
    } else if (controls && typeof controls === 'object') {
        const targetKey = controls.notes ? 'notes' : controls.token ? 'token' : Object.keys(controls)[0];
        if (targetKey && controls[targetKey]) {
            const group = controls[targetKey];
            if (Array.isArray(group.tools)) {
                if (!group.tools.some((t) => t.name === toolDef.name)) group.tools.push(toolDef);
            } else if (group.tools) {
                group.tools[toolDef.name] = toolDef;
            }
        }
    }
});

Hooks.on('disconnect', () => {
    updateSession({ active: false, userId: null, userName: null });
});
