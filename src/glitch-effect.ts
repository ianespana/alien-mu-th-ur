import { ERROR_SNIPPETS, SYSTEM_MESSAGES } from './constants.js';

export function startGlitchEffect(): () => void {
    const style = document.createElement('style');
    style.textContent = `
        .terminal-window {
            position: fixed;
            background: rgba(0, 20, 0, 0.9);
            border: 2px solid #00ff00;
            color: #00ff00;
            font-family: monospace;
            padding: 10px;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 0 10px #00ff00;
        }
        @keyframes glowPulse {
            0% { box-shadow: 0 0 10px #00ff00; }
            50% { box-shadow: 0 0 20px #00ff00; }
            100% { box-shadow: 0 0 10px #00ff00; }
        }
        @keyframes glowPulseRed {
            0% { box-shadow: 0 0 10px #ff0000; }
            50% { box-shadow: 0 0 20px #ff0000; }
            100% { box-shadow: 0 0 10px #ff0000; }
        }
    `;
    document.head.appendChild(style);

    const windows = new Set<HTMLElement>();
    const intervals = new Set<NodeJS.Timeout>();
    let isRunning = true;

    function createWindow() {
        const window = document.createElement('div');
        window.classList.add('terminal-window');
        window.style.cssText = `
            width: ${Math.random() * 300 + 200}px;
            height: ${Math.random() * 200 + 150}px;
            top: ${Math.random() * (document.documentElement.clientHeight - 200)}px;
            left: ${Math.random() * (document.documentElement.clientWidth - 300)}px;
            animation: glowPulse 2s infinite ease-in-out;
        `;

        const header = document.createElement('div');
        header.style.cssText = `border-bottom: 1px solid #00ff00; padding-bottom: 5px; margin-bottom: 10px; font-size: 0.9em;`;
        header.innerHTML = `MOTHER TERMINAL ${Math.floor(Math.random() * 9999)
            .toString()
            .padStart(4, '0')}`;
        window.appendChild(header);

        const codeContainer = document.createElement('div');
        codeContainer.style.cssText = `height: calc(100% - 30px); overflow: hidden; font-size: 12px; line-height: 1.2;`;
        window.appendChild(codeContainer);

        document.body.appendChild(window);
        windows.add(window);

        let codeContent = '';
        const updateInterval = setInterval(() => {
            if (!isRunning) return;
            const newContent: string[] = [];
            const isError = Math.random() < 0.3;

            if (isError) {
                const msg = ERROR_SNIPPETS[Math.floor(Math.random() * ERROR_SNIPPETS.length)];
                newContent.push(`<span style="color: #ff0000;">${msg}</span>`);
                window.style.animation = 'glowPulseRed 2s infinite ease-in-out';
            } else {
                newContent.push(SYSTEM_MESSAGES[Math.floor(Math.random() * SYSTEM_MESSAGES.length)]);
                window.style.animation = 'glowPulse 2s infinite ease-in-out';
            }

            codeContent += newContent.join('\n') + '\n';
            const lines = codeContent.split('\n').slice(-20);
            codeContainer.innerHTML = lines.join('\n');
        }, 500);

        intervals.add(updateInterval);

        setTimeout(
            () => {
                window.remove();
                windows.delete(window);
                clearInterval(updateInterval);
                intervals.delete(updateInterval);
            },
            10000 + Math.random() * 5000,
        );
    }

    const mainInterval = setInterval(() => {
        if (isRunning && windows.size < 5) createWindow();
    }, 2000);

    return () => {
        isRunning = false;
        clearInterval(mainInterval);
        intervals.forEach(clearInterval);
        windows.forEach((w) => w.remove());
        style.remove();
    };
}
