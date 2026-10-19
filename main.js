/* 柯婧然作品集网站 —— 交互与动效
   依赖：本地 GSAP + ScrollTrigger（动效）、Lenis（平滑滚动）。库没加载到时保留静态浏览。 */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;
  const indexMode = html.dataset.indexMode === "horizontal" ? "horizontal" : "list";
  const TXT = window.SITE_TEXT, PROJ = window.PROJECTS, CONTACT = window.SITE_CONTACT;
  const IMG = "";
  const framing = name => (window.IMAGE_FRAMING && window.IMAGE_FRAMING[name]) || {};
  const imageStyle = name => {
    const frame = framing(name);
    return `--image-position:${frame.position || "50% 50%"};--image-fit:${frame.fit || "cover"};--image-background:${frame.background || "#1c1a18"};--landscape-width:${frame.width || "100%"};--landscape-left:${frame.left || "0%"}`;
  };
  // 单文件版会把图片内嵌到 window.IMG_DATA；普通版从 assets/ 读
  const src = n => (window.IMG_DATA && window.IMG_DATA[n]) || ((n.includes("/") ? n.split("/").pop() : IMG + n) + "?v=20261020-5");
  $$("img[data-img]").forEach(i => { i.src = src(i.dataset.img); });

  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const anim = hasGsap && !reduced;
  if (!anim) html.classList.add("no-anim");
  html.classList.add("no-hscroll");
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------------- 语言 ---------------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const urlLang = new URLSearchParams(location.search).get("lang");
  let lang = (urlLang === "en" || urlLang === "zh") ? urlLang
    : store.get("jk-lang") || ((navigator.language || "zh").toLowerCase().startsWith("zh") ? "zh" : "en");
  const t = (k) => (TXT[k] ? TXT[k][lang] : k);
  const other = () => (lang === "zh" ? "en" : "zh");
  const CURSOR_TXT = { view: { zh: "查看", en: "View" }, drag: { zh: "拖动", en: "Drag" } };

  function setLangAttr() {
    html.lang = lang === "zh" ? "zh-CN" : "en";
    const mode = indexMode === "list" ? { zh: "悬浮目录", en: "List index" } : { zh: "横向目录", en: "Horizontal index" };
    document.title = lang === "zh" ? `柯婧然 — 平面设计作品集 · ${mode.zh}` : `Jingran Ke — Graphic Design Portfolio · ${mode.en}`;
  }

  function fillStatic() {
    $$("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    $$("[data-i18n-html]").forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    splitStatement();
    buildMarquee();
    buildAwards();
    renderCards();
    if (caseState.open) renderCase(caseState.id);
  }

  function switchLang(next) {
    if (next === lang) return;
    const targets = $$("[data-i18n],[data-i18n-html],.card-info,.row,.awards,.marquee-track,.about-statement,.case-body");
    const swap = () => {
      lang = next; store.set("jk-lang", lang); setLangAttr(); fillStatic();
      if (anim) { buildStatementScroll(); ScrollTrigger.refresh(); }
    };
    if (!anim) { swap(); return; }
    gsap.to(targets, {
      opacity: 0, y: 6, duration: .18, ease: "power1.in", onComplete() {
        swap();
        gsap.fromTo(targets, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: .4, ease: "power2.out", clearProps: "transform" });
      }
    });
  }

  $(".lang").addEventListener("click", () => switchLang(other()));

  /* ---------------- 关于我：逐字显现 ---------------- */
  function splitStatement() {
    const el = $(".about-statement");
    const s = t("about.statement");
    el.setAttribute("aria-label", s);
    const parts = lang === "zh" ? Array.from(s) : s.split(/(\s+)/);
    el.innerHTML = parts.map(p => /^\s+$/.test(p) ? p : `<span class="ch" aria-hidden="true">${p}</span>`).join("");
  }
  let statementST = null;
  function buildStatementScroll() {
    if (statementST) { statementST.scrollTrigger && statementST.scrollTrigger.kill(); statementST.kill(); }
    const chars = $$(".about-statement .ch");
    statementST = gsap.to(chars, {
      opacity: 1, stagger: .02, ease: "none",
      scrollTrigger: { trigger: ".about-statement", start: "top 82%", end: "bottom 50%", scrub: .6 }
    });
  }

  /* ---------------- 跑马灯 ---------------- */
  function buildMarquee() {
    const items = TXT.marquee[lang];
    const one = items.map(w => `<span class="marquee-item">${w}</span>`).join("");
    $(".marquee-track").innerHTML = one + one + one + one;
  }

  /* ---------------- 关于我：奖项、工具 ---------------- */
  function buildAwards() {
    $(".awards").innerHTML = TXT["about.awards.list"][lang]
      .map(([y, a]) => `<li><span class="yr">${y}</span><span>${a}</span></li>`).join("");
  }
  $(".tools").innerHTML = window.TOOLS
    .map(([f, n]) => `<li${n ? ` data-name="${n}"` : ""}><img src="${src("tools/" + f)}" alt="${n}" loading="lazy"></li>`).join("");

  /* ---------------- 联系方式 ---------------- */
  $$(".js-wechat").forEach(e => e.textContent = CONTACT.wechat);
  $$(".js-xiaohongshu").forEach(e => e.textContent = CONTACT.xiaohongshu);
  $$(".js-email").forEach(e => { e.textContent = CONTACT.email; e.href = "mailto:" + CONTACT.email; });
  $$(".js-email-text").forEach(e => e.textContent = CONTACT.email);
  $$(".js-pdf").forEach(e => { if (CONTACT.pdf) e.href = CONTACT.pdf; else e.remove(); });
  const toastEl = $(".toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("is-on");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 1800);
  }
  $$(".js-copy").forEach(b => b.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(CONTACT.email); toast(t("contact.copied")); }
    catch (e) { location.href = "mailto:" + CONTACT.email; }
  }));

  /* ---------------- 两个章节共用的项目索引 ---------------- */
  const indexes = [
    { section: $("#projects"), part: 1, next: "#publication", nextTitle: "Part 02 →", nextLabel: "pubs.title" },
    { section: $("#publication"), part: 2, next: "#contact", nextTitle: "Thank you →", nextLabel: "nav.contact" }
  ];
  const previewHiders = [];
  function hideIndexPreviews() { previewHiders.forEach(hide => hide()); }
  indexes.forEach(index => {
    index.projects = PROJ.filter(p => p.part === index.part);
    if (indexMode === "list") {
      index.section.classList.add("index-list");
      const titleKey = index.part === 1 ? "part1.big" : "pubs.title";
      const titleId = index.part === 1 ? "projects-title" : "publication-title";
      index.section.innerHTML = `<div class="pubs-head"><h2 class="pubs-title" id="${titleId}" data-i18n="${titleKey}"></h2><p class="pubs-sub index-hint"></p></div><div class="pubs-list">${index.projects.map(p => `
        <a class="row" href="#/${p.id}" data-id="${p.id}" data-cursor="view" style="--accent:${p.accent}">
          <span class="row-no">${p.no}</span><span class="row-thumb"><img src="${src(p.cover)}" alt="" loading="lazy" decoding="async"></span>
          <span class="row-t"></span><span class="row-alt"></span><span class="row-tags"></span><span class="row-arrow">→</span>
        </a>`).join("")}</div>`;
      setupIndexPreview(index);
      return;
    }
    index.track = $(".track", index.section);
    index.track.innerHTML = index.projects.map(p => `
      <a class="card" href="#/${p.id}" data-id="${p.id}" data-cursor="view" style="--accent:${p.accent}">
        <span class="card-tab">${p.no}</span>
        <div class="card-media${framing(p.cover).fit === "contain" ? " card-media--contain" : ""}" style="${imageStyle(p.cover)}"><img src="${src(p.cover)}" alt="" loading="lazy" decoding="async"></div>
        <div class="card-info"></div>
      </a>`).join("") + `<div class="card-end"><b>${index.nextTitle}</b><a href="${index.next}" data-cursor="link" class="index-end-link"></a></div>`;
    $(".work-count", index.section).innerHTML = `<b class="js-cur">01</b> / ${String(index.projects.length).padStart(2, "0")}`;
  });

  function setupIndexPreview(index) {
    const preview = document.createElement("div");
    preview.className = "pubs-preview";
    preview.setAttribute("aria-hidden", "true");
    preview.innerHTML = '<div class="pubs-preview-inner"><img alt="" decoding="async"></div>';
    document.body.appendChild(preview);
    const image = $("img", preview);
    let currentId = null, pointerX = 0, pointerY = 0;
    const hide = () => { preview.classList.remove("is-visible"); currentId = null; };
    previewHiders.push(hide);
    const place = () => {
      if (!currentId || !image.complete || !image.naturalWidth) return;
      const width = preview.offsetWidth, height = preview.offsetHeight;
      let left = pointerX + 28;
      if (left + width > innerWidth - 16) left = pointerX - width - 28;
      preview.style.left = `${Math.max(16, Math.min(innerWidth - width - 16, left))}px`;
      preview.style.top = `${Math.max(16, Math.min(innerHeight - height - 16, pointerY - height / 2))}px`;
      preview.classList.add("is-visible");
    };
    image.addEventListener("load", place);
    const show = (project, x, y) => {
      if (!finePointer || innerWidth <= 820 || caseState.open) return;
      pointerX = x; pointerY = y;
      if (currentId !== project.id) {
        preview.classList.remove("is-visible");
        currentId = project.id;
        image.src = src(project.cover);
      }
      place();
    };
    $$(".row", index.section).forEach(row => {
      const project = index.projects.find(p => p.id === row.dataset.id);
      row.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") show(project, e.clientX, e.clientY); });
      row.addEventListener("pointermove", e => { if (e.pointerType === "mouse") show(project, e.clientX, e.clientY); });
      row.addEventListener("pointerleave", hide);
      row.addEventListener("focus", () => { const r = row.getBoundingClientRect(); show(project, r.right - preview.offsetWidth - 60, r.top + r.height / 2); });
      row.addEventListener("blur", hide);
    });
    addEventListener("scroll", hide, { passive: true });
    addEventListener("resize", hide);
    addEventListener("blur", hide);
    addEventListener("keydown", e => { if (e.key === "Escape") hide(); });
  }

  function chips(arr) { return arr.map(x => `<span class="chip">${x}</span>`).join(""); }
  function renderCards() {
    $$(".card").forEach(c => {
      const p = PROJ.find(x => x.id === c.dataset.id);
      const alt = p.title[other()] !== p.title[lang] ? p.title[other()] : (p.sub ? p.sub[lang] : "");
      c.querySelector(".card-info").innerHTML =
        `<span class="card-title">${p.title[lang]}</span><span class="card-alt">${alt}</span><span class="card-tags">${chips(p.tags[lang])}</span>`;
      c.querySelector("img").alt = p.title[lang];
    });
    $$(".row").forEach(row => {
      const p = PROJ.find(x => x.id === row.dataset.id);
      $(".row-t", row).textContent = p.title[lang];
      $(".row-alt", row).textContent = p.title[other()] !== p.title[lang] ? p.title[other()] : (p.sub ? p.sub[lang] : "");
      $(".row-tags", row).innerHTML = chips(p.tags[lang]);
    });
    indexes.forEach(index => {
      const end = $(".index-end-link", index.section);
      if (end) end.textContent = t(index.nextLabel) + " ↓";
      const hint = $(".index-hint", index.section);
      if (hint) hint.innerHTML = `<span class="index-hint-pointer">${lang === "zh" ? "悬停预览缩略图 · 点击查看项目" : "Hover to preview · Click to explore"}</span><span class="index-hint-touch">${lang === "zh" ? "点击查看项目" : "Tap to explore"}</span>`;
    });
  }

  /* ---------------- 项目详情层 ---------------- */
  const caseEl = $(".case"), caseScroll = $(".case-scroll"), caseBody = $(".case-body");
  const caseState = { open: false, id: null, pushed: false };

  function stopCaseVideos() {
    $$("video", caseBody).forEach(video => video.pause());
  }

  function galleryMedia(im, override) {
    const frame = override || framing(im[0]);
    const crop = frame.page ? null : frame.crop;
    const width = crop ? crop[2] - crop[0] : im[1];
    const height = crop ? crop[3] - crop[1] : im[2];
    let style = `--media-ratio:${frame.ratio || `${width}/${height}`}`;
    if (crop) {
      style += `;--crop-width:${im[1] / width * 100}%;--crop-left:${-crop[0] / width * 100}%;--crop-top:${-crop[1] / height * 100}%`;
    }
    const mode = frame.page ? " g-media--page" : frame.panels ? " g-media--composition" : crop ? " g-media--crop" : "";
    return { width, height, frame, style, mode };
  }

  function renderCase(id) {
    stopCaseVideos();
    const p = PROJ.find(x => x.id === id);
    const i = PROJ.indexOf(p), n = PROJ[(i + 1) % PROJ.length];
    caseEl.style.setProperty("--accent", p.accent);
    caseEl.classList.toggle("case--light", p.theme === "light");
    caseEl.dataset.project = p.id;
    const alt = p.title[other()] !== p.title[lang] ? p.title[other()] : "";
    const partName = p.part === 1 ? "Project" : "Publication";

    // 按项目指定图片顺序与列数；未指定时使用同宽单栏，原页保持完整 16:9。
    const rows = p.galleryRows
      ? p.galleryRows.map(row => ({ images: row.items.map(no => p.imgs[no - 1]), columns: row.columns }))
      : p.imgs.map(im => ({ images: [im] }));
    const fig = im => {
      const media = galleryMedia(im);
      const image = alt => `<img src="${src(im[0])}" width="${im[1]}" height="${im[2]}" alt="${alt}" loading="lazy" decoding="async">`;
      const content = media.frame.panels
        ? media.frame.panels.map((crop, i) => {
          const panel = galleryMedia(im, { crop });
          return `<div class="g-panel g-media--crop" style="${panel.style}">${image(i ? "" : p.title[lang])}</div>`;
        }).join("")
        : image(p.title[lang]);
      return `<figure class="g-item${media.width > media.height ? " g-item--landscape" : ""}${media.frame.page ? " g-item--page" : ""}${media.frame.hero ? " g-item--hero" : ""}"><div class="g-media${media.mode}" style="${media.style}">${content}</div>${im[3] ? `<figcaption>${im[3][lang]}</figcaption>` : ""}</figure>`;
    };
    const gallery = rows.map(row => {
      const cols = row.images.length;
      const columns = row.columns ? ` style="--gallery-columns:${row.columns.map(value => `${value}fr`).join(" ")}"` : "";
      return `<div class="g-row g-row--${cols}"${columns}>${row.images.map(fig).join("")}</div>`;
    }).join("");
    const video = p.video ? `<div class="g-row"><figure class="g-item g-item--video">
      <video controls playsinline preload="metadata"${p.video.poster ? ` poster="${src(p.video.poster)}"` : ""} aria-label="${p.title[lang]}">
        <source src="${(window.VIDEO_DATA && window.VIDEO_DATA[p.video.src]) || p.video.src}" type="video/mp4">
        ${lang === "zh" ? "此浏览器不支持视频播放。" : "Your browser does not support video playback."}
      </video>${p.video.caption ? `<figcaption>${p.video.caption[lang]}</figcaption>` : ""}
    </figure></div>` : "";

    caseBody.innerHTML = `
      <div class="case-head">
        <div>
          <span class="case-no">${partName} ${p.no}</span>
          <h2 class="case-title"><span class="ln"><span>${p.title[lang]}</span></span></h2>
          ${alt ? `<p class="case-alt">${alt}</p>` : ""}
          ${p.sub ? `<p class="case-sub">${p.sub[lang]}</p>` : ""}
        </div>
        <div class="case-meta">
          <div class="case-categories"><h4>${t("case.tags")}</h4><div class="chips">${chips(p.tags[lang])}</div></div>
          ${p.specs ? `<div><h4>${t("case.specs")}</h4><ul>${p.specs[lang].map(s => `<li>${s}</li>`).join("")}</ul></div>` : ""}
          ${p.desc ? `<p class="case-desc">${p.desc[lang]}</p>` : ""}
          ${p.link ? `<a class="case-link" href="${p.link}" target="_blank" rel="noopener" data-cursor="link">${t("case.link")} ↗</a>` : ""}
        </div>
      </div>
      <div class="case-gallery">${gallery}${video}</div>
      <a class="case-next" href="#/${n.id}" data-next="${n.id}" data-cursor="view" style="--next-accent:${n.accent}">
        <div><small>${t("case.next")} · ${n.part === 1 ? "Project" : "Publication"} ${n.no}</small><strong>${n.title[lang]}</strong></div>
        <img src="${src(n.cover)}" style="${imageStyle(n.cover)}" alt="" loading="lazy">
      </a>`;
    caseEl.setAttribute("aria-label", p.title[lang]);
    $(".case-close span").textContent = t("case.close");
    watchGallery();
  }

  let galleryIO;
  function watchGallery() {
    if (galleryIO) galleryIO.disconnect();
    if (!anim) return;
    const items = $$(".g-item", caseBody);
    gsap.set(items, { opacity: 0, y: 20 });
    galleryIO = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      galleryIO.unobserve(e.target);
      gsap.to(e.target, { opacity: 1, y: 0, duration: .65, ease: "power2.out" });
    }), { root: caseScroll, rootMargin: "0px 0px -8% 0px" });
    items.forEach(i => galleryIO.observe(i));
  }

  let fromEl = null;
  function openCase(id, origin) {
    hideIndexPreviews();
    const wasOpen = caseState.open;
    caseState.open = true; caseState.id = id;
    renderCase(id);
    caseScroll.scrollTop = 0;
    caseEl.classList.add("is-open"); caseEl.setAttribute("aria-hidden", "false");
    if (lenis) lenis.stop(); else document.body.style.overflow = "hidden";
    $(".case-close").focus({ preventScroll: true });
    if (!anim) return;

    const head = $(".case-head", caseBody);
    if (wasOpen) {
      gsap.fromTo(caseBody, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .7, ease: "expo.out" });
    } else {
      const media = origin && (origin.querySelector(".card-media") || origin);
      let from = "inset(100% 0px 0px 0px)";
      if (media) {
        const r = media.getBoundingClientRect();
        if (r.width && r.bottom > 0 && r.top < innerHeight)
          from = `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px)`;
      }
      gsap.fromTo(caseEl, { clipPath: from }, { clipPath: "inset(0px 0px 0px 0px)", duration: 1, ease: "expo.inOut", clearProps: "clipPath" });
    }
    gsap.from($(".case-title .ln > span", head), { yPercent: 110, duration: 1, ease: "expo.out", delay: wasOpen ? .1 : .55 });
    gsap.from($$(".case-no,.case-alt,.case-sub,.case-meta > *", head), { opacity: 0, y: 24, stagger: .06, duration: .8, ease: "expo.out", delay: wasOpen ? .15 : .65 });
  }

  function closeCase() {
    if (!caseState.open) return;
    stopCaseVideos();
    caseState.open = false;
    const done = () => {
      caseEl.classList.remove("is-open"); caseEl.setAttribute("aria-hidden", "true");
      if (window.gsap) gsap.set(caseEl, { clearProps: "clipPath" });
      caseBody.innerHTML = "";
      if (lenis) lenis.start(); else document.body.style.overflow = "";
      const back = document.querySelector(`[data-id="${caseState.id}"]`);
      if (back) back.focus({ preventScroll: true });
    };
    if (!anim) return done();
    gsap.fromTo(caseEl, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: .8, ease: "expo.inOut", onComplete: done });
  }

  function route() {
    const m = location.hash.match(/^#\/(p\d-\d\d)$/);
    if (m && PROJ.some(p => p.id === m[1])) { openCase(m[1], fromEl); fromEl = null; }
    else if (caseState.open) closeCase();
  }
  addEventListener("hashchange", () => { caseState.pushed = true; route(); });

  document.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href") || "";
    if (a.dataset.next) {                    // 详情页里的"下一个"：替换历史记录，不叠加
      e.preventDefault();
      history.replaceState(null, "", "#/" + a.dataset.next);
      openCase(a.dataset.next);
      return;
    }
    if (href.startsWith("#/")) { fromEl = a; return; }   // 打开详情，交给 hashchange
    if (href.startsWith("#") && href.length > 1) {        // 页内跳转
      const target = href === "#top" ? 0 : $(href);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6 });
      else (target === 0 ? window.scrollTo({ top: 0, behavior: "smooth" }) : target.scrollIntoView({ behavior: "smooth" }));
    }
  });
  $(".case-close").addEventListener("click", () => {
    if (caseState.pushed) history.back();
    else { history.replaceState(null, "", location.pathname + location.search); closeCase(); }
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && caseState.open) $(".case-close").click(); });

  /* ---------------- 初次填文字 ---------------- */
  setLangAttr();
  fillStatic();

  /* ---------------- 平滑滚动 ---------------- */
  let lenis = null;
  if (anim && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: x => Math.min(1, 1.001 - Math.pow(2, -10 * x)), smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------------- 导航：下滑隐藏、上滑出现 ---------------- */
  const nav = $(".nav");
  let lastY = scrollY;
  addEventListener("scroll", () => {
    const y = scrollY;
    nav.classList.toggle("is-hidden", y > lastY && y > 200);
    lastY = y;
  }, { passive: true });

  /* ---------------- 没有 GSAP 时到此为止 ---------------- */
  if (!hasGsap) { route(); return; }
  if (!anim) {
    // 用户系统设置了"减少动态效果"：保留路由与语言，跳过所有动效
    route();
    return;
  }

  /* ---------------- 光标 ---------------- */
  const cursor = $(".cursor");
  if (finePointer) {
    html.classList.add("has-cursor");
    const dot = $(".cursor-dot"), ring = $(".cursor-ring"), label = $(".cursor-label");
    const dx = gsap.quickTo(dot, "x", { duration: .08 }), dy = gsap.quickTo(dot, "y", { duration: .08 });
    const rx = gsap.quickTo(ring, "x", { duration: .45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: .45, ease: "power3" });
    addEventListener("pointermove", e => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      const c = e.target.closest && e.target.closest("[data-cursor]");
      const mode = c ? c.dataset.cursor : "";
      cursor.classList.toggle("is-native", !!e.target.closest("video"));
      cursor.classList.toggle("is-view", mode === "view");
      cursor.classList.toggle("is-drag", mode === "drag");
      cursor.classList.toggle("is-link", mode === "link");
      cursor.classList.toggle("is-dark", !!e.target.closest(".work,.pubs,.marquee,.loader") || (!!e.target.closest(".case") && !e.target.closest(".case--light")));
      if (CURSOR_TXT[mode]) label.textContent = CURSOR_TXT[mode][lang];
    }, { passive: true });
    addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    addEventListener("pointerup", () => cursor.classList.remove("is-down"));
    document.addEventListener("mouseleave", () => gsap.to([dot, ring], { opacity: 0, duration: .2 }));
    document.addEventListener("mouseenter", () => gsap.to([dot, ring], { opacity: 1, duration: .2 }));
  }

  /* ---------------- 会呼吸的咖啡色团块 ---------------- */
  function rand(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function makeBlob(path, seed, o = {}) {
    const r = rand(seed), n = o.n || 9;
    const pts = Array.from({ length: n }, (_, i) => ({
      a: i / n * Math.PI * 2 + (r() - .5) * .35,
      base: 1 + (r() - .5) * (o.irregular || .34),
      p1: r() * 6.28, p2: r() * 6.28, f1: .6 + r() * .6, f2: 1.1 + r() * .8
    }));
    const cx = 500, cy = 350, rx = o.rx || 440, ry = o.ry || 300, amp = o.amp || .07;
    let visible = false, t0 = r() * 100;
    const draw = (time) => {
      const t = time + t0;
      const P = pts.map(p => {
        const k = p.base * (1 + amp * (Math.sin(t * p.f1 + p.p1) + .5 * Math.sin(t * p.f2 + p.p2)) / 1.5);
        return [cx + Math.cos(p.a) * rx * k, cy + Math.sin(p.a) * ry * k];
      });
      let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
      for (let i = 0; i < n; i++) {
        const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
        d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
      }
      path.setAttribute("d", d + "Z");
    };
    draw(0);
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(path.ownerSVGElement);
    gsap.ticker.add(time => { if (visible) draw(time * .55); });
  }
  makeBlob($(".hero-blob path"), 11);
  makeBlob($(".divider--1 .divider-blob path"), 27);
  makeBlob($(".divider--2 .divider-blob path"), 53);
  makeBlob($(".contact-blob path"), 71);

  /* ---------------- 首屏：鼠标视差 ---------------- */
  const hero = $(".hero");
  const pars = $$(".hero .par").map(el => ({
    d: +el.dataset.depth,
    x: gsap.quickTo(el, "x", { duration: 1, ease: "power3" }),
    y: gsap.quickTo(el, "y", { duration: 1, ease: "power3" })
  }));
  if (finePointer) hero.addEventListener("pointermove", e => {
    const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
    pars.forEach(p => { p.x(-nx * p.d * 2.2); p.y(-ny * p.d * 2.2); });
  });

  /* ---------------- 首屏：能拖的小物件 ---------------- */
  let zTop = 10;
  $$(".sticker").forEach(el => {
    const wrap = el.parentElement;
    let drag = null;
    el.addEventListener("pointerdown", e => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      wrap.style.zIndex = ++zTop;
      drag = { sx: e.clientX, sy: e.clientY, ox: gsap.getProperty(el, "x"), oy: gsap.getProperty(el, "y"), vx: 0, vy: 0, lx: e.clientX, ly: e.clientY, lt: performance.now() };
      gsap.to(el, { scale: 1.08, duration: .3, ease: "back.out(3)" });
    });
    el.addEventListener("pointermove", e => {
      if (!drag) return;
      const now = performance.now(), dt = Math.max(1, now - drag.lt);
      drag.vx = (e.clientX - drag.lx) / dt; drag.vy = (e.clientY - drag.ly) / dt;
      drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now;
      gsap.set(el, { x: drag.ox + e.clientX - drag.sx, y: drag.oy + e.clientY - drag.sy, rotation: "+=" + drag.vx * 1.4 });
    });
    const end = () => {
      if (!drag) return;
      const { vx, vy } = drag; drag = null;
      gsap.to(el, { x: "+=" + vx * 160, y: "+=" + vy * 160, scale: 1, duration: 1.1, ease: "expo.out" });
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  });

  /* ---------------- 首屏：滚出时的视差 ---------------- */
  gsap.to(".hero-word", { yPercent: -45, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-blob", { yPercent: 12, scale: 1.08, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-name", { yPercent: -60, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });

  /* ---------------- 首屏入场 ---------------- */
  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero .hero-panel", { scaleY: 0, transformOrigin: "50% 0%", duration: 1.2 }, 0)
      .from(".hero .hero-word", { yPercent: 70, opacity: 0, duration: 1.4 }, .05)
      .from(".hero-gingham", { xPercent: -110, rotation: -20, duration: 1.4 }, .1)
      .from(".hero-blob", { scale: .4, opacity: 0, transformOrigin: "50% 60%", duration: 1.6 }, .1)
      .from(".hero-plus", { opacity: 0, duration: 1 }, .4)
      .fromTo(".hero-name .tag, .hero-works", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, stagger: .12, ease: "expo.inOut" }, .45)
      .from(".hero-years", { opacity: 0, x: -40, duration: 1 }, .8)
      .from(".hero .sticker", { y: () => -innerHeight * .9, rotation: () => gsap.utils.random(-120, 120), duration: 1.3, stagger: .09, ease: "back.out(1.2)" }, .35)
      .from(".hero .bit", { scale: 0, duration: .6, stagger: .06, ease: "back.out(3)" }, 1)
      .from(".hero-hint, .hero-scroll", { opacity: 0, y: 14, duration: .8 }, 1.3)
      .add(() => gsap.to(".hint-arrow", { x: -4, y: -4, repeat: -1, yoyo: true, duration: .7, ease: "sine.inOut" }));
    return tl;
  }

  /* ---------------- 加载 ---------------- */
  const loader = $(".loader");
  const lword = $(".loader-word span"), lnum = $(".loader-num"), lbar = $(".loader-bar span");
  if (lenis) lenis.stop();
  scrollTo(0, 0);
  const ready = Promise.race([
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      new Promise(r => { const i = new Image(); i.onload = i.onerror = r; i.src = src($(".me-photo img").dataset.img); })
    ]),
    new Promise(r => setTimeout(r, 3500))
  ]);
  const prog = { v: 0 };
  const progTween = gsap.to(prog, {
    v: 100, duration: 1.9, ease: "power2.inOut",
    onUpdate() {
      const v = Math.round(prog.v);
      lnum.textContent = v + "%";
      lbar.style.width = v + "%";
      const key = v < 45 ? "loader.1" : v < 90 ? "loader.2" : "loader.3";
      if (lword.dataset.k !== key) { lword.dataset.k = key; lword.textContent = t(key); }
    }
  });
  gsap.fromTo(".loader-folder", { y: 0 }, { y: -8, repeat: -1, yoyo: true, duration: .5, ease: "sine.inOut" });

  Promise.all([ready, progTween.then()]).then(() => {
    const tl = gsap.timeline();
    tl.to(".loader-folder", { scale: 1.4, rotation: -8, duration: .3, ease: "power2.in" })
      .fromTo(loader, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "expo.inOut" }, "+=.05")
      .add(heroIntro(), "-=.55")
      .add(() => {
        loader.remove();
        if (lenis) lenis.start();
        route();          // 如果打开的是带 #/项目 的链接，加载完直接进详情
      }, "-=1.2");
  });

  /* ---------------- 跑马灯：随滚动速度加速、倾斜 ---------------- */
  const mTrack = $(".marquee-track");
  let mx = 0, mBoost = 0;
  gsap.ticker.add((time, dt) => {
    const v = lenis ? lenis.velocity : 0;
    mBoost += (Math.min(Math.abs(v) * .12, 6) - mBoost) * .08;
    mx -= (0.05 + mBoost * .25) * dt * .6 * (v < 0 ? -1 : 1);
    const w = mTrack.scrollWidth / 2;
    if (w) { if (mx <= -w) mx += w; if (mx > 0) mx -= w; }
    gsap.set(mTrack, { x: mx, skewX: -Math.max(-8, Math.min(8, v * .25)) });
  });

  /* ---------------- 关于我 ---------------- */
  buildStatementScroll();
  gsap.utils.toArray(".about-col").forEach(col => {
    gsap.from(col.children, {
      opacity: 0, y: 40, stagger: .06, duration: 1, ease: "expo.out",
      scrollTrigger: { trigger: col, start: "top 85%" }
    });
  });
  gsap.from(".tools li", { scale: 0, rotation: -30, stagger: .04, duration: .7, ease: "back.out(2)", scrollTrigger: { trigger: ".tools", start: "top 88%" } });
  const photo = $(".me-photo");
  if (finePointer) {
    photo.addEventListener("pointermove", e => {
      const r = photo.getBoundingClientRect();
      gsap.to(photo, { rotationY: ((e.clientX - r.left) / r.width - .5) * 16, rotationX: -((e.clientY - r.top) / r.height - .5) * 16, transformPerspective: 700, duration: .5 });
    });
    photo.addEventListener("pointerleave", () => gsap.to(photo, { rotationX: 0, rotationY: 0, duration: .8, ease: "elastic.out(1,.5)" }));
  }

  /* ---------------- 分隔页：在横向 pin 就绪后创建 ---------------- */
  function buildDividers() {
    $$(".divider").forEach(sec => {
    const path = $(".dash-path path", sec), svg = path.ownerSVGElement;
    const trav = $(".traveler", sec), isScissors = trav.classList.contains("scissors");
    const stage = $(".divider-stage", sec), motion = { progress: 0 };
    let len;
    const halves = $$(".half", trav);
    const steering = { tilt: 0 };
    let pathAngle = 0;
    const orientMouse = () => gsap.set(trav, { rotation: pathAngle + steering.tilt });
    const measure = () => {
      if (!isScissors) {
        // 留足旋转后的图标边距，横向前进时连续走过高、低、高三个转折。
        const w = stage.clientWidth, h = stage.clientHeight;
        const radius = Math.hypot(trav.offsetWidth, trav.offsetHeight) / 2 + 16;
        const left = Math.max(100, radius / w * 1000), right = 1000 - left;
        const top = Math.max(76, radius / h * 600), bottom = 600 - top;
        const dx = right - left;
        path.setAttribute("d", `M${left} ${bottom} C${left + dx * .05} ${bottom}, ${left + dx * .14} ${top}, ${left + dx * .29} ${top} C${left + dx * .44} ${top}, ${left + dx * .48} ${bottom}, ${left + dx * .64} ${bottom} C${left + dx * .78} ${bottom}, ${left + dx * .91} ${top}, ${right} ${top}`);
      }
      len = path.getTotalLength();
    };
    const place = (p) => {
      // SVG 局部坐标转成舞台坐标，避免缩放、非等比拉伸和固定区段产生偏移。
      const matrix = path.getScreenCTM();
      if (!matrix) return;
      const box = stage.getBoundingClientRect();
      const at = path.getPointAtLength(len * p).matrixTransform(matrix);
      const a = path.getPointAtLength(Math.max(0, len * p - 2)).matrixTransform(matrix);
      const b = path.getPointAtLength(Math.min(len, len * p + 2)).matrixTransform(matrix);
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      gsap.set(trav, { x: at.x - box.left, y: at.y - box.top });
      if (isScissors) {
        gsap.set(trav, { rotation: ang + 90 });
        const snip = Math.abs(Math.sin(p * Math.PI * 14)) * 14;
        gsap.set(halves[0], { rotation: snip }); gsap.set(halves[1], { rotation: -snip });
      } else {
        pathAngle = ang * .25;
        orientMouse();
      }
    };
    gsap.set(trav, { xPercent: -50, yPercent: -50 });
    measure();
    place(0);
    if (!isScissors && finePointer) {
      // 指针只改变小角度转向，位置始终由虚线上的滚动进度决定。
      const steerTo = gsap.quickTo(steering, "tilt", { duration: .55, ease: "power3.out", onUpdate: orientMouse });
      let previous = null, idleTimer;
      const resetSteering = () => {
        previous = null;
        clearTimeout(idleTimer);
        steerTo(0);
      };
      sec.addEventListener("pointermove", e => {
        if (e.pointerType !== "mouse") return;
        const point = { x: e.clientX, y: e.clientY };
        if (!previous) { previous = point; return; }
        const dx = point.x - previous.x, dy = point.y - previous.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 2) return;
        previous = point;
        const turn = (dx / distance * 18 + dy / distance * 6) * Math.min(distance / 10, 1);
        steerTo(gsap.utils.clamp(-22, 22, turn));
        clearTimeout(idleTimer);
        idleTimer = setTimeout(resetSteering, 450);
      }, { passive: true });
      sec.addEventListener("pointerleave", resetSteering);
      sec.addEventListener("pointercancel", resetSteering);
    }
    gsap.to(motion, {
      progress: 1, ease: "none", onUpdate: () => place(motion.progress),
      scrollTrigger: {
        trigger: sec, start: "top bottom", end: "bottom top", scrub: .6,
        onRefreshInit: measure, onRefresh: () => place(motion.progress)
      }
    });
    gsap.fromTo(path, { strokeDashoffset: 0 }, { strokeDashoffset: -400, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true } });
    const title = $(".divider-title", sec);
    gsap.fromTo(title.children, { clipPath: "inset(0% 100% 0% 0%)" }, {
      clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, stagger: .12, ease: "expo.inOut",
      scrollTrigger: { trigger: sec, start: "top 55%" }
    });
    gsap.from($(".hero-word", sec), { xPercent: -20, opacity: 0, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: true } });
    gsap.from($(".divider-gingham", sec), { yPercent: 40, rotation: 10, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "top top", scrub: true } });
    });
  }

  /* ---------------- 两个章节共用横滑、计数与视差 ---------------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 821px)", () => {
    if (indexMode !== "horizontal") return;
    html.classList.remove("no-hscroll");
    indexes.forEach(index => {
      const { section, track } = index;
      const cards = $$(".card", section);
      const cur = $(".js-cur", section), bar = $(".work-progress span", section);
      const dist = () => Math.max(0, track.scrollWidth - section.clientWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: section, start: "top top", end: () => "+=" + Math.max(1, dist()), pin: true, scrub: 1, invalidateOnRefresh: true,
          // 先按文档顺序刷新两段 pin，再测量依赖其滚动距离的分隔页。
          refreshPriority: 3 - index.part,
          onUpdate(s) {
            gsap.set(bar, { scaleX: s.progress });
            cur.textContent = String(Math.min(cards.length, Math.round(s.progress * (cards.length - 1)) + 1)).padStart(2, "0");
          }
        }
      });
      cards.forEach(c => {
        if (!$(".card-media--contain", c)) gsap.fromTo($("img", c), { xPercent: -5 }, { xPercent: 5, ease: "none", scrollTrigger: { trigger: c, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        // 首屏内的卡片在横滑时间轴上的 start 为负，改由章节进入触发。
        // 后续卡片继续由本章节的横向时间轴触发，确保所有标题都有可达的入场点。
        const firstViewport = c.offsetLeft < section.clientWidth * .85;
        const titleTrigger = firstViewport
          ? { trigger: section, start: "top 65%", once: true }
          : { trigger: c, containerAnimation: tween, start: "left 85%", once: true };
        gsap.fromTo($(".card-info", c), { opacity: 0, y: 30 }, {
          opacity: 1, y: 0, duration: .8, ease: "expo.out", clearProps: "opacity,transform", scrollTrigger: titleTrigger
        });
      });
    });
    return () => html.classList.add("no-hscroll");
  });
  mm.add("(max-width: 820px)", () => {
    $$(".card").forEach(c => gsap.from(c, { opacity: 0, y: 60, duration: 1, ease: "expo.out", scrollTrigger: { trigger: c, start: "top 88%" } }));
  });
  buildDividers();

  /* ---------------- 结尾 ---------------- */
  gsap.fromTo(".contact-title > *", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, stagger: .12, ease: "expo.inOut", scrollTrigger: { trigger: ".contact", start: "top 50%" } });
  gsap.from(".contact-card", { y: 200, rotation: 18, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".contact", start: "top 40%" } });
  gsap.from(".contact-gingham", { xPercent: -60, rotation: -10, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "top top", scrub: true } });

  /* ---------------- 导航高亮 ---------------- */
  [["#about", ".about"], ["#projects", "#projects"], ["#publication", "#publication"], ["#contact", ".contact"]].forEach(([h, s]) => {
    const a = $(`.nav-links a[href="${h}"]`);
    ScrollTrigger.create({ trigger: s, start: "top 50%", end: "bottom 50%", onToggle: st => a.classList.toggle("is-active", st.isActive) });
  });

  const refreshScrollLayout = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
  // 断点切换会重建 pin，也必须重新排序后测量分隔页。
  ScrollTrigger.addEventListener("matchMedia", refreshScrollLayout);
  addEventListener("load", refreshScrollLayout);
  refreshScrollLayout();
})();
