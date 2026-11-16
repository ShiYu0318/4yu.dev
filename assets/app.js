/* =========================================================
   4yü/專案：全站唯一 JS
   資料：content/projects.json + content/projects/<id>.md
   動態：assets/vendor 的 GSAP（ScrollTrigger、SplitText、Flip）。
         GSAP 沒載入或使用者開啟「減少動態效果」時，內容照常顯示、只是不動。
   新增 Markdown 語法時，同步更新 AGENTS.md §5、範本與 check.py。
   ========================================================= */
(() => {
  "use strict";

  const MANIFEST = "content/projects.json";
  const PROJECT_DIR = "content/projects/";
  const CALLOUTS = {
    SUMMARY:   { cls: "summary",   label: "" },
    HIGHLIGHT: { cls: "highlight", label: "重點" },
    NOTE:      { cls: "note",      label: "補充" },
    WIP:       { cls: "wip",       label: "開發中" },
  };
  // lucide 圖示：16px、stroke 1.5
  const ICON = {
    out:   '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>',
    down:  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>',
    right: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  };
  const EASE = "expo.out";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 並列的幾段資訊用間距分開，不用「·」之類的分隔符號
  const parts = (...xs) => xs.filter((x) => x || x === 0).map((x) => `<span class="part">${esc(x)}</span>`).join("");
  const no = (n) => `No. ${String(n).padStart(2, "0")}`;
  const external = (url, label, cls = "button") =>
    `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}${ICON.out}</a>`;
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsap = window.gsap;
  const motion = !!gsap && !reduced;
  if (gsap) {
    [window.ScrollTrigger, window.SplitText, window.Flip, window.ScrambleTextPlugin].forEach((p) => p && gsap.registerPlugin(p));
  }

  async function loadManifest() {
    const res = await fetch(MANIFEST, { cache: "no-cache" });
    if (!res.ok) throw new Error(`讀不到 ${MANIFEST}（HTTP ${res.status}）`);
    const data = await res.json();
    data.published = data.projects.filter((p) => p.status === "published");
    data.published.forEach((p, i) => { p.no = i + 1; });
    data.catTitle = Object.fromEntries(data.categories.map((c) => [c.id, c.title]));
    return data;
  }


  /* ================= 互動與動態效果（AGENTS.md §6.5） ================= */
  const FX = {
    lenis: null,
    interactive: motion && finePointer,

    init() {
      if (!motion) return;
      // 平滑捲動
      if (window.Lenis) {
        this.lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4) });
        if (window.ScrollTrigger) this.lenis.on("scroll", ScrollTrigger.update);
        gsap.ticker.add((t) => this.lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
        document.addEventListener("click", (e) => {
          const a = e.target.closest('a[href*="#"]');
          if (!a || a.target === "_blank") return;
          const url = new URL(a.href, location.href);
          if (url.pathname !== location.pathname || !url.hash) return;
          const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
          if (!target) return;
          e.preventDefault();
          this.lenis.scrollTo(target, { offset: -72 });
          history.replaceState(null, "", url.hash);
        });
      }
      this.curtain();
      if (this.interactive) { this.cursor(); this.magnetize(document); }
    },

    // 換頁布幕：點站內連結時布幕從下蓋上，新頁面載入後從上收起
    curtain() {
      const el = $(".curtain"), mark = el && $(".wordmark", el);
      if (!el) return;
      if (sessionStorage.getItem("curtain")) {
        sessionStorage.removeItem("curtain");
        document.documentElement.classList.add("is-entering");
        gsap.set(el, { scaleY: 1, transformOrigin: "50% 0%" });
        gsap.set(mark, { opacity: 1 });
        gsap.timeline({ onComplete: () => document.documentElement.classList.remove("is-entering") })
          .to(mark, { opacity: 0, y: -12, duration: 0.25, ease: "power2.in" })
          .to(el, { scaleY: 0, duration: 0.6, ease: "expo.inOut" }, "-=0.05");
      }
      addEventListener("pageshow", (e) => { if (e.persisted) gsap.set(el, { scaleY: 0 }); });
      document.addEventListener("click", (e) => {
        const a = e.target.closest("a[href]");
        if (e.defaultPrevented || !a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        const url = new URL(a.href, location.href);
        if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
        if (url.pathname === location.pathname && url.search === location.search) return;
        e.preventDefault();
        sessionStorage.setItem("curtain", "1");
        document.documentElement.classList.add("is-leaving");
        gsap.set(el, { transformOrigin: "50% 100%" });
        gsap.timeline({ onComplete: () => { location.href = url.href; } })
          .to(el, { scaleY: 1, duration: 0.5, ease: "expo.inOut" })
          .fromTo(mark, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.25 }, "-=0.15");
      });
    },

    // 自訂游標：小點緊跟、圓圈延遲跟隨；移到連結放大，移到專案變成標籤
    cursor() {
      const root = $(".cursor"), dot = $(".cursor-dot"), ring = $(".cursor-ring"), label = $(".cursor-label");
      if (!root) return;
      document.documentElement.classList.add("has-cursor");
      root.classList.add("is-hidden");   // 第一次移動滑鼠前先藏起來，避免停在左上角
      const dx = gsap.quickTo(dot, "x", { duration: 0.1 }), dy = gsap.quickTo(dot, "y", { duration: 0.1 });
      const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
      let first = true;
      addEventListener("pointermove", (e) => {
        if (first) { first = false; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); root.classList.remove("is-hidden"); }
        dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      }, { passive: true });
      document.addEventListener("pointerover", (e) => {
        const t = e.target;
        const tagged = t.closest("[data-cursor]");
        const hidden = t.closest("canvas, input, textarea, .prose pre");
        const link = t.closest("a, button, [role='tab'], summary");
        root.classList.toggle("is-label", !!tagged);
        root.classList.toggle("is-link", !tagged && !!link);
        root.classList.toggle("is-hidden", !!hidden);
        if (tagged) label.textContent = tagged.dataset.cursor;
      });
      document.addEventListener("pointerleave", () => root.classList.add("is-hidden"));
      document.addEventListener("pointerenter", () => root.classList.remove("is-hidden"));
    },

    // 磁吸：按鈕被游標吸過去一點，離開後彈回
    magnetize(root) {
      if (!this.interactive) return;
      $$(".button, .search-trigger, .contact-links a, .contact-mail, .pager a, .toc-toggle", root).forEach((el) => {
        if (el.dataset.magnet) return;
        el.dataset.magnet = "1";
        const strength = el.matches(".contact-mail, .pager a") ? 0.12 : 0.3;
        const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" }), yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * strength); yTo((e.clientY - r.top - r.height / 2) * strength);
        });
        el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.4)" }));
      });
    },

    scramble(el, text = el.textContent, duration = 0.9) {
      if (!motion || !window.ScrambleTextPlugin || !el) return;
      const segs = el.querySelectorAll(":scope > .part");
      if (segs.length) { segs.forEach((seg) => this.scramble(seg, seg.textContent, duration)); return; }
      gsap.to(el, { duration, scrambleText: { text, chars: "01ABCDEFabcdef~/", speed: 0.6, revealDelay: 0.2 } });
    },

    // Hero：背景格點、照片 3D 傾斜、標題字被滑過時跳動、小字解碼
    hero(hero) {
      this.scramble($(".hero-eyebrow", hero), undefined, 1.4);
      const canvas = document.createElement("canvas");
      canvas.className = "hero-grid"; canvas.setAttribute("aria-hidden", "true");
      hero.prepend(canvas);
      const topo = this.topography(canvas, hero);

      if (!this.interactive) return;
      const img = $(".portrait img", hero);
      const tx = gsap.quickTo(img, "rotationY", { duration: 0.6, ease: "power3" });
      const ty = gsap.quickTo(img, "rotationX", { duration: 0.6, ease: "power3" });
      hero.addEventListener("pointermove", (e) => {
        topo.point(e.clientX, e.clientY);
        const hr = hero.getBoundingClientRect();
        tx(((e.clientX - hr.left) / hr.width - 0.5) * 18);
        ty(-((e.clientY - hr.top) / hr.height - 0.5) * 18);
      });
      hero.addEventListener("pointerleave", () => { topo.leave(); tx(0); ty(0); });

    },


    /* 等高線地形：3D Perlin noise 當高度場，用 marching squares 畫等高線；
       游標位置加一座小山，附近的線變亮；畫面外或減少動態時停止更新 */
    topography(canvas, host) {
      const ctx = canvas.getContext("2d");
      const lineColor = cssVar("--line-strong"), hot = cssVar("--accent");
      const P = new Uint8Array(512);
      { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
      const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10), lerp = (a, b, t) => a + t * (b - a);
      const grad = (h, x, y, z) => { const u = (h & 15) < 8 ? x : y, v = (h & 15) < 4 ? y : (h & 15) === 12 || (h & 15) === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
      const noise = (x, y, z) => {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
        const u = fade(x), v = fade(y), w = fade(z);
        const A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
        return lerp(lerp(lerp(grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z), u), lerp(grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z), u), v),
          lerp(lerp(grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1), u), lerp(grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1), u), v), w);
      };
      const CELL = 14, LEVELS = 14, SCALE = 0.0032, HILL = 150;
      let w = 0, h = 0, dpr = 1, cols = 0, rows = 0, field = new Float32Array(0);
      let t = Math.random() * 100, pointer = null, hill = { v: 0 }, visible = true, last = 0;

      const sample = () => {
        for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
          const x = i * CELL, y = j * CELL;
          let v = noise(x * SCALE, y * SCALE, t) * 1.1 + noise(x * SCALE * 2.3, y * SCALE * 2.3, t * 1.4) * 0.35;
          if (pointer && hill.v > 0.001) { const dx = x - pointer.x, dy = y - pointer.y; v += Math.exp(-(dx * dx + dy * dy) / (2 * HILL * HILL)) * 0.9 * hill.v; }
          field[j * (cols + 1) + i] = v;
        }
      };
      const contours = () => {
        const path = new Path2D(), W = cols + 1;
        for (let l = 0; l < LEVELS; l++) {
          const iso = -0.7 + (1.6 * l) / (LEVELS - 1);
          for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
            const a = field[j * W + i], b = field[j * W + i + 1], c = field[(j + 1) * W + i + 1], d = field[(j + 1) * W + i];
            const idx = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
            if (idx === 0 || idx === 15) continue;
            const x = i * CELL, y = j * CELL;
            const top = [x + CELL * (iso - a) / (b - a), y], right = [x + CELL, y + CELL * (iso - b) / (c - b)];
            const bottom = [x + CELL * (iso - d) / (c - d), y + CELL], left = [x, y + CELL * (iso - a) / (d - a)];
            const seg = (p, q) => { path.moveTo(p[0], p[1]); path.lineTo(q[0], q[1]); };
            switch (idx) {
              case 1: case 14: seg(left, bottom); break;
              case 2: case 13: seg(bottom, right); break;
              case 3: case 12: seg(left, right); break;
              case 4: case 11: seg(top, right); break;
              case 5: seg(left, top); seg(bottom, right); break;
              case 6: case 9: seg(top, bottom); break;
              case 7: case 8: seg(left, top); break;
              case 10: seg(top, right); seg(left, bottom); break;
            }
          }
        }
        return path;
      };
      const draw = () => {
        sample();
        const path = contours();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;
        ctx.strokeStyle = lineColor;
        ctx.stroke(path);
        if (pointer && hill.v > 0.01) {
          ctx.save();
          const g = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 220);
          g.addColorStop(0, hot); g.addColorStop(1, "transparent");
          ctx.globalAlpha = 0.9 * hill.v;
          ctx.strokeStyle = g;
          ctx.stroke(path);
          ctx.restore();
        }
      };
      const size = () => {
        const r = canvas.getBoundingClientRect();
        w = r.width; h = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
        field = new Float32Array((cols + 1) * (rows + 1));
        draw();
      };
      new ResizeObserver(size).observe(host);
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(host);
      if (motion) gsap.ticker.add((time) => {
        if (!visible || time - last < 1 / 30) return;   // 約 30fps 就夠
        last = time; t += 0.004 + hill.v * 0.002;
        draw();
      });
      return {
        point: (cx, cy) => {
          const r = canvas.getBoundingClientRect();
          pointer = { x: cx - r.left, y: cy - r.top };
          if (hill.v < 1 && !gsap.isTweening(hill)) gsap.to(hill, { v: 1, duration: 0.8, ease: "power2.out" });
        },
        leave: () => gsap.to(hill, { v: 0, duration: 1.2, ease: "power2.out" }),
      };
    },

    // 跑馬燈：所有專案用到的技術；捲動越快跑越快，方向跟著捲動方向
    marquee(data) {
      const track = $(".marquee-track");
      if (!track) return;
      const tags = [...new Set(data.published.flatMap((p) => p.tags))];
      const run = tags.map((t) => `<span>${esc(t)}</span><span class="sep">/</span>`).join("");
      track.innerHTML = run + run;
      if (!motion) return;
      let x = 0, dir = -1, boost = 0;
      const half = () => track.scrollWidth / 2;
      gsap.ticker.add((t, dt) => {
        x += dir * (0.04 + boost) * dt;
        boost *= 0.94;
        const hw = half();
        if (x <= -hw) x += hw; else if (x > 0) x -= hw;
        gsap.set(track, { x });
      });
      if (window.ScrollTrigger) ScrollTrigger.create({
        onUpdate: (self) => { dir = self.direction === 1 ? -1 : 1; boost = Math.min(Math.abs(self.getVelocity()) / 2500, 1.2); },
      });
    },

    // 專案區：截圖 3D 傾斜與視差、編號解碼、清單隨捲動速度傾斜、數字倒數
    projects() {
      const countEl = $("#project-count");
      if (motion && countEl && window.ScrollTrigger) {
        const total = Number(countEl.textContent), o = { v: 0 };
        ScrollTrigger.create({ trigger: countEl, start: "top 90%", once: true, onEnter: () =>
          gsap.to(o, { v: total, duration: 1.2, ease: "power2.out", onUpdate: () => { countEl.textContent = String(Math.round(o.v)).padStart(2, "0"); } }) });
      }
      $$(".feature").forEach((f) => {
        const shot = $(".feature-shot", f), img = shot.firstElementChild, meta = $(".meta", f);
        if (motion && window.ScrollTrigger) {
          gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: shot, start: "top bottom", end: "bottom top", scrub: true } });
          ScrollTrigger.create({ trigger: f, start: "top 80%", once: true, onEnter: () => this.scramble(meta) });
        }
        if (!this.interactive) return;
        const rx = gsap.quickTo(shot, "rotationX", { duration: 0.5, ease: "power3" }), ry = gsap.quickTo(shot, "rotationY", { duration: 0.5, ease: "power3" });
        gsap.set(shot, { transformPerspective: 1000 });
        shot.addEventListener("pointermove", (e) => {
          const r = shot.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 10); rx(-((e.clientY - r.top) / r.height - 0.5) * 8);
        });
        shot.addEventListener("pointerleave", () => { rx(0); ry(0); });
      });
      if (this.interactive) $$("#index a").forEach((a) => {
        const n = $(".no", a), text = n.textContent;
        a.addEventListener("pointerenter", () => this.scramble(n, text, 0.5));
      });
      const list = $("#index");
      if (motion && list && window.ScrollTrigger) {
        const skew = gsap.quickTo(list, "skewY", { duration: 0.5, ease: "power3" });
        ScrollTrigger.create({ onUpdate: (self) => skew(Math.max(-2.5, Math.min(2.5, self.getVelocity() / -600))) });
        let t; addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(() => skew(0), 120); }, { passive: true });
      }
    },

    // 頁尾信箱：字母靠近游標時浮起
    mailWave(btn) {
      if (!this.interactive || !window.SplitText || !btn) return;
      const chars = SplitText.create(btn, { type: "chars", charsClass: "char" }).chars;
      const tos = chars.map((c) => gsap.quickTo(c, "y", { duration: 0.4, ease: "power3" }));
      const zone = btn.closest(".contact");
      zone.addEventListener("pointermove", (e) => {
        chars.forEach((c, i) => {
          const r = c.getBoundingClientRect(), d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          tos[i](-Math.max(0, 1 - d / 140) * 18);
        });
      });
      zone.addEventListener("pointerleave", () => tos.forEach((to) => to(0)));
    },

    // 專案頁：章節標題解碼、封面隨捲動縮放、內文圖片展開
    project(article) {
      if (!motion || !window.ScrollTrigger) return;
      $$("h2 .h-text, h3 .h-text", article).forEach((t) => {
        const text = t.textContent;
        ScrollTrigger.create({ trigger: t, start: "top 88%", once: true, onEnter: () => this.scramble(t, text, 0.8) });
      });
      const cover = $(".project-cover img");
      if (cover) gsap.to(cover, { scale: 1.08, yPercent: 4, ease: "none", scrollTrigger: { trigger: ".project-cover", start: "top 60%", end: "bottom top", scrub: true } });
      $$("img", article).forEach((img) => {
        gsap.from(img, { clipPath: "inset(12% 8% 12% 8% round 12px)", duration: 1.1, ease: EASE, scrollTrigger: { trigger: img, start: "top 88%", once: true } });
      });
    },
  };

  /* ================= 共用：導覽、搜尋、頁尾、進度 ================= */

  // 流體 hover：一塊底色滑到游標所在的連結
  function initNavHover() {
    const nav = $(".nav"), blob = $(".nav-hover");
    if (!nav || !blob || !finePointer) return;
    const items = $$(":scope > a, :scope > button", nav);
    const move = (el) => {
      const r = el.getBoundingClientRect(), n = nav.getBoundingClientRect();
      const props = { x: r.left - n.left, width: r.width, opacity: 1 };
      if (motion) gsap.to(blob, { ...props, duration: 0.35, ease: EASE });
      else Object.assign(blob.style, { transform: `translateX(${props.x}px)`, width: `${props.width}px`, opacity: 1 });
    };
    items.forEach((el) => el.addEventListener("pointerenter", () => move(el)));
    nav.addEventListener("pointerleave", () => {
      if (motion) gsap.to(blob, { opacity: 0, duration: 0.2 }); else blob.style.opacity = 0;
    });
  }

  // ⌘K 搜尋面板
  function initPalette(data) {
    const dlg = $("#palette"), input = $("#palette-input"), list = $("#palette-list");
    if (!dlg) return;
    let sel = 0, results = [];
    const match = (p, q) => !q || [p.title, p.tagline, data.catTitle[p.category], ...p.tags].join(" ").toLowerCase().includes(q);
    const draw = () => {
      const q = input.value.trim().toLowerCase();
      results = data.published.filter((p) => match(p, q));
      sel = Math.min(sel, Math.max(results.length - 1, 0));
      list.innerHTML = results.map((p, i) => `
        <li><a role="option" href="project.html?id=${encodeURIComponent(p.id)}" aria-selected="${i === sel}">
          <span class="meta">${String(p.no).padStart(2, "0")}</span>
          <span>${esc(p.title)}<small>${esc(p.tagline)}</small></span>
          <span class="meta">${esc(data.catTitle[p.category])}</span>
        </a></li>`).join("") || `<li class="empty">找不到「${esc(input.value)}」</li>`;
    };
    const mark = () => $$("a", list).forEach((a, i) => {
      a.setAttribute("aria-selected", i === sel);
      if (i === sel) a.scrollIntoView({ block: "nearest" });
    });
    const open = () => { if (dlg.open) return; input.value = ""; sel = 0; draw(); dlg.showModal(); input.focus(); FX.lenis?.stop(); };
    dlg.addEventListener("close", () => FX.lenis?.start());
    list.setAttribute("data-lenis-prevent", "");
    $$("[data-palette-open]").forEach((b) => b.addEventListener("click", open));
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dlg.open ? dlg.close() : open(); }
      else if (e.key === "/" && !dlg.open && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
    input.addEventListener("input", () => { sel = 0; draw(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, results.length - 1); mark(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); mark(); }
      else if (e.key === "Enter" && results[sel]) { e.preventDefault(); location.href = `project.html?id=${encodeURIComponent(results[sel].id)}`; }
    });
    list.addEventListener("pointermove", (e) => {
      const a = e.target.closest("a"); if (!a) return;
      const i = $$("a", list).indexOf(a); if (i !== sel) { sel = i; mark(); }
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  }

  function renderFooter(data) {
    const pf = data.profile, foot = $("#contact");
    if (!foot) return;
    foot.innerHTML = `
      <div class="contact">
        <div>
          <p class="meta">合作、演講或實驗室聯絡</p>
          <button class="contact-mail" type="button" data-cursor="複製" data-copy="${esc(pf.email)}" aria-label="複製 Email：${esc(pf.email)}">${esc(pf.email)}</button>
          <p class="meta copy-status" aria-live="polite"></p>
        </div>
        <nav class="contact-links" aria-label="其他連結">
          ${pf.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}
        </nav>
        ${pf.githubAvatar ? `
        <figure class="dotfield">
          <div class="dotfield-frame"><img src="${esc(pf.githubAvatar)}" alt="" hidden><canvas role="img" aria-label="用點陣畫成的 GitHub 頭像：戴耳機的黑貓"></canvas></div>
        </figure>` : ""}
      </div>
      <div class="footer-base">
        <span>4yü 2026</span>
        <span>內容與版面依 <a href="https://github.com/ShiYu0318/NCCU-GenAI-HW/blob/main/AGENTS.md">AGENTS.md</a> 維護</span>
      </div>`;
    const field = $(".dotfield-frame", foot);
    if (field) initDotField(field);
    const btn = $("[data-copy]", foot), status = $(".copy-status", foot);
    FX.mailWave(btn);
    FX.magnetize(foot);
    btn.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(btn.dataset.copy); status.textContent = "已複製到剪貼簿"; }
      catch { location.href = `mailto:${btn.dataset.copy}`; }
      setTimeout(() => (status.textContent = ""), 2000);
    });
  }

  // 頂端進度條：首頁是捲動進度，專案頁是閱讀進度
  function initProgress() {
    const bar = $(".progress");
    if (!bar) return;
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
      ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // 標題逐字浮現
  function splitReveal(el, delay = 0) {
    if (!motion || !window.SplitText || !el) return null;
    const split = SplitText.create(el, { type: "lines,chars", linesClass: "line", charsClass: "char", mask: "lines" });
    // 動畫結束後還原成原本的文字，複製時才不會變成一字一行
    gsap.from(split.chars, { yPercent: 110, duration: 0.9, ease: EASE, stagger: 0.018, delay, onComplete: () => split.revert() });
    return split;
  }

  // 捲到時才出現。用 IntersectionObserver 看元素實際位置，版面高度改變（切換檢視、圖片載入）也不會漏掉
  const revealed = new WeakSet();
  function onVisible(els, play, margin = "0px 0px -8% 0px") {
    if (!motion || !("IntersectionObserver" in window) || !els.length) return false;
    let queue = [], timer = 0;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        if (revealed.has(en.target)) return;
        revealed.add(en.target);
        queue.push(en.target);
      });
      if (queue.length && !timer) timer = requestAnimationFrame(() => { play(queue); queue = []; timer = 0; });
    }, { rootMargin: margin });
    els.forEach((el) => io.observe(el));
    return true;
  }
  // 某些元素已由別的動畫負責顯示（例如切換檢視時），之後就不再交給捲動淡入
  const markRevealed = (els) => els.forEach((el) => revealed.add(el));

  function revealOnScroll(targets, opts = {}) {
    const els = typeof targets === "string" ? $$(targets) : targets;
    if (!motion || !els.length) return;
    gsap.set(els, { opacity: 0, y: 16 });
    onVisible(els, (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.06, overwrite: "auto", ...opts }));
  }

  // 截圖展開：外框從內縮的裁切展開，圖片從放大縮回
  function revealShots(shots) {
    if (!motion) return;
    gsap.set(shots, { clipPath: "inset(10% 6% 10% 6% round 16px)" });
    shots.forEach((s) => gsap.set(s.firstElementChild, { scale: 1.2 }));
    onVisible(shots, (batch) => batch.forEach((shot) => {
      gsap.to(shot, { clipPath: "inset(0% 0% 0% 0% round 16px)", duration: 1.1, ease: EASE, clearProps: "clipPath" });
      gsap.to(shot.firstElementChild, { scale: 1, duration: 1.4, ease: EASE });
    }));
  }

  /* ================= 首頁 ================= */

  async function renderHome() {
    let data;
    try { data = await loadManifest(); }
    catch (e) { $("#hero").innerHTML = errorBox(e.message); return; }
    initPalette(data);
    renderFooter(data);

    const pf = data.profile;
    const others = pf.links.filter((l) => l.label !== "GitHub");
    $("#hero").innerHTML = `
      <div class="hero-text">
        <p class="hero-eyebrow meta">${esc(pf.nameEn)}　${esc(pf.tagline)}</p>
        <h1 class="sr-only">${esc(pf.name)}</h1>
        <p class="bio">${esc(pf.bio)}</p>
        <div class="hero-actions">
          <a class="button primary" href="#projects">查看專案${ICON.down}</a>
          ${external("https://github.com/ShiYu0318", "GitHub")}
          ${others.filter((l) => l.label === "CV").map((l) => external(l.url, l.label)).join("")}
        </div>
      </div>
      <figure class="portrait">
        <img src="${esc(pf.portrait)}" alt="${esc(pf.name)} 的照片" width="800" height="800">
        <figcaption class="meta">@${esc(pf.handle)}</figcaption>
      </figure>`;
    FX.hero($("#hero"));
    if (motion) {
      gsap.from([".hero-eyebrow", ".hero .bio", ".hero-actions"], { opacity: 0, y: 16, duration: 0.9, ease: EASE, stagger: 0.1, delay: 0.15 });
      gsap.from(".portrait", { opacity: 0, scale: 0.94, duration: 1, ease: EASE, delay: 0.2 });
    }

    renderProjects(data);
  }

  // 封面：有截圖用截圖；沒有的話用程式畫一張專案資訊卡（不是假截圖）
  const coverHTML = (p, data) => p.cover
    ? `<img src="${esc(p.cover)}" alt="${esc(p.title)} 的畫面" loading="lazy">`
    : `<div class="gen-cover" role="img" aria-label="${esc(p.title)} 的資訊卡">
         <span class="gc-path">~/projects/${esc(p.id)}</span>
         <span class="gc-title">${esc(p.title)}</span>
         <span class="gc-stack">${p.tags.map(esc).join(" / ")}</span>
         <span class="gc-no">${String(p.no).padStart(2, "0")}</span>
       </div>`;

  // 分段控制：選取底色滑到被點的按鈕
  function segmented(box, onChange) {
    const thumb = $(".thumb", box);
    const move = (btn, animate) => {
      if (!btn || !thumb) return;
      const props = { x: btn.offsetLeft, y: btn.offsetTop - 4, width: btn.offsetWidth };
      if (motion && animate) gsap.to(thumb, { ...props, duration: 0.45, ease: EASE });
      else if (gsap) gsap.set(thumb, props);
      else Object.assign(thumb.style, { transform: `translate(${props.x}px, ${props.y}px)`, width: `${props.width}px` });
    };
    const attr = box.getAttribute("role") === "radiogroup" ? "aria-checked" : "aria-selected";
    box.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || btn.getAttribute(attr) === "true") return;
      $$("button", box).forEach((b) => b.setAttribute(attr, b === btn));
      move(btn, true);
      onChange(btn.dataset.value);
    });
    const sync = () => move($(`button[${attr}="true"]`, box), false);
    requestAnimationFrame(sync);
    addEventListener("resize", sync);
    document.fonts?.ready.then(sync);
  }

  function renderProjects(data) {
    const cats = [{ id: "all", title: "全部" }, ...data.categories];
    const count = (id) => data.published.filter((p) => id === "all" || p.category === id).length;
    const fbox = $("#filters"), vbox = $("#views");
    fbox.innerHTML = `<span class="thumb" aria-hidden="true"></span>` + cats.filter((c) => count(c.id)).map((c, i) =>
      `<button type="button" role="tab" data-value="${esc(c.id)}" aria-selected="${i === 0}">${esc(c.title)}<span class="count">${count(c.id)}</span></button>`).join("");
    $("#project-count").textContent = String(data.published.length).padStart(2, "0");

    const VIEWS = [
      { id: "rows", label: "交錯", icon: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="10" height="7" rx="1.5"/><path d="M16 6h5M16 9h3"/><rect x="11" y="13" width="10" height="7" rx="1.5"/><path d="M3 15h5M3 18h3"/></svg>' },
      { id: "grid", label: "矩陣", icon: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>' },
      { id: "table", label: "表格", icon: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M3 12h18M3 19h18"/></svg>' },
    ];
    let view = "rows";
    try { const saved = localStorage.getItem("view"); if (VIEWS.some((v) => v.id === saved)) view = saved; } catch { /* 無法使用 localStorage 時用預設 */ }
    vbox.innerHTML = `<span class="thumb" aria-hidden="true"></span>` + VIEWS.map((v) =>
      `<button type="button" role="radio" data-value="${v.id}" aria-checked="${v.id === view}" title="${v.label}">${v.icon}<span>${v.label}</span></button>`).join("");

    const list = data.published;
    const meta = (p) => parts(no(p.no), data.catTitle[p.category], p.year, p.team && "團隊");
    const href = (p) => `project.html?id=${encodeURIComponent(p.id)}`;

    $("#view-rows").innerHTML = list.map((p) => `
      <a class="feature item" data-flip-id="${esc(p.id)}" data-cat="${esc(p.category)}" href="${href(p)}">
        <div class="feature-shot">${coverHTML(p, data)}</div>
        <div class="feature-text">
          <p class="meta">${meta(p)}</p>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.tagline)}</p>
          <p class="stack">${p.tags.map(esc).join(" / ")}</p>
          <span class="read-more"><span>閱讀介紹</span>${ICON.right}</span>
        </div>
      </a>`).join("");

    $("#view-grid").innerHTML = list.map((p) => `
      <a class="tile item" data-flip-id="${esc(p.id)}" data-cat="${esc(p.category)}" href="${href(p)}">
        <div class="tile-shot">${coverHTML(p, data)}</div>
        <div class="tile-text">
          <p class="meta">${parts(String(p.no).padStart(2, "0"), data.catTitle[p.category], p.team && "團隊")}</p>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.tagline)}</p>
        </div>
      </a>`).join("");

    $("#index").innerHTML = list.map((p) => `
      <li class="item" data-flip-id="${esc(p.id)}" data-cat="${esc(p.category)}"><a href="${href(p)}" data-id="${esc(p.id)}">
        <span class="meta no">${String(p.no).padStart(2, "0")}</span>
        <span><span class="title">${esc(p.title)}${p.team ? `<span class="team">團隊</span>` : ""}</span><span class="tagline">${esc(p.tagline)}</span></span>
        <span class="cat">${esc(data.catTitle[p.category])}</span>
        <span class="meta year">${esc(p.year)}</span>
        <span class="go" aria-hidden="true">${ICON.right}</span>
      </a></li>`).join("");

    let cat = "all";
    const viewEl = (id) => $(`#view-${id}`);
    const filter = () => {
      let shown = 0;
      $$(".item", viewEl(view)).forEach((el) => {
        const on = cat === "all" || el.dataset.cat === cat;
        el.hidden = !on;
        if (on) shown++;
      });
      $("#empty").hidden = shown > 0;
      return shown;
    };
    const showView = (id) => VIEWS.forEach((v) => { viewEl(v.id).hidden = v.id !== id; });

    // 篩選：Flip 讓留下的項目平滑移到新位置
    segmented(fbox, (value) => {
      const items = $$(".item", viewEl(view));
      const state = motion && window.Flip ? Flip.getState(items) : null;
      cat = value;
      filter();
      if (state) Flip.from(state, {
        duration: 0.6, ease: EASE, nested: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE, stagger: 0.04 }),
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });

    // 切換顯示方式：舊版面淡出 → 換版面 → 新版面的項目依序浮現（不讓兩種版面的文字疊在一起）
    let switching = null;
    segmented(vbox, (value) => {
      const prev = view;
      view = value;
      try { localStorage.setItem("view", view); } catch { /* 忽略 */ }
      const swap = () => {
        showView(view);
        filter();
        const to = $$(".item:not([hidden])", viewEl(view));
        markRevealed(to);
        if (view === "rows") markRevealed($$(".feature-shot, .feature-text", viewEl(view)));
        if (motion) {
          const shots = $$(".feature-shot", viewEl(view)), texts = $$(".feature-text", viewEl(view));
          if (shots.length) { gsap.set(shots, { clearProps: "clipPath" }); shots.forEach((s) => gsap.set(s.firstElementChild, { scale: 1 })); }
          if (texts.length) gsap.set(texts, { opacity: 1, y: 0 });
          const top = viewEl(view).getBoundingClientRect().top;
          const inView = to.filter((el) => el.getBoundingClientRect().top < innerHeight + 40);
          if (to.length) gsap.set(to, { opacity: 1, y: 0 });
          if (inView.length) gsap.fromTo(inView, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: EASE, stagger: 0.035, clearProps: "transform" });
          if (top < 0) FX.lenis ? FX.lenis.scrollTo("#projects", { offset: -72, duration: 0.8 }) : null;
        }
        window.ScrollTrigger?.refresh();
      };
      if (!motion) { swap(); return; }
      switching?.kill();
      const from = $$(".item:not([hidden])", viewEl(prev)).filter((el) => {
        const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight;
      });
      switching = gsap.to(from, { opacity: 0, y: -10, duration: 0.22, ease: "power2.in", stagger: 0.012, onComplete: () => {
        const old = $$(".item", viewEl(prev)); if (old.length) gsap.set(old, { opacity: 1, y: 0 });
        swap();
      } });
      if (!from.length) { switching.kill(); swap(); }
    });

    showView(view);
    filter();

    revealShots($$(".feature-shot"));
    revealOnScroll($$(".feature-text"));
    revealOnScroll($$(".tile"));
    revealOnScroll($$("#index li"));
    initPreview(data);
    FX.marquee(data);
    FX.projects();
  }

  // 索引 hover：截圖預覽跟著游標，帶一點延遲
  // 表格 hover 預覽：有截圖顯示截圖，沒有就顯示程式畫的資訊卡；捲動時跟著游標下的那一列更新
  function initPreview(data) {
    const box = $(".preview"), list = $("#index");
    if (!box || !list || !finePointer || !gsap) return;
    const byId = Object.fromEntries(data.published.map((p) => [p.id, p]));
    // 先載入所有截圖，第一次 hover 才不會是空框
    data.published.forEach((p) => { if (p.cover) new Image().src = p.cover; });
    const xTo = gsap.quickTo(box, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(box, "y", { duration: 0.5, ease: "power3" });
    const rTo = gsap.quickTo(box, "rotation", { duration: 0.6, ease: "power3" });
    let visible = false, current = null, lastX = 0, px = -1, py = -1;

    const show = (a, x, y) => {
      const id = a?.dataset.id;
      if (!id || !byId[id]) { hide(); return; }
      if (id !== current) { current = id; box.innerHTML = coverHTML(byId[id], data); }
      xTo(x + 24); yTo(y - 80);
      if (!visible) {
        visible = true;
        gsap.set(box, { x: x + 24, y: y - 80 });
        gsap.to(box, { opacity: 1, scale: 1, duration: reduced ? 0 : 0.3, ease: EASE, overwrite: "auto" });
      }
    };
    const hide = () => {
      if (!visible) return;
      visible = false;
      gsap.to(box, { opacity: 0, scale: 0.96, duration: 0.2, overwrite: "auto" });
    };
    list.addEventListener("pointermove", (e) => {
      px = e.clientX; py = e.clientY;
      if (motion) { rTo(Math.max(-10, Math.min(10, (px - lastX) * 0.6))); lastX = px; }
      show(e.target.closest("a"), px, py);
    });
    list.addEventListener("pointerleave", () => { px = -1; hide(); });
    // 捲動時游標不動、底下的列會換：用游標位置重新找
    addEventListener("scroll", () => {
      if (px < 0) return;
      const el = document.elementFromPoint(px, py);
      const a = el?.closest("#index a");
      a ? show(a, px, py) : hide();
    }, { passive: true });
  }


  /* 點陣頭像：把 GitHub 頭像（電光藍背景上的黑貓）依顏色取樣成點陣。
     藍色背景 → 電光藍點、白色的眼睛與背景字 → 白點、耳機 → 淡藍點、黑貓本身留空；
     游標靠近時點被推開，離開後用彈簧拉回原位，捲到時點從四散聚合 */
  function initDotField(frame) {
    const canvas = $("canvas", frame), src = $("img", frame);
    const ctx = canvas.getContext("2d");
    const colors = [cssVar("--brand"), cssVar("--accent"), cssVar("--text")];
    let dots = [], w = 0, h = 0, dpr = 1, raf = 0, pointer = null, active = false, built = false;

    const build = (intro) => {
      const rect = frame.getBoundingClientRect();
      w = rect.width; h = rect.height; dpr = Math.min(devicePixelRatio || 1, 2);
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      const step = w < 300 ? 5 : 6;
      const cols = Math.floor(w / step), rows = Math.floor(h / step);
      const sample = document.createElement("canvas");
      sample.width = cols; sample.height = rows;
      const sctx = sample.getContext("2d", { willReadFrequently: true });
      sctx.drawImage(src, 0, 0, cols, rows);
      const px = sctx.getImageData(0, 0, cols, rows).data;
      const ox = (w - cols * step) / 2, oy = (h - rows * step) / 2;
      dots = [];
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = (j * cols + i) * 4, R = px[k] / 255, G = px[k + 1] / 255, B = px[k + 2] / 255;
          const lum = 0.2126 * R + 0.7152 * G + 0.0722 * B;
          const blue = B - Math.max(R, G);
          let c, size;
          if (lum > 0.55) { c = 2; size = 0.42 + lum * 0.36; }          // 眼睛、背景字的白
          else if (blue > 0.45) { c = 0; size = 0.3 + blue * 0.32; }     // 電光藍背景
          else if (lum > 0.14 || blue > 0.2) { c = 1; size = 0.22 + lum * 0.6; } // 耳機、輪廓
          else continue;                                                // 黑貓本身留空
          const r = size * step * 0.62;
          const hx = ox + i * step + step / 2, hy = oy + j * step + step / 2;
          const a = Math.random() * Math.PI * 2, d = (0.5 + Math.random()) * w * 0.6;
          const start = intro ? { x: w / 2 + Math.cos(a) * d, y: h / 2 + Math.sin(a) * d } : { x: hx, y: hy };
          dots.push({ hx, hy, x: start.x, y: start.y, vx: 0, vy: 0, r, c });
        }
      }
      built = true;
      wake();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = colors[c];
        ctx.beginPath();
        for (const d of dots) {
          if (d.c !== c) continue;
          ctx.moveTo(d.x + d.r, d.y);
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
    };

    const tick = () => {
      let energy = 0;
      const R = 70, R2 = R * R;
      for (const d of dots) {
        if (pointer) {
          const dx = d.x - pointer.x, dy = d.y - pointer.y, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            const dist = Math.sqrt(d2), f = (1 - dist / R) * 2.8;
            d.vx += (dx / dist) * f; d.vy += (dy / dist) * f;
          }
        }
        d.vx = (d.vx + (d.hx - d.x) * 0.055) * 0.8;
        d.vy = (d.vy + (d.hy - d.y) * 0.055) * 0.8;
        d.x += d.vx; d.y += d.vy;
        energy += Math.abs(d.vx) + Math.abs(d.vy) + Math.abs(d.hx - d.x) * 0.1;
      }
      draw();
      if (energy > dots.length * 0.01 || pointer) raf = requestAnimationFrame(tick);
      else { raf = 0; active = false; }
    };
    const wake = () => {
      if (reduced) { dots.forEach((d) => { d.x = d.hx; d.y = d.hy; }); draw(); return; }
      if (!active) { active = true; raf = requestAnimationFrame(tick); }
    };

    canvas.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
      wake();
    });
    canvas.addEventListener("pointerleave", () => { pointer = null; });

    const start = () => {
      // 捲到頁尾才開始聚合
      new IntersectionObserver((entries, obs) => {
        if (entries.some((e) => e.isIntersecting)) { obs.disconnect(); build(!reduced); }
      }, { rootMargin: "0px 0px -10% 0px" }).observe(frame);
      let t; new ResizeObserver(() => { if (!built) return; clearTimeout(t); t = setTimeout(() => build(false), 150); }).observe(frame);
    };
    if (src.complete && src.naturalWidth) start(); else src.addEventListener("load", start, { once: true });
  }

  /* ================= 專案頁 ================= */

  async function renderProject() {
    const article = $("#article");
    const id = new URLSearchParams(location.search).get("id");
    if (!id) { article.innerHTML = errorBox("網址缺少 ?id=，請從首頁選一個專案"); return; }

    let data, md;
    try {
      data = await loadManifest();
      const res = await fetch(PROJECT_DIR + encodeURIComponent(id) + ".md", { cache: "no-cache" });
      if (!res.ok) throw new Error(`找不到專案「${id}」（HTTP ${res.status}）`);
      md = await res.text();
    } catch (e) { article.innerHTML = errorBox(e.message); return; }
    initPalette(data);
    renderFooter(data);

    const p = data.projects.find((x) => x.id === id);
    if (p) {
      document.title = `4yü/${p.title}`;
      $("#project-head").innerHTML = `
        <p class="meta">${parts(p.no && no(p.no), data.catTitle[p.category], p.year, p.team && "團隊專案")}</p>
        <h1>${esc(p.title)}</h1>
        <p class="tagline">${esc(p.tagline)}</p>
        <div class="row">
          ${external(p.repo, "GitHub", "button primary")}
          ${p.demo ? external(p.demo, "線上展示") : ""}
          <span class="stack">${p.tags.map(esc).join(" / ")}</span>
        </div>
        ${p.cover ? `<figure class="project-cover"><img src="${esc(p.cover)}" alt="${esc(p.title)} 的主要畫面"></figure>` : ""}`;
      splitReveal($("#project-head h1"));
      if (motion) gsap.from(["#project-head .meta", "#project-head .tagline", "#project-head .row"], { opacity: 0, y: 12, duration: 0.8, ease: EASE, stagger: 0.08, delay: 0.2 });
      if (motion && p.cover) gsap.from(".project-cover", { clipPath: "inset(10% 6% 10% 6% round 16px)", opacity: 0, duration: 1.2, ease: EASE, delay: 0.3 });
    }

    article.innerHTML = window.marked ? marked.parse(md, { gfm: true }) : `<pre>${esc(md)}</pre>`;
    transformCallouts(article);
    enhanceCode(article);
    $$('a[href^="http"]', article).forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
    $$("img", article).forEach((img) => { img.loading = "lazy"; });
    if (p?.cover) $$(`img[src="${CSS.escape(p.cover)}"]`, article).forEach((img) => img.remove());
    const headings = addAnchors(article);
    buildToc(headings);
    buildPager(data.published, id);
    revealOnScroll($$(":scope > *", article).filter((el) => !el.matches(".lede")));
    FX.project(article);
    FX.magnetize(document);
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }

  // > [!TYPE] 標題  →  SUMMARY 變導言段落，其餘變左側細線的提示框
  function transformCallouts(root) {
    $$("blockquote", root).forEach((bq) => {
      const first = bq.firstElementChild;
      if (!first || first.tagName !== "P") return;
      const m = first.innerHTML.match(/^\s*\[!(\w+)\][ \t]*([^\n<]*)(?:\n|<br>)?/);
      if (!m || !CALLOUTS[m[1].toUpperCase()]) return;
      const type = CALLOUTS[m[1].toUpperCase()];
      first.innerHTML = first.innerHTML.slice(m[0].length).trim();
      if (!first.innerHTML) first.remove();
      const box = document.createElement("div");
      if (type.cls === "summary") box.className = "lede";
      else {
        box.className = `callout callout-${type.cls}`;
        const title = m[2].trim() || type.label;
        if (title) box.innerHTML = `<div class="callout-title">${esc(title)}</div>`;
      }
      while (bq.firstChild) box.appendChild(bq.firstChild);
      bq.replaceWith(box);
    });
  }

  function enhanceCode(root) {
    $$("pre > code", root).forEach((code) => {
      const lang = (code.className.match(/language-(\w+)/) || [])[1];
      if (window.hljs && lang && hljs.getLanguage(lang)) hljs.highlightElement(code);
      const btn = document.createElement("button");
      btn.className = "copy-btn"; btn.type = "button"; btn.textContent = "複製";
      btn.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(code.innerText); btn.textContent = "已複製"; }
        catch { btn.textContent = "無法複製"; }
        setTimeout(() => (btn.textContent = "複製"), 1500);
      });
      code.parentElement.appendChild(btn);
    });
  }

  function addAnchors(root) {
    const used = new Set();
    return $$("h2, h3", root).map((h) => {
      const base = h.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-") || "section";
      let slug = base, n = 2;
      while (used.has(slug)) slug = `${base}-${n++}`;
      used.add(slug);
      h.id = slug;
      h.dataset.label = h.textContent;
      h.innerHTML = `<span class="h-text">${h.innerHTML}</span><a class="anchor" href="#${slug}" aria-label="連結到此節">#</a>`;
      return h;
    });
  }

  // 目錄：一條細線滑到目前閱讀的章節
  function buildToc(headings) {
    const toc = $("#toc");
    if (!headings.length) { toc.remove(); return; }
    toc.innerHTML = `<div class="toc-title">本頁目錄</div><ol><span class="toc-marker" aria-hidden="true"></span>${headings.map((h) =>
      `<li class="lv${h.tagName[1]}"><a href="#${h.id}">${esc(h.dataset.label)}</a></li>`).join("")}</ol>`;
    const marker = $(".toc-marker", toc);
    const links = new Map($$("a", toc).map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
    const setActive = (a) => {
      links.forEach((x) => x.classList.toggle("active", x === a));
      marker.style.transform = `translateY(${a.offsetTop}px)`;
      marker.style.height = `${a.offsetHeight}px`;
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => { const a = links.get(en.target.id); if (en.isIntersecting && a) setActive(a); });
    }, { rootMargin: "-96px 0px -70% 0px" });
    headings.forEach((h) => obs.observe(h));

    const btn = $("#toc-toggle");
    btn?.addEventListener("click", () => btn.setAttribute("aria-expanded", toc.classList.toggle("open")));
    toc.addEventListener("click", (e) => { if (e.target.tagName === "A") toc.classList.remove("open"); });
  }

  function buildPager(list, id) {
    const i = list.findIndex((p) => p.id === id);
    if (i < 0) return;
    const link = (p, cls, label) => p
      ? `<a class="${cls}" href="project.html?id=${encodeURIComponent(p.id)}"><span class="meta">${parts(label, no(p.no))}</span>${esc(p.title)}</a>`
      : "";
    $("#pager").innerHTML = link(list[i - 1], "prev", "上一個") + link(list[i + 1], "next", "下一個");
  }

  /* ================= 經歷（content/experience.json，來自 Notion，見 AGENTS.md §9） ================= */

  const EXPERIENCE = "content/experience.json";
  // 類型 → 分區標題；順序 = 「分類」檢視的分區順序
  const EXP_TYPES = [
    ["研究", "研究、論文"],
    ["工作", "工作"],
    ["社群", "社群、領導"],
    ["競賽", "競賽"],
    ["檢定", "檢定"],
    ["教學", "教學、演講"],
    ["籌辦", "活動籌辦"],
    ["學習", "營隊、課程"],
  ];
  const EXP_TYPE = Object.fromEntries(EXP_TYPES.map(([id, title], i) => [id, { title, order: i }]));
  const GRADES = ["大四", "大三", "大二", "大一", "高三", "高二", "高一", "國三", "國二", "國一"];
  const today = new Date().toISOString().slice(0, 10);

  async function loadExperience() {
    const res = await fetch(EXPERIENCE, { cache: "no-cache" });
    if (!res.ok) throw new Error(`讀不到 ${EXPERIENCE}（HTTP ${res.status}）`);
    const data = await res.json();
    data.items.forEach((x, i) => { x.key = `exp-${i}`; });
    return data;
  }

  const ymd = (d) => d.replaceAll("-", "/");
  function expDate(x) {
    if (!x.end || x.end === x.start) return ymd(x.start);
    return `${ymd(x.start)} – ${x.end > today ? "至今" : ymd(x.end)}`;
  }

  // 一筆經歷：左邊「日期 / 標題 / ▫ 單位 / 標籤」，右邊「身分 / 成果」，中間用虛線連起來（參考履歷排版）
  function expRow(x) {
    const t = EXP_TYPE[x.type] || { title: x.type };
    const title = x.link
      ? `<a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}${ICON.out}</a>`
      : esc(x.title);
    const tags = [t.title, ...x.fields].map(esc).join(" / ");
    return `
      <li class="exp" data-flip-id="${x.key}">
        <p class="meta exp-date">${expDate(x)}${x.start > today ? `<span class="exp-soon">即將</span>` : ""}</p>
        <div class="exp-line">
          <h3>${title}</h3>
          <span class="exp-leader" aria-hidden="true"></span>
          ${x.role ? `<span class="exp-role">${esc(x.role)}</span>` : ""}
        </div>
        <div class="exp-detail">
          <div>
            ${x.org ? `<p class="exp-org">${esc(x.org)}</p>` : ""}
            <p class="meta exp-tags">${tags}</p>
          </div>
          ${x.result ? `<p class="exp-result">${parts(...x.result.split(/\s*[・·]\s*/))}</p>` : ""}
        </div>
      </li>`;
  }

  // 經歷列從模糊中浮現（參考 vicwen.com 的捲動進場）
  function blurIn(els) {
    if (!motion || !els.length) return;
    els = els.filter((el) => !revealed.has(el));
    gsap.set(els, { opacity: 0, y: 12, filter: "blur(8px)" });
    onVisible(els, (batch) => gsap.to(batch, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: EASE, stagger: 0.05, clearProps: "filter", overwrite: "auto" }), "0px 0px -4% 0px");
  }

  // 首頁：最近 5 筆
  async function renderExperiencePreview() {
    const box = $("#exp-latest");
    if (!box) return;
    let data;
    try { data = await loadExperience(); }
    catch { $("#experience").hidden = true; return; }
    $("#exp-count").textContent = String(data.items.length).padStart(2, "0");
    box.innerHTML = data.items.slice(0, 5).map(expRow).join("");
    blurIn($$(".exp", box));
    FX.magnetize($("#experience"));
  }

  // 經歷頁：分類 / 時間 / 年級三種分組 + 領域篩選
  async function renderExperience() {
    let manifest, data;
    try { [manifest, data] = await Promise.all([loadManifest(), loadExperience()]); }
    catch (e) { $("#exp-groups").innerHTML = errorBox(e.message); return; }
    initPalette(manifest);
    renderFooter(manifest);

    const items = data.items;
    const years = [...new Set(items.map((x) => x.start.slice(0, 4)))];
    $("#exp-meta").innerHTML = parts(`${items.length} 筆`, `${years.at(-1)}–${years[0]}`, `同步自 Notion，更新於 ${data.updated}`);

    const fields = ["全部", ...Object.entries(items.flatMap((x) => x.fields).reduce((m, f) => ((m[f] = (m[f] || 0) + 1), m), {}))
      .sort((a, b) => b[1] - a[1]).map(([f]) => f)];
    const countOf = (f) => items.filter((x) => f === "全部" || x.fields.includes(f)).length;
    $("#exp-fields").innerHTML = `<span class="thumb" aria-hidden="true"></span>` + fields.map((f, i) =>
      `<button type="button" role="tab" data-value="${esc(f)}" aria-selected="${i === 0}">${esc(f)}<span class="count">${countOf(f)}</span></button>`).join("");

    const VIEWS = [
      { id: "year", label: "時間線" },
      { id: "type", label: "分類" },
      { id: "grade", label: "年級" },
    ];
    let view = "year", field = "全部";
    try { const saved = localStorage.getItem("exp-view-v2"); if (VIEWS.some((v) => v.id === saved)) view = saved; } catch { /* 用預設 */ }
    $("#exp-views").innerHTML = `<span class="thumb" aria-hidden="true"></span>` + VIEWS.map((v) =>
      `<button type="button" role="radio" data-value="${v.id}" aria-checked="${v.id === view}"><span>${v.label}</span></button>`).join("");

    const groupsOf = (list) => {
      const by = (keyFn, order) => {
        const m = new Map();
        list.forEach((x) => { const k = keyFn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
        return [...m.entries()].sort((a, b) => order(a[0], b[0]));
      };
      if (view === "year") return by((x) => x.start.slice(0, 4), (a, b) => b.localeCompare(a));
      if (view === "grade") return by((x) => x.grade || "其他", (a, b) => (GRADES.indexOf(a) + 99) % 99 - (GRADES.indexOf(b) + 99) % 99);
      return by((x) => x.type, (a, b) => (EXP_TYPE[a]?.order ?? 99) - (EXP_TYPE[b]?.order ?? 99))
        .map(([k, v]) => [EXP_TYPE[k]?.title || k, v]);
    };

    // 時間線：年份是大段落，月份是小段落並附上當時的年級
    const timelineHTML = (list) => groupsOf(list).map(([year, rows]) => {
      const months = new Map();
      rows.forEach((x) => { const k = x.start.slice(0, 7); if (!months.has(k)) months.set(k, []); months.get(k).push(x); });
      return `
        <section class="exp-year">
          <h2 class="exp-year-head"><span>${esc(year)}</span><span class="meta">${rows.length} 筆</span></h2>
          ${[...months.entries()].map(([m, xs]) => `
            <section class="exp-month">
              <h3 class="exp-month-head"><span class="exp-node" aria-hidden="true"></span>${esc(m.replace("-", "/"))}${xs[0].grade ? `<span>（${esc(xs[0].grade)}）</span>` : ""}</h3>
              <ol class="exp-list">${xs.map(expRow).join("")}</ol>
            </section>`).join("")}
        </section>`;
    }).join("");

    const box = $("#exp-groups");
    let fading = null;
    const render = (animate) => {
      const list = items.filter((x) => field === "全部" || x.fields.includes(field));
      $("#exp-empty").hidden = list.length > 0;
      box.classList.toggle("timeline", view === "year");
      box.innerHTML = view === "year" ? timelineHTML(list) : groupsOf(list).map(([title, rows], i) => `
        <section class="exp-group">
          <h2 class="exp-group-head"><span>${esc(title)}</span><span class="meta">${parts(String(i + 1).padStart(2, "0"), `${rows.length} 筆`)}</span><i aria-hidden="true"></i></h2>
          <ol class="exp-list">${rows.map(expRow).join("")}</ol>
        </section>`).join("");
      const nodes = $$(".exp-group-head, .exp-year-head, .exp-month-head, .exp", box);
      if (animate && motion) {
        // 畫面上的部分依序浮現，其餘的交給捲動淡入
        const inView = nodes.filter((el) => el.getBoundingClientRect().top < innerHeight);
        markRevealed(inView);
        if (inView.length) gsap.fromTo(inView, { opacity: 0, y: 12, filter: "blur(6px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.6, ease: EASE, stagger: 0.025, clearProps: "filter" });
        blurIn(nodes.filter((el) => !inView.includes(el)));
      } else {
        blurIn(nodes);
      }
      $$(".exp-group-head .meta", box).forEach((m) => FX.scramble?.(m));
    };
    // 切換：舊的先淡出再換，不讓兩種排列疊在一起
    const draw = (animate) => {
      if (!animate || !motion) { render(false); return; }
      fading?.kill();
      const out = $$(".exp-group-head, .exp-year-head, .exp-month-head, .exp", box)
        .filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
      if (!out.length) { render(true); return; }
      fading = gsap.to(out, { opacity: 0, y: -8, duration: 0.2, ease: "power2.in", stagger: 0.008, onComplete: () => render(true) });
    };

    segmented($("#exp-fields"), (v) => { field = v; draw(true); });
    segmented($("#exp-views"), (v) => {
      view = v;
      try { localStorage.setItem("exp-view-v2", v); } catch { /* 無法儲存就算了 */ }
      draw(true);
    });
    draw(false);
    if (motion) {
      splitReveal($("#exp-page-title"));
      gsap.from(["#exp-meta", ".exp-head .controls"], { opacity: 0, y: 12, duration: 0.8, ease: EASE, stagger: 0.08, delay: 0.1 });
    }
  }

  function errorBox(msg) {
    return `<div class="error-box">${esc(msg)}<br><a href="index.html">回到所有專案</a></div>`;
  }

  FX.init();
  initNavHover();
  initProgress();
  if (document.body.classList.contains("page-home")) { renderHome(); renderExperiencePreview(); }
  if (document.body.classList.contains("page-experience")) renderExperience();
  if (document.body.classList.contains("page-project")) renderProject();
})();
