/* Hiệu ứng trang trí — bật/tắt trong js/config.js (mục effects).
   File này chỉ nghe sự kiện "gti:*" từ app.js, không đụng vào luồng trang. */
(() => {
  "use strict";

  const S = window.SITE || {};
  const FX = Object.assign(
    { crosshair: true, hitmarker: true, scramble: true, killfeed: true, particles: true, sweep: true, spotlight: true, feed: {} },
    S.effects
  );
  const FEED = FX.feed || {};
  const WISHES = Array.isArray(window.WISHES) ? window.WISHES : [];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const on = (name, fn) => document.addEventListener(`gti:${name}`, (e) => fn(e.detail || {}));
  const make = (tag, cls, parent = document.body) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    parent.appendChild(n);
    return n;
  };
  const fill = (tpl, vars) => String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ""));
  const pad = (n) => String(n).padStart(2, "0");

  /* ============================================================
     TÂM NGẮM thay con trỏ chuột
     ============================================================ */
  if (FX.crosshair && finePointer) {
    document.documentElement.classList.add("has-crosshair");
    const c = make("div", "crosshair");
    c.setAttribute("aria-hidden", "true");
    c.innerHTML = "<i></i><i></i><i></i><i></i><b></b>";
    let x = -100, y = -100, cx = x, cy = y, raf = 0;
    const HOVER = "button, a, input, .thumb, .option, .star, [role='radio']";
    const loop = () => {
      cx += (x - cx) * 0.35;
      cy += (y - cy) * 0.35;
      c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.1 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      c.classList.add("on");
      c.classList.toggle("is-hover", !!e.target.closest?.(HOVER));
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("pointerleave", () => c.classList.remove("on"));
    addEventListener("pointerdown", () => c.classList.add("is-down"));
    addEventListener("pointerup", () => c.classList.remove("is-down"));
  }

  /* ============================================================
     HITMARKER khi bấm / chạm
     ============================================================ */
  if (FX.hitmarker && !reduced) {
    addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      const h = make("div", "hitmarker");
      h.setAttribute("aria-hidden", "true");
      h.innerHTML = "<i></i><i></i><i></i><i></i>";
      h.style.left = `${e.clientX}px`;
      h.style.top = `${e.clientY}px`;
      if (e.target.closest?.(".option")) h.classList.add("big");
      h.addEventListener("animationend", () => h.remove());
    }, { passive: true });
  }

  /* ============================================================
     CHỮ GIẢI MÃ cho tiêu đề / nhãn khi vào màn mới
     ============================================================ */
  // chỉ dùng ký tự hẹp để chữ đang nhảy không làm tiêu đề xuống dòng
  const GLYPHS = "ABCDEFHJKLNPRSTUXYZ0123456789#/<>";
  const originals = new WeakMap();
  const running = new WeakMap();
  function scramble(root, dur = 650) {
    // giữ nguyên chiều cao trong lúc nhảy chữ để khung không bị giật
    if (!root.dataset.fxLock) {
      root.dataset.fxLock = "1";
      root.style.height = `${root.offsetHeight}px`;
      root.style.overflow = "hidden";
      setTimeout(() => {
        root.style.height = root.style.overflow = "";
        delete root.dataset.fxLock;
      }, dur + 80);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    nodes.forEach((n) => {
      let orig = originals.get(n);
      if (orig == null) { orig = n.nodeValue; originals.set(n, orig); }
      const chars = Array.from(orig);
      const token = {};
      running.set(n, token);
      const t0 = performance.now();
      let last = 0;
      const step = (t) => {
        if (running.get(n) !== token) return;
        const k = Math.min(1, (t - t0) / dur);
        if (t - last > 40 || k === 1) {
          last = t;
          const reveal = Math.floor(k * chars.length);
          let s = "";
          for (let i = 0; i < chars.length; i++) {
            const ch = chars[i];
            s += i < reveal || !ch.trim() ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          n.nodeValue = s;
        }
        if (k < 1) requestAnimationFrame(step);
        else { n.nodeValue = orig; originals.delete(n); running.delete(n); }
      };
      requestAnimationFrame(step);
    });
  }
  if (FX.scramble && !reduced) {
    on("screen", ({ el }) => {
      if (!el) return;
      el.querySelectorAll(".tag, .title").forEach((n, i) => setTimeout(() => scramble(n, i ? 800 : 500), 120 + i * 90));
    });
  }

  /* ============================================================
     CHỚP MÀN HÌNH + RUNG khi trả lời
     ============================================================ */
  const flash = make("div", "fx-flash");
  flash.setAttribute("aria-hidden", "true");
  function doFlash(kind) {
    flash.className = "fx-flash";
    void flash.offsetWidth;
    flash.classList.add(kind);
  }
  on("quiz", ({ ok, panel }) => {
    if (reduced) return;
    doFlash(ok ? "heal" : "hurt");
    if (!ok && panel) {
      panel.classList.remove("shake");
      void panel.offsetWidth;
      panel.classList.add("shake");
    }
  });

  /* ============================================================
     BẢNG THÔNG BÁO góc phải (kiểu kill feed)
     ============================================================ */
  let feedBox = null;
  function feed(parts, kind = "") {
    if (!FX.killfeed) return;
    if (!feedBox) {
      feedBox = make("div", "killfeed");
      feedBox.setAttribute("aria-hidden", "true");
    }
    // luôn nằm ngay dưới thanh trên cùng (thanh này cao hơn trên điện thoại)
    const bar = document.querySelector(".topbar");
    if (bar) feedBox.style.top = `${Math.max(0, bar.getBoundingClientRect().bottom) + 10}px`;
    const row = make("div", `kf ${kind}`, feedBox);
    parts.forEach((p) => {
      const s = make("span", p.cls || "", row);
      s.textContent = p.text;
    });
    const max = innerWidth < 720 ? 2 : 4;
    while (feedBox.children.length > max) feedBox.firstElementChild.remove();
    setTimeout(() => {
      row.classList.add("out");
      setTimeout(() => row.remove(), 400);
    }, 4200);
  }

  let wishTimer = 0;
  on("screen", ({ id }) => {
    clearInterval(wishTimer);
    feedBox?.querySelectorAll(".kf.wish").forEach((r) => r.remove());
    if (id === "briefing" && FEED.connected) feed([{ text: "◉", cls: "kf-ico" }, { text: FEED.connected }]);
    if (id === "finale" && FEED.finale) feed([{ text: "★", cls: "kf-ico amber" }, { text: FEED.finale }], "gold");
    if (id === "mailbox" && WISHES.length) {
      let i = 0;
      const pushWish = () => {
        const w = WISHES[i % WISHES.length];
        feed([
          { text: fill(FEED.wish || "{from}", { from: w.from }), cls: "kf-name" },
          { text: "♥", cls: "kf-ico" },
          { text: FEED.wishTarget || "", cls: "kf-target" },
          { text: `#${pad((i % WISHES.length) + 1)}`, cls: "kf-no" },
        ], "wish");
        i++;
      };
      pushWish();
      wishTimer = setInterval(pushWish, 1700);
    }
  });
  on("quiz", ({ ok }) => {
    const t = ok ? FEED.quizOk : FEED.quizBad;
    if (t) feed([{ text: ok ? "✔" : "✖", cls: `kf-ico ${ok ? "" : "red"}` }, { text: t }], ok ? "" : "bad");
  });
  on("photo", ({ index, isNew, seen, total }) => {
    if (!isNew) return;
    if (seen === total && FEED.photosDone) feed([{ text: "★", cls: "kf-ico amber" }, { text: FEED.photosDone }], "gold");
    else if (FEED.photo) feed([{ text: "◎", cls: "kf-ico" }, { text: fill(FEED.photo, { n: pad(index + 1), total: pad(total) }) }]);
  });

  /* ============================================================
     KHUNG SÁNG THEO CHUỘT
     ============================================================ */
  if (FX.spotlight && finePointer) {
    let pending = null;
    addEventListener("pointermove", (e) => {
      pending = e;
      requestAnimationFrame(() => {
        if (!pending) return;
        const t = pending.target.closest?.(".panel, .wish");
        if (t) {
          const r = t.getBoundingClientRect();
          t.style.setProperty("--mx", `${pending.clientX - r.left}px`);
          t.style.setProperty("--my", `${pending.clientY - r.top}px`);
        }
        pending = null;
      });
    }, { passive: true });
  }

  /* ============================================================
     THANH QUÉT RADAR
     ============================================================ */
  if (FX.sweep && !reduced) make("div", "fx-sweep").setAttribute("aria-hidden", "true");

  /* ============================================================
     BỤI SÁNG trên nền
     ============================================================ */
  if (FX.particles && !reduced) {
    const cv = make("canvas", "fx-dust");
    cv.setAttribute("aria-hidden", "true");
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dots = [];
    const resize = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(60, (W * H) / 26000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: 0.5 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.15, vy: -0.08 - Math.random() * 0.25,
        a: Math.random() * Math.PI * 2,
        amber: Math.random() < 0.18,
      }));
    };
    resize();
    addEventListener("resize", resize);
    const draw = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, W, H);
        for (const d of dots) {
          d.x += d.vx; d.y += d.vy; d.a += 0.02;
          if (d.y < -5) { d.y = H + 5; d.x = Math.random() * W; }
          if (d.x < -5) d.x = W + 5; else if (d.x > W + 5) d.x = -5;
          ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(d.a));
          ctx.fillStyle = d.amber ? "#ffb020" : "#19f5a0";
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }
})();
