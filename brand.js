// Фирменный модуль ВИТШ Медиа для HTML-макетов: заставки, брендбук, шаблоны постов и обложка.
// Подключение: <script src="../brand/brand.js"></script>, затем `await VM.ready()` и VM.markSVG / VM.lockup / VM.snap.
// Геометрия знака совпадает с logo/build-mark.mjs.
(function () {
  const C = {
    blue: "#4392ee", navy: "#173160", night: "#0f1d38", ink: "#111111", white: "#ffffff",
    mid: "#8dbaf4", pale: "#cfe2fb", mist: "#eef4fd", paper: "#fafaf8", line: "#e6e8ec",
  };

  // Знак в единицах viewBox 200. Модуль U = 25: квадрат 4U у (1U, 3U), сетка точек 4U×4U у (3U, 1U),
  // сдвиг 2U. Габарит знака — 6U, начинается в (1U, 1U), поэтому знак ставится на сетку целиком.
  const U = 25;

  /** Точки полутона: координаты, итоговый радиус и t — 0 у квадрата, 1 в дальнем углу. */
  function grid(n = 6) {
    const step = 100 / n, out = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const t = (i + (n - 1 - j)) / (2 * (n - 1));
      out.push({ i, j, t, cx: 75 + step / 2 + i * step, cy: 25 + step / 2 + j * step, r: step * (0.08 + 0.39 * (1 - t)) });
    }
    return out;
  }

  let uid = 0;
  /**
   * Знак как набор SVG-элементов (без обёртки <svg>). Каждая точка нарисована дважды: дыркой в маске квадрата
   * и тёмной точкой под маской «всё, кроме квадрата». Поэтому точка, пересекающая край квадрата, честно
   * делится на дырку и точку — это нужно анимации, а в статике даёт тот же знак, что и build-mark.mjs.
   */
  function markGroup({ square = C.blue, dot = C.navy, n = 6 } = {}) {
    const id = "vm" + ++uid, g = grid(n);
    const big = 'x="-600" y="-600" width="1400" height="1400"';
    const sq = 'x="25" y="75" width="100" height="100" rx="10"';
    const circles = (fill, cls) => g.map((d) => `<circle class="${cls}" cx="${d.cx}" cy="${d.cy}" r="${d.r}" fill="${fill}"/>`).join("");
    const svg = `<defs>
<mask id="${id}-in" maskUnits="userSpaceOnUse" ${big}><rect ${big} fill="#fff"/>${circles("#000", `${id}-h`)}</mask>
<mask id="${id}-out" maskUnits="userSpaceOnUse" ${big}><rect ${big} fill="#fff"/><rect class="${id}-sq" ${sq} fill="#000"/></mask>
</defs><rect class="${id}-sq" ${sq} fill="${square}" mask="url(#${id}-in)"/><g mask="url(#${id}-out)">${circles(dot, `${id}-d`)}</g>`;
    return { id, svg, grid: g };
  }

  const THEMES = {
    light: { square: C.blue, dot: C.navy, ink: C.ink, accent: C.blue },
    dark: { square: C.blue, dot: C.white, ink: C.white, accent: C.mid },
    blue: { square: C.white, dot: C.navy, ink: C.white, accent: C.white },
    white: { square: C.white, dot: C.white, ink: C.white, accent: C.white },
    mono: { square: C.ink, dot: C.ink, ink: C.ink, accent: C.ink },
  };

  /** Отдельный знак: <svg> размером size, габарит знака занимает size·0.75 (по 1U поля с каждой стороны). */
  function markSVG(size, opts = {}) {
    const th = THEMES[opts.theme || "light"];
    return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" style="display:block;overflow:visible">${markGroup({ square: th.square, dot: th.dot, n: opts.n || 6 }).svg}</svg>`;
  }

  // ---------- Шрифты и измерения ----------
  const SANS = "Onest", MONO = "JetBrains Mono";
  const ready = () => Promise.all([
    document.fonts.load(`600 100px ${SANS}`, "ВИТШ всё про"),
    document.fonts.load(`500 100px ${SANS}`, "Аа"),
    document.fonts.load(`400 100px ${SANS}`, "Аа"),
    document.fonts.load(`500 100px "${MONO}"`, "МЕДИА медиа 0123"),
  ]).then(() => document.fonts.ready);

  const ctx = document.createElement("canvas").getContext("2d");
  function measure(text, font, ls = 0) {
    ctx.font = font;
    ctx.letterSpacing = `${ls}px`;
    return ctx.measureText(text);
  }

  /**
   * Слово по буквам с точной высотой прописных: cap — высота прописной в px, X — левый край чернил.
   * Возвращает позиции букв (с учётом кернинга и трекинга), размер шрифта и ширину чернил.
   */
  function word(text, { family = SANS, weight = 600, cap, track = -0.04, X = 0 }) {
    const capRatio = measure("ВИТШН", `${weight} 1000px ${family}`).actualBoundingBoxAscent / 1000;
    const size = cap / capRatio, font = `${weight} ${size}px ${family}`, ls = track * size;
    const full = measure(text, font, ls);
    const origin = X + full.actualBoundingBoxLeft;
    const letters = [...text].map((ch, k) => ({ ch, x: origin + measure(text.slice(0, k), font, ls).width }));
    // Трекинг после последней буквы не входит в чернила: правый край = origin + actualBoundingBoxRight
    return { size, font, family, weight, letters, inkL: X, inkW: full.actualBoundingBoxLeft + full.actualBoundingBoxRight };
  }

  /** Слово, растянутое по чернилам ровно на ширину W (для «МЕДИА» под «ВИТШ»): равные промежутки между буквами. */
  function justified(text, { family = MONO, weight = 500, cap, X, W }) {
    const capRatio = measure("МЕДИАН", `${weight} 1000px "${family}"`).actualBoundingBoxAscent / 1000;
    const size = cap / capRatio, font = `${weight} ${size}px "${family}"`;
    const m = [...text].map((ch) => { const r = measure(ch, font); return { ch, l: r.actualBoundingBoxLeft, w: r.actualBoundingBoxLeft + r.actualBoundingBoxRight }; });
    const gap = (W - m.reduce((s, c) => s + c.w, 0)) / (m.length - 1);
    let x = X;
    const letters = m.map((c) => { const o = { ch: c.ch, x: x + c.l }; x += c.w + gap; return o; });
    return { size, font, family: `"${family}"`, weight, letters, inkL: X, inkW: W };
  }

  const textSVG = (w, y, fill, cls) => w.letters.map((l, k) =>
    `<text class="${cls}" data-k="${k}" x="${l.x.toFixed(2)}" y="${y}" fill="${fill}" font-family='${w.family}' font-weight="${w.weight}" font-size="${w.size.toFixed(2)}" style="font-kerning:none">${l.ch}</text>`).join("");

  /**
   * Логотип на модульной сетке G (px). Всё стоит на линиях сетки:
   *  горизонтальный ('h'): знак 6G×6G; текст с отступом 1G; прописные «ВИТШ» — 2G, от верха квадрата (2G)
   *    до низа полутона (4G); «МЕДИА» — 1G, от 5G до низа квадрата (6G), ширина = ширине «ВИТШ».
   *  вертикальный ('v'): знак сверху по центру, «ВИТШ» от 7G до 9G, «МЕДИА» от 10G до 11G.
   * Возвращает { svg, w, h, id } — svg это <g> в координатах логотипа (0,0 — левый верх габарита).
   */
  function lockup({ G, layout = "h", theme = "light" }) {
    const th = THEMES[theme];
    const m = markGroup({ square: th.square, dot: th.dot });
    if (layout === "h") {
      const vitsh = word("ВИТШ", { cap: 2 * G, X: 7 * G });
      const media = justified("МЕДИА", { cap: G, X: 7 * G, W: vitsh.inkW });
      const svg = `<g class="${m.id}-mark" transform="translate(${-G} ${-G}) scale(${G / U})">${m.svg}</g>`
        + textSVG(vitsh, 4 * G, th.ink, `${m.id}-w`) + textSVG(media, 6 * G, th.accent, `${m.id}-m`);
      return { svg, w: 7 * G + vitsh.inkW, h: 6 * G, id: m.id, base: { vitsh: 4 * G, media: 6 * G }, textX: 7 * G, textW: vitsh.inkW };
    }
    const probe = word("ВИТШ", { cap: 2 * G, X: 0 });
    const w = Math.max(6 * G, probe.inkW), x0 = (w - probe.inkW) / 2;
    const vitsh = word("ВИТШ", { cap: 2 * G, X: x0 });
    const media = justified("МЕДИА", { cap: G, X: x0, W: vitsh.inkW });
    const mx = (w - 6 * G) / 2;
    const svg = `<g class="${m.id}-mark" transform="translate(${mx - G} ${-G}) scale(${G / U})">${m.svg}</g>`
      + textSVG(vitsh, 9 * G, th.ink, `${m.id}-w`) + textSVG(media, 11 * G, th.accent, `${m.id}-m`);
    return { svg, w, h: 11 * G, id: m.id, markX: mx, base: { vitsh: 9 * G, media: 11 * G }, textX: x0, textW: vitsh.inkW };
  }

  /**
   * Базовая сетка для обычного HTML-текста: элемент с data-snap="60" сдвигается вниз так, чтобы базовая
   * линия его первой строки легла на ближайшую линию, кратную 60 px (от верха страницы или от data-snap-root).
   * line-height элемента должен быть кратен шагу — тогда и остальные строки идут по линиям.
   */
  function snap(root = document) {
    root.querySelectorAll("[data-snap]").forEach((el) => {
      el.style.marginTop = "";
      const step = +el.dataset.snap;
      const base = el.closest("[data-snap-root]") || document.body;
      const probe = document.createElement("span");
      probe.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
      const first = el.querySelector("[data-snap-first]") || el;
      first.insertBefore(probe, first.firstChild);
      const y = probe.getBoundingClientRect().top - base.getBoundingClientRect().top;
      probe.remove();
      const target = Math.ceil((y - 0.5) / step) * step;
      const cur = parseFloat(getComputedStyle(el).marginTop) || 0;
      el.style.marginTop = `${cur + (target - y)}px`;
    });
  }

  window.VM = { C, U, grid, markGroup, markSVG, lockup, word, justified, ready, snap, THEMES };
})();
