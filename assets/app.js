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
    up:    '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>',
    chevronDown: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    right: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    // 社群圖示：lucide-static 0.460.0（ISC），新版 lucide 已移除品牌圖示
    GitHub: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>',
    LinkedIn: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>',
    Instagram: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>',
  };
  const EASE = "expo.out";
  // 同一個人的兩個網站：作品集與部落格，互相切換時用同一套換頁布幕
  const SITES = ["4yu.dev", "www.4yu.dev", "blog.4yu.dev"];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 並列的幾段資訊用間距分開，不用「·」之類的分隔符號
  const parts = (...xs) => xs.filter((x) => x || x === 0).map((x) => `<span class="part">${esc(x)}</span>`).join("");
  const no = (n) => `No. ${String(n).padStart(2, "0")}`;
  const external = (url, label, cls = "button") =>
    `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}${ICON.out}</a>`;
  // 自我介紹：空一行分段、單一換行就換行；[文字](網址) 轉成連結（其他文字一律跳脫，不支援別的 Markdown）
  const linkify = (text) => esc(text).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    (_, label, url) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`);
  // 平滑捲動：有 Lenis 用 Lenis，沒有就用瀏覽器的 smooth；減少動態時直接跳過去
  const smoothTo = (target, offset = 0) => {
    if (FX.lenis) { FX.lenis.scrollTo(target, { offset, duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4) }); return; }
    const y = typeof target === "number" ? target : target.getBoundingClientRect().top + scrollY + offset;
    scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  };
  // 社群連結（profile.links 裡有圖示的那幾個）做成只有圖示的按鈕
  const socialIcons = (links) => `<div class="socials">${links.filter((l) => ICON[l.label]).map((l) =>
    `<a class="icon-btn" href="${esc(l.url)}" target="_blank" rel="noopener" aria-label="${esc(l.label)}" title="${esc(l.label)}">${ICON[l.label]}</a>`).join("")}</div>`;
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

    // 第一次進站的加載畫面結束前，首頁等元素的進場動畫要延後
    introDelay: 0, introEnd: 0,
    // 加載畫面還沒結束時，進場動畫要等它結束再播
    introWait() { return Math.max(0, this.introEnd - performance.now() / 1000); },
    ready: null, markReady: () => {},

    init() {
      this.ready = new Promise((res) => { this.markReady = res; });
      this.loader();
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
          this.lenis.scrollTo(target, { offset: 0 });   // 位移由 CSS 的 scroll-padding-top 決定，這裡不再重複加
          history.replaceState(null, "", url.hash);
        });
      }
      this.curtain();
      if (this.interactive) { this.cursor(); this.magnetize(document); }
    },

    // 換頁布幕：點站內連結時布幕從下蓋上，新頁面載入後從上收起
    /* 加載畫面：散落的點飛向中央、聚成點陣版的 ~/4yü（「~/」是電光藍），
       資料載好後向四周炸開、底色淡掉。只在同一次瀏覽的第一頁出現；減少動態時不出現。 */
    loader() {
      const root = document.documentElement;
      const done = () => { root.classList.remove("is-loading"); try { sessionStorage.setItem("loaded", "1"); } catch { /* 忽略 */ } };
      if (!root.classList.contains("is-loading") || !motion) { done(); return; }
      this.introDelay = 1.6;
      this.introEnd = performance.now() / 1000 + 1.6;
      const el = document.createElement("div"); el.className = "loader-screen"; el.setAttribute("aria-hidden", "true");
      const cv = document.createElement("canvas"); el.appendChild(cv); document.body.appendChild(el);
      root.classList.remove("is-loading");
      root.style.overflow = "hidden";
      const c = cv.getContext("2d"), W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const mono = cssVar("--font-mono"), text = cssVar("--text"), accent = cssVar("--accent");
      const fontReady = Promise.race([document.fonts?.load(`100px ${mono}`) ?? Promise.resolve(), new Promise((r) => setTimeout(r, 700))]);
      fontReady.then(() => {
        const size = Math.min(W / 4.2, 220), g = W < 760 ? 5 : 7;
        const off = document.createElement("canvas"), oc = off.getContext("2d");
        off.width = W; off.height = H;
        oc.font = `${size}px ${mono}`; oc.textAlign = "center"; oc.textBaseline = "middle"; oc.fillStyle = "#fff";
        oc.fillText("~/4yü", W / 2, H / 2);
        const split = W / 2 - oc.measureText("~/4yü").width / 2 + oc.measureText("~/").width;
        const px = oc.getImageData(0, 0, W, H).data, pts = [];
        for (let y = 0; y < H; y += g) for (let x = 0; x < W; x += g)
          if (px[(y * W + x) * 4 + 3] > 128) pts.push({ tx: x, ty: y, x: Math.random() * W, y: Math.random() * H, acc: x < split });
        const s = Math.max(2, g * 0.42);
        const draw = () => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = text; for (const p of pts) if (!p.acc) c.fillRect(p.x - s / 2, p.y - s / 2, s, s);
          c.fillStyle = accent; for (const p of pts) if (p.acc) c.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        };
        const tl = gsap.timeline({ onUpdate: draw });
        tl.to(pts, { x: (i, p) => p.tx, y: (i, p) => p.ty, duration: 1.2, ease: "expo.out", stagger: { amount: 0.35, from: "random" } });
        // 等資料載好（最多 3 秒）才炸開
        tl.add(() => {
          tl.pause();
          Promise.race([this.ready, new Promise((r) => setTimeout(r, 3000))]).then(() => setTimeout(() => tl.play(), 150));
        });
        tl.to(pts, { x: (i, p) => p.tx + (p.tx - W / 2) * (2 + Math.random() * 2), y: (i, p) => p.ty + (p.ty - H / 2) * (2 + Math.random() * 2), duration: 0.8, ease: "expo.in" })
          .to(el, { backgroundColor: "rgba(0,0,0,0)", duration: 0.5, ease: "power2.in" }, "-=0.55")
          .add(() => { el.remove(); root.style.overflow = ""; done(); });
      });
    },

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
      // 從部落格（blog.4yu.dev）點回來時，也用布幕收起來接上，兩個網站像同一個
      else if (document.referrer && SITES.includes(new URL(document.referrer).hostname) && new URL(document.referrer).hostname !== location.hostname) {
        gsap.set(el, { scaleY: 1, transformOrigin: "50% 0%" });
        gsap.set(mark, { opacity: 1 });
        gsap.timeline().to(mark, { opacity: 0, y: -12, duration: 0.25, ease: "power2.in", delay: 0.1 }).to(el, { scaleY: 0, duration: 0.6, ease: "expo.inOut" }, "-=0.05");
      }
      addEventListener("pageshow", (e) => { if (e.persisted) gsap.set(el, { scaleY: 0 }); });
      document.addEventListener("click", (e) => {
        const a = e.target.closest("a[href]");
        if (e.defaultPrevented || !a || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        const url = new URL(a.href, location.href);
        const sibling = url.origin !== location.origin && SITES.includes(url.hostname);
        if (!sibling && (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname))) return;
        if (url.pathname === location.pathname && url.search === location.search) return;
        e.preventDefault();
        if (!sibling) sessionStorage.setItem("curtain", "1");
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
      const canvas = document.createElement("canvas");
      canvas.className = "hero-grid"; canvas.setAttribute("aria-hidden", "true");
      hero.prepend(canvas);
      const topo = this.backdrop(canvas, hero);

      if (!this.interactive) return;
      const img = $(".portrait img", hero);
      const tx = gsap.quickTo(img, "rotationY", { duration: 0.6, ease: "power3" });
      const ty = gsap.quickTo(img, "rotationX", { duration: 0.6, ease: "power3" });
      hero.addEventListener("pointermove", (e) => {
        topo.point(e.clientX, e.clientY);
        const hr = hero.getBoundingClientRect();
        tx(((e.clientX - hr.left) / hr.width - 0.5) * 40);
        ty(-((e.clientY - hr.top) / hr.height - 0.5) * 34);
      });
      hero.addEventListener("pointerleave", () => { topo.leave(); tx(0); ty(0); });
      hero.addEventListener("pointerdown", (e) => { if (!e.target.closest("a, button")) topo.burst(e.clientX, e.clientY); });

    },


    /* Hero 背景：六種互動場景依序輪播（見 AGENTS.md §6.5）
       等高線、流場粒子、ASCII 字元場、生命遊戲、鳥群、梯度下降。
       約 24 秒換下一種（淡出淡入），右下角的「下一個」小圖示可以手動換。
       減少動態時只畫一張靜止的等高線。 */
    backdrop(canvas, host) {
      const ctx = canvas.getContext("2d");
      const rgb = (name) => { const v = cssVar(name).replace("#", ""); const n = parseInt(v.length === 3 ? v.replace(/./g, "$&$&") : v, 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; };
      const LINE = rgb("--text"), ACC = rgb("--accent");
      const col = (c, a) => `rgba(${c},${a})`;
      const P = new Uint8Array(512);
      { const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; }
      const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10), lerp = (a, b, t) => a + t * (b - a);
      const grad = (h, x, y, z) => { const u = (h & 15) < 8 ? x : y, v = (h & 15) < 4 ? y : (h & 15) === 12 || (h & 15) === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
      const noise = (x, y, z = 0) => {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
        const u = fade(x), v = fade(y), w = fade(z);
        const A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
        return lerp(lerp(lerp(grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z), u), lerp(grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z), u), v),
          lerp(lerp(grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1), u), lerp(grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1), u), v), w);
      };
      const m = { x: 0, y: 0, on: false, k: 0 };   // 游標；k 是游標影響力（進出時漸變）
      let bursts = [];                               // 點擊產生的衝擊波：{ x, y, r, life }
      const near = (x, y, r) => m.k ? Math.max(0, 1 - Math.hypot(x - m.x, y - m.y) / r) * m.k : 0;
      let w = 0, h = 0, dpr = 1;
      const clear = () => ctx.clearRect(0, 0, w, h);

      const SCENES = {
        contour: {
          label: "等高線",
          init(s) { s.g = 12; s.t = Math.random() * 100; },
          frame(s) {
            const g = s.g, cols = Math.ceil(w / g) + 1, rows = Math.ceil(h / g) + 1, f = new Float32Array(cols * rows);
            s.t += 0.004;
            for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
              const x = i * g, y = j * g;
              let v = noise(x * 0.0032, y * 0.0032, s.t) * 1.1 + noise(x * 0.0074, y * 0.0074, s.t * 1.4) * 0.35;
              if (m.k) v += Math.exp(-((x - m.x) ** 2 + (y - m.y) ** 2) / 60000) * 1.1 * m.k;
              for (const b of bursts) v += Math.exp(-((Math.hypot(x - b.x, y - b.y) - b.r) ** 2) / 900) * 0.5 * b.life;
              f[j * cols + i] = v;
            }
            const dim = new Path2D(), lit = new Path2D();
            for (let l = 0; l < 20; l++) {
              const L = -0.75 + 1.7 * l / 19;
              for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
                const a = f[j * cols + i], b = f[j * cols + i + 1], d = f[(j + 1) * cols + i], e = f[(j + 1) * cols + i + 1];
                const k = (a > L) | ((b > L) << 1) | ((e > L) << 2) | ((d > L) << 3); if (k === 0 || k === 15) continue;
                const x = i * g, y = j * g, pts = [], it = (p, q) => (L - p) / (q - p);
                if ((a > L) !== (b > L)) pts.push([x + g * it(a, b), y]);
                if ((b > L) !== (e > L)) pts.push([x + g, y + g * it(b, e)]);
                if ((d > L) !== (e > L)) pts.push([x + g * it(d, e), y + g]);
                if ((a > L) !== (d > L)) pts.push([x, y + g * it(a, d)]);
                for (let n = 0; n + 1 < pts.length; n += 2) { const path = near(pts[n][0], pts[n][1], 260) > 0.2 ? lit : dim; path.moveTo(pts[n][0], pts[n][1]); path.lineTo(pts[n + 1][0], pts[n + 1][1]); }
              }
            }
            clear(); ctx.lineWidth = 1;
            ctx.strokeStyle = col(LINE, 0.2); ctx.stroke(dim);
            ctx.strokeStyle = col(ACC, 0.85); ctx.stroke(lit);
          },
        },
        flow: {
          label: "流場粒子", trails: true,
          init(s) { s.t = Math.random() * 100; s.p = Array.from({ length: Math.round(w * h / 240) }, () => ({ x: Math.random() * w, y: Math.random() * h, a: Math.random() * 400 })); },
          frame(s) {
            s.t += 0.004;
            ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "rgba(0,0,0,0.06)"; ctx.fillRect(0, 0, w, h);
            ctx.globalCompositeOperation = "source-over";
            const dim = new Path2D(), lit = new Path2D();
            for (const p of s.p) {
              const ang = noise(p.x * 0.0025, p.y * 0.0025, s.t) * Math.PI * 3;
              let vx = Math.cos(ang), vy = Math.sin(ang);
              for (const b of bursts) { const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) + 1; if (Math.abs(d - b.r) < 40) { p.x += dx / d * 6 * b.life; p.y += dy / d * 6 * b.life; } }
              const k = near(p.x, p.y, 240);
              if (k) { const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) + 1; vx += (-dy / d) * k * 4 - dx / d * k; vy += (dx / d) * k * 4 - dy / d * k; }
              const nx = p.x + vx * 1.3, ny = p.y + vy * 1.3, path = k > 0.1 ? lit : dim;
              path.moveTo(p.x, p.y); path.lineTo(nx, ny);
              p.x = nx; p.y = ny; p.a++;
              if (p.x < 0 || p.x > w || p.y < 0 || p.y > h || p.a > 600) { p.x = Math.random() * w; p.y = Math.random() * h; p.a = 0; }
            }
            ctx.lineWidth = 1; ctx.strokeStyle = col(LINE, 0.42); ctx.stroke(dim); ctx.strokeStyle = col(ACC, 0.95); ctx.stroke(lit);
          },
        },
        ascii: {
          label: "ASCII 字元場",
          init(s) { s.t = Math.random() * 100; s.chars = " .:-=+*#%"; s.font = `13px ${cssVar("--font-mono")}`; },
          frame(s) {
            s.t += 0.006; clear();
            ctx.font = s.font; ctx.textBaseline = "top";
            const cw = 11, chh = 16, tick = (s.t * 60) | 0;
            for (let y = 0; y < h; y += chh) for (let x = 0; x < w; x += cw) {
              let k = near(x, y, 180);
              for (const b of bursts) k = Math.max(k, Math.max(0, 1 - Math.abs(Math.hypot(x - b.x, y - b.y) - b.r) / 30) * b.life);
              if (k > 0.05) { ctx.fillStyle = col(ACC, 0.3 + k * 0.7); ctx.fillText(((x * 7 + y * 13 + tick) & 3) ? "1" : "0", x, y); continue; }
              const v = (noise(x * 0.01, y * 0.018, s.t) + 0.6) / 1.2;
              const i = Math.max(0, Math.min(s.chars.length - 1, (v * s.chars.length) | 0)); if (!i) continue;
              ctx.fillStyle = col(LINE, 0.07 + v * 0.24); ctx.fillText(s.chars[i], x, y);
            }
          },
        },
        life: {
          label: "生命遊戲",
          init(s) {
            s.g = 10; s.cols = Math.ceil(w / s.g); s.rows = Math.ceil(h / s.g);
            s.a = new Uint8Array(s.cols * s.rows); s.age = new Float32Array(s.a.length); s.n = 0;
            for (let i = 0; i < s.a.length; i++) s.a[i] = Math.random() < 0.16 ? 1 : 0;
          },
          burst(s, x, y) { const { cols, rows, g } = s; for (let k = 0; k < 160; k++) { const a = Math.random() * 7, r = Math.random() * 9; const i = (x / g + Math.cos(a) * r) | 0, j = (y / g + Math.sin(a) * r) | 0; if (i >= 0 && j >= 0 && i < cols && j < rows) { s.a[j * cols + i] = 1; s.age[j * cols + i] = 1; } } },
          frame(s) {
            const { cols, rows, g } = s;
            if (m.k > 0.5) for (let k = 0; k < 9; k++) { const i = (m.x / g + (Math.random() - 0.5) * 8) | 0, j = (m.y / g + (Math.random() - 0.5) * 8) | 0; if (i >= 0 && j >= 0 && i < cols && j < rows) s.a[j * cols + i] = 1; }
            if (++s.n % 3 === 0) {
              const n = new Uint8Array(s.a.length); let alive = 0;
              for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
                let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) c += s.a[((j + dy + rows) % rows) * cols + ((i + dx + cols) % cols)];
                const id = j * cols + i, v = s.a[id] ? (c === 2 || c === 3) : c === 3; n[id] = v ? 1 : 0; alive += n[id];
                if (v && !s.a[id]) s.age[id] = 1;
              }
              s.a = n;
              if (alive < s.a.length * 0.03) for (let i = 0; i < s.a.length; i++) if (Math.random() < 0.08) s.a[i] = 1;
            }
            clear();
            for (let id = 0; id < s.a.length; id++) {
              s.age[id] *= 0.94; if (!s.a[id] && s.age[id] < 0.05) continue;
              ctx.fillStyle = s.age[id] > 0.3 ? col(ACC, 0.1 + s.age[id] * 0.38) : col(LINE, s.a[id] ? 0.1 : s.age[id] * 0.18);
              ctx.fillRect((id % cols) * g + 2, ((id / cols) | 0) * g + 2, g - 4, g - 4);
            }
          },
        },
        boids: {
          label: "鳥群演算法",
          init(s) { s.b = Array.from({ length: Math.min(320, Math.round(w * h / 3200)) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: Math.random() * 2 - 1, vy: Math.random() * 2 - 1 })); },
          frame(s) {
            clear(); ctx.lineWidth = 1.2;
            const dim = new Path2D(), lit = new Path2D();
            for (const p of s.b) {
              let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
              for (const q of s.b) { if (q === p) continue; const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy; if (d2 > 3600) continue; n++; ax += q.vx; ay += q.vy; cx += q.x; cy += q.y; if (d2 < 400) { sx -= dx; sy -= dy; } }
              if (n) { p.vx += (ax / n - p.vx) * 0.05 + (cx / n - p.x) * 0.0008 + sx * 0.03; p.vy += (ay / n - p.vy) * 0.05 + (cy / n - p.y) * 0.0008 + sy * 0.03; }
              const k = near(p.x, p.y, 190); if (k) { p.vx += (p.x - m.x) * 0.02 * k; p.vy += (p.y - m.y) * 0.02 * k; }
              for (const b of bursts) { const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) + 1; if (d < b.r + 30) { p.vx += dx / d * 0.8 * b.life; p.vy += dy / d * 0.8 * b.life; } }
              const sp = Math.hypot(p.vx, p.vy), max = k ? 5 : 2.2; if (sp > max) { p.vx *= max / sp; p.vy *= max / sp; } if (sp < 1) { p.vx *= 1.2; p.vy *= 1.2; }
              p.x = (p.x + p.vx + w) % w; p.y = (p.y + p.vy + h) % h;
              const a = Math.atan2(p.vy, p.vx), L = 7, tx = p.x + Math.cos(a) * L, ty = p.y + Math.sin(a) * L, path = k > 0.05 ? lit : dim;
              path.moveTo(tx, ty); path.lineTo(p.x + Math.cos(a + 2.6) * L * 0.6, p.y + Math.sin(a + 2.6) * L * 0.6);
              path.moveTo(tx, ty); path.lineTo(p.x + Math.cos(a - 2.6) * L * 0.6, p.y + Math.sin(a - 2.6) * L * 0.6);
            }
            ctx.strokeStyle = col(LINE, 0.45); ctx.stroke(dim); ctx.strokeStyle = col(ACC, 0.95); ctx.stroke(lit);
          },
        },
        descent: {
          label: "梯度下降",
          // 損失曲面：一個大碗加上雜訊做出的局部極小值；三條優化路徑（帶動量的梯度下降）往下滾，留下軌跡
          init(s) {
            s.t = 0; s.seed = Math.random() * 50; s.yaw = Math.random() * 6; s.pitch = 0.5;
            s.L = (x, y) => 0.18 * (x * x + y * y) + 0.9 * noise(x * 0.55 + s.seed, y * 0.55 + s.seed) + 0.35 * noise(x * 1.3 + s.seed, y * 1.3);
            s.runs = [0, 1, 2, 3, 4].map((i) => this.descent.spawn(s, i));
          },
          burst(s) { s.runs.push(this.descent.spawn(s, 0)); if (s.runs.length > 8) s.runs.shift(); },
          spawn(s, i) {
            const a = Math.random() * Math.PI * 2, r = 3.2 + Math.random() * 0.8;
            return { x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, step: 0, trail: [], done: 0, delay: i * 40 };
          },
          frame(s) {
            s.t += 1;
            s.yaw += 0.0016 + (m.k ? (m.x / w - 0.5) * 0.012 * m.k : 0);
            s.pitch += ((m.k ? 0.3 + (m.y / h) * 0.5 : 0.5) - s.pitch) * 0.05;
            const N = 44, R = 4.6, fov = Math.min(w, h) * 2.3, cy = Math.cos(s.yaw), sy = Math.sin(s.yaw), cp = Math.cos(s.pitch), sp = Math.sin(s.pitch);
            const ox = w * 0.56, oy = h * 0.6;
            // 鏡頭：先繞垂直軸轉 yaw，再從斜上方以 pitch 俯視；越遠、越高的點在畫面上越上面
            const proj = (x, y, z) => {
              const rx = x * cy - y * sy, ry = x * sy + y * cy;
              const up = z * cp + ry * sp, depth = ry * cp - z * sp + 16;
              return [ox + rx * fov / depth, oy - up * fov / depth, depth];
            };
            const Z = (x, y) => s.L(x, y) * 0.8 - 1.6;   // 高度 = 損失，極小值在碗底
            clear(); ctx.lineWidth = 1;
            const grid = new Path2D();
            for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
              const x = -R + 2 * R * i / N, y = -R + 2 * R * j / N, p = proj(x, y, Z(x, y));
              if (i < N) { const x2 = x + 2 * R / N, q = proj(x2, y, Z(x2, y)); grid.moveTo(p[0], p[1]); grid.lineTo(q[0], q[1]); }
              if (j < N) { const y2 = y + 2 * R / N, q = proj(x, y2, Z(x, y2)); grid.moveTo(p[0], p[1]); grid.lineTo(q[0], q[1]); }
            }
            ctx.strokeStyle = col(LINE, 0.15); ctx.stroke(grid);
            ctx.font = `12px ${cssVar("--font-mono")}`; ctx.textBaseline = "middle";
            s.runs.forEach((r, i) => {
              if (r.delay > 0) { r.delay--; return; }
              if (!r.done) {
                const e = 1e-3, gx = (s.L(r.x + e, r.y) - s.L(r.x - e, r.y)) / (2 * e), gy = (s.L(r.x, r.y + e) - s.L(r.x, r.y - e)) / (2 * e);
                r.vx = r.vx * 0.9 - gx * 0.012; r.vy = r.vy * 0.9 - gy * 0.012;
                r.x += r.vx; r.y += r.vy; r.step++;
                r.trail.push([r.x, r.y]);
                if ((Math.hypot(gx, gy) < 0.02 && Math.hypot(r.vx, r.vy) < 0.002) || r.step > 900) r.done = 1;
              } else if (++r.done > 180) { s.runs[i] = this.descent.spawn(s, 0); return; }
              const tr = new Path2D();
              r.trail.forEach(([x, y], n) => { const p = proj(x, y, Z(x, y)); n ? tr.lineTo(p[0], p[1]) : tr.moveTo(p[0], p[1]); });
              ctx.strokeStyle = col(ACC, 0.7); ctx.lineWidth = 1.5; ctx.stroke(tr); ctx.lineWidth = 1;
              const p = proj(r.x, r.y, Z(r.x, r.y));
              ctx.fillStyle = col(ACC, 1); ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 7); ctx.fill();
              ctx.fillStyle = col(LINE, 0.45);
              ctx.fillText(`step ${String(r.step).padStart(3, "0")}  loss ${s.L(r.x, r.y).toFixed(3)}`, p[0] + 10, p[1]);
            });
          },
        },
      };
      SCENES.descent.init = SCENES.descent.init.bind(SCENES);
      SCENES.descent.frame = SCENES.descent.frame.bind(SCENES);
      SCENES.descent.burst = SCENES.descent.burst.bind(SCENES);
      const ORDER = Object.keys(SCENES);

      // 依固定順序輪播；下次進站從下一種開始，不會每次都是同一種
      let saved = null; try { saved = sessionStorage.getItem("backdrop"); } catch { /* 無法使用時不管 */ }
      const after = (k) => ORDER[(ORDER.indexOf(k) + 1) % ORDER.length];
      let key = motion ? (ORDER.includes(saved) ? after(saved) : ORDER[0]) : "contour", state = {}, visible = true, last = 0, since = 0, switching = false;
      const label = document.createElement("button");
      label.type = "button"; label.className = "backdrop-next";
      label.setAttribute("aria-label", "下一個背景"); label.title = "下一個背景";
      label.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></svg>';
      host.appendChild(label);
      const start = (k) => {
        key = k; state = {}; SCENES[key].init(state); clear(); since = 0;
        canvas.setAttribute("aria-label", SCENES[key].label);
        try { sessionStorage.setItem("backdrop", key); } catch { /* 忽略 */ }
      };
      const next = () => {
        if (switching || !motion) return; switching = true;
        gsap.to(canvas, { opacity: 0, duration: 0.6, ease: "power2.in", onComplete: () => {
          start(after(key));
          gsap.to(canvas, { opacity: 1, duration: 0.9, ease: "power2.out", onComplete: () => { switching = false; } });
        } });
      };
      label.addEventListener("click", next);
      if (!motion) label.hidden = true;

      const size = () => {
        const r = canvas.getBoundingClientRect();
        w = r.width; h = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        start(key);
        if (!motion) SCENES[key].frame(state);
      };
      size();   // 先初始化一次，ticker 才不會在 ResizeObserver 回呼前畫到空的場景
      new ResizeObserver(size).observe(host);
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(host);
      if (motion) gsap.ticker.add((time) => {
        if (!visible || time - last < 1 / 30) return;   // 約 30fps
        const dt = time - last; last = time;
        m.k += ((m.on ? 1 : 0) - m.k) * 0.08; if (m.k < 0.01) m.k = 0;
        bursts.forEach((b) => { b.r += 9; b.life *= 0.955; });
        bursts = bursts.filter((b) => b.life > 0.04);
        SCENES[key].frame(state);
        // 衝擊波本身：一圈擴散的電光藍細環
        for (const b of bursts) {
          ctx.strokeStyle = `rgba(${ACC},${0.55 * b.life})`; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
        }
        since += dt; if (since > 24) next();
      });
      return {
        point: (cx, cy) => { const r = canvas.getBoundingClientRect(); m.x = cx - r.left; m.y = cy - r.top; m.on = true; },
        leave: () => { m.on = false; },
        // 點擊：放出一圈衝擊波；生命遊戲撒一把細胞、梯度下降從點擊處附近多放一條路徑
        burst: (cx, cy) => {
          if (!motion) return;
          const r = canvas.getBoundingClientRect(), x = cx - r.left, y = cy - r.top;
          bursts.push({ x, y, r: 0, life: 1 });
          SCENES[key].burst?.(state, x, y);
        },
      };
    },

    // 交錯檢視的每一列：截圖視差、編號解碼、3D 傾斜（首頁按「更多」新加的列也要綁）
    features(list) {
      list.forEach((f) => {
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
          ry(((e.clientX - r.left) / r.width - 0.5) * 22); rx(-((e.clientY - r.top) / r.height - 0.5) * 16);
        });
        shot.addEventListener("pointerleave", () => { rx(0); ry(0); });
      });
      window.ScrollTrigger?.refresh();
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
      this.features($$(".feature"));
      // 矩陣的卡片也跟著游標傾斜
      if (this.interactive) $$(".tile").forEach((tile) => {
        const shot = $(".tile-shot", tile);
        const rx = gsap.quickTo(shot, "rotationX", { duration: 0.5, ease: "power3" }), ry = gsap.quickTo(shot, "rotationY", { duration: 0.5, ease: "power3" });
        gsap.set(shot, { transformPerspective: 700 });
        tile.addEventListener("pointermove", (e) => {
          const r = shot.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 24); rx(-((e.clientY - r.top) / r.height - 0.5) * 18);
        });
        tile.addEventListener("pointerleave", () => { rx(0); ry(0); });
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
          <p class="meta">有合作機會或任何問題歡迎聯絡</p>
          <button class="contact-mail" type="button" data-cursor="複製" data-copy="${esc(pf.email)}" aria-label="複製 Email：${esc(pf.email)}">${esc(pf.email)}</button>
          <p class="meta copy-status" aria-live="polite"></p>
        </div>
        <nav class="contact-links" aria-label="其他連結">
          ${socialIcons(pf.links)}
          ${pf.links.filter((l) => !ICON[l.label]).map((l) => SITES.includes(new URL(l.url).hostname) ? `<a href="${esc(l.url)}">${esc(l.label)}</a>` : `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}
        </nav>
        ${pf.githubAvatar ? `
        <figure class="dotfield">
          <div class="dotfield-frame"><img src="${esc(pf.githubAvatar)}" alt="" hidden><canvas role="img" aria-label="用點陣畫成的 GitHub 頭像：戴耳機的黑貓"></canvas></div>
        </figure>` : ""}
      </div>
      <div class="footer-base">
        <span>© 2026 4yu.dev All Rights Reserved</span>
        <button class="to-top" type="button" aria-label="回到頂端" title="回到頂端">${ICON.up}</button>
      </div>`;
    $(".to-top", foot).addEventListener("click", () => smoothTo(0));
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
    gsap.set(els, { opacity: 0, y: 36 });
    onVisible(els, (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.07, delay: FX.introWait(), overwrite: "auto", ...opts }));
  }

  // 交錯檢視的列：截圖從自己那一側、文字從另一側滑入
  function revealFeatures(features) {
    const even = (el) => [...el.parentElement.children].indexOf(el) % 2 === 1;
    revealShots(features.map((f) => $(".feature-shot", f)), (el) => even(el.closest(".feature")) ? 140 : -140);
    slideIn(features.map((f) => $(".feature-text", f)), (el) => even(el.closest(".feature")) ? -90 : 90);
  }

  // 從左右滑入：dir(el) 回傳起始的水平位移（負數從左邊、正數從右邊）
  function slideIn(els, dir) {
    if (!motion || !els.length) return;
    els.forEach((el) => gsap.set(el, { opacity: 0, x: dir(el) }));
    onVisible(els, (batch) => gsap.to(batch, { opacity: 1, x: 0, duration: 1.2, ease: EASE, stagger: 0.08, delay: FX.introWait(), overwrite: "auto" }));
  }

  // 截圖展開：外框從內縮的裁切展開，圖片從放大縮回
  // dir(el) 有給的話同時從左右滑入（同一個元素只能交給一個捲動觀察器）
  function revealShots(shots, dir = () => 0) {
    if (!motion) return;
    shots.forEach((s) => gsap.set(s, { clipPath: "inset(10% 6% 10% 6% round 16px)", x: dir(s), opacity: dir(s) ? 0 : 1 }));
    shots.forEach((s) => gsap.set(s.firstElementChild, { scale: 1.2 }));
    onVisible(shots, (batch) => batch.forEach((shot, i) => {
      gsap.to(shot, { clipPath: "inset(0% 0% 0% 0% round 16px)", x: 0, opacity: 1, duration: 1.2, ease: EASE, delay: FX.introWait() + i * 0.08, clearProps: "clipPath" });
      gsap.to(shot.firstElementChild, { scale: 1, duration: 1.4, ease: EASE });
    }));
  }

  /* ================= 首頁 ================= */

  async function renderHome() {
    let data;
    try { data = await loadManifest(); }
    catch (e) { $("#hero").innerHTML = errorBox(e.message); FX.markReady(); return; }
    FX.markReady();
    initPalette(data);
    renderFooter(data);

    const pf = data.profile;
    $("#hero").innerHTML = `
      <div class="hero-text">
        <h1 class="sr-only">${esc(pf.name)}</h1>
        <div class="bio">${pf.bio.split(/\n\s*\n/).map((para) => `<p>${para.trim().split("\n").map((line) => `<span class="bio-line">${linkify(line)}</span>`).join("")}</p>`).join("")}</div>
        <div class="hero-actions">
          <a class="button primary" href="#experience">經歷${ICON.down}</a>
          <a class="button primary" href="#projects">專案${ICON.down}</a>
          ${pf.links.filter((l) => l.label === "CV").map((l) => external(l.url, l.label)).join("")}
          ${socialIcons(pf.links)}
        </div>
      </div>
      <figure class="portrait">
        <img src="${esc(pf.portrait)}" alt="${esc(pf.name)} 的照片" width="800" height="800">
        <figcaption class="meta">@${esc(pf.handle)}</figcaption>
      </figure>`;
    // 首屏剛好填滿畫面，底部中間的小箭頭點一下平滑捲到下一段；開始捲動後淡出
    const down = document.createElement("button");
    down.type = "button"; down.className = "scroll-down"; down.setAttribute("aria-label", "往下捲"); down.title = "往下捲";
    down.innerHTML = ICON.chevronDown;
    $("#hero").appendChild(down);
    down.addEventListener("click", () => smoothTo($("#hero").nextElementSibling, -64));
    addEventListener("scroll", () => { down.classList.toggle("is-hidden", scrollY > 80); }, { passive: true });
    FX.hero($("#hero"));
    if (motion) {
      gsap.from([".hero .bio", ".hero-actions"], { opacity: 0, y: 24, duration: 1, ease: EASE, stagger: 0.1, delay: 0.15 + FX.introDelay });
      gsap.from(".portrait", { opacity: 0, scale: 0.94, duration: 1, ease: EASE, delay: 0.2 + FX.introDelay });
    }

    FX.marquee(data);
    renderHomeProjects(data);
  }

  // 首頁的專案區：先放前 4 個，「更多」每次再加 4 個，全部放完就藏起來；「全部」連到專案頁
  function renderHomeProjects(data) {
    const box = $("#home-projects"), more = $("#projects-more"), list = data.published, STEP = 10;
    $("#project-count").textContent = String(list.length).padStart(2, "0");
    let shown = 0;
    const add = (first) => {
      const next = list.slice(shown, shown + STEP);
      box.insertAdjacentHTML("beforeend", next.map((p) => featureHTML(p, data)).join(""));
      const added = [...box.children].slice(shown);
      shown += next.length;
      revealFeatures(added);
      if (first) FX.projects(); else FX.features(added);
      FX.magnetize(box);
      if (shown >= list.length) more.hidden = true;
      else more.querySelector(".more-count").textContent = Math.min(STEP, list.length - shown);
    };
    $(".all-count", more.parentElement).textContent = list.length;
    add(true);
    more.addEventListener("click", () => add(false));
  }

  // 專案頁：篩選 + 交錯 / 矩陣 / 表格
  async function renderProjectsPage() {
    let data;
    try { data = await loadManifest(); }
    catch (e) { $("#view-rows").innerHTML = errorBox(e.message); FX.markReady(); return; }
    FX.markReady();
    initPalette(data);
    renderFooter(data);
    renderProjects(data);
    if (motion) {
      splitReveal($("#projects-title"), FX.introDelay);
      gsap.from([".projects-page .controls", ".back-link"], { opacity: 0, y: 12, duration: 0.8, ease: EASE, stagger: 0.08, delay: 0.1 + FX.introDelay });
    }
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

  // 交錯檢視的一列（首頁的專案區與專案頁共用）
  const projectHref = (p) => `project.html?id=${encodeURIComponent(p.id)}`;
  const featureHTML = (p, data) => `
      <a class="feature item" data-flip-id="${esc(p.id)}" data-cat="${esc(p.category)}" href="${projectHref(p)}">
        <div class="feature-shot">${coverHTML(p, data)}</div>
        <div class="feature-text">
          <p class="meta">${parts(no(p.no), data.catTitle[p.category], p.year, p.team && "團隊")}</p>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.tagline)}</p>
          <p class="stack">${p.tags.map(esc).join(" / ")}</p>
          <span class="read-more"><span>閱讀介紹</span>${ICON.right}</span>
        </div>
      </a>`;

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

    $("#view-rows").innerHTML = list.map((p) => featureHTML(p, data)).join("");

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
          if (texts.length) gsap.set(texts, { opacity: 1, y: 0, x: 0 });
          if (shots.length) gsap.set(shots, { opacity: 1, x: 0 });
          const top = viewEl(view).getBoundingClientRect().top;
          const inView = to.filter((el) => el.getBoundingClientRect().top < innerHeight + 40);
          if (to.length) gsap.set(to, { opacity: 1, y: 0, x: 0 });
          if (inView.length) gsap.fromTo(inView, { opacity: 0, x: (i) => (i % 2 ? 60 : -60) }, { opacity: 1, x: 0, duration: 0.7, ease: EASE, stagger: 0.035, clearProps: "transform" });
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

    // 專案從左右滑入：交錯檢視的截圖從自己那一側、文字從另一側；矩陣依所在的半邊；表格一列左一列右
    const even = (el) => [...el.parentElement.children].indexOf(el) % 2 === 1;
    revealFeatures($$("#view-rows .feature"));
    slideIn($$(".tile"), (el) => (el.offsetLeft + el.offsetWidth / 2 < el.parentElement.offsetWidth / 2 ? -80 : 80));
    slideIn($$("#index li"), (el) => even(el) ? 60 : -60);
    initPreview(data);
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
    if (!id) { article.innerHTML = errorBox("網址缺少 ?id=，請從首頁選一個專案"); FX.markReady(); return; }

    let data, md;
    try {
      data = await loadManifest();
      const res = await fetch(PROJECT_DIR + encodeURIComponent(id) + ".md", { cache: "no-cache" });
      if (!res.ok) throw new Error(`找不到專案「${id}」（HTTP ${res.status}）`);
      md = await res.text();
    } catch (e) { article.innerHTML = errorBox(e.message); FX.markReady(); return; }
    FX.markReady();
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
      splitReveal($("#project-head h1"), FX.introDelay);
      if (motion) gsap.from(["#project-head .meta", "#project-head .tagline", "#project-head .row"], { opacity: 0, y: 12, duration: 0.8, ease: EASE, stagger: 0.08, delay: 0.2 + FX.introDelay });
      if (motion && p.cover) gsap.from(".project-cover", { clipPath: "inset(10% 6% 10% 6% round 16px)", opacity: 0, duration: 1.2, ease: EASE, delay: 0.3 + FX.introDelay });
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
    ["研究", "研究 / 論文"],
    ["工作", "工作"],
    ["社群", "社群 / 領導"],
    ["競賽", "競賽"],
    ["檢定", "檢定"],
    ["教學", "教學 / 演講"],
    ["籌辦", "活動籌辦"],
    ["學習", "營隊 / 課程"],
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
    const tags = parts(t.title, x.fields.join(" / "));
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

  // 經歷列捲到時往上浮出
  function riseIn(els) {
    if (!motion || !els.length) return;
    els = els.filter((el) => !revealed.has(el));
    gsap.set(els, { opacity: 0, y: 36 });
    onVisible(els, (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: EASE, stagger: 0.07, delay: FX.introWait(), overwrite: "auto" }), "0px 0px -4% 0px");
  }

  // 首頁：最近 5 筆
  async function renderExperiencePreview() {
    const box = $("#exp-latest");
    if (!box) return;
    let data;
    try { data = await loadExperience(); }
    catch { $("#experience").hidden = true; return; }
    $("#exp-count").textContent = String(data.items.length).padStart(2, "0");
    // 先放最近 5 筆，「更多」每次再加 5 筆；「全部」連到經歷頁
    const more = $("#exp-more"), STEP = 10;
    let shown = 0;
    const add = () => {
      const next = data.items.slice(shown, shown + STEP);
      box.insertAdjacentHTML("beforeend", next.map(expRow).join(""));
      riseIn([...box.children].slice(shown));
      shown += next.length;
      if (shown >= data.items.length) more.hidden = true;
      else more.querySelector(".more-count").textContent = Math.min(STEP, data.items.length - shown);
    };
    $(".all-count", more.parentElement).textContent = data.items.length;
    add();
    more.addEventListener("click", add);
    FX.magnetize($("#experience"));
  }


  // 經歷頁：分類 / 時間 / 年級三種分組 + 領域篩選
  async function renderExperience() {
    let manifest, data;
    try { [manifest, data] = await Promise.all([loadManifest(), loadExperience()]); }
    catch (e) { $("#exp-groups").innerHTML = errorBox(e.message); FX.markReady(); return; }
    FX.markReady();
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
        if (inView.length) gsap.fromTo(inView, { opacity: 0, y: 28 },
          { opacity: 1, y: 0, duration: 0.8, ease: EASE, stagger: 0.03 });
        riseIn(nodes.filter((el) => !inView.includes(el)));
      } else {
        riseIn(nodes);
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
      splitReveal($("#exp-page-title"), FX.introDelay);
      gsap.from(["#exp-meta", ".exp-head .controls"], { opacity: 0, y: 12, duration: 0.8, ease: EASE, stagger: 0.08, delay: 0.1 + FX.introDelay });
    }
  }

  function errorBox(msg) {
    return `<div class="error-box">${esc(msg)}<br><a href="projects.html">回到所有專案</a></div>`;
  }

  FX.init();
  initNavHover();
  initProgress();
  if (document.body.classList.contains("page-home")) { renderHome(); renderExperiencePreview(); }
  if (document.body.classList.contains("page-experience")) renderExperience();
  if (document.body.classList.contains("page-projects")) renderProjectsPage();
  if (document.body.classList.contains("page-project")) renderProject();
})();
