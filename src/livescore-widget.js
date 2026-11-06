/*!
 * livescore-widget v1.0.0
 * Embeddable real-time scoreboard widget
 * https://github.com/hojullc/livescore-widget
 * MIT License — Hoju LLC (hoju.us)
 */
(function (global) {
  'use strict';

  /* ─────────────────────────────────────────
     DEFAULT CONFIG
  ───────────────────────────────────────── */
  const DEFAULTS = {
    container: '#livescore',
    sport: 'generic',          // generic | basketball | soccer | baseball | football | volleyball
    teamA: { name: 'Home', color: '#635bff', score: 0 },
    teamB: { name: 'Away', color: '#f78166', score: 0 },
    period: 1,
    periodLabel: 'Quarter',    // Quarter / Half / Period / Set / Inning
    totalPeriods: 4,
    timeRemaining: null,       // null = not shown; string e.g. "12:34"
    theme: 'dark',             // dark | light | auto
    showLogo: true,
    showAnimation: true,
    wsUrl: null,               // WebSocket URL for live updates
    onScoreChange: null,       // callback(teamA, teamB)
    onPeriodChange: null,      // callback(period)
  };

  /* ─────────────────────────────────────────
     SPORT CONFIGS
  ───────────────────────────────────────── */
  const SPORTS = {
    generic:    { periods: 4, periodLabel: 'Quarter', icon: '🏆' },
    basketball: { periods: 4, periodLabel: 'Quarter', icon: '🏀' },
    soccer:     { periods: 2, periodLabel: 'Half',    icon: '⚽' },
    baseball:   { periods: 9, periodLabel: 'Inning',  icon: '⚾' },
    football:   { periods: 4, periodLabel: 'Quarter', icon: '🏈' },
    volleyball: { periods: 5, periodLabel: 'Set',     icon: '🏐' },
    hockey:     { periods: 3, periodLabel: 'Period',  icon: '🏒' },
  };

  /* ─────────────────────────────────────────
     CSS INJECTION
  ───────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('livescore-styles')) return;
    const style = document.createElement('style');
    style.id = 'livescore-styles';
    style.textContent = `
      .ls-widget {
        --ls-bg:         var(--ls-theme-bg, #161b22);
        --ls-bg2:        var(--ls-theme-bg2, #21262d);
        --ls-border:     var(--ls-theme-border, #30363d);
        --ls-text:       var(--ls-theme-text, #e6edf3);
        --ls-text2:      var(--ls-theme-text2, #8b949e);
        --ls-team-a:     var(--ls-custom-a, #635bff);
        --ls-team-b:     var(--ls-custom-b, #f78166);
        --ls-radius:     12px;
        --ls-transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .ls-widget.ls-light {
        --ls-theme-bg:     #ffffff;
        --ls-theme-bg2:    #f6f9fc;
        --ls-theme-border: #e3e8ef;
        --ls-theme-text:   #0a2540;
        --ls-theme-text2:  #425466;
      }
      .ls-board {
        background: var(--ls-bg);
        border: 1px solid var(--ls-border);
        border-radius: var(--ls-radius);
        overflow: hidden;
        max-width: 480px;
        width: 100%;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      }
      .ls-header {
        background: var(--ls-bg2);
        border-bottom: 1px solid var(--ls-border);
        padding: 10px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--ls-text2);
      }
      .ls-sport-badge {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ls-live-dot {
        width: 6px; height: 6px;
        border-radius: 50%;
        background: #3fb950;
        animation: ls-blink 1.5s step-end infinite;
        flex-shrink: 0;
      }
      @keyframes ls-blink {
        0%,100% { opacity: 1; }
        50%      { opacity: 0; }
      }
      .ls-scores {
        padding: 24px 20px;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 16px;
        align-items: center;
      }
      .ls-team {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .ls-team-name {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--ls-text2);
      }
      .ls-score {
        font-size: 56px;
        font-weight: 900;
        line-height: 1;
        letter-spacing: -0.04em;
        transition: transform var(--ls-transition), color var(--ls-transition);
        min-width: 70px;
        text-align: center;
      }
      .ls-team-a .ls-score { color: var(--ls-team-a); }
      .ls-team-b .ls-score { color: var(--ls-team-b); }
      .ls-score.ls-bump {
        animation: ls-bump 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes ls-bump {
        0%   { transform: scale(1); }
        40%  { transform: scale(1.25); }
        100% { transform: scale(1); }
      }
      .ls-team-bar {
        height: 4px;
        border-radius: 2px;
        width: 48px;
        transition: width 0.5s ease;
      }
      .ls-team-a .ls-team-bar { background: var(--ls-team-a); }
      .ls-team-b .ls-team-bar { background: var(--ls-team-b); }
      .ls-divider {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        color: var(--ls-text2);
        font-size: 11px;
        font-weight: 600;
      }
      .ls-vs {
        font-size: 20px;
        font-weight: 900;
        color: var(--ls-border);
        letter-spacing: -0.02em;
      }
      .ls-time {
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-size: 13px;
        font-weight: 600;
        color: var(--ls-text);
        background: var(--ls-bg2);
        padding: 4px 10px;
        border-radius: 6px;
        border: 1px solid var(--ls-border);
        letter-spacing: 0.04em;
      }
      .ls-footer {
        background: var(--ls-bg2);
        border-top: 1px solid var(--ls-border);
        padding: 10px 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .ls-periods {
        display: flex;
        gap: 4px;
      }
      .ls-period-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: var(--ls-border);
        transition: background 0.3s;
      }
      .ls-period-dot.active  { background: #3fb950; }
      .ls-period-dot.done    { background: var(--ls-text2); }
      .ls-period-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--ls-text2);
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .ls-controls {
        display: flex;
        gap: 8px;
        margin-top: 16px;
        flex-wrap: wrap;
      }
      .ls-btn {
        padding: 7px 16px;
        border-radius: 6px;
        border: 1px solid var(--ls-border);
        background: var(--ls-bg2);
        color: var(--ls-text2);
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: border-color 0.2s, color 0.2s;
      }
      .ls-btn:hover { border-color: var(--ls-text2); color: var(--ls-text); }
      .ls-btn-a:hover { border-color: var(--ls-team-a); color: var(--ls-team-a); }
      .ls-btn-b:hover { border-color: var(--ls-team-b); color: var(--ls-team-b); }
      .ls-branding {
        font-size: 10px;
        color: var(--ls-text2);
        opacity: 0.4;
        font-weight: 500;
      }
      .ls-branding a { color: inherit; text-decoration: none; }
      .ls-branding a:hover { opacity: 1; }
      @media (prefers-reduced-motion: reduce) {
        .ls-score.ls-bump { animation: none; }
        .ls-live-dot { animation: none; }
        * { transition-duration: 0.01ms !important; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ─────────────────────────────────────────
     MAIN CLASS
  ───────────────────────────────────────── */
  class LiveScoreWidget {
    constructor(options = {}) {
      this.cfg = Object.assign({}, DEFAULTS, options);
      this.cfg.teamA = Object.assign({}, DEFAULTS.teamA, options.teamA || {});
      this.cfg.teamB = Object.assign({}, DEFAULTS.teamB, options.teamB || {});
      this._ws = null;
      this._scoreAEl = null;
      this._scoreBEl = null;
      this._timeEl = null;
      this._mounted = false;

      // Apply sport presets
      const sport = SPORTS[this.cfg.sport] || SPORTS.generic;
      if (!options.totalPeriods)  this.cfg.totalPeriods  = sport.periods;
      if (!options.periodLabel)   this.cfg.periodLabel   = sport.periodLabel;
      this._sportIcon = sport.icon;

      injectStyles();
    }

    /* ── Render ── */
    mount() {
      const target = typeof this.cfg.container === 'string'
        ? document.querySelector(this.cfg.container)
        : this.cfg.container;
      if (!target) { console.error(`livescore-widget: container "${this.cfg.container}" not found`); return this; }

      const themeClass = this.cfg.theme === 'light' ? 'ls-light'
                       : this.cfg.theme === 'auto' && matchMedia('(prefers-color-scheme: light)').matches ? 'ls-light'
                       : '';

      target.innerHTML = '';
      const widget = document.createElement('div');
      widget.className = `ls-widget ${themeClass}`;
      widget.setAttribute('role', 'region');
      widget.setAttribute('aria-label', `${this.cfg.teamA.name} vs ${this.cfg.teamB.name} scoreboard`);
      widget.setAttribute('aria-live', 'polite');
      widget.setAttribute('aria-atomic', 'false');

      // Apply team colors as CSS vars
      widget.style.setProperty('--ls-custom-a', this.cfg.teamA.color);
      widget.style.setProperty('--ls-custom-b', this.cfg.teamB.color);

      widget.innerHTML = this._html();
      target.appendChild(widget);

      this._scoreAEl = widget.querySelector('.ls-team-a .ls-score');
      this._scoreBEl = widget.querySelector('.ls-team-b .ls-score');
      this._timeEl   = widget.querySelector('.ls-time');
      this._widget   = widget;
      this._mounted  = true;

      this._updatePeriodDots();

      if (this.cfg.wsUrl) this._connectWS();

      return this;
    }

    _html() {
      const { teamA, teamB, period, totalPeriods, periodLabel, timeRemaining, showLogo } = this.cfg;
      const periodDots = Array.from({ length: totalPeriods }, (_, i) => {
        const cls = i + 1 < period ? 'done' : i + 1 === period ? 'active' : '';
        return `<span class="ls-period-dot ${cls}" aria-hidden="true"></span>`;
      }).join('');

      return `
        <div class="ls-board">
          <div class="ls-header">
            <div class="ls-sport-badge">
              <span role="img" aria-label="${this.cfg.sport}">${this._sportIcon}</span>
              <span>${this.cfg.sport.charAt(0).toUpperCase() + this.cfg.sport.slice(1)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span class="ls-live-dot" aria-hidden="true"></span>
              <span>LIVE</span>
            </div>
          </div>

          <div class="ls-scores">
            <div class="ls-team ls-team-a">
              <span class="ls-team-name">${this._escHtml(teamA.name)}</span>
              <span class="ls-score" aria-label="${this._escHtml(teamA.name)} score: ${teamA.score}">${teamA.score}</span>
              <div class="ls-team-bar"></div>
            </div>

            <div class="ls-divider">
              <span class="ls-vs" aria-hidden="true">—</span>
              ${timeRemaining ? `<span class="ls-time" aria-label="Time remaining: ${timeRemaining}">${timeRemaining}</span>` : ''}
            </div>

            <div class="ls-team ls-team-b">
              <span class="ls-team-name">${this._escHtml(teamB.name)}</span>
              <span class="ls-score" aria-label="${this._escHtml(teamB.name)} score: ${teamB.score}">${teamB.score}</span>
              <div class="ls-team-bar"></div>
            </div>
          </div>

          <div class="ls-footer">
            <div class="ls-period-label">${periodLabel} ${period} of ${totalPeriods}</div>
            <div class="ls-periods" role="list" aria-label="Game periods">${periodDots}</div>
            ${showLogo ? '<span class="ls-branding"><a href="https://hoju.us" target="_blank" rel="noopener">hoju.us</a></span>' : ''}
          </div>
        </div>
      `;
    }

    _escHtml(str) {
      return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    /* ── Score Updates ── */
    setScore(team, score) {
      if (!this._mounted) return this;
      const isA = team === 'a' || team === 'A';
      const el  = isA ? this._scoreAEl : this._scoreBEl;
      const prev = isA ? this.cfg.teamA.score : this.cfg.teamB.score;
      const next = Math.max(0, parseInt(score, 10) || 0);
      if (isA) this.cfg.teamA.score = next; else this.cfg.teamB.score = next;

      if (el) {
        el.textContent = next;
        el.setAttribute('aria-label', `${isA ? this.cfg.teamA.name : this.cfg.teamB.name} score: ${next}`);
        if (this.cfg.showAnimation && next !== prev) {
          el.classList.remove('ls-bump');
          void el.offsetWidth; // reflow
          el.classList.add('ls-bump');
          el.addEventListener('animationend', () => el.classList.remove('ls-bump'), { once: true });
        }
      }
      if (typeof this.cfg.onScoreChange === 'function') {
        this.cfg.onScoreChange({ ...this.cfg.teamA }, { ...this.cfg.teamB });
      }
      return this;
    }

    addPoint(team, points = 1) {
      const isA = team === 'a' || team === 'A';
      return this.setScore(team, (isA ? this.cfg.teamA.score : this.cfg.teamB.score) + points);
    }

    /* ── Period ── */
    setPeriod(n) {
      if (!this._mounted) return this;
      this.cfg.period = Math.max(1, Math.min(n, this.cfg.totalPeriods));
      this._updatePeriodDots();
      const label = this._widget.querySelector('.ls-period-label');
      if (label) label.textContent = `${this.cfg.periodLabel} ${this.cfg.period} of ${this.cfg.totalPeriods}`;
      if (typeof this.cfg.onPeriodChange === 'function') this.cfg.onPeriodChange(this.cfg.period);
      return this;
    }

    nextPeriod() { return this.setPeriod(this.cfg.period + 1); }

    _updatePeriodDots() {
      if (!this._widget) return;
      this._widget.querySelectorAll('.ls-period-dot').forEach((dot, i) => {
        dot.classList.remove('active', 'done');
        if (i + 1 < this.cfg.period) dot.classList.add('done');
        if (i + 1 === this.cfg.period) dot.classList.add('active');
      });
    }

    /* ── Clock ── */
    setTime(timeString) {
      this.cfg.timeRemaining = timeString;
      if (this._timeEl) this._timeEl.textContent = timeString;
      return this;
    }

    startClock(seconds, onTick) {
      let remaining = seconds;
      this._clockInterval = setInterval(() => {
        remaining--;
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        const display = `${m}:${String(s).padStart(2, '0')}`;
        this.setTime(display);
        if (typeof onTick === 'function') onTick(remaining);
        if (remaining <= 0) this.stopClock();
      }, 1000);
      return this;
    }

    stopClock() {
      clearInterval(this._clockInterval);
      return this;
    }

    /* ── WebSocket Live Updates ── */
    _connectWS() {
      try {
        this._ws = new WebSocket(this.cfg.wsUrl);
        this._ws.addEventListener('message', e => {
          try {
            const data = JSON.parse(e.data);
            if (data.scoreA !== undefined) this.setScore('a', data.scoreA);
            if (data.scoreB !== undefined) this.setScore('b', data.scoreB);
            if (data.period !== undefined) this.setPeriod(data.period);
            if (data.time   !== undefined) this.setTime(data.time);
          } catch { /* ignore malformed messages */ }
        });
        this._ws.addEventListener('error', () => console.warn('livescore-widget: WebSocket error'));
      } catch (e) {
        console.warn('livescore-widget: Could not connect WebSocket', e);
      }
    }

    disconnect() {
      this.stopClock();
      if (this._ws) { this._ws.close(); this._ws = null; }
      return this;
    }

    destroy() {
      this.disconnect();
      const target = typeof this.cfg.container === 'string'
        ? document.querySelector(this.cfg.container)
        : this.cfg.container;
      if (target) target.innerHTML = '';
      this._mounted = false;
      return this;
    }

    /**
     * Render a demo with interactive buttons below the widget.
     */
    mountDemo() {
      this.mount();
      const target = typeof this.cfg.container === 'string'
        ? document.querySelector(this.cfg.container)
        : this.cfg.container;
      const controls = document.createElement('div');
      controls.className = 'ls-controls';
      controls.innerHTML = `
        <button class="ls-btn ls-btn-a" data-action="a">+1 ${this._escHtml(this.cfg.teamA.name)}</button>
        <button class="ls-btn ls-btn-b" data-action="b">+1 ${this._escHtml(this.cfg.teamB.name)}</button>
        <button class="ls-btn" data-action="period">Next Period</button>
        <button class="ls-btn" data-action="reset">Reset</button>
      `;
      controls.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === 'a') this.addPoint('a');
        if (action === 'b') this.addPoint('b');
        if (action === 'period') this.nextPeriod();
        if (action === 'reset') {
          this.setScore('a', 0).setScore('b', 0).setPeriod(1);
        }
      });
      target.appendChild(controls);
      return this;
    }
  }

  /* ─────────────────────────────────────────
     PUBLIC API
  ───────────────────────────────────────── */
  const LiveScore = {
    version: '1.0.0',
    /**
     * Create and mount a new scoreboard widget.
     * @param {Object} options - Widget configuration
     * @returns {LiveScoreWidget}
     */
    create(options = {}) {
      return new LiveScoreWidget(options);
    },
    /**
     * Quick-mount a demo widget with interactive buttons.
     */
    demo(container, options = {}) {
      return new LiveScoreWidget({ container, ...options }).mountDemo();
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LiveScore, LiveScoreWidget };
  } else {
    global.LiveScore = LiveScore;
    global.LiveScoreWidget = LiveScoreWidget;
  }

}(typeof window !== 'undefined' ? window : this));
