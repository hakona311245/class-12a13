/* Logic trang — nội dung nằm ở js/config.js và js/wishes.js */
(() => {
  "use strict";

  const S = window.SITE;
  const WISHES = Array.isArray(window.WISHES) ? window.WISHES : [];
  const $ = (sel, root = document) => root.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), S);
  const pad = (n) => String(n).padStart(2, "0");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } },
  };

  /* ---------- đổ chữ từ config vào các [data-bind] ---------- */
  document.title = S.meta.pageTitle;
  document.querySelectorAll("[data-bind]").forEach((n) => {
    const v = get(n.dataset.bind);
    if (v != null) n.textContent = v;
  });
  $("#wishCount").textContent = WISHES.length;
  $("#wishCount2").textContent = WISHES.length;

  /* ---------- điều hướng màn hình ---------- */
  const order = ["boot", "briefing", "quiz", "gallery", "mailbox", "finale"].filter(
    (id) => id !== "quiz" || (S.quiz.enabled && S.quiz.questions.length)
  );
  const stepsEl = $("#steps");
  order.forEach(() => stepsEl.appendChild(el("i")));
  const enterHooks = {};
  let current = "boot";

  function go(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("is-active"));
    $(`#screen-${id}`).classList.add("is-active");
    current = id;
    const idx = order.indexOf(id);
    [...stepsEl.children].forEach((n, i) => {
      n.className = i < idx ? "done" : i === idx ? "now" : "";
    });
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    enterHooks[id]?.();
  }
  const next = () => go(order[order.indexOf(current) + 1]);

  /* ---------- đồng hồ chân trang ---------- */
  const clock = $("#clock");
  const tick = () => {
    const d = new Date();
    clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };
  tick();
  setInterval(tick, 1000);

  /* ============================================================
     NHẠC NỀN
     ============================================================ */
  const audio = $("#bgm");
  const player = $("#player");
  const seek = $("#seek");
  const timeEl = $("#trackTime");
  audio.src = S.music.src;
  audio.loop = S.music.loop !== false;
  audio.volume = S.music.volume ?? 0.7;
  $("#trackName").textContent = `${S.music.title} — ${S.music.artist}`;

  const fmt = (t) => (isFinite(t) ? `${Math.floor(t / 60)}:${pad(Math.floor(t % 60))}` : "0:00");
  const setP = (v) => seek.style.setProperty("--p", `${v / 10}%`);
  let seeking = false;

  function playMusic() {
    return audio.play().catch(() => { /* trình duyệt chặn tự phát — người dùng bấm nút play */ });
  }
  $("#playBtn").addEventListener("click", () => (audio.paused ? playMusic() : audio.pause()));
  $("#muteBtn").addEventListener("click", () => {
    audio.muted = !audio.muted;
    player.classList.toggle("is-muted", audio.muted);
  });
  audio.addEventListener("play", () => player.classList.add("is-playing"));
  audio.addEventListener("pause", () => player.classList.remove("is-playing"));
  audio.addEventListener("timeupdate", () => {
    if (seeking || !audio.duration) return;
    const v = Math.round((audio.currentTime / audio.duration) * 1000);
    seek.value = v;
    setP(v);
    timeEl.textContent = fmt(audio.currentTime);
  });
  seek.addEventListener("input", () => {
    seeking = true;
    setP(seek.value);
    if (audio.duration) timeEl.textContent = fmt((seek.value / 1000) * audio.duration);
  });
  seek.addEventListener("change", () => {
    if (audio.duration) audio.currentTime = (seek.value / 1000) * audio.duration;
    seeking = false;
  });
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && e.target === document.body) {
      e.preventDefault();
      audio.paused ? playMusic() : audio.pause();
    }
  });

  /* ============================================================
     0. KHỞI ĐỘNG
     ============================================================ */
  (async function boot() {
    const log = $("#bootLog");
    const bar = $("#bootBar");
    const lines = S.boot.lines;
    for (let i = 0; i < lines.length; i++) {
      const li = el("li", null, lines[i]);
      log.appendChild(li);
      await sleep(reducedMotion ? 0 : 60);
      li.classList.add("on");
      bar.style.width = `${((i + 1) / lines.length) * 100}%`;
      await sleep(reducedMotion ? 0 : 520);
      li.classList.add(i === lines.length - 1 ? "warn" : "ok");
    }
    const btn = $("#bootBtn");
    btn.disabled = false;
    btn.focus({ preventScroll: true });
  })();

  $("#bootBtn").addEventListener("click", () => {
    player.hidden = false;
    playMusic();
    next();
  });

  /* ============================================================
     1. GIAO NHIỆM VỤ — hiệu ứng gõ chữ
     ============================================================ */
  let typedOnce = false;
  enterHooks.briefing = async () => {
    const p = $("#briefingBody");
    const text = S.briefing.body;
    if (typedOnce || reducedMotion) {
      p.textContent = text;
      p.classList.add("done");
      return;
    }
    typedOnce = true;
    const chars = Array.from(text);
    p.textContent = "";
    for (let i = 0; i < chars.length; i++) {
      if (current !== "briefing") break;
      p.textContent += chars[i];
      await sleep(chars[i] === "." ? 160 : 14);
    }
    p.textContent = text;
    p.classList.add("done");
  };
  $("#briefingBtn").addEventListener("click", next);

  /* ============================================================
     2. CÂU HỎI XÁC MINH
     ============================================================ */
  let qIndex = 0;
  function renderQuestion() {
    const q = S.quiz.questions[qIndex];
    const total = S.quiz.questions.length;
    $("#quizQuestion").textContent = total > 1 ? `[${qIndex + 1}/${total}] ${q.question}` : q.question;
    const box = $("#quizOptions");
    const status = $("#quizStatus");
    box.innerHTML = "";
    status.className = "quiz-status";
    status.textContent = "🔒 TRẠNG THÁI: CHỜ XÁC MINH — Hãy chọn một đáp án ở trên.";

    q.options.forEach((opt, i) => {
      const b = el("button", "option");
      b.type = "button";
      b.append(el("span", null, `${"ABCDEFGH"[i]}. ${opt}`), el("small", null, "CHỌN"));
      b.addEventListener("click", () => {
        if (i === q.answer) {
          box.querySelectorAll(".option").forEach((o) => (o.disabled = true));
          b.classList.add("is-correct");
          b.querySelector("small").textContent = "✓ ĐÚNG";
          status.className = "quiz-status ok";
          status.textContent = `✅ ${q.correct}`;
          const last = qIndex === total - 1;
          const cont = el("button", "btn btn-primary", last ? S.quiz.continueButton : "CÂU TIẾP THEO");
          cont.type = "button";
          cont.append(el("b", null, " >>"));
          cont.addEventListener("click", () => {
            if (last) next();
            else { qIndex++; renderQuestion(); }
          });
          status.appendChild(cont);
          cont.focus({ preventScroll: true });
        } else {
          b.classList.remove("is-wrong");
          void b.offsetWidth; // chạy lại animation rung
          b.classList.add("is-wrong");
          b.disabled = true;
          b.querySelector("small").textContent = "✗ SAI";
          status.className = "quiz-status bad";
          status.textContent = `⛔ ${q.wrong}`;
        }
      });
      box.appendChild(b);
    });
  }
  if (order.includes("quiz")) renderQuestion();

  /* ============================================================
     3. KHO ẢNH
     ============================================================ */
  const photos = S.gallery.photos;
  const img = $("#viewerImg");
  const thumbs = $("#thumbs");
  const seen = new Set();
  let pIndex = 0;

  photos.forEach((p, i) => {
    const t = el("button", "thumb");
    t.type = "button";
    t.setAttribute("aria-label", `Xem ảnh ${i + 1}`);
    const ti = el("img");
    ti.src = p.src;
    ti.alt = "";
    ti.loading = "lazy";
    ti.decoding = "async";
    t.appendChild(ti);
    t.addEventListener("click", () => showPhoto(i));
    thumbs.appendChild(t);
  });

  function showPhoto(i, instant) {
    pIndex = (i + photos.length) % photos.length;
    const p = photos[pIndex];
    const label = `HỒ SƠ KỶ NIỆM [${pad(pIndex + 1)}/${pad(photos.length)}] // 12A13`;
    $("#viewerLabel").textContent = label;
    $("#viewerCaption").textContent = p.caption || "";
    $("#viewerFreq").textContent = `FM ${(19.11 + pIndex * 0.37).toFixed(2)} MHz // TAPE ${pad(pIndex + 1)}`;
    img.alt = p.caption || `Ảnh kỷ niệm lớp số ${pIndex + 1}`;

    const apply = () => { img.src = p.src; img.classList.remove("swap"); };
    if (instant || reducedMotion) apply();
    else {
      const st = $("#viewerStatic");
      st.classList.remove("on");
      void st.offsetWidth;
      st.classList.add("on");
      img.classList.add("swap");
      setTimeout(apply, 180);
    }

    [...thumbs.children].forEach((t, k) => t.classList.toggle("is-current", k === pIndex));
    thumbs.children[pIndex].scrollIntoView({ block: "nearest", inline: "center", behavior: reducedMotion ? "auto" : "smooth" });
    seen.add(pIndex);
    thumbs.children[pIndex].classList.add("seen");
    const pct = (seen.size / photos.length) * 100;
    $("#scanProgressBar").style.width = `${pct}%`;
    $("#scanProgressText").textContent =
      seen.size === photos.length
        ? `ĐÃ DÒ TOÀN BỘ ${photos.length} TẦN SỐ — HỘP THƯ ĐÃ SẴN SÀNG`
        : `ĐÃ DÒ ${seen.size}/${photos.length} TẦN SỐ`;
    $("#mailNotice").classList.toggle("ready", seen.size === photos.length);

    // tải trước ảnh kế tiếp
    const n = photos[(pIndex + 1) % photos.length];
    if (n) new Image().src = n.src;
  }

  $("#prevBtn").addEventListener("click", () => showPhoto(pIndex - 1));
  $("#nextBtn").addEventListener("click", () => showPhoto(pIndex + 1));
  $("#mailBtn").addEventListener("click", next);
  document.addEventListener("keydown", (e) => {
    if (current !== "gallery") return;
    if (e.key === "ArrowRight") showPhoto(pIndex + 1);
    if (e.key === "ArrowLeft") showPhoto(pIndex - 1);
  });
  // vuốt trên điện thoại
  let touchX = null;
  const frame = $(".viewer-frame");
  frame.addEventListener("touchstart", (e) => (touchX = e.touches[0].clientX), { passive: true });
  frame.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) showPhoto(pIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });
  if (photos.length) showPhoto(0, true);

  /* ============================================================
     4. HỘP THƯ
     ============================================================ */
  const wishBox = $("#wishes");
  const hex = (s) => {
    let h = 0;
    for (const c of s) h = (h * 31 + c.codePointAt(0)) >>> 0;
    return h.toString(16).toUpperCase().padStart(8, "0");
  };
  WISHES.forEach((w, i) => {
    const card = el("article", "wish");
    const head = el("div", "wish-head");
    head.append(el("span", "wish-from", w.from), el("span", "wish-no", `#${pad(i + 1)}`));
    card.append(head, el("p", null, w.message), el("div", "wish-code", `ENC-${hex(w.from + i)} // ĐÃ GIẢI MÃ`));
    wishBox.appendChild(card);
  });
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px" })
    : null;
  enterHooks.mailbox = () => {
    [...wishBox.children].forEach((c, i) => {
      c.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
      if (io && !reducedMotion) io.observe(c);
      else c.classList.add("in");
    });
  };
  $("#finishBtn").addEventListener("click", next);

  /* ============================================================
     5. KẾT THÚC
     ============================================================ */
  const statsEl = $("#stats");
  const statVals = S.finale.stats.map((s) => {
    if (s.value === "auto:wishes") return WISHES.length;
    if (s.value === "auto:photos") return photos.length;
    return s.value;
  });
  S.finale.stats.forEach((s, i) => {
    const box = el("div", "stat");
    box.append(el("b", null, "0"), el("span", null, s.label));
    box.dataset.target = statVals[i];
    statsEl.appendChild(box);
  });

  // đánh giá sao
  const starsEl = $("#stars");
  const reply = $("#ratingReply");
  const starSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.8 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z"/></svg>';
  const paintStars = (n) => [...starsEl.children].forEach((s, i) => s.classList.toggle("on", i < n));
  let rating = Number(store.get("gti-rating")) || 0;
  for (let i = 1; i <= 5; i++) {
    const b = el("button", "star");
    b.type = "button";
    b.innerHTML = starSvg;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", `${i} sao`);
    b.addEventListener("mouseenter", () => paintStars(i));
    b.addEventListener("focus", () => paintStars(i));
    b.addEventListener("click", () => {
      rating = i;
      store.set("gti-rating", String(i));
      paintStars(i);
      [...starsEl.children].forEach((s, k) => s.setAttribute("aria-checked", String(k === i - 1)));
      reply.textContent = S.finale.ratingReplies[i - 1] || "";
      if (i === 5) burst(120);
    });
    starsEl.appendChild(b);
  }
  starsEl.addEventListener("mouseleave", () => paintStars(rating));
  paintStars(rating);
  if (rating) reply.textContent = S.finale.ratingReplies[rating - 1] || "";

  enterHooks.finale = () => {
    statsEl.querySelectorAll(".stat").forEach((box) => {
      const target = box.dataset.target;
      const b = box.querySelector("b");
      const num = Number(target);
      if (!isFinite(num) || reducedMotion) { b.textContent = target; return; }
      const t0 = performance.now();
      const dur = 1100;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        b.textContent = Math.round(num * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    burst(160);
  };

  $("#replayBtn").addEventListener("click", () => {
    seen.clear();
    [...thumbs.children].forEach((t) => t.classList.remove("seen"));
    qIndex = 0;
    if (order.includes("quiz")) renderQuestion();
    showPhoto(0, true);
    [...wishBox.children].forEach((c) => c.classList.remove("in"));
    go("briefing");
  });

  /* ---------- pháo sáng (canvas) ---------- */
  const canvas = $("#tracers");
  const ctx = canvas.getContext("2d");
  let parts = [];
  let raf = 0;
  function burst(n) {
    if (reducedMotion) return;
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const colors = ["#19f5a0", "#ffb020", "#e4ebe8"];
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? r.width * 0.15 : r.width * 0.85;
      const a = (-Math.PI / 2) + (Math.random() - 0.5) * 1.3;
      const sp = 6 + Math.random() * 9;
      parts.push({
        x: side, y: r.height, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0, max: 70 + Math.random() * 50,
        c: colors[i % colors.length], w: 1 + Math.random() * 2,
      });
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function loop() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    parts = parts.filter((p) => p.life < p.max);
    for (const p of parts) {
      const ox = p.x, oy = p.y;
      p.vy += 0.16; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.life++;
      ctx.globalAlpha = 1 - p.life / p.max;
      ctx.strokeStyle = p.c;
      ctx.lineWidth = p.w;
      ctx.beginPath();
      ctx.moveTo(ox - p.vx * 2, oy - p.vy * 2);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(loop) : 0;
  }
})();
