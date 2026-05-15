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

		// sync handler for making header/content width "auto"
		this._syncContentWidth = () => {
			const panel = document.getElementById('interactive-terminal');
			if (!panel) return;
			const chromeInner = panel.querySelector('.pt-chrome-inner');
			if (!chromeInner) return;
			const rect = chromeInner.getBoundingClientRect();
			const computed = Math.max(900, Math.round(rect.width));
			document.documentElement.style.setProperty('--pt-w', `900px`);
		};
	}

	init() {
		if (document.getElementById('terminal-launcher')) return;

		this.injectStyles();

		document.body.insertAdjacentHTML(
			'beforeend',
			`
			<div class="pt-overlay" id="terminal-overlay" aria-hidden="true"></div>

			<button id="terminal-launcher" class="pt-launcher" aria-label="Open terminal">
				<span class="pt-launcher-pulse"></span>
				<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
					<path d="M4 5.5h16A1.5 1.5 0 0 1 21.5 7v10A1.5 1.5 0 0 1 20 18.5H4A1.5 1.5 0 0 1 2.5 17V7A1.5 1.5 0 0 1 4 5.5Z" stroke="currentColor" stroke-width="1.6"/>
					<path d="m7 10 3 2.5L7 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M12.5 15h4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
				</svg>
			</button>

			<section id="interactive-terminal" class="pt-panel" aria-hidden="true">

				<!-- Chrome bar — exact same width as body -->
				<div class="pt-chrome">
					<div class="pt-chrome-inner">
						<div class="pt-dots">
							<span class="pt-dot pt-dot--red"  title="Close"></span>
							<span class="pt-dot pt-dot--yellow"></span>
							<span class="pt-dot pt-dot--green"></span>
						</div>
						<span class="pt-title">
							<span class="pt-title-slash">/</span>portfolio.terminal
						</span>
						<button class="pt-close" id="terminal-close" aria-label="Close terminal">
							<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
								<path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
							</svg>
						</button>
					</div>
				</div>

				<!-- Separator rule -->
				<div class="pt-rule"></div>

				<!-- Output + input, locked to same width as chrome -->
				<div class="pt-body">
					<div class="pt-output" id="terminal-output"></div>

					<div class="pt-input-row">
						<span class="pt-prompt">
							<span class="pt-prompt-user">amine</span><span class="pt-prompt-at">@</span><span class="pt-prompt-host">portfolio</span><span class="pt-prompt-sep"> ❯</span>
						</span>
						<input
							id="terminal-input"
							class="pt-input"
							type="text"
							placeholder="type a command…"
							autocomplete="off"
							spellcheck="false"
						/>
					</div>
				</div>

				<!-- Subtle status bar -->
				<div class="pt-statusbar">
					<span class="pt-status-dot"></span>
					<span id="pt-status-text">ready</span>
					<span class="pt-status-sep">·</span>
					<span>tab to complete</span>
					<span class="pt-status-sep">·</span>
					<span>↑↓ history</span>
					<span class="pt-status-right">ESC to close</span>
				</div>

			</section>
			`
		);

		const input    = document.getElementById('terminal-input');
		const launcher = document.getElementById('terminal-launcher');
		const closer   = document.getElementById('terminal-close');
		const overlay  = document.getElementById('terminal-overlay');

		if (!input || !launcher || !closer || !overlay) return;

		launcher.addEventListener('click', () => this.open());
		closer.addEventListener('click',   () => this.close());
		overlay.addEventListener('click',  () => this.close());

		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.isOpen) this.close();
		});

		input.addEventListener('keydown', (e) => {
			if (e.key === 'Tab') {
				e.preventDefault();
				const val = input.value.trim().toLowerCase();
				if (!val) return;
				const matches = Object.keys(this.commands).filter(c => c.startsWith(val));
				if (matches.length === 1) {
					input.value = matches[0];
					this._setStatus(matches[0]);
				} else if (matches.length > 1) {
					this.print(matches.join('   '), 'info');
				}
				return;
			}

			if (e.key === 'Enter') {
				const value = input.value.trim();
				if (!value) return;
				this.run(value);
				input.value = '';
				this._setStatus('ready');
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

		input.addEventListener('input', () => {
			const val = input.value.trim().toLowerCase();
			if (!val) { this._setStatus('ready'); return; }
			const matches = Object.keys(this.commands).filter(c => c.startsWith(val));
			if (matches.length === 1 && matches[0] !== val) this._setStatus(`→ ${matches[0]}`);
			else this._setStatus(val ? 'typing…' : 'ready');
		});

		// Focus trap
		document.addEventListener('keydown', (e) => {
			if (!this.isOpen || e.key !== 'Tab') return;
			const panel = document.getElementById('interactive-terminal');
			if (!panel) return;
			const focusable = panel.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
			if (!focusable.length) return;
			const first = focusable[0];
			const last  = focusable[focusable.length - 1];
			if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
		});

		this._bootSequence();
	}

	_bootSequence() {
		const lines = [
			{ text: 'Welcome — type help to explore.', type: 'muted' },
		];
		lines.forEach((l, i) => {
			setTimeout(() => this.print(l.text, l.type), i * 80);
		});
	}

	_setStatus(text) {
		const el = document.getElementById('pt-status-text');
		if (el) el.textContent = text;
	}

	open() {
		const panel   = document.getElementById('interactive-terminal');
		const overlay = document.getElementById('terminal-overlay');
		const input   = document.getElementById('terminal-input');
		if (!panel || !overlay || !input) return;

		if (window.innerWidth <= 520) {
			panel.classList.add('mobile');
			document.documentElement.style.overflow = 'hidden';
		}

		panel.classList.add('open');
		overlay.classList.add('open');

		// enforce fixed content width
		document.documentElement.style.setProperty('--pt-w', '900px');
		panel.setAttribute('aria-hidden', 'false');
		panel.setAttribute('role', 'dialog');
		panel.setAttribute('aria-modal', 'true');
		overlay.setAttribute('aria-hidden', 'false');
		this.isOpen = true;

		setTimeout(() => input.focus(), 240);
	}

	close() {
		const panel   = document.getElementById('interactive-terminal');
		const overlay = document.getElementById('terminal-overlay');
		if (!panel || !overlay) return;

		panel.classList.remove('open', 'mobile');
		document.documentElement.style.overflow = '';
		// ensure content width remains the fixed value
		document.documentElement.style.setProperty('--pt-w', '900px');
		overlay.classList.remove('open');
		panel.setAttribute('aria-hidden', 'true');
		panel.removeAttribute('role');
		panel.removeAttribute('aria-modal');
		overlay.setAttribute('aria-hidden', 'true');
		this.isOpen = false;
	}

	run(raw) {
		this.history.unshift(raw);
		this.historyIndex = -1;
		this.print(`❯ ${raw}`, 'cmd');
		const [command] = raw.split(' ');
		const action = this.commands[command.toLowerCase()];
		if (action) action();
		else this.print(`command not found: ${command}`, 'error');
	}

	print(text, type = 'normal') {
		const out = document.getElementById('terminal-output');
		if (!out) return;
		const line = document.createElement('div');
		line.className = `pt-line pt-line--${type}`;
		line.textContent = text;
		// entrance animation
		line.style.opacity = '0';
		line.style.transform = 'translateY(4px)';
		out.appendChild(line);
		requestAnimationFrame(() => {
			line.style.transition = 'opacity 160ms ease, transform 160ms ease';
			line.style.opacity = '1';
			line.style.transform = 'translateY(0)';
		});
		out.scrollTop = out.scrollHeight;
	}

	showHelp() {
		const cmds = Object.keys(this.commands);
		this.print('Available commands:', 'label');
		this.print(cmds.join('  ·  '), 'info');
	}

	whoami() {
		this.print('Mohamed Amine Wardane', 'highlight');
		this.print('Location  →  Rabat, Morocco', 'normal');
		this.print('School    →  1337 Coding School', 'normal');
		this.print('Role      →  Software Engineering Student', 'normal');
	}

	about() {
		this.print('Systems programming, backend engineering, Unix architecture.', 'normal');
	}

	skills() {
		this.print('C / C++  ·  TypeScript  ·  Python  ·  JavaScript', 'normal');
		this.print('React  ·  Next.js  ·  Docker  ·  Unix / Linux', 'normal');
	}

	projects() {
		this.print('Minishell            →  POSIX shell in C', 'normal');
		this.print('Inception            →  Docker infrastructure', 'normal');
		this.print('RAG Vector Pipeline  →  LLM retrieval system', 'normal');
	}

	contact() {
		this.print('email     →  amine.wardane999@gmail.com', 'success');
		this.print('github    →  github.com/mowardan', 'normal');
		this.print('linkedin  →  linkedin.com/in/mohamed-amine-wardane', 'normal');
	}

	github() {
		this.print('Opening GitHub profile…', 'muted');
		window.open('https://github.com/mowardan', '_blank');
	}

	linkedin() {
		this.print('Opening LinkedIn…', 'muted');
		window.open('https://www.linkedin.com/in/mohamed-amine-wardane-18a79a342/?skipRedirect=true', '_blank');
	}

	copyEmail() {
		const email = 'amine.wardane999@gmail.com';
		navigator.clipboard
			.writeText(email)
			.then(() => this.print(`Copied to clipboard — ${email}`, 'success'))
			.catch(() => this.print(`Copy failed. Manual: ${email}`, 'error'));
	}

	date() {
		this.print(new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' }), 'normal');
	}

	clear() {
		const out = document.getElementById('terminal-output');
		if (out) out.innerHTML = '';
	}

	injectStyles() {
		if (document.getElementById('pt-styles')) return;
		const style = document.createElement('style');
		style.id = 'pt-styles';
		style.textContent = `
/* ─── Design tokens ─────────────────────────────────────── */
:root {
	--pt-bg:           rgba(250, 250, 252, 0.72);
	--pt-border:       rgba(0, 0, 0, 0.07);
	--pt-ink:          #111218;
	--pt-muted:        #767b8a;
	--pt-subtle:       #b0b5c3;
	--pt-accent:       #4f6ef7;
	--pt-accent-dim:   rgba(79, 110, 247, 0.08);
	--pt-rule:         rgba(0, 0, 0, 0.055);
	--pt-radius:       14px;
	--pt-chrome-h:     48px;
	--pt-status-h:     34px;
	--pt-w:            900px;       /* content column width   */
	--pt-pad:          28px;        /* horizontal content pad */
	--pt-font:         'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
}

/* ─── Overlay ────────────────────────────────────────────── */
.pt-overlay {
	position: fixed; inset: 0;
	background: rgba(10, 10, 20, 0.18);
	backdrop-filter: blur(6px) saturate(1.4);
	-webkit-backdrop-filter: blur(6px) saturate(1.4);
	opacity: 0; pointer-events: none;
	transition: opacity 260ms ease;
	z-index: 1400;
}
.pt-overlay.open { opacity: 1; pointer-events: auto; }

/* ─── Launcher button ────────────────────────────────────── */
.pt-launcher {
	position: fixed; right: 24px; bottom: 24px;
	width: 56px; height: 56px;
	border-radius: 50%;
	background: var(--pt-bg);
	border: 1px solid var(--pt-border);
	display: grid; place-items: center;
	color: var(--pt-ink);
	cursor: pointer;
	box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	transition: transform 180ms cubic-bezier(.2,.8,.2,1), box-shadow 180ms ease;
	z-index: 1500;
}
.pt-launcher:hover {
	transform: scale(1.06);
	box-shadow: 0 12px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.08);
}
.pt-launcher:active { transform: scale(.97); }

.pt-launcher-pulse {
	position: absolute;
	width: 100%; height: 100%;
	border-radius: 50%;
	border: 1.5px solid var(--pt-accent);
	opacity: 0;
	animation: pt-pulse 3s ease-out 1.2s infinite;
	pointer-events: none;
}
@keyframes pt-pulse {
	0%   { transform: scale(.9); opacity: .5; }
	70%  { transform: scale(1.5); opacity: 0; }
	100% { opacity: 0; }
}

/* ─── Panel ──────────────────────────────────────────────── */
.pt-panel {
	position: fixed;
	right: 24px; bottom: 96px;

	/* panel is exactly as wide as the chrome inner box + its own padding */
	width: calc(var(--pt-w) + var(--pt-pad) * 2);
	max-width: calc(100vw - 32px);
	height: min(68vh, 620px);

	display: flex; flex-direction: column;
	background: var(--pt-bg);
	border-radius: var(--pt-radius);
	border: 1px solid var(--pt-border);
	box-shadow:
		0 32px 80px rgba(0,0,0,0.13),
		0 8px 24px rgba(0,0,0,0.07),
		inset 0 1px 0 rgba(255,255,255,0.7);
	backdrop-filter: blur(20px) saturate(1.6);
	-webkit-backdrop-filter: blur(20px) saturate(1.6);
	z-index: 1501;

	opacity: 0;
	transform: translateY(10px) scale(.98);
	pointer-events: none;
	transition:
		opacity 280ms cubic-bezier(.2,.8,.2,1),
		transform 320ms cubic-bezier(.2,.8,.2,1);
	overflow: hidden;
}
.pt-panel.open {
	opacity: 1;
	transform: translateY(0) scale(1);
	pointer-events: auto;
}
.pt-panel.mobile {
	left: 8px; right: 8px; bottom: 0;
	width: calc(100% - 16px);
	max-width: none;
	height: 64vh;
	border-radius: var(--pt-radius) var(--pt-radius) 0 0;
}

/* Noise texture for depth */
.pt-panel::after {
	content: '';
	position: absolute; inset: 0;
	background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E");
	background-size: 160px;
	pointer-events: none;
	border-radius: inherit;
	z-index: 0;
}

/* ─── Chrome bar ─────────────────────────────────────────── */
.pt-chrome {
	flex-shrink: 0;
	height: var(--pt-chrome-h);
	display: flex; align-items: center;
	padding: 0 var(--pt-pad);
	position: relative; z-index: 1;
}
.pt-chrome-inner {
	width: 100%;
	max-width: var(--pt-w);
	margin: 0 auto;
	display: flex; align-items: center; gap: 10px;
	position: relative;
	padding: 8px 0; /* vertical padding only; horizontal alignment via max-width */
}

.pt-chrome-inner::before {
	content: '';
	position: absolute;
	left: 0; right: 0; top: 0; bottom: 0;
	background: rgba(255,255,255,0.96);
	border-radius: 8px;
	z-index: 0;
}

.pt-chrome-inner > * { z-index: 1; }
}

.pt-dots { display: flex; gap: 7px; flex-shrink: 0; }
.pt-dot {
	width: 12px; height: 12px; border-radius: 50%;
	transition: filter 160ms ease;
}
.pt-dot:hover { filter: brightness(0.85); }
.pt-dot--red    { background: #ff5f57; box-shadow: 0 0 0 0.5px rgba(0,0,0,0.1) inset; }
.pt-dot--yellow { background: #febc2e; box-shadow: 0 0 0 0.5px rgba(0,0,0,0.1) inset; }
.pt-dot--green  { background: #28c840; box-shadow: 0 0 0 0.5px rgba(0,0,0,0.1) inset; }

.pt-title {
	flex: 1;
	text-align: center;
	font: 600 0.78rem/1 var(--pt-font);
	letter-spacing: 0.13em;
	color: var(--pt-muted);
	text-transform: lowercase;
	user-select: none;
}
.pt-title-slash { color: var(--pt-accent); margin-right: 1px; }

.pt-close {
	flex-shrink: 0;
	width: 28px; height: 28px;
	display: grid; place-items: center;
	background: transparent;
	border: 0;
	border-radius: 6px;
	color: var(--pt-subtle);
	cursor: pointer;
	transition: background 140ms ease, color 140ms ease;
}
.pt-close:hover { background: rgba(0,0,0,0.05); color: var(--pt-ink); }

/* ─── Rule ───────────────────────────────────────────────── */
.pt-rule {
	flex-shrink: 0;
	height: 1px;
	background: linear-gradient(
		90deg,
		transparent,
		var(--pt-rule) 20%,
		var(--pt-rule) 80%,
		transparent
	);
	margin: 0 var(--pt-pad);
	position: relative; z-index: 1;
}

/* ─── Body (output + input) ──────────────────────────────── */
.pt-body {
	flex: 1;
	display: flex; flex-direction: column;
	overflow: hidden;
	padding: 20px var(--pt-pad) 16px;
	position: relative; z-index: 1;

	/* align content to the same column as chrome */
	align-items: center;
}

.pt-output {
	flex: 1;
	width: 100%; max-width: var(--pt-w);
	overflow-y: auto;
	overflow-x: hidden;
	padding-bottom: 8px;
	scroll-behavior: smooth;
}
.pt-output::-webkit-scrollbar { width: 5px; }
.pt-output::-webkit-scrollbar-track { background: transparent; }
.pt-output::-webkit-scrollbar-thumb {
	background: rgba(0,0,0,0.10);
	border-radius: 999px;
}

/* ─── Terminal lines ─────────────────────────────────────── */
.pt-line {
	font: 500 0.875rem/1.8 var(--pt-font);
	color: var(--pt-ink);
	padding: 1px 0;
	word-break: break-word;
}
.pt-line + .pt-line { /* small gap between consecutive lines */ }
.pt-line--cmd       { color: var(--pt-ink); font-weight: 700; margin-top: 12px; }
.pt-line--muted     { color: var(--pt-subtle); font-size: 0.82rem; }
.pt-line--info      { color: var(--pt-muted); letter-spacing: 0.02em; }
.pt-line--label     { color: var(--pt-accent); font-weight: 600; margin-top: 6px; }
.pt-line--highlight { color: var(--pt-accent); font-weight: 700; font-size: 0.95rem; }
.pt-line--success   { color: #2d9e6b; }
.pt-line--error     { color: #d94f4f; }
.pt-line--normal    { color: var(--pt-ink); }

/* ─── Input row ──────────────────────────────────────────── */
.pt-input-row {
	width: 100%; max-width: var(--pt-w);
	display: flex; align-items: center; gap: 10px;
	margin-top: 8px;
	padding: 10px 14px;
	background: rgba(255,255,255,0.55);
	border: 1px solid rgba(0,0,0,0.07);
	border-radius: 8px;
	box-shadow:
		0 1px 3px rgba(0,0,0,0.04),
		inset 0 1px 0 rgba(255,255,255,0.8);
	transition: border-color 180ms ease, box-shadow 180ms ease;
}
.pt-input-row:focus-within {
	border-color: rgba(79, 110, 247, 0.35);
	box-shadow:
		0 0 0 3px var(--pt-accent-dim),
		inset 0 1px 0 rgba(255,255,255,0.8);
}

.pt-prompt {
	font: 600 0.82rem/1 var(--pt-font);
	flex-shrink: 0;
	white-space: nowrap;
	user-select: none;
}
.pt-prompt-user   { color: var(--pt-accent); }
.pt-prompt-at     { color: var(--pt-subtle); }
.pt-prompt-host   { color: var(--pt-muted); }
.pt-prompt-sep    { color: var(--pt-accent); margin-left: 6px; }

.pt-input {
	flex: 1;
	background: transparent;
	border: 0;
	outline: none;
	font: 500 0.875rem/1 var(--pt-font);
	color: var(--pt-ink);
	caret-color: var(--pt-accent);
	min-width: 0;
}
.pt-input::placeholder { color: var(--pt-subtle); }
.pt-input::selection   { background: var(--pt-accent-dim); }

/* ─── Status bar ─────────────────────────────────────────── */
.pt-statusbar {
	flex-shrink: 0;
	height: var(--pt-status-h);
	display: flex; align-items: center; gap: 8px;
	padding: 0 calc(var(--pt-pad) + 14px);   /* matches input-row inner edge */
	font: 500 0.7rem/1 var(--pt-font);
	color: var(--pt-subtle);
	border-top: 1px solid var(--pt-rule);
	position: relative; z-index: 1;
}
.pt-status-dot {
	width: 6px; height: 6px; border-radius: 50%;
	background: #28c840;
	box-shadow: 0 0 5px rgba(40, 200, 64, 0.5);
	animation: pt-blink 2.4s ease-in-out infinite;
	flex-shrink: 0;
}
@keyframes pt-blink {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.3; }
}
.pt-status-sep { opacity: 0.4; }
.pt-status-right { margin-left: auto; opacity: 0.55; }

/* ─── Responsive ─────────────────────────────────────────── */
@media (max-width: 700px) {
	:root {
		--pt-w: 100%;
		--pt-pad: 18px;
	}
}
@media (max-width: 520px) {
	.pt-launcher { right: 16px; bottom: 16px; width: 50px; height: 50px; }
	.pt-panel { right: 8px; left: 8px; bottom: 0; border-radius: var(--pt-radius) var(--pt-radius) 0 0; }
}
		`;
		document.head.appendChild(style);
	}
}