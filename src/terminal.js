export class PortfolioTerminal {
  constructor() {
    this.history = [];
    this.historyIndex = -1;
    this.isOpen = false;
    this.commands = {
      help:     () => this.showHelp(),
      whoami:   () => this.whoami(),
      about:    () => this.about(),
      skills:   () => this.skills(),
      projects: () => this.projects(),
      contact:  () => this.contact(),
      github:   () => this.github(),
      linkedin: () => this.linkedin(),
      email:    () => this.copyEmail(),
      date:     () => this.date(),
      clear:    () => this.clear(),
    };
  }

  init() {
    if (document.getElementById('terminal-launcher')) return;
    this.injectStyles();

    document.body.insertAdjacentHTML('beforeend', `
      <button id="terminal-launcher" class="tp-launcher" aria-label="Open terminal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="4 17 10 11 4 5"></polyline>
          <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
      </button>

      <div class="tp-overlay" id="terminal-overlay" aria-hidden="true"></div>

      <section id="interactive-terminal" class="tp-panel" aria-hidden="true">
        <div class="tp-chrome">
          <div class="tp-dots">
            <span class="tp-dot tp-dot--red"></span>
            <span class="tp-dot tp-dot--yellow"></span>
            <span class="tp-dot tp-dot--green"></span>
          </div>
          <span class="tp-title">
            <span class="tp-title-accent">/</span>portfolio
          </span>
          <button class="tp-close" id="terminal-close" aria-label="Close terminal">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="tp-body">
          <div class="tp-output" id="terminal-output"></div>
        </div>

        <div class="tp-input-area">
          <span class="tp-prompt" aria-hidden="true">
            <span class="tp-prompt-user">amine</span><span class="tp-prompt-at">@</span><span class="tp-prompt-host">portfolio</span>
            <span class="tp-prompt-sep">❯</span>
          </span>
          <input
            id="terminal-input"
            class="tp-input"
            type="text"
            placeholder="type a command..."
            autocomplete="off"
            spellcheck="false"
            aria-label="Terminal input"
          />
        </div>

        <div class="tp-statusbar">
          <span class="tp-status-dot"></span>
          <span id="pt-status-text" class="tp-status-text">ready</span>
          <span class="tp-status-hints">
            <span class="tp-hint">Tab ↹ complete</span>
            <span class="tp-hint-sep">·</span>
            <span class="tp-hint">↑↓ history</span>
          </span>
          <span class="tp-status-esc">esc to close</span>
        </div>
      </section>
    `);

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
          this.print(matches.join('  '), 'info');
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

    document.addEventListener('keydown', (e) => {
      if (!this.isOpen || e.key !== 'Tab') return;
      const panel = document.getElementById('interactive-terminal');
      if (!panel) return;
      const focusable = [...panel.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    if (typeof visualViewport !== 'undefined') {
      visualViewport.addEventListener('resize', () => {
        if (!this.isOpen) return;
        const panel = document.getElementById('interactive-terminal');
        if (!panel) return;
        const vvh = visualViewport.height;
        const isMobile = window.innerWidth <= 640;
        if (isMobile) {
          panel.style.setProperty('--tp-mobile-height', `${Math.min(vvh * 0.8, 560)}px`);
        }
      });
    }

    this._bootSequence();
  }

  _bootSequence() {
    setTimeout(() => this.print('Welcome — type help to explore.', 'muted'), 0);
  }

  _setStatus(text) {
    const el = document.getElementById('pt-status-text');
    if (el) el.textContent = text;
  }

  _isMobile() {
    return window.innerWidth <= 640;
  }

  open() {
    const panel   = document.getElementById('interactive-terminal');
    const overlay = document.getElementById('terminal-overlay');
    const input   = document.getElementById('terminal-input');
    if (!panel || !overlay || !input) return;

    if (this._isMobile()) {
      document.documentElement.style.overflow = 'hidden';
    }

    panel.classList.add('tp-panel--open');
    overlay.classList.add('tp-overlay--open');
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

    panel.classList.remove('tp-panel--open');
    overlay.classList.remove('tp-overlay--open');
    panel.removeAttribute('role');
    panel.removeAttribute('aria-modal');
    panel.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
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
    line.className = `tp-line tp-line--${type}`;
    line.textContent = text;
    line.style.opacity = '0';
    line.style.transform = 'translateY(6px)';
    out.appendChild(line);
    requestAnimationFrame(() => {
      line.style.transition = 'opacity 180ms ease, transform 220ms cubic-bezier(.15,.7,.3,1)';
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
      .then(()  => this.print(`Copied to clipboard — ${email}`, 'success'))
      .catch(()  => this.print(`Copy failed. Manual: ${email}`, 'error'));
  }

  date() {
    this.print(new Date().toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' }), 'normal');
  }

  clear() {
    const out = document.getElementById('terminal-output');
    if (out) out.innerHTML = '';
  }

  injectStyles() {
    if (document.getElementById('tp-styles')) return;
    const style = document.createElement('style');
    style.id = 'tp-styles';
    style.textContent = `
/* ═══════════════════════════════════════════════
   TERMINAL PORTFOLIO — Design System
   ═══════════════════════════════════════════════ */

:root {
  --tp-bg:          rgba(255, 255, 255, 0.58);
  --tp-bg-alt:      rgba(245, 245, 245, 0.95);
  --tp-border:      rgba(0, 0, 0, 0.10);
  --tp-border-focus: rgba(0, 0, 0, 0.22);
  --tp-text:        #111111;
  --tp-muted:       #666666;
  --tp-subtle:      #999999;
  --tp-accent:      #1f1f1f;
  --tp-accent-dim:  rgba(0, 0, 0, 0.06);
  --tp-green:       #2d9e6b;
  --tp-red:         #d94f4f;
  --tp-amber:       #b8860b;
  --tp-radius:      16px;
  --tp-font:        'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Menlo', monospace;
  --tp-pad:         clamp(14px, 2.5vw, 24px);
}

/* ─── Overlay ─────────────────────────────────── */
.tp-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease;
  z-index: 1400;
}
.tp-overlay--open {
  opacity: 1;
  pointer-events: auto;
}

/* ─── Launcher ────────────────────────────────── */
.tp-launcher {
  position: fixed;
  right: max(16px, env(safe-area-inset-right, 0px) + 12px);
  bottom: max(20px, env(safe-area-inset-bottom, 0px) + 16px);
  z-index: 1500;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid var(--tp-border);
  background: var(--tp-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: var(--tp-text);
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    transform 200ms cubic-bezier(.2,.8,.2,1),
    box-shadow 200ms ease,
    border-color 200ms ease;
  touch-action: manipulation;
}
.tp-launcher:hover {
  transform: scale(1.08);
  border-color: rgba(0, 0, 0, 0.25);
  box-shadow:
    0 6px 32px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.1);
}
.tp-launcher:active {
  transform: scale(0.94);
}

/* ─── Panel ───────────────────────────────────── */
#interactive-terminal.tp-panel {
  all: initial;
  display: flex;
  flex-direction: column;
  position: fixed;
  right: max(12px, env(safe-area-inset-right, 0px) + 8px);
  bottom: max(84px, env(safe-area-inset-bottom, 0px) + 76px);
  z-index: 1501;
  width: min(540px, calc(100vw - 24px));
  height: min(480px, calc(100vh - 180px));
  background: var(--tp-bg);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid var(--tp-border);
  border-radius: var(--tp-radius);
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.12),
    0 8px 24px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.06) inset;
  overflow: hidden;
  opacity: 0;
  transform: translateY(12px) scale(0.97);
  pointer-events: none;
  transition:
    opacity 260ms cubic-bezier(.15,.7,.3,1),
    transform 320ms cubic-bezier(.15,.7,.3,1);
}

#interactive-terminal.tp-panel--open {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

/* ─── Chrome Bar ──────────────────────────────── */
.tp-chrome {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px var(--tp-pad) 10px;
  user-select: none;
  position: relative;
}

.tp-dots {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.tp-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: filter 160ms ease;
}
.tp-dot--red    { background: #ff5f57; }
.tp-dot--yellow { background: #febc2e; }
.tp-dot--green  { background: #28c840; }

.tp-title {
  flex: 1;
  text-align: center;
  font: 600 0.75rem/1 var(--tp-font);
  letter-spacing: 0.12em;
  color: var(--tp-muted);
  text-transform: lowercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tp-title-accent {
  color: var(--tp-accent);
  margin-right: 2px;
}

.tp-close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  background: transparent;
  border: 0;
  border-radius: 6px;
  color: var(--tp-subtle);
  cursor: pointer;
  touch-action: manipulation;
  transition: background 140ms ease, color 140ms ease;
}
.tp-close:hover {
  background: rgba(255, 82, 82, 0.12);
  color: var(--tp-red);
}

/* ─── Body / Output ───────────────────────────── */
.tp-body {
  flex: 1;
  overflow: hidden;
  padding: 0 var(--tp-pad);
  display: flex;
  flex-direction: column;
  position: relative;
}
.tp-body::before {
  content: '';
  position: absolute;
  top: 0; left: var(--tp-pad); right: var(--tp-pad);
  height: 20px;
  background: linear-gradient(to bottom, rgba(255,255,255,0.7), transparent);
  z-index: 2;
  pointer-events: none;
}

.tp-output {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0 4px;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}
.tp-output::-webkit-scrollbar {
  width: 4px;
}
.tp-output::-webkit-scrollbar-track {
  background: transparent;
}
.tp-output::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 99px;
}
.tp-output::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* ─── Lines ───────────────────────────────────── */
.tp-line {
  font: 500 clamp(0.78rem, 2vw, 0.875rem)/1.7 var(--tp-font);
  color: var(--tp-text);
  padding: 1px 0;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.tp-line--cmd {
  color: var(--tp-text);
  font-weight: 700;
  margin-top: 10px;
}
.tp-line--cmd::before {
  content: '>';
  color: var(--tp-accent);
  margin-right: 8px;
  font-weight: 400;
}

.tp-line--muted {
  color: var(--tp-muted);
  font-size: clamp(0.72rem, 1.8vw, 0.82rem);
}
.tp-line--info {
  color: var(--tp-accent);
  letter-spacing: 0.02em;
}
.tp-line--label {
  color: var(--tp-accent);
  font-weight: 600;
  margin-top: 6px;
  font-size: clamp(0.72rem, 1.8vw, 0.82rem);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.tp-line--highlight {
  color: var(--tp-accent);
  font-weight: 700;
  font-size: clamp(0.85rem, 2.2vw, 0.95rem);
}
.tp-line--success {
  color: var(--tp-green);
}
.tp-line--error {
  color: var(--tp-red);
}
.tp-line--normal {
  color: var(--tp-text);
}

/* ─── Input Area ──────────────────────────────── */
.tp-input-area {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 6px var(--tp-pad) 0;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid var(--tp-border);
  border-radius: 10px;
  transition:
    border-color 200ms ease,
    box-shadow 200ms ease;
}
.tp-input-area:focus-within {
  border-color: var(--tp-border-focus);
  box-shadow: 0 0 0 3px var(--tp-accent-dim);
}

.tp-prompt {
  font: 600 clamp(0.72rem, 1.8vw, 0.82rem)/1 var(--tp-font);
  flex-shrink: 0;
  white-space: nowrap;
  user-select: none;
}
.tp-prompt-user { color: var(--tp-green); }
.tp-prompt-at   { color: var(--tp-subtle); }
.tp-prompt-host { color: var(--tp-muted); }
.tp-prompt-sep  {
  color: var(--tp-accent);
  margin-left: 6px;
  font-weight: 400;
}

.tp-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: none;
  font: 500 clamp(0.78rem, 2vw, 0.875rem)/1 var(--tp-font);
  color: var(--tp-text);
  caret-color: var(--tp-accent);
  font-size: max(16px, clamp(0.78rem, 2vw, 0.875rem));
}
.tp-input::placeholder {
  color: var(--tp-subtle);
  opacity: 0.5;
}
.tp-input::selection {
  background: var(--tp-accent-dim);
}

/* ─── Status Bar ──────────────────────────────── */
.tp-statusbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px var(--tp-pad) 10px;
  font: 500 0.65rem/1 var(--tp-font);
  color: var(--tp-subtle);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.tp-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tp-green);
  box-shadow: 0 0 6px rgba(45, 158, 107, 0.5);
  animation: tp-blink 2.4s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes tp-blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.25; }
}

.tp-status-text {
  color: var(--tp-muted);
  margin-right: auto;
  flex-shrink: 0;
}

.tp-status-hints {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
}

.tp-hint {
  opacity: 0.5;
  white-space: nowrap;
}
.tp-hint-sep {
  opacity: 0.3;
  flex-shrink: 0;
}

.tp-status-esc {
  flex-shrink: 0;
  margin-left: 8px;
  opacity: 0.35;
  white-space: nowrap;
}

@media (max-width: 900px) {
  .tp-status-hints { display: none; }
}

/* ─── Tablet & Small Screens (≤900px) ─────────── */
@media (max-width: 900px) {
  #interactive-terminal.tp-panel {
    right: 12px;
    bottom: 80px;
    height: min(440px, calc(100vh - 140px));
  }
}

/* ─── Mobile (≤640px) ─────────────────────────── */
@media (max-width: 640px) {
  #interactive-terminal.tp-panel {
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    height: var(--tp-mobile-height, 70vh) !important;
    border-radius: var(--tp-radius) var(--tp-radius) 0 0;
    border-bottom: none;
    transform: translateY(24px) scale(1);
    box-shadow:
      0 -8px 40px rgba(0, 0, 0, 0.12),
      0 0 0 1px rgba(0, 0, 0, 0.06) inset;
  }

  #interactive-terminal.tp-panel--open {
    transform: translateY(0) scale(1);
  }

  .tp-chrome {
    padding-top: 12px;
    position: relative;
  }
  .tp-chrome::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    border-radius: 99px;
    background: rgba(0, 0, 0, 0.12);
  }

  .tp-launcher {
    width: 48px;
    height: 48px;
    right: max(12px, env(safe-area-inset-right, 0px) + 8px);
    bottom: max(16px, env(safe-area-inset-bottom, 0px) + 12px);
  }
}

/* ─── Extra small (≤360px) ────────────────────── */
@media (max-width: 360px) {
  :root {
    --tp-pad: 10px;
  }
  #interactive-terminal.tp-panel {
    height: var(--tp-mobile-height, 65vh) !important;
  }
  .tp-dot {
    width: 10px;
    height: 10px;
  }
  .tp-title {
    font-size: 0.68rem;
  }
}
    `;
    document.head.appendChild(style);
  }
}
