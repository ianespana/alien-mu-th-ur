import gsap from 'gsap';
import {
    playCommunicationSoundThrottled,
    playReplySound,
    playTypeSound,
    setShouldContinueReplySound,
    stopReplySound,
} from '../audio-utils.js';
import { getGame, MODULE_ID } from '../constants.js';

const waitingMessageTweens = new WeakMap<HTMLElement, gsap.core.Tween>();

export async function showBootSequence(isSpectator: boolean = false): Promise<void> {
    const bootContainer = document.createElement('div');
    bootContainer.id = 'muthur-boot-sequence';
    bootContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: black;
        color: #00ff00;
        font-family: monospace;
        z-index: 999999;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        width: 80%;
        max-width: 800px;
        position: relative;
    `;
    bootContainer.appendChild(content);

    const backgroundLogo = document.createElement('div');
    backgroundLogo.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
        opacity: 0;
        z-index: -1;
    `;
    backgroundLogo.innerHTML = '';
    bootContainer.appendChild(backgroundLogo);

    document.body.appendChild(bootContainer);

    gsap.timeline().to(backgroundLogo, {
        opacity: 0.1,
        duration: 1.2,
        ease: 'power2.inOut',
    });

    const logo = document.createElement('div');
    logo.innerHTML = `
         <pre style="color: #00ff00; font-size: 14px; line-height: 1.2; text-align: center; font-weight: bold;">
██     ██ ███████ ██    ██ ██       █████  ███    ██ ██████      ██    ██ ██    ██ ████████  █████  ███    ██ ██ 
██     ██ ██       ██  ██  ██      ██   ██ ████   ██ ██   ██      ██  ██  ██    ██    ██    ██   ██ ████   ██ ██ 
██  █  ██ █████     ████   ██      ███████ ██ ██  ██ ██   ██       ████   ██    ██    ██    ███████ ██ ██  ██ ██ 
██ ███ ██ ██         ██    ██      ██   ██ ██  ██ ██ ██   ██        ██    ██    ██    ██    ██   ██ ██ ██  ██ ██
 ███ ███  ███████    ██    ███████ ██   ██ ██   ████ ██████         ██     ██████     ██    ██   ██ ██   ████ ██ 
    </pre>
`;
    content.appendChild(logo);

    const scanline = document.createElement('div');
    scanline.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: rgba(0, 255, 0, 0.2);
        pointer-events: none;
        z-index: 1000;
    `;
    bootContainer.appendChild(scanline);

    gsap.to(scanline, {
        top: '100%',
        duration: 2,
        repeat: -1,
        ease: 'none',
    });

    const bootLog = document.createElement('div');
    bootLog.style.cssText = `
        margin-top: 40px;
        font-size: 16px;
        line-height: 1.5;
        height: 300px;
        overflow: hidden;
    `;
    content.appendChild(bootLog);

    const bootMessages = [
        'WEYLAND-YUTANI CORP. - MUTHUR 6000',
        'SYSTEM INITIALIZATION...',
        'KERNEL LOADED: VERSION 7.4.2',
        'MEMORY CHECK: 2.4 TB - OK',
        'PERIPHERALS DETECTED: 14',
        'NETWORK PROTOCOLS: TCP/IP, W-NET, MU-NET',
        'SECURITY PROTOCOLS: ACTIVE',
        'ESTABLISHING SECURE CONNECTION...',
        'ACCESSING CORE SYSTEMS...',
        'SYSTEM READY.',
    ];

    for (const msg of bootMessages) {
        const line = document.createElement('div');
        bootLog.appendChild(line);
        await typeWriterEffect(line, msg, 20);
        bootLog.scrollTop = bootLog.scrollHeight;
        await new Promise((resolve) => setTimeout(resolve, 200));
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    gsap.to(bootContainer, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
            bootContainer.remove();
            if (!isSpectator) {
                window.showMuthurInterface?.();
            } else {
                if (window.showSpectatorInterface) {
                    const activeUser = window.currentMuthurSession?.userId ?? '';
                    const activeName = window.currentMuthurSession?.userName ?? '';
                    window.showSpectatorInterface(activeUser, activeName, true);
                }
            }
        },
    });
}

export function createFullScreenGlitch(): HTMLElement {
    const glitchOverlay = document.createElement('div');
    glitchOverlay.id = 'muthur-glitch-overlay';
    glitchOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 999999;
        mix-blend-mode: difference;
        opacity: 0;
    `;
    document.body.appendChild(glitchOverlay);
    return glitchOverlay;
}

export async function applyGlitchEffect(): Promise<void> {
    const gameCanvas = document.getElementById('board');

    if (Math.random() > 0.7) {
        const effects = [
            async () => {
                const blackout = document.createElement('div');
                blackout.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: black;
                    z-index: 999999;
                    pointer-events: none;
                `;
                document.body.appendChild(blackout);
                await new Promise<void>((resolve) => {
                    gsap.to(blackout, {
                        opacity: 0,
                        duration: 0.15,
                        onComplete: () => {
                            blackout.remove();
                            resolve();
                        },
                    });
                });
            },
            async () => {
                if (gameCanvas) {
                    await new Promise<void>((resolve) => {
                        gsap.to(gameCanvas, {
                            y: Math.random() * 300 - 150,
                            duration: 0.1,
                            yoyo: true,
                            repeat: 1,
                            onComplete: () => {
                                gsap.set(gameCanvas, { clearProps: 'transform' });
                                resolve();
                            },
                        });
                    });
                }
            },
            async () => {
                if (gameCanvas) {
                    await new Promise<void>((resolve) => {
                        gsap.to(gameCanvas, {
                            filter: 'brightness(2) contrast(3) hue-rotate(90deg)',
                            duration: 0.08,
                            yoyo: true,
                            repeat: 1,
                            onComplete: () => {
                                gameCanvas.style.filter = '';
                                resolve();
                            },
                        });
                    });
                }
            },
            async () => {
                const slice = document.createElement('div');
                const height = Math.random() * 100 + 50;
                const top = Math.random() * (window.innerHeight - height);
                slice.style.cssText = `
                    position: fixed;
                    top: ${top}px;
                    left: 0;
                    width: 100%;
                    height: ${height}px;
                    background: black;
                    z-index: 999999;
                    pointer-events: none;
                `;
                document.body.appendChild(slice);
                await new Promise<void>((resolve) => {
                    gsap.to(slice, {
                        opacity: 0,
                        duration: 0.12,
                        onComplete: () => {
                            slice.remove();
                            resolve();
                        },
                    });
                });
            },
        ];

        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        await randomEffect();
    }
}

export async function typeWriterEffect(element: HTMLElement, text: string, speed: number = 30): Promise<void> {
    element.textContent = '';
    await new Promise<void>((resolve) => {
        const timeline = gsap.timeline({ onComplete: resolve });
        for (let i = 0; i < text.length; i++) {
            const char = text.charAt(i);
            timeline.call(() => {
                element.textContent += char;
                playTypeSound();
            });
            timeline.to({}, { duration: speed / 1000 });
        }
    });
}

export async function displayMuthurMessage(
    chatLog: HTMLElement,
    text: string,
    prefix: string = '',
    color: string = '#00ff00',
    messageType: string = 'normal',
): Promise<HTMLElement> {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', messageType);
    messageDiv.style.color = color;
    chatLog.appendChild(messageDiv);

    if (getGame().settings.get(MODULE_ID, 'enableTypewriter')) {
        setShouldContinueReplySound(true);
        void playReplySound();

        let currentText = prefix;
        await new Promise<void>((resolve) => {
            const timeline = gsap.timeline({
                onComplete: () => {
                    stopReplySound();
                    resolve();
                },
            });
            for (let i = 0; i < text.length; i++) {
                const char = text.charAt(i);
                timeline.call(() => {
                    currentText += char;
                    messageDiv.textContent = currentText;
                    chatLog.scrollTop = chatLog.scrollHeight;
                });
                timeline.to({}, { duration: 0.03 });
            }
        });
    } else {
        messageDiv.textContent = prefix + text;
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    return messageDiv;
}

export async function displayHackMessage(
    chatLog: HTMLElement,
    message: string,
    color: string,
    type: string,
    isPassword: boolean = false,
): Promise<void> {
    const messageDiv = document.createElement('div');
    messageDiv.style.color = color;
    messageDiv.classList.add('message', type);
    chatLog.appendChild(messageDiv);

    const soundGloballyMuted = !!window.MUTHUR?.muteForSpectator;

    if (isPassword) {
        messageDiv.textContent = message;
        if (!soundGloballyMuted && getGame().settings.get(MODULE_ID, 'enableTypingSounds')) {
            playCommunicationSoundThrottled();
        }
        return;
    }

    let displayedText = '';
    await new Promise<void>((resolve) => {
        const timeline = gsap.timeline({ onComplete: resolve });
        for (const char of message) {
            timeline.call(() => {
                displayedText += char;
                messageDiv.textContent = displayedText;
                if (!soundGloballyMuted && getGame().settings.get(MODULE_ID, 'enableTypingSounds') && char === ' ') {
                    playCommunicationSoundThrottled();
                }
            });
            timeline.to({}, { duration: 0.02 });
        }
    });
}

export function updateSpectatorsWithMessage(
    text: string,
    prefix: string = '',
    color: string = '#00ff00',
    messageType: string = 'normal',
): void {
    getGame().socket?.emit('module.alien-mu-th-ur', {
        type: 'updateSpectators',
        text: text,
        prefix: prefix,
        color: color,
        messageType: messageType,
    });
}

export function syncMessageToSpectators(
    chatLog: HTMLElement,
    message: string,
    prefix: string = '',
    color: string = '#00ff00',
    messageType: string = 'normal',
): Promise<HTMLElement> {
    const messageElement = displayMuthurMessage(chatLog, message, prefix, color, messageType);
    updateSpectatorsWithMessage(message, prefix, color, messageType);
    return messageElement;
}

export function sendToGM(message: string, actionType: string = 'command', commandType: string = ''): void {
    try {
        getGame().socket.emit('module.alien-mu-th-ur', {
            type: 'muthurCommand',
            command: message,
            user: getGame().user?.name,
            userId: getGame().user?.id,
            actionType: actionType,
            commandType: commandType,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('MUTHUR | Error while sending message:', error);
        ui.notifications?.error('Communication error with MUTHUR');
    }
}

export function syncCommandResult(command: string, result: { text: string; color?: string; type?: string }): void {
    if (!getGame().socket) return;
    getGame().socket.emit('module.alien-mu-th-ur', {
        type: 'commandResult',
        command: command,
        result: result,
    });
}

export function showWaitingMessage(): HTMLElement {
    let waitingContainer = document.getElementById('muthur-waiting-container');
    if (waitingContainer) return waitingContainer;

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

    const title = document.createElement('h2');
    title.textContent = 'MU/TH/UR 6000';
    title.style.cssText = `
        color: #00ff00;
        margin-top: 0;
        font-family: monospace;
    `;
    waitingContainer.appendChild(title);

    const message = document.createElement('p');
    message.textContent =
        getGame().i18n?.localize('MUTHUR.waitingForGM') || 'Waiting for GM authorization to start MUTHUR...';
    message.style.cssText = `
        color: #00ff00;
        font-family: monospace;
        margin-bottom: 20px;
    `;
    waitingContainer.appendChild(message);

    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.cssText = `
        color: #00ff00;
        font-size: 24px;
        font-family: monospace;
    `;
    loadingIndicator.textContent = '.';
    waitingContainer.appendChild(loadingIndicator);

    let dotsCount = 1;
    const dotsTween = gsap.to(
        {},
        {
            duration: 0.5,
            repeat: -1,
            onRepeat: () => {
                dotsCount = (dotsCount % 3) + 1;
                loadingIndicator.textContent = '.'.repeat(dotsCount);
            },
        },
    );

    waitingMessageTweens.set(waitingContainer, dotsTween);
    document.body.appendChild(waitingContainer);

    return waitingContainer;
}

export function removeWaitingMessage(): void {
    const waitingContainer = document.getElementById('muthur-waiting-container');
    if (waitingContainer) {
        waitingMessageTweens.get(waitingContainer)?.kill();
        waitingMessageTweens.delete(waitingContainer);
        waitingContainer.remove();
    }
}
