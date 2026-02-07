import * as actions from './actions';
import { getGame, MODULE_ID } from './constants';
import * as hacking from './hacking';
import {
    showGMSpectatorSelectionDialog,
    showMuthurInterface,
    showSpectatorInterface,
    toggleMuthurChat,
} from './interfaces.js';
import { getSession, resetSession } from './session.js';
import { registerSettings } from './settings.js';
import { handleSocketMessage } from './socket-handler.js';
import { showBootSequence } from './ui/ui-utils.js';

Hooks.once('init', () => {
    console.log('MUTHUR | Initializing Alien MU/TH/UR 6000');

    registerSettings();

    // Attach to the window for internal module access and backward compatibility
    window.MUTHUR = window.MUTHUR || {
        showMuthurInterface,
        showSpectatorInterface,
        toggleMuthurChat,
        hacking,
        actions,
    };
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

    getGame().socket?.on(`module.${MODULE_ID}`, (data) => {
        handleSocketMessage(data);
    });
});

Hooks.on('getSceneControlButtons', (controls) => {
    const toolDef: SceneControls.Tool = {
        name: 'muthur',
        title: 'MU/TH/UR 6000',
        icon: 'fas fa-robot',
        visible: true,
        button: true,
        order: 100,
        onChange: () => toggleMuthurChat(),
    };

    const token: SceneControls.Control = controls['notes'];
    token.tools[toolDef.name] = toolDef;
});
