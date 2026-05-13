export class PortfolioTerminal {
	constructor() {
		this.history = [];
		this.historyIndex = -1;
		this.isOpen = false;
		this.commands = {
			help: () => this.showHelp(),
			whoami: () => this.whoami(),
			about: () => this.about(),
			skills: () => this.skills(),
			projects: () => this.projects(),
			contact: () => this.contact(),
			github: () => this.github(),
			linkedin: () => this.linkedin(),
			email: () => this.copyEmail(),
			date: () => this.date(),
			clear: () => this.clear(),
		};
	}

	init() {
		if (document.getElementById('terminal-launcher')) return;

		this.injectStyles();

		document.body.insertAdjacentHTML(
			'beforeend',
			`
			<div class="terminal-overlay" id="terminal-overlay" aria-hidden="true"></div>
			<button id="terminal-launcher" class="terminal-launcher" aria-label="Open terminal">
				<span class="terminal-launcher-ring"></span>
				<span class="terminal-launcher-core">
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
						<path d="M4 5.5h16A1.5 1.5 0 0 1 21.5 7v10A1.5 1.5 0 0 1 20 18.5H4A1.5 1.5 0 0 1 2.5 17V7A1.5 1.5 0 0 1 4 5.5Z" stroke="currentColor" stroke-width="1.8"/>
						<path d="m7 10 3 2.5L7 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M12.5 15h4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
					</svg>
				</span>
			</button>

			<section id="interactive-terminal" class="terminal-panel" aria-hidden="true">
				<div class="terminal-panel-header">
					<div class="terminal-dots">
						<span class="terminal-dot dot-red"></span>
						<span class="terminal-dot dot-yellow"></span>
						<span class="terminal-dot dot-green"></span>
					</div>
					<div class="terminal-title">portfolio.terminal</div>
					<button class="terminal-close" id="terminal-close" aria-label="Close terminal">x</button>
				</div>
				<div class="terminal-output" id="terminal-output"></div>
				<div class="terminal-input-line">
					<span class="terminal-prompt">$</span>
					<input id="terminal-input" class="terminal-input" type="text" placeholder="Type help and press Enter" autocomplete="off" />
				</div>
			</section>
		`
		);

		const input = document.getElementById('terminal-input');
		const launcher = document.getElementById('terminal-launcher');
		const closer = document.getElementById('terminal-close');
		const overlay = document.getElementById('terminal-overlay');

		if (!input || !launcher || !closer || !overlay) return;

		launcher.addEventListener('click', () => this.open());
		closer.addEventListener('click', () => this.close());
		overlay.addEventListener('click', () => this.close());

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.isOpen) this.close();
		});

		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				const value = input.value.trim();
				if (!value) return;
				this.run(value);
				input.value = '';
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				this.historyIndex = Math.min(this.historyIndex + 1, this.history.length - 1);
				if (this.historyIndex >= 0) input.value = this.history[this.historyIndex];
			} else if (e.key === 'ArrowDown') {
				e.preventDefault();
				this.historyIndex = Math.max(this.historyIndex - 1, -1);
				input.value = this.historyIndex === -1 ? '' : this.history[this.historyIndex];
			}
		});

		this.print('Boot sequence ready.', 'info');
		this.print('Click the terminal icon any time to open this panel.', 'info');
		this.print('Type help to list commands.', 'info');
	}

	open() {
		const panel = document.getElementById('interactive-terminal');
		const overlay = document.getElementById('terminal-overlay');
		const input = document.getElementById('terminal-input');
		if (!panel || !overlay || !input) return;

		panel.classList.add('open');
		overlay.classList.add('open');
		panel.setAttribute('aria-hidden', 'false');
		overlay.setAttribute('aria-hidden', 'false');
		this.isOpen = true;

		setTimeout(() => input.focus(), 220);
	}

	close() {
		const panel = document.getElementById('interactive-terminal');
		const overlay = document.getElementById('terminal-overlay');
		if (!panel || !overlay) return;

		panel.classList.remove('open');
		overlay.classList.remove('open');
		panel.setAttribute('aria-hidden', 'true');
		overlay.setAttribute('aria-hidden', 'true');
		this.isOpen = false;
	}

	run(raw) {
		this.history.unshift(raw);
		this.historyIndex = -1;
		this.print(`$ ${raw}`, 'cmd');

		const [command] = raw.split(' ');
		const action = this.commands[command.toLowerCase()];
		if (action) {
			action();
		} else {
			this.print(`command not found: ${command}`, 'error');
		}
	}

	print(text, type = 'normal') {
		const out = document.getElementById('terminal-output');
		if (!out) return;
		const line = document.createElement('div');
		line.className = `terminal-line ${type}`;
		line.textContent = text;
		out.appendChild(line);
		out.scrollTop = out.scrollHeight;
	}

	showHelp() {
		this.print('help, whoami, about, skills, projects, contact, github, linkedin, email, date, clear', 'info');
	}

	whoami() {
		this.print('Mohamed Amine Wardane', 'success');
		this.print('Location: Rabat, Morocco', 'normal');
		this.print('Education: 1337 Coding School', 'normal');
		this.print('Role: Software Engineering Student', 'normal');
	}

	about() {
		this.print('Systems programming, backend engineering, Unix architecture.', 'normal');
	}

	skills() {
		this.print('C/C++, TypeScript, Python, JavaScript, React, Next.js, Docker, Unix/Linux', 'normal');
	}

	projects() {
		this.print('Minishell, Inception Infrastructure, RAG Vector Pipelines', 'normal');
	}

	contact() {
		this.print('Email: amine.wardane999@gmail.com', 'success');
		this.print('GitHub: github.com/mowardan', 'normal');
		this.print('LinkedIn: linkedin.com/in/mohamed-amine-wardane', 'normal');
	}

	github() {
		this.print('Opening GitHub...', 'info');
		window.open('https://github.com/mowardan', '_blank');
	}

	linkedin() {
		this.print('Opening LinkedIn...', 'info');
		window.open('https://www.linkedin.com/in/mohamed-amine-wardane-18a79a342/?skipRedirect=true', '_blank');
	}

	copyEmail() {
		const email = 'amine.wardane999@gmail.com';
		navigator.clipboard
			.writeText(email)
			.then(() => this.print(`Copied: ${email}`, 'success'))
			.catch(() => this.print(`Copy failed. Use: ${email}`, 'error'));
	}

	date() {
		this.print(new Date().toString(), 'normal');
	}

	clear() {
		const out = document.getElementById('terminal-output');
		if (out) out.innerHTML = '';
	}

	injectStyles() {
		if (document.getElementById('terminal-floating-styles')) return;

		const style = document.createElement('style');
		style.id = 'terminal-floating-styles';
		style.textContent = `
			.terminal-overlay {
				position: fixed;
				inset: 0;
				background: rgba(0, 0, 0, 0.05);
				opacity: 0;
				pointer-events: none;
				transition: opacity 280ms ease;
				z-index: 1400;
				backdrop-filter: blur(3px);
			}

			.terminal-overlay.open {
				opacity: 1;
				pointer-events: auto;
			}

			.terminal-launcher {
				position: fixed;
				right: 22px;
				bottom: 22px;
				width: 72px;
				height: 72px;
				border: 1px solid rgba(0, 0, 0, 0.08);
				padding: 0;
				border-radius: 999px;
				background: rgba(255, 255, 255, 0.56);
				cursor: pointer;
				z-index: 1500;
				box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8);
				animation: terminalLauncherFloat 4.6s ease-in-out infinite;
				transition: transform 180ms ease, box-shadow 180ms ease;
			}

			.terminal-launcher-ring {
				position: absolute;
				inset: 0;
				border-radius: inherit;
				background: conic-gradient(from 120deg, rgba(17,17,17,0.06), rgba(17,17,17,0.18), rgba(17,17,17,0.06));
				filter: none;
				animation: terminalRingSpin 10s linear infinite;
			}

			.terminal-launcher-core {
				position: absolute;
				inset: 6px;
				border-radius: inherit;
				display: grid;
				place-items: center;
				color: #111111;
				background: rgba(255, 255, 255, 0.62);
				box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
				backdrop-filter: blur(8px);
			}

			.terminal-launcher-core svg {
				width: 34px;
				height: 34px;
			}

			.terminal-launcher:hover {
				transform: scale(1.04);
				box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
			}

			.terminal-launcher:active {
				transform: scale(0.96);
			}

			.terminal-panel {
				position: fixed;
				right: 22px;
				bottom: 108px;
				width: min(1100px, calc(100vw - 32px));
				height: min(85vh, 750px);
				display: flex;
				flex-direction: column;
				background: rgba(255, 255, 255, 0.54);
				border-radius: 16px;
				border: 1px solid rgba(0, 0, 0, 0.08);
				box-shadow: 0 32px 80px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.8);
				z-index: 1501;
				opacity: 0;
				transform: translateY(24px) scale(0.96);
				pointer-events: none;
				transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease;
				overflow: hidden;
				backdrop-filter: blur(12px);
			}

			.terminal-panel.open {
				opacity: 1;
				transform: translateY(0) scale(1);
				pointer-events: auto;
			}

			.terminal-panel::before {
				content: '';
				position: absolute;
				inset: 0;
				background-image: linear-gradient(to bottom, rgba(0,0,0,0.02), transparent 16%);
				opacity: 1;
				pointer-events: none;
			}

			.terminal-panel-header {
				position: relative;
				display: grid;
				grid-template-columns: 1fr auto 1fr;
				align-items: center;
				padding: 22px 28px;
				border-bottom: 1px solid rgba(0, 0, 0, 0.06);
				background: rgba(255, 255, 255, 0.52);
				z-index: 1;
			}

			.terminal-dots {
				display: flex;
				gap: 12px;
			}

			.terminal-dot {
				width: 16px;
				height: 16px;
				border-radius: 50%;
			}

			.dot-red { background: #e0535b; }
			.dot-yellow { background: #e5ae0a; }
			.dot-green { background: #4caf50; }

			.terminal-title {
				justify-self: center;
				font: 700 1rem 'JetBrains Mono', 'Fira Code', monospace;
				letter-spacing: 0.1em;
				text-transform: uppercase;
				color: #333333;
			}

			.terminal-close {
				justify-self: end;
				border: 1px solid rgba(0, 0, 0, 0.1);
				width: 40px;
				height: 40px;
				border-radius: 8px;
				background: rgba(255, 255, 255, 0.6);
				color: #666666;
				cursor: pointer;
				font: 700 1.15rem/1 'JetBrains Mono', 'Fira Code', monospace;
				transition: all 0.2s ease;
			}

			.terminal-close:hover {
				background: rgba(255, 255, 255, 0.8);
				color: #111111;
				border-color: rgba(0, 0, 0, 0.15);
			}

			.terminal-output {
				position: relative;
				z-index: 1;
				flex: 1;
				overflow-y: auto;
				padding: 32px 36px;
				font: 500 1.15rem/1.8 'JetBrains Mono', 'Fira Code', monospace;
				color: #4a4a4a;
			}

			.terminal-output::-webkit-scrollbar {
				width: 8px;
			}

			.terminal-output::-webkit-scrollbar-thumb {
				background: rgba(0, 0, 0, 0.15);
				border-radius: 999px;
			}

			.terminal-output::-webkit-scrollbar-thumb:hover {
				background: rgba(0, 0, 0, 0.25);
			}

			.terminal-line { margin-bottom: 16px; }
			.terminal-line.cmd { color: #111111; font-weight: 600; }
			.terminal-line.info { color: #666666; }
			.terminal-line.success { color: #2e8b57; font-weight: 500; }
			.terminal-line.error { color: #c53030; font-weight: 500; }

			.terminal-input-line {
				position: relative;
				z-index: 1;
				display: flex;
				align-items: center;
				gap: 16px;
				padding: 32px 36px;
				border-top: 1px solid rgba(0, 0, 0, 0.06);
				background: rgba(255, 255, 255, 0.50);
			}

			.terminal-prompt {
				font: 700 1.25rem 'JetBrains Mono', 'Fira Code', monospace;
				color: #111111;
			}

			.terminal-input {
				width: 100%;
				border: 0;
				background: transparent;
				outline: none;
				font: 500 1.25rem 'JetBrains Mono', 'Fira Code', monospace;
				color: #1a1a1a;
			}

			.terminal-input::placeholder { color: #aaaaaa; }

			.terminal-input {
				width: 100%;
				border: 0;
				background: transparent;
				outline: none;
				font: 500 0.95rem 'JetBrains Mono', 'Fira Code', monospace;
				color: #1a1a1a;
			}

			.terminal-input::placeholder { color: #aaaaaa; }

			@keyframes terminalLauncherFloat {
				0%, 100% { transform: translateY(0); }
				50% { transform: translateY(-4px); }
			}

			@keyframes terminalRingSpin {
				to { transform: rotate(360deg); }
			}

			@media (max-width: 768px) {
				.terminal-launcher {
					right: 14px;
					bottom: 14px;
					width: 64px;
					height: 64px;
				}

				.terminal-panel {
					right: 8px;
					left: 8px;
					width: auto;
					bottom: 88px;
					height: min(80vh, 600px);
				}
			}
		`;

		document.head.appendChild(style);
	}
}
