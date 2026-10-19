/**
 * Procedural SVG artwork for the studio UI.
 * No external images, no generated-photo imitation: these are deliberate
 * storyboard illustrations for cards and frame placeholders.
 */

const FOAM = '#f4e6cf';

function steamPaths(color = '#ffffff', opacity = 0.5, className = 'steam') {
  return `
    <g class="${className}" fill="none" stroke="${color}" stroke-opacity="${opacity}" stroke-width="3" stroke-linecap="round">
      <path d="M150 96c-14-18 12-26-2-44" />
      <path d="M176 92c-10-14 8-22-1-38" />
      <path d="M202 98c-13-17 11-25-2-42" />
    </g>`;
}

export function audienceArt(audienceId) {
  if (audienceId === 'desi') {
    return `
<svg viewBox="0 0 640 380" class="scene-svg" role="img" aria-label="Village courtyard miniature set">
  <defs>
    <linearGradient id="desiSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2b1c1f"/>
      <stop offset="0.55" stop-color="#63342a"/>
      <stop offset="1" stop-color="#a75a35"/>
    </linearGradient>
    <radialGradient id="desiFire" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffd27a" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="#e2583e" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#e2583e" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="desiWall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#73503c"/>
      <stop offset="1" stop-color="#4a3228"/>
    </linearGradient>
    <linearGradient id="desiGround" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#5a4432"/>
      <stop offset="1" stop-color="#33241c"/>
    </linearGradient>
  </defs>
  <rect width="640" height="380" fill="url(#desiSky)"/>
  <circle cx="118" cy="70" r="26" fill="#f2dcae" opacity="0.75"/>
  <g opacity="0.85">
    <rect x="0" y="150" width="640" height="150" fill="url(#desiWall)"/>
    <path d="M470 150c0-58 34-92 82-92s82 34 82 92z" fill="#2a1d19" opacity="0.75"/>
    <rect x="60" y="150" width="120" height="150" fill="#3d2a22" opacity="0.55"/>
    <path d="M60 150h120v16H60z" fill="#8a5a3d" opacity="0.5"/>
  </g>
  <rect y="300" width="640" height="80" fill="url(#desiGround)"/>
  <g opacity="0.7">
    <rect x="26" y="252" width="150" height="8" rx="4" fill="#2f2019"/>
    <rect x="34" y="260" width="6" height="42" fill="#2f2019"/>
    <rect x="162" y="260" width="6" height="42" fill="#2f2019"/>
    <path d="M40 252h122l-10-10H50z" fill="#3b2a22"/>
  </g>
  <g>
    <ellipse cx="420" cy="330" rx="150" ry="28" fill="#1f1411" opacity="0.55"/>
    <circle cx="420" cy="300" r="92" fill="url(#desiFire)"/>
    <path d="M400 306c-20-26 0-46 6-58 8 18 26 30 20 52-4 14-18 16-26 6z" fill="#ffb45c" opacity="0.9"/>
    <path d="M428 310c-12-16 0-30 4-38 5 12 16 18 12 32-2 10-11 12-16 6z" fill="#ffe3a3" opacity="0.95"/>
    <path d="M352 286h136l-18 34H370z" fill="#563428"/>
    <g>
      <rect x="366" y="232" width="108" height="60" rx="12" fill="#7d4a32"/>
      <rect x="350" y="224" width="140" height="14" rx="7" fill="#9a6142"/>
      <path d="M368 232c0-20 104-20 104 0z" fill="#8a5438"/>
      ${steamPaths('#f7e3c2', 0.65)}
    </g>
  </g>
  <g fill="#e7a93c">
    <circle cx="228" cy="262" r="7"/><circle cx="252" cy="252" r="6"/><circle cx="276" cy="266" r="7"/>
    <circle cx="252" cy="278" r="5"/>
  </g>
  <g fill="#f0e6d2" opacity="0.25">
    <circle cx="540" cy="120" r="22"/><circle cx="592" cy="170" r="14"/><circle cx="486" cy="72" r="12"/>
  </g>
</svg>`;
  }

  return `
<svg viewBox="0 0 640 380" class="scene-svg" role="img" aria-label="Modern backyard miniature set">
  <defs>
    <linearGradient id="westSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#20323f"/>
      <stop offset="0.45" stop-color="#7a5b45"/>
      <stop offset="1" stop-color="#e0a458"/>
    </linearGradient>
    <radialGradient id="westSun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#ffe6b0"/>
      <stop offset="0.6" stop-color="#f2a65a" stop-opacity="0.75"/>
      <stop offset="1" stop-color="#f2a65a" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="westWood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8c6239"/>
      <stop offset="1" stop-color="#4c3421"/>
    </linearGradient>
  </defs>
  <rect width="640" height="380" fill="url(#westSky)"/>
  <circle cx="512" cy="104" r="58" fill="url(#westSun)"/>
  <g fill="#2f4034" opacity="0.9">
    <circle cx="92" cy="196" r="54"/><circle cx="150" cy="216" r="40"/><circle cx="52" cy="224" r="36"/>
    <circle cx="560" cy="230" r="46"/><circle cx="608" cy="212" r="34"/>
  </g>
  <g stroke="#3a2a1d" stroke-width="6" opacity="0.75">
    <path d="M0 240h640"/><path d="M340 196v52"/><path d="M420 190v60"/><path d="M500 198v52"/>
  </g>
  <rect y="240" width="640" height="140" fill="#3a2a1d"/>
  <g>
    <rect y="286" width="640" height="94" fill="url(#westWood)"/>
    <g stroke="#3a2a1d" stroke-opacity="0.5" stroke-width="2">
      <path d="M0 306h640"/><path d="M0 330h640"/><path d="M0 356h640"/>
    </g>
  </g>
  <g>
    <ellipse cx="300" cy="330" rx="140" ry="24" fill="#22180f" opacity="0.45"/>
    <path d="M186 292h228l-16 26H202z" fill="#2f2a25"/>
    <path d="M184 288h232l-6 10H190z" fill="#40403f"/>
    <path d="M420 296l72-12 6 12-74 12z" fill="#2f2a25"/>
    <ellipse cx="298" cy="288" rx="94" ry="14" fill="#50493f"/>
    <circle cx="272" cy="284" r="12" fill="#e0a458"/>
    <circle cx="306" cy="280" r="10" fill="#d98b4a"/>
    <circle cx="330" cy="286" r="9" fill="#8a9a5b"/>
    ${steamPaths('#fff4e0', 0.6)}
  </g>
  <g fill="#f0e6d2" opacity="0.22">
    <circle cx="120" cy="120" r="18"/><circle cx="200" cy="86" r="10"/><circle cx="76" cy="72" r="12"/>
    <circle cx="580" cy="150" r="14"/>
  </g>
  <g fill="#e0a458" opacity="0.85">
    <circle cx="470" cy="262" r="4"/><circle cx="486" cy="272" r="3"/><circle cx="500" cy="258" r="3"/>
  </g>
</svg>`;
}

export function dishTile(dish, index) {
  const [primary = '#e0a458', secondary = '#5e6b3e', tertiary = '#f0e6d2'] = dish.palette ?? [];
  const id = `tile-${dish.id ?? index}`;
  return `
<div class="dish-tile" style="--tile-a:${primary};--tile-b:${secondary};--tile-c:${tertiary}">
  <svg viewBox="0 0 320 210" aria-hidden="true">
    <defs>
      <linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${primary}" stop-opacity="0.34"/>
        <stop offset="0.55" stop-color="${secondary}" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#0b0a09" stop-opacity="0.92"/>
      </linearGradient>
      <radialGradient id="${id}-glow" cx="0.5" cy="0.6" r="0.6">
        <stop offset="0" stop-color="${tertiary}" stop-opacity="0.25"/>
        <stop offset="1" stop-color="${tertiary}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="320" height="210" fill="url(#${id}-bg)"/>
    <rect width="320" height="210" fill="url(#${id}-glow)"/>
    <ellipse cx="160" cy="152" rx="104" ry="30" fill="#0b0a09" opacity="0.55"/>
    <ellipse cx="160" cy="146" rx="86" ry="24" fill="${tertiary}" opacity="0.14"/>
    <ellipse cx="160" cy="140" rx="62" ry="20" fill="${primary}" opacity="0.5"/>
    <path d="M110 140c14-24 86-24 100 0z" fill="${secondary}" opacity="0.85"/>
    <g fill="none" stroke="${tertiary}" stroke-opacity="0.5" stroke-width="3" stroke-linecap="round">
      <path d="M132 108c-10-12 8-18-1-30"/>
      <path d="M162 102c-8-10 6-16-1-26"/>
      <path d="M190 108c-9-12 7-17-1-28"/>
    </g>
    <g opacity="0.5" stroke="${primary}" stroke-width="1.5" fill="none">
      <circle cx="266" cy="52" r="16"/><circle cx="46" cy="62" r="9"/><circle cx="292" cy="118" r="7"/>
    </g>
  </svg>
  <span class="dish-tile-index">${String(index + 1).padStart(2, '0')}</span>
  <span class="dish-tile-emoji" aria-hidden="true">${dish.emoji ?? '🍽️'}</span>
</div>`;
}

export function stageFrame(stage, index, palette = []) {
  const [primary = '#e0a458', secondary = '#5e6b3e', tertiary = '#f0e6d2'] = palette;
  const id = `frame-${stage.id ?? index}`;
  return `
<div class="frame-tile">
  <svg viewBox="0 0 180 320" aria-hidden="true">
    <defs>
      <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#14110e"/>
        <stop offset="0.6" stop-color="${secondary}" stop-opacity="0.28"/>
        <stop offset="1" stop-color="${primary}" stop-opacity="0.42"/>
      </linearGradient>
    </defs>
    <rect width="180" height="320" fill="url(#${id}-bg)"/>
    <circle cx="90" cy="150" r="52" fill="${tertiary}" opacity="0.08"/>
    <ellipse cx="90" cy="212" rx="64" ry="20" fill="#0b0a09" opacity="0.6"/>
    <ellipse cx="90" cy="204" rx="54" ry="16" fill="${primary}" opacity="0.4"/>
    <ellipse cx="90" cy="198" rx="36" ry="12" fill="${secondary}" opacity="0.75"/>
    <g fill="none" stroke="${tertiary}" stroke-opacity="0.45" stroke-width="2.4" stroke-linecap="round">
      <path d="M74 168c-8-10 6-15-1-25"/>
      <path d="M92 164c-6-8 5-12-1-20"/>
      <path d="M108 168c-7-9 6-13-1-22"/>
    </g>
    <g opacity="0.5" stroke="${primary}" stroke-width="1.4" fill="none">
      <path d="M24 262c22-12 34-12 52 0"/>
      <path d="M104 262c22-12 34-12 52 0"/>
    </g>
    <text x="90" y="292" text-anchor="middle" fill="${tertiary}" fill-opacity="0.55" font-size="12" font-family="monospace" letter-spacing="2">9:16</text>
  </svg>
  <span class="frame-badge">${stage.id ?? `S${index + 1}`}</span>
  <span class="frame-duration">${stage.duration ?? 5}s</span>
</div>`;
}

export function logoMark() {
  return `
<svg viewBox="0 0 48 48" class="logo-mark" aria-hidden="true">
  <defs>
    <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2a65a"/>
      <stop offset="1" stop-color="#e2583e"/>
    </linearGradient>
  </defs>
  <rect x="3" y="3" width="42" height="42" rx="14" fill="#1b1613"/>
  <rect x="3" y="3" width="42" height="42" rx="14" fill="none" stroke="url(#logoGrad)" stroke-width="2"/>
  <path d="M13 27c0-6 5-10 11-10s11 4 11 10" fill="none" stroke="url(#logoGrad)" stroke-width="3" stroke-linecap="round"/>
  <path d="M9 30h30" stroke="url(#logoGrad)" stroke-width="3" stroke-linecap="round"/>
  <path d="M21 21l4-8 4 8z" fill="url(#logoGrad)"/>
  <circle cx="24" cy="16" r="1.6" fill="#f6efe3"/>
</svg>`;
}
