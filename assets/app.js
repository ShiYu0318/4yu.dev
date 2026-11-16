/* =========================================================
   ShiYu 作品集 — 全站唯一 JS
   - 首頁：讀 content/projects.json → 個人簡介、分類篩選、專案卡片
   - 專案頁：讀 content/projects/<id>.md → Markdown、提示框、
             程式碼上色、目錄、上一個 / 下一個專案
   新增 Markdown 語法時，記得同步更新 AGENTS.md §5、範本與 check.py。
   ========================================================= */
(() => {
  "use strict";

  const MANIFEST = "content/projects.json";
  const PROJECT_DIR = "content/projects/";
  const CALLOUTS = {
    SUMMARY:   { cls: "summary",   icon: "",   label: "摘要" },
    HIGHLIGHT: { cls: "highlight", icon: "✦",  label: "亮點" },
    NOTE:      { cls: "note",      icon: "ℹ",  label: "補充" },
    WIP:       { cls: "wip",       icon: "⚙",  label: "開發中" },
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const initials = (t) => t.replace(/[^A-Za-z0-9一-鿿 ]/g, "").split(/\s+/).filter(Boolean)
    .map((w) => w[0]).join("").slice(0, 3).toUpperCase() || t.slice(0, 2);

  async function loadManifest() {
    const res = await fetch(MANIFEST, { cache: "no-cache" });
    if (!res.ok) throw new Error(`讀不到 ${MANIFEST}（HTTP ${res.status}）`);
    const data = await res.json();
    data.published = data.projects.filter((p) => p.status === "published");
    data.catTitle = Object.fromEntries(data.categories.map((c) => [c.id, c.title]));
    return data;
  }

  const coverHTML = (p) => p.cover
    ? `<img src="${esc(p.cover)}" alt="${esc(p.title)} 的封面截圖" loading="lazy">`
    : `<div class="cover-mono" aria-hidden="true">${esc(p.title.length <= 12 ? p.title : initials(p.title))}</div>`;

  /* ---------------- 首頁 ---------------- */
  async function renderHome() {
    let data;
    try { data = await loadManifest(); }
    catch (e) { $("#hero").innerHTML = errorBox(e.message); return; }

    const pf = data.profile;
    const nCat = new Set(data.published.map((p) => p.category)).size;
    $("#hero").innerHTML = `
      <img class="avatar" src="${esc(pf.avatar)}" alt="${esc(pf.name)} 的頭像" width="196" height="196">
      <div>
        <p class="handle">@${esc(pf.handle)}</p>
        <h1>${esc(pf.name)}<small>${esc(pf.nameEn || "")}</small></h1>
        <p class="tagline">${esc(pf.tagline)}</p>
        <p class="bio">${esc(pf.bio)}</p>
        <div class="hero-links">
          <a class="btn primary" href="#projects">看作品 ↓</a>
          ${pf.links.map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}
        </div>
        <div class="stats">
          <div class="stat"><b>${data.published.length}</b><span>精選專案</span></div>
          <div class="stat"><b>${nCat}</b><span>領域</span></div>
          <div class="stat"><b>${data.published.filter((p) => p.demo).length}</b><span>線上展示</span></div>
        </div>
      </div>`;

    const filters = [{ id: "all", title: "全部" }, ...data.categories];
    const fbox = $("#filters");
    fbox.innerHTML = filters.map((f, i) =>
      `<button class="filter" role="tab" data-cat="${esc(f.id)}" aria-selected="${i === 0}">${esc(f.title)}</button>`).join("");

    const card = (p) => `
      <a class="card" href="project.html?id=${encodeURIComponent(p.id)}">
        <div class="card-cover">${coverHTML(p)}</div>
        <div class="card-body">
          <div class="card-meta"><span>${esc(data.catTitle[p.category] || "")}</span><span>${p.demo ? '<span class="badge-demo">● live</span> · ' : ""}${esc(p.year)}</span></div>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.tagline)}</p>
          <div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </div>
      </a>`;

    const draw = (cat) => {
      const list = data.published.filter((p) => cat === "all" || p.category === cat);
      // 「全部」時 featured 用大卡片；篩選時一律小卡片
      const big = cat === "all" ? list.filter((p) => p.featured) : [];
      const rest = list.filter((p) => !big.includes(p));
      $("#featured").innerHTML = big.map(card).join("");
      $("#grid").innerHTML = rest.map(card).join("");
    };

    fbox.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (!btn) return;
      fbox.querySelectorAll(".filter").forEach((b) => b.setAttribute("aria-selected", b === btn));
      draw(btn.dataset.cat);
    });
    draw("all");
  }

  /* ---------------- 專案頁 ---------------- */
  async function renderProject() {
    const article = $("#article");
    const id = new URLSearchParams(location.search).get("id");
    if (!id) { article.innerHTML = errorBox("網址缺少 ?id=，請從首頁點選專案。"); return; }

    let data, md;
    try {
      data = await loadManifest();
      const res = await fetch(PROJECT_DIR + encodeURIComponent(id) + ".md", { cache: "no-cache" });
      if (!res.ok) throw new Error(`找不到專案「${id}」（HTTP ${res.status}）`);
      md = await res.text();
    } catch (e) { article.innerHTML = errorBox(e.message); return; }

    const p = data.projects.find((x) => x.id === id);
    if (p) {
      document.title = `${p.title} · 黃士育 ShiYu`;
      $("#project-hero").innerHTML = `
        <div class="crumb">~/projects/${esc(p.id)} · ${esc(data.catTitle[p.category] || "")} · ${esc(p.year)}</div>
        <h1>${esc(p.title)}</h1>
        <p class="tagline">${esc(p.tagline)}</p>
        <div class="hero-row">
          <a class="btn primary" href="${esc(p.repo)}" target="_blank" rel="noopener">GitHub ↗</a>
          ${p.demo ? `<a class="btn" href="${esc(p.demo)}" target="_blank" rel="noopener">線上展示 ↗</a>` : ""}
          <div class="tags">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        </div>`;
    }

    article.innerHTML = marked.parse(md, { gfm: true });
    transformCallouts(article);
    enhanceCode(article);
    article.querySelectorAll('a[href^="http"]').forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
    article.querySelectorAll("img").forEach((img) => { img.loading = "lazy"; });
    const headings = addAnchors(article);
    buildToc(headings);
    buildPager(data.published, id);
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }

  // > [!TYPE] 標題  →  <div class="callout callout-type">
  function transformCallouts(root) {
    root.querySelectorAll("blockquote").forEach((bq) => {
      const first = bq.firstElementChild;
      if (!first || first.tagName !== "P") return;
      const m = first.innerHTML.match(/^\s*\[!(\w+)\][ \t]*([^\n<]*)(?:\n|<br>)?/);
      if (!m || !CALLOUTS[m[1].toUpperCase()]) return;
      const type = CALLOUTS[m[1].toUpperCase()];
      first.innerHTML = first.innerHTML.slice(m[0].length).trim();
      if (!first.innerHTML) first.remove();
      const box = document.createElement("div");
      box.className = `callout callout-${type.cls}`;
      box.innerHTML = `<div class="callout-title"><span aria-hidden="true">${type.icon}</span><span>${esc(m[2].trim() || type.label)}</span></div>`;
      while (bq.firstChild) box.appendChild(bq.firstChild);
      bq.replaceWith(box);
    });
  }

  function enhanceCode(root) {
    root.querySelectorAll("pre > code").forEach((code) => {
      const pre = code.parentElement;
      const lang = (code.className.match(/language-(\w+)/) || [])[1];
      if (window.hljs && lang && hljs.getLanguage(lang)) hljs.highlightElement(code);
      if (lang) pre.insertAdjacentHTML("afterbegin", `<span class="code-lang">${esc(lang)}</span>`);
      const btn = document.createElement("button");
      btn.className = "copy-btn"; btn.type = "button"; btn.textContent = "複製";
      btn.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(code.innerText); btn.textContent = "已複製 ✓"; }
        catch { btn.textContent = "失敗"; }
        setTimeout(() => (btn.textContent = "複製"), 1500);
      });
      pre.appendChild(btn);
    });
  }

  function addAnchors(root) {
    const used = new Set();
    return [...root.querySelectorAll("h2, h3")].map((h) => {
      let s = h.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").replace(/\s+/g, "-") || "section";
      let slug = s, n = 2;
      while (used.has(slug)) slug = `${s}-${n++}`;
      used.add(slug);
      h.id = slug;
      h.dataset.label = h.textContent;
      h.insertAdjacentHTML("beforeend", `<a class="anchor" href="#${slug}" aria-label="連結到此節">#</a>`);
      return h;
    });
  }

  function buildToc(headings) {
    const toc = $("#toc");
    if (!headings.length) { toc.remove(); return; }
    toc.innerHTML = `<div class="toc-title">ON THIS PAGE</div><ol>${headings.map((h) =>
      `<li class="lv${h.tagName[1]}"><a href="#${h.id}">${esc(h.dataset.label)}</a></li>`).join("")}</ol>`;

    const links = new Map([...toc.querySelectorAll("a")].map((a) => [a.hash.slice(1), a]));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove("active"));
        links.get(en.target.id)?.classList.add("active");
      });
    }, { rootMargin: "-90px 0px -70% 0px" });
    headings.forEach((h) => obs.observe(h));

    const btn = $("#toc-toggle");
    btn?.addEventListener("click", () => btn.setAttribute("aria-expanded", toc.classList.toggle("open")));
    toc.addEventListener("click", (e) => { if (e.target.tagName === "A") toc.classList.remove("open"); });
  }

  function buildPager(list, id) {
    const i = list.findIndex((p) => p.id === id);
    if (i < 0) return;
    const link = (p, cls, label) => p ? `<a class="${cls}" href="project.html?id=${encodeURIComponent(p.id)}"><small>${label}</small>${esc(p.title)}</a>` : "";
    $("#pager").innerHTML = link(list[i - 1], "prev", "← prev") + link(list[i + 1], "next", "next →");
  }

  function errorBox(msg) {
    return `<div class="error-box"><strong>出了點問題：</strong>${esc(msg)}<br><a href="index.html">回到首頁</a></div>`;
  }

  if (document.body.classList.contains("page-home")) renderHome();
  if (document.body.classList.contains("page-project")) renderProject();
})();
