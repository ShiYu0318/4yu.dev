/* =========================================================
   黃士育 · 專案 — 全站唯一 JS
   - 首頁：讀 content/projects.json → 自我介紹、領域篩選、
           精選（圖文交錯）與索引（筆記本目錄式條列）
   - 專案頁：讀 content/projects/<id>.md → Markdown、提示框、
             程式碼上色、目錄、上一個 / 下一個
   每個專案的編號（No. 01）由 projects.json 中已發佈專案的順序決定。
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
  // lucide: arrow-up-right / arrow-down，16px、stroke 1.5
  const ICON_OUT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';
  const ICON_DOWN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>';

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const no = (n) => `No. ${String(n).padStart(2, "0")}`;
  const external = (url, label, cls = "button") =>
    `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}${ICON_OUT}</a>`;

  async function loadManifest() {
    const res = await fetch(MANIFEST, { cache: "no-cache" });
    if (!res.ok) throw new Error(`讀不到 ${MANIFEST}（HTTP ${res.status}）`);
    const data = await res.json();
    data.published = data.projects.filter((p) => p.status === "published");
    data.published.forEach((p, i) => { p.no = i + 1; });
    data.catTitle = Object.fromEntries(data.categories.map((c) => [c.id, c.title]));
    return data;
  }

  /* ---------------- 首頁 ---------------- */
  async function renderHome() {
    let data;
    try { data = await loadManifest(); }
    catch (e) { $("#hero").innerHTML = errorBox(e.message); return; }

    const pf = data.profile;
    const others = pf.links.filter((l) => l.label !== "GitHub");
    $("#hero").innerHTML = `
      <div class="enter">
        <p class="hero-eyebrow meta">${esc(pf.nameEn)} · ${esc(pf.tagline)}</p>
        <h1>${esc(pf.headline)}</h1>
        <p class="bio">${esc(pf.bio)}</p>
        <div class="hero-actions">
          <a class="button primary" href="#projects">看專案${ICON_DOWN}</a>
          ${others.map((l) => external(l.url, l.label)).join("")}
        </div>
      </div>
      <figure class="portrait enter enter-2">
        <img src="${esc(pf.portrait || pf.avatar)}" alt="${esc(pf.name)} 的照片" width="800" height="1000">
        <figcaption class="meta"><span>${esc(pf.name)}</span><span>@${esc(pf.handle)}</span></figcaption>
      </figure>`;

    const filters = [{ id: "all", title: "全部" }, ...data.categories];
    const fbox = $("#filters");
    fbox.innerHTML = filters.map((f, i) =>
      `<button type="button" role="tab" data-cat="${esc(f.id)}" aria-selected="${i === 0}">${esc(f.title)}</button>`).join("");

    const feature = (p) => `
      <a class="feature" href="project.html?id=${encodeURIComponent(p.id)}">
        <div class="feature-shot"><img src="${esc(p.cover)}" alt="${esc(p.title)} 的畫面" loading="lazy"></div>
        <div>
          <p class="meta">${no(p.no)} · ${esc(data.catTitle[p.category])} · ${esc(p.year)}</p>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.tagline)}</p>
          <p class="stack">${p.tags.map(esc).join(" / ")}</p>
          <span class="read-more">閱讀介紹</span>
        </div>
      </a>`;

    const row = (p) => `
      <li><a href="project.html?id=${encodeURIComponent(p.id)}">
        <span class="meta no">${String(p.no).padStart(2, "0")}</span>
        <span><span class="title">${esc(p.title)}</span><span class="tagline">${esc(p.tagline)}</span></span>
        <span class="cat">${esc(data.catTitle[p.category])}</span>
        <span class="meta year">${esc(p.year)}</span>
      </a></li>`;

    const draw = (cat) => {
      const all = cat === "all";
      const list = data.published.filter((p) => all || p.category === cat);
      // 「全部」時，有封面的精選專案以圖文大列呈現；篩選時一律進索引
      const lead = all ? list.filter((p) => p.featured && p.cover) : [];
      const rest = list.filter((p) => !lead.includes(p));
      $("#lead").innerHTML = lead.map(feature).join("");
      $("#index-head").innerHTML = rest.length
        ? `<span class="meta">No.</span><span class="meta">${all ? "其他專案" : "專案"}</span><span class="meta">領域</span><span class="meta">年份</span>`
        : "";
      $("#index").innerHTML = rest.map(row).join("") || `<li class="empty">這個領域還沒有專案</li>`;
    };

    fbox.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      fbox.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", b === btn));
      draw(btn.dataset.cat);
    });
    draw("all");
  }

  /* ---------------- 專案頁 ---------------- */
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

    const p = data.projects.find((x) => x.id === id);
    if (p) {
      document.title = `${p.title} · 黃士育`;
      $("#project-head").innerHTML = `
        <div class="enter">
          <p class="meta">${p.no ? no(p.no) + " · " : ""}${esc(data.catTitle[p.category])} · ${esc(p.year)}</p>
          <h1>${esc(p.title)}</h1>
          <p class="tagline">${esc(p.tagline)}</p>
          <div class="row">
            ${external(p.repo, "GitHub", "button primary")}
            ${p.demo ? external(p.demo, "線上展示") : ""}
            <span class="stack">${p.tags.map(esc).join(" / ")}</span>
          </div>
        </div>
        ${p.cover ? `<figure class="project-cover enter enter-2"><img src="${esc(p.cover)}" alt="${esc(p.title)} 的主要畫面"></figure>` : ""}`;
    }

    article.innerHTML = marked.parse(md, { gfm: true });
    transformCallouts(article);
    enhanceCode(article);
    article.querySelectorAll('a[href^="http"]').forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
    article.querySelectorAll("img").forEach((img) => { img.loading = "lazy"; });
    // 封面已在標頭顯示，內文中同一張圖就不重複
    if (p?.cover) article.querySelectorAll(`img[src="${CSS.escape(p.cover)}"]`).forEach((img) => img.remove());
    const headings = addAnchors(article);
    buildToc(headings);
    buildPager(data.published, id);
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }

  // > [!TYPE] 標題  →  SUMMARY 變成導言段落，其餘變成左側細線的提示框
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
      if (type.cls === "summary") {
        box.className = "lede";
      } else {
        box.className = `callout callout-${type.cls}`;
        const title = m[2].trim() || type.label;
        if (title) box.innerHTML = `<div class="callout-title">${esc(title)}</div>`;
      }
      while (bq.firstChild) box.appendChild(bq.firstChild);
      bq.replaceWith(box);
    });
  }

  function enhanceCode(root) {
    root.querySelectorAll("pre > code").forEach((code) => {
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
    return [...root.querySelectorAll("h2, h3")].map((h) => {
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

  function buildToc(headings) {
    const toc = $("#toc");
    if (!headings.length) { toc.remove(); return; }
    toc.innerHTML = `<div class="toc-title">本頁目錄</div><ol>${headings.map((h) =>
      `<li class="lv${h.tagName[1]}"><a href="#${h.id}">${esc(h.dataset.label)}</a></li>`).join("")}</ol>`;

    const links = new Map([...toc.querySelectorAll("a")].map((a) => [a.hash.slice(1), a]));
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.remove("active"));
        links.get(en.target.id)?.classList.add("active");
      });
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

  if (document.body.classList.contains("page-home")) renderHome();
  if (document.body.classList.contains("page-project")) renderProject();
})();
