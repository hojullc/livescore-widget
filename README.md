# livescore-widget

> Embeddable real-time scoreboard widget — born from [Scoreboard Pro](https://apps.apple.com/app/id496758984). Framework-agnostic, CSS-variable themed, WebSocket-ready.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)

Built by [Hoju LLC](https://hoju.us)

---

## Features

- 🏆 **Multi-sport support** — Basketball, Soccer, Baseball, Football, Volleyball, Hockey, or Generic
- 🎨 **CSS-variable theming** — dark, light, auto, or fully custom colors per team
- ⚡ **Real-time WebSocket updates** — connect a live feed and scores update automatically
- ♿ **Fully accessible** — ARIA live regions, semantic HTML, reduced-motion support
- ⏱️ **Built-in clock** — `startClock(seconds)` counts down with one call
- 🔌 **Zero dependencies** — pure JavaScript, ~6KB gzipped
- 🖼️ **Framework-agnostic** — works in React, Vue, plain HTML, or anything

---

## Quick Start

### Script tag
```html
<div id="scoreboard"></div>
<script src="https://cdn.jsdelivr.net/gh/hojullc/livescore-widget/src/livescore-widget.js"></script>
<script>
  LiveScore.create({
    container: '#scoreboard',
    sport: 'basketball',
    teamA: { name: 'Lakers', color: '#552583', score: 0 },
    teamB: { name: 'Celtics', color: '#007A33', score: 0 },
    timeRemaining: '12:00',
    theme: 'dark'
  }).mount();
</script>
```

### npm
```bash
npm install livescore-widget
```
```js
import { LiveScore } from 'livescore-widget';

const board = LiveScore.create({
  container: '#scoreboard',
  sport: 'soccer',
  teamA: { name: 'Home', color: '#635bff' },
  teamB: { name: 'Away', color: '#f78166' },
}).mount();

// Update scores
board.addPoint('a');       // +1 for team A
board.setScore('b', 3);    // Set team B to 3
board.nextPeriod();        // Advance period
```

### Interactive demo (with buttons)
```js
LiveScore.demo('#scoreboard', { sport: 'basketball', ... });
```

---

## API

### `LiveScore.create(options)`
Returns a `LiveScoreWidget` instance. Call `.mount()` to render.

### `LiveScore.demo(container, options)`
Mounts the widget with +1 / Next Period / Reset buttons — great for testing.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `string\|Element` | `'#livescore'` | CSS selector or DOM element |
| `sport` | `string` | `'generic'` | `basketball`, `soccer`, `baseball`, `football`, `volleyball`, `hockey`, `generic` |
| `teamA` | `object` | `{name:'Home', color:'#635bff', score:0}` | Team A config |
| `teamB` | `object` | `{name:'Away', color:'#f78166', score:0}` | Team B config |
| `period` | `number` | `1` | Current period/half/set |
| `totalPeriods` | `number` | Sport default | Total periods |
| `periodLabel` | `string` | Sport default | `Quarter`, `Half`, `Period`, etc. |
| `timeRemaining` | `string\|null` | `null` | Clock display, e.g. `'12:34'` |
| `theme` | `string` | `'dark'` | `dark`, `light`, or `auto` |
| `showLogo` | `boolean` | `true` | Show Hoju branding |
| `showAnimation` | `boolean` | `true` | Bump animation on score change |
| `wsUrl` | `string\|null` | `null` | WebSocket URL for live updates |
| `onScoreChange` | `function` | `null` | Callback `(teamA, teamB)` |
| `onPeriodChange` | `function` | `null` | Callback `(period)` |

### Instance Methods

| Method | Description |
|--------|-------------|
| `.mount()` | Render the widget into the container |
| `.setScore(team, score)` | Set score. `team`: `'a'` or `'b'` |
| `.addPoint(team, points?)` | Add points (default 1) |
| `.setPeriod(n)` | Set period number |
| `.nextPeriod()` | Advance to next period |
| `.setTime(string)` | Update clock display |
| `.startClock(seconds, onTick?)` | Start countdown clock |
| `.stopClock()` | Stop countdown clock |
| `.destroy()` | Remove widget and disconnect WS |

---

## WebSocket Protocol

Send JSON messages from your server:
```json
{ "scoreA": 42, "scoreB": 38, "period": 3, "time": "4:12" }
```
Any field can be omitted — only provided fields update.

---

## CSS Theming

Override CSS variables on the widget's container:
```css
#scoreboard {
  --ls-custom-a: #FF6B00;    /* Team A color */
  --ls-custom-b: #005EB8;    /* Team B color */
  --ls-theme-bg: #1a1a2e;    /* Widget background */
  --ls-theme-text: #eee;      /* Text color */
}
```

---

## Related

- **[Scoreboard Pro](https://apps.apple.com/app/id496758984)** — the iOS app this widget was born from
- **[Hoju LLC](https://hoju.us)** — web, mobile & accessibility consulting

---

## License

MIT © [Hoju LLC](https://hoju.us)
