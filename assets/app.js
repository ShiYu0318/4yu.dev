/* =========================================================
   黃士育 · 專案 — 全站唯一 JS
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
  const no = (n) => `No. ${String(n).padStart(2, "0")}`;
  const external = (url, label, cls = "button") =>
    `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}${ICON.out}</a>`;
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const gsap = window.gsap;
  const motion = !!gsap && !reduced;
  if (gsap) {
    [window.ScrollTrigger, window.SplitText, window.Flip].forEach((p) => p && gsap.registerPlugin(p));
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
    const open = () => { if (dlg.open) return; input.value = ""; sel = 0; draw(); dlg.showModal(); input.focus(); };
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
          <button class="contact-mail" type="button" data-copy="${esc(pf.email)}" aria-label="複製 Email：${esc(pf.email)}">${esc(pf.email)}</button>
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
        <span>黃士育 · 2026</span>
        <span>內容與版面依 <a href="https://github.com/ShiYu0318/NCCU-GenAI-HW/blob/main/AGENTS.md">AGENTS.md</a> 維護</span>
      </div>`;
    const field = $(".dotfield-frame", foot);
    if (field) initDotField(field);
    const btn = $("[data-copy]", foot), status = $(".copy-status", foot);
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
    if (!motion || !window.SplitText || !el) return;
    const split = SplitText.create(el, { type: "lines,chars", linesClass: "line", mask: "lines" });
    gsap.from(split.chars, { yPercent: 110, duration: 0.9, ease: EASE, stagger: 0.018, delay });
  }

  // 捲到時才出現：淡入上移
  function revealOnScroll(targets, opts = {}) {
    if (!motion || !window.ScrollTrigger) return;
    const els = typeof targets === "string" ? $$(targets) : targets;
    if (!els.length) return;
    gsap.set(els, { opacity: 0, y: 16 });
    ScrollTrigger.batch(els, {
      start: "top 88%", once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: EASE, stagger: 0.06, ...opts }),
    });
  }

  // 截圖展開：外框從內縮的裁切展開，圖片從放大縮回
  function revealShots(shots) {
    if (!motion || !window.ScrollTrigger) return;
    shots.forEach((shot) => {
      const img = $("img", shot);
      gsap.timeline({ scrollTrigger: { trigger: shot, start: "top 85%", once: true } })
        .from(shot, { clipPath: "inset(10% 6% 10% 6% round 16px)", duration: 1.1, ease: EASE })
        .from(img, { scale: 1.12, duration: 1.4, ease: EASE }, 0);
    });
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
        <p class="hero-eyebrow meta">${esc(pf.nameEn)} · ${esc(pf.tagline)}</p>
        <h1>${esc(pf.headline).replace(/\n/g, "<br>")}</h1>
        <p class="bio">${esc(pf.bio)}</p>
        <div class="hero-actions">
          <a class="button primary" href="#projects">看 ${data.published.length} 個專案${ICON.down}</a>
          ${external("https://github.com/ShiYu0318", "GitHub")}
          ${others.filter((l) => l.label === "CV").map((l) => external(l.url, l.label)).join("")}
        </div>
      </div>
      <figure class="portrait">
        <img src="${esc(pf.portrait)}" alt="${esc(pf.name)} 的照片" width="800" height="800">
        <figcaption class="meta">${esc(pf.name)} · @${esc(pf.handle)}</figcaption>
      </figure>`;
    splitReveal($(".hero h1"), 0.1);
    if (motion) {
      gsap.from([".hero-eyebrow", ".hero .bio", ".hero-actions"], { opacity: 0, y: 12, duration: 0.8, ease: EASE, stagger: 0.08, delay: 0.35 });
      gsap.from(".portrait", { opacity: 0, scale: 0.94, duration: 1, ease: EASE, delay: 0.2 });
    }

    renderProjects(data);
  }

  function renderProjects(data) {
    const cats = [{ id: "all", title: "全部" }, ...data.categories];
    const count = (id) => data.published.filter((p) => id === "all" || p.category === id).length;
    const fbox = $("#filters");
    fbox.innerHTML = `<span class="thumb" aria-hidden="true"></span>` + cats.filter((c) => count(c.id)).map((c, i) =>
      `<button type="button" role="tab" data-cat="${esc(c.id)}" aria-selected="${i === 0}">${esc(c.title)}<span class="count">${count(c.id)}</span></button>`).join("");
    $("#project-count").textContent = String(data.published.length).padStart(2, "0");

    const lead = data.published.filter((p) => p.featured && p.cover);
    const rest = data.published.filter((p) => !lead.includes(p));
    const teamTag = (p) => p.team ? `<span class="team">團隊</span>` : "";

    $("#lead").innerHTML = lead.map((p) => `
      <a class="feature" data-cat="${esc(p.category)}" href="project.html?id=${encodeURIComponent(p.id)}">
        <div class="feature-shot"><img src="${esc(p.cover)}" alt="${esc(p.title)} 的畫面" loading="lazy"></div>
        <div class="feature-text">
          <p class="meta">${no(p.no)} · ${esc(data.catTitle[p.category])} · ${esc(p.year)}${p.team ? " · 團隊" : ""}</p>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.tagline)}</p>
          <p class="stack">${p.tags.map(esc).join(" / ")}</p>
          <span class="read-more"><span>閱讀介紹</span>${ICON.right}</span>
        </div>
      </a>`).join("");

    $("#index").innerHTML = rest.map((p) => `
      <li data-cat="${esc(p.category)}"><a href="project.html?id=${encodeURIComponent(p.id)}" ${p.cover ? `data-cover="${esc(p.cover)}"` : ""}>
        <span class="meta no">${String(p.no).padStart(2, "0")}</span>
        <span><span class="title">${esc(p.title)}${teamTag(p)}</span><span class="tagline">${esc(p.tagline)}</span></span>
        <span class="cat">${esc(data.catTitle[p.category])}</span>
        <span class="meta year">${esc(p.year)}</span>
      </a></li>`).join("");

    // 篩選：用 Flip 讓留下的項目平滑移到新位置
    const thumb = $(".thumb", fbox);
    const moveThumb = (btn, animate) => {
      const props = { x: btn.offsetLeft, width: btn.offsetWidth };
      if (motion && animate) gsap.to(thumb, { ...props, duration: 0.45, ease: EASE });
      else if (gsap) gsap.set(thumb, props);
      else Object.assign(thumb.style, { transform: `translateX(${props.x}px)`, width: `${props.width}px` });
    };
    const items = () => $$(".feature, #index li");
    const apply = (cat) => {
      const state = motion && window.Flip ? Flip.getState(items()) : null;
      let shown = 0;
      items().forEach((el) => {
        const on = cat === "all" || el.dataset.cat === cat;
        el.hidden = !on;
        if (on && el.tagName === "LI") shown++;
      });
      const leads = $$(".feature:not([hidden])").length;
      $("#lead").hidden = leads === 0;
      $("#empty").hidden = shown > 0 || leads > 0;
      $(".index-head").hidden = shown === 0;
      if (state) {
        Flip.from(state, {
          duration: 0.6, ease: EASE, absolute: false, nested: true,
          onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: EASE, stagger: 0.04 }),
        });
      }
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    fbox.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn || btn.getAttribute("aria-selected") === "true") return;
      $$("button", fbox).forEach((b) => b.setAttribute("aria-selected", b === btn));
      moveThumb(btn, true);
      apply(btn.dataset.cat);
    });
    requestAnimationFrame(() => moveThumb($("button", fbox), false));
    addEventListener("resize", () => moveThumb($('button[aria-selected="true"]', fbox), false));

    revealShots($$(".feature-shot"));
    revealOnScroll($$(".feature-text"));
    revealOnScroll($$("#index li"));
    initPreview();
  }

  // 索引 hover：截圖預覽跟著游標，帶一點延遲
  function initPreview() {
    const box = $(".preview"), img = $("img", box);
    if (!box || !finePointer || !gsap) return;
    const xTo = gsap.quickTo(box, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(box, "y", { duration: 0.5, ease: "power3" });
    let visible = false;
    $("#index").addEventListener("pointermove", (e) => {
      const a = e.target.closest("a");
      const cover = a?.dataset.cover;
      if (!cover) { hide(); return; }
      if (!img.src.endsWith(cover)) img.src = cover;
      xTo(e.clientX + 24); yTo(e.clientY - 80);
      if (!visible) {
        visible = true;
        gsap.set(box, { x: e.clientX + 24, y: e.clientY - 80 });
        gsap.to(box, { opacity: 1, scale: 1, duration: reduced ? 0 : 0.3, ease: EASE });
      }
    });
    const hide = () => { if (!visible) return; visible = false; gsap.to(box, { opacity: 0, scale: 0.96, duration: 0.2 }); };
    $("#index").addEventListener("pointerleave", hide);
    addEventListener("scroll", hide, { passive: true });
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
      document.title = `${p.title} · 黃士育`;
      $("#project-head").innerHTML = `
        <p class="meta">${p.no ? no(p.no) + " · " : ""}${esc(data.catTitle[p.category])} · ${esc(p.year)}${p.team ? " · 團隊專案" : ""}</p>
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
      h.insertAdjacentHTML("beforeend", `<a class="anchor" href="#${slug}" aria-label="連結到此節">#</a>`);
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
      ? `<a class="${cls}" href="project.html?id=${encodeURIComponent(p.id)}"><span class="meta">${label} · ${no(p.no)}</span>${esc(p.title)}</a>`
      : "";
    $("#pager").innerHTML = link(list[i - 1], "prev", "上一個") + link(list[i + 1], "next", "下一個");
  }

  function errorBox(msg) {
    return `<div class="error-box">${esc(msg)}<br><a href="index.html">回到所有專案</a></div>`;
  }

  initNavHover();
  initProgress();
  if (document.body.classList.contains("page-home")) renderHome();
  if (document.body.classList.contains("page-project")) renderProject();
})();
