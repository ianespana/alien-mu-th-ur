/**
 * Fix for MU/TH/UR spectator mode
 * This script fixes synchronization issues between the active player and spectators
 */

// Wait for the document to be ready
Hooks.once('ready', () => {
    console.log("MU/TH/UR | Loading fixes for spectator mode");
    
    // Spectator audio policy: same rules as the player (game.settings)
    try { window.MUTHUR = window.MUTHUR || {}; window.MUTHUR.muteForSpectator = false; } catch(e) {}
    
    // Function to update spectator interfaces with a new message
    window.updateSpectatorsWithMessage = function(text, prefix = '', color = '#00ff00', messageType = 'normal') {
        // Send the message to all spectators via the socket
        game.socket.emit('module.alien-mu-th-ur', {
            type: 'updateSpectators',
            text: text,
            prefix: prefix,
            color: color,
            messageType: messageType
        });
    };
    
    // Function to synchronize messages between the active player and spectators
    window.syncMessageToSpectators = function(chatLog, message, prefix = '', color = '#00ff00', messageType = 'normal') {
        // Display the message in the local chat
        const messageElement = displayMuthurMessage(chatLog, message, prefix, color, messageType);
        
        // Update spectator interfaces with the same message
        updateSpectatorsWithMessage(message, prefix, color, messageType);
        
        return messageElement;
    };
    
    // Function to synchronize special command results
    window.syncCommandResult = function(command, result) {
        // Send the command result to all spectators
        game.socket.emit('module.alien-mu-th-ur', {
            type: 'commandResult',
            command: command,
            result: result
        });
    };
    
    // Function to display a waiting message while the GM selects spectators
    window.showWaitingMessage = function() {
        // Check if a waiting message already exists
        let waitingContainer = document.getElementById('muthur-waiting-container');
        if (waitingContainer) {
            return waitingContainer;
        }
        
        // Create the waiting message container
        waitingContainer = document.createElement('div');
        waitingContainer.id = 'muthur-waiting-container';
        waitingContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: black;
            border: 2px solid #00ff00;
            padding: 20px;
            z-index: 100000;
            text-align: center;
            font-family: monospace;
            min-width: 400px;
        `;
        
        // Add the title
        const title = document.createElement('h2');
        title.textContent = "MU/TH/UR 6000";
        title.style.cssText = `
            color: #00ff00;
            margin-top: 0;
            font-family: monospace;
        `;
        waitingContainer.appendChild(title);
        
        // Add the waiting message
        const message = document.createElement('p');
        message.textContent = game.i18n.localize("MUTHUR.waitingForGM");
        message.style.cssText = `
            color: #00ff00;
            font-family: monospace;
            margin-bottom: 20px;
        `;
        waitingContainer.appendChild(message);
        
        // Add a loading indicator (blinking dots)
        const loadingIndicator = document.createElement('div');
        loadingIndicator.style.cssText = `
            color: #00ff00;
            font-size: 24px;
            font-family: monospace;
        `;
        loadingIndicator.textContent = ".";
        waitingContainer.appendChild(loadingIndicator);
        
        // Animation of blinking dots
        let dots = 1;
        const loadingInterval = setInterval(() => {
            dots = (dots % 3) + 1;
            loadingIndicator.textContent = ".".repeat(dots);
        }, 500);
        
        // Store the interval in an attribute to be able to clean it up later
        waitingContainer.dataset.intervalId = loadingInterval;
        
        // Add to document
        document.body.appendChild(waitingContainer);
        
        return waitingContainer;
    };
    
    // Replace toggleMuthurChat function to display a waiting message
    const originalToggleMuthurChat = window.toggleMuthurChat;
    if (originalToggleMuthurChat) {
        window.toggleMuthurChat = function() {
            let chatContainer = document.getElementById('muthur-chat-container');

            // If a window already exists, close it
            if (chatContainer) {
                chatContainer.remove();
                if (currentMuthurSession.userId === game.user.id) {
                    currentMuthurSession.active = false;
                    currentMuthurSession.userId = null;
                    currentMuthurSession.userName = null;

                    game.socket.emit('module.alien-mu-th-ur', {
                        type: 'sessionStatus',
                        active: false
                    });
                }
                if (!game.user.isGM) {
                    sendToGM(game.i18n.localize("MUTHUR.sessionEnded"), 'close');
                }
                return;
            }

            // Check if a session is active before creating a new one
            if (currentMuthurSession.active && currentMuthurSession.userId !== game.user.id) {
                ui.notifications.warn(game.i18n.format("MUTHUR.sessionActiveWarning", { userName: currentMuthurSession.userName }));
                return;
            }

            // Differentiate GM/Player behavior
            if (game.user.isGM) {
                showMuthurInterface();
            } else {
                // Display a waiting message while the GM selects spectators
                showWaitingMessage();
                
                // Update session state
                currentMuthurSession.active = true;
                currentMuthurSession.userId = game.user.id;
                currentMuthurSession.userName = game.user.name;
                
                // Inform the GM that a player has launched MU/TH/UR and wait for their spectator selection
                game.socket.emit('module.alien-mu-th-ur', {
                    type: 'requestSpectatorSelection',
                    userId: game.user.id,
                    userName: game.user.name
                });
            }
        };
    }
    
    // Modify showBootSequence function to handle spectators
    const originalShowBootSequence = window.showBootSequence;
    if (originalShowBootSequence) {
        window.showBootSequence = function(isSpectator = false) {
            // Close the waiting message if it exists
            const waitingContainer = document.getElementById('muthur-waiting-container');
            if (waitingContainer) {
                // Clean up the interval
                if (waitingContainer.dataset.intervalId) {
                    clearInterval(parseInt(waitingContainer.dataset.intervalId));
                }
                waitingContainer.remove();
            }
            
            // Call the original function
            return originalShowBootSequence(isSpectator);
        };
    }
    
    // Modify showMuthurInterface function to use syncMessageToSpectators
    const originalShowMuthurInterface = window.showMuthurInterface;
    if (originalShowMuthurInterface) {
        window.showMuthurInterface = function() {
            const interfaceElement = originalShowMuthurInterface();
            
            // Replace calls to displayMuthurMessage with syncMessageToSpectators
            const chatLog = interfaceElement.querySelector('.muthur-chat-log');
            if (chatLog) {
                // Display welcome message with syncMessageToSpectators
                chatLog.innerHTML = ''; // Empty the chat log
                syncMessageToSpectators(chatLog, game.i18n.localize("MUTHUR.welcome"), '', '#00ff00', 'reply');
            }
            
            return interfaceElement;
        };
    }
    
    // Replace showGMSpectatorSelectionDialog function
    const originalShowGMSpectatorSelectionDialog = window.showGMSpectatorSelectionDialog;
    if (originalShowGMSpectatorSelectionDialog) {
        window.showGMSpectatorSelectionDialog = function(activeUserId, activeUserName) {
            // Call the original function
            const dialog = originalShowGMSpectatorSelectionDialog(activeUserId, activeUserName);
            
            // Replace button event handlers
            const confirmButton = dialog.querySelector('button:first-child');
            const cancelButton = dialog.querySelector('button:last-child');
            
            if (confirmButton && cancelButton) {
                // Remove existing handlers
                const newConfirmButton = confirmButton.cloneNode(true);
                const newCancelButton = cancelButton.cloneNode(true);
                confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
                cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
                
                // Add new handlers
                newConfirmButton.addEventListener('click', () => {
                    // Get selected players
                    const selectedPlayers = [];
                    const checkboxes = dialog.querySelectorAll('input[type="checkbox"]');
                    checkboxes.forEach(checkbox => {
                        if (checkbox.checked) {
                            selectedPlayers.push(checkbox.value);
                        }
                    });
                    
                    // Close the dialog window
                    dialog.remove();
                    
                    // Send a signal to selected players to open the interface in spectator mode
                    if (selectedPlayers.length > 0) {
                        game.socket.emit('module.alien-mu-th-ur', {
                            type: 'openSpectatorInterface',
                            spectatorIds: selectedPlayers,
                            activeUserId: activeUserId,
                            activeUserName: activeUserName
                        });
                    }
                    
                    // Send a signal to the active player and spectators to continue with the boot sequence
                    game.socket.emit('module.alien-mu-th-ur', {
                        type: 'continueBootSequence',
                        targetUserId: activeUserId,
                        spectatorIds: selectedPlayers
                    });
                });
                
                newCancelButton.addEventListener('click', () => {
                    // Close the dialog window
                    dialog.remove();
                    
                    // Send a signal to the active player to continue with the boot sequence (without spectators)
                    game.socket.emit('module.alien-mu-th-ur', {
                        type: 'continueBootSequence',
                        targetUserId: activeUserId,
                        spectatorIds: []
                    });
                });
            }
            
            return dialog;
        };
    }
    
    // Add a function to synchronize hacking animations
    window.syncHackingAttempt = function() {
        try { console.debug('MUTHUR Spectator | syncHackingAttempt requested by initiator'); } catch(e) {}
        // Inform spectators that a hacking attempt is in progress
        game.socket.emit('module.alien-mu-th-ur', {
            type: 'hackingAttempt'
        });
    };
    
    // Replace simulateHackingAttempt function to synchronize with spectators
    const originalSimulateHackingAttempt = window.simulateHackingAttempt;
    if (originalSimulateHackingAttempt) {
        window.simulateHackingAttempt = async function(chatLog) {
            // Synchronize with spectators
            syncHackingAttempt();
            
            // Call the original function
            return await originalSimulateHackingAttempt(chatLog);
        };
    }
    
    // Function to display hacking animations on spectators
    window.showSpectatorHackingAnimation = async function() {
        const spectatorChatLog = document.querySelector('.muthur-spectator-log');
        if (spectatorChatLog) {
            // Create hacking animation windows
            try {
                const creator = (window.createHackingWindows || window.parent?.createHackingWindows);
                if (creator) {
                    const stopper = creator();
                    if (stopper) { window.stopHackingWindows = stopper; }
                }
            } catch (e) { console.warn('createHackingWindows not available', e); }
            
            // Add hacking-active class to container
            const container = document.getElementById('muthur-spectator-container');
            if (container) {
                container.classList.add('hacking-active');
            }
            
            // Wait for animation to end (about 10 seconds)
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Clean up hacking elements
            try { if (window.stopHackingWindows) { window.stopHackingWindows(); window.stopHackingWindows = null; } } catch (e) {}
            try { (window.clearHackingElements || window.parent?.clearHackingElements)?.(); } catch (e) {}
            
            // Remove hacking-active class
            if (container) {
                container.classList.remove('hacking-active');
            }
        }
    };
    
    // Listen for socket events for spectators
    game.socket.on('module.alien-mu-th-ur', (data) => {
        // Clear spectator side chat when player sends CLEAR
        if (data.type === 'clearSpectatorChat' && !game.user.isGM) {
            try {
                const spectatorLog = document.querySelector('.muthur-spectator-log');
                if (spectatorLog) {
                    spectatorLog.innerHTML = '';
                }
            } catch(e) { /* no-op */ }
        }

        // Ensure spectators see the boot sequence
        if (data.type === 'continueBootSequence' && !game.user.isGM) {
            if (data.spectatorIds && data.spectatorIds.includes(game.user.id)) {
                try { (window.showBootSequence || window.parent?.showBootSequence)?.(true); } catch (e) { console.warn('Spectator boot error:', e); }
                try { window.currentMuthurSession = window.currentMuthurSession || {}; window.currentMuthurSession.spectatorIds = data.spectatorIds; } catch(e) {}
                // Sound follows global settings, no activation prompt
            }
        }
        
        // Handle hacking attempts for spectators
        if (data.type === 'hackingAttempt' && !game.user.isGM) {
            try { console.debug('MUTHUR Spectator | hackingAttempt received'); } catch(e) {}
            try { showSpectatorHackingAnimation(); } catch (e) { console.warn('Spectator hacking animation error:', e); }
        }

        // Real-time hack text stream (sequences + passwords)
        if (data.type === 'hackStream' && !game.user.isGM) {
            const spectatorLog = document.querySelector('.muthur-spectator-log');
            if (spectatorLog) {
                try { displayHackMessage(spectatorLog, data.text, data.color || '#00ff00', data.msgType || 'reply', !!data.isPassword); } catch(e) { console.warn('hackStream display error', e); }
                spectatorLog.scrollTop = spectatorLog.scrollHeight;
            }
        }

        // Reproduce player's periodic glitches
        if (data.type === 'hackGlitch' && !game.user.isGM) {
            try {
                const container = document.getElementById('muthur-spectator-container');
                (window.createFullScreenGlitch || window.MUTHUR?.applyScreenGlitch || (()=>{}))(200);
                if (container && window.MUTHUR?.applyLightGlitch) window.MUTHUR.applyLightGlitch(container, 400);
            } catch(e) { /* no-op */ }
        }

        // Stop glitches exactly at AdminPrivileges step
        if (data.type === 'hackStopGlitch' && !game.user.isGM) {
            try {
                const container = document.getElementById('muthur-spectator-container');
                if (container) container.classList.remove('hacking-active');
                if (window.stopHackingWindows) { window.stopHackingWindows(); window.stopHackingWindows = null; }
                const overlay = document.getElementById('muthur-glitch-overlay');
                if (overlay) overlay.remove();
            } catch(e) {}
        }

        // End of hack: clean up windows/glitches on spectator side
        if (data.type === 'hackComplete' && !game.user.isGM) {
            try {
                const container = document.getElementById('muthur-spectator-container');
                if (container) container.classList.remove('hacking-active');
                (window.clearHackingElements || window.parent?.clearHackingElements)?.();
                const overlay = document.getElementById('muthur-glitch-overlay');
                if (overlay) overlay.remove();
                // Kill any remaining anim timers
                try { if (window.stopHackingWindows) window.stopHackingWindows(); } catch(e) {}

                // Reproduce player's final visual step: empty chat and red background
                const spectatorLog = document.querySelector('.muthur-spectator-log');
                if (spectatorLog) {
                    spectatorLog.innerHTML = '';
                    spectatorLog.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                }
            } catch(e) { console.warn('Spectator hackComplete cleanup error', e); }
        }
        
        // Close spectator interface if the session is closed (EXIT on player side)
        if (data.type === 'sessionStatus' && !data.active && !game.user.isGM) {
            try {
                const container = document.getElementById('muthur-spectator-container');
                if (container) container.remove();
            } catch(e) { /* no-op */ }
        }
        
        // Handle special command results for spectators
        if (data.type === 'commandResult' && !game.user.isGM) {
            try {
                if (window.currentMuthurSession && window.currentMuthurSession.spectatorIds && window.currentMuthurSession.spectatorIds.includes(game.user.id)) {
                const spectatorLog = document.querySelector('.muthur-spectator-log');
                if (spectatorLog) {
                    // Process different types of results
                    if (data.command === 'SPECIAL_ORDER') {
                        // Display result of special order
                        displayMuthurMessage(spectatorLog, data.result.text, '', data.result.color || '#00ff00', data.result.type || 'reply');
                    } else if (data.command === 'HACK') {
                        // Display result of hack
                        displayMuthurMessage(spectatorLog, data.result.text, '', data.result.color || '#ff0000', data.result.type || 'error');
                    } else {
                        // Display any other command result
                        displayMuthurMessage(spectatorLog, data.result.text, '', data.result.color || '#00ff00', data.result.type || 'reply');
                    }
                }
            }
            } catch (e) { console.warn('Spectator commandResult sync error:', e); }
        }
        
        // Synchronize messages between active player and spectators
        if (data.type === 'requestCurrentMessages' && data.targetUserId === game.user.id) {
            // Active player sends all current messages to the spectator who just connected
            const chatLog = document.querySelector('.muthur-chat-log');
            if (chatLog) {
                const messages = chatLog.querySelectorAll('.message');
                const messageData = [];
                
                messages.forEach(msg => {
                    messageData.push({
                        text: msg.textContent,
                        color: msg.style.color,
                        messageType: Array.from(msg.classList).find(c => c !== 'message') || 'normal'
                    });
                });
                
                game.socket.emit('module.alien-mu-th-ur', {
                    type: 'syncMessages',
                    messages: messageData,
                    targetSpectatorId: data.spectatorId
                });
            }
        }
        
        if (data.type === 'syncMessages' && data.targetSpectatorId === game.user.id) {
            // Spectator receives all current messages from the active player
            const spectatorLog = document.querySelector('.muthur-spectator-log');
            if (spectatorLog) {
                // Clear existing messages
                spectatorLog.innerHTML = '';
                
                // Add all received messages
                data.messages.forEach(msg => {
                    displayMuthurMessage(spectatorLog, msg.text, '', msg.color, msg.messageType);
                });
                
                spectatorLog.scrollTop = spectatorLog.scrollHeight;
            }
        }

        // Close any MU/TH/UR interface on spectator side when session is deactivated
        if (data.type === 'sessionStatus' && !data.active && !game.user.isGM) {
            try {
                const container = document.getElementById('muthur-spectator-container');
                if (container) container.remove();
            } catch(e) { /* no-op */ }
        }
    });

    // Spectator sounds: follow settings (no forced mute)
    try { window.MUTHUR = window.MUTHUR || {}; window.MUTHUR.muteForSpectator = false; } catch (e) {}

    // Support for alarm overlay for spectators (in case the overlay is not already synchronized)
    try {
        window.muthurSpectatorAlarmOn = function(){
            let ov = document.getElementById('muthur-alarm-overlay');
            if (!ov) {
                ov = document.createElement('div');
                ov.id = 'muthur-alarm-overlay';
                ov.style.cssText = 'position:fixed; inset:0; background:rgba(255,0,0,0.12); pointer-events:none; z-index:100002; animation: alarmPulse 1s infinite;';
                const style = document.createElement('style');
                style.textContent = '@keyframes alarmPulse { 0%{opacity:0.3} 50%{opacity:0.6} 100%{opacity:0.3} }';
                document.head.appendChild(style);
                document.body.appendChild(ov);
            }
        };
        window.muthurSpectatorAlarmOff = function(){
            const ov = document.getElementById('muthur-alarm-overlay');
            if (ov) ov.remove();
        };
    } catch(e) {}
});
