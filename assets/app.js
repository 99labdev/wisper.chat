// OpenWispr site interactions: refresh flash, theme, i18n, reveals,
// and OS-aware download wiring (installers hosted on the site).
(function () {
  "use strict";

  var reduceMotion =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var I18N = window.OPENWISPR_I18N || { en: {} };
  var LANGS = window.OPENWISPR_LANGS || [
    { code: "en", native: "English", lang: "en" },
  ];
  var BASE = I18N.en || {};

  /* ---------- refresh flash ---------- */
  function flash() {
    if (reduceMotion) return;
    var el = document.getElementById("flash");
    if (!el) return;
    document.body.classList.remove("flashing");
    void el.offsetWidth; // restart animation
    document.body.classList.add("flashing");
    window.setTimeout(function () {
      document.body.classList.remove("flashing");
    }, 700);
  }
  window.requestAnimationFrame(flash);

  /* ---------- theme ---------- */
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("ow-theme", theme);
    } catch (e) {}
    var t = document.querySelector(".theme-toggle");
    if (t)
      t.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
      );
  }
  document.querySelectorAll(".theme-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next =
        document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      flash();
    });
  });

  /* ---------- i18n ---------- */
  function langMeta(code) {
    return (
      LANGS.find(function (l) {
        return l.code === code;
      }) || LANGS[0]
    );
  }
  function hasLang(code) {
    return LANGS.some(function (l) {
      return l.code === code;
    });
  }
  function detectLang() {
    try {
      var saved = localStorage.getItem("ow-lang");
      if (saved && hasLang(saved)) return saved;
    } catch (e) {}
    var nav = (navigator.language || "en").toLowerCase();
    var prefix = nav.split("-")[0];
    var hit = LANGS.find(function (l) {
      var lang = l.lang.toLowerCase();
      return lang === nav || lang.split("-")[0] === prefix || l.code === prefix;
    });
    return hit ? hit.code : "en";
  }
  function t(dict, key) {
    return dict[key] != null ? dict[key] : BASE[key];
  }
  function applyLang(code) {
    var dict = I18N[code] || BASE;
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t(dict, el.getAttribute("data-i18n"));
      if (v != null) el.textContent = v;
    });
    var meta = langMeta(code);
    document.documentElement.lang = meta.lang;
    document.documentElement.dir = meta.rtl ? "rtl" : "ltr";
    return dict;
  }

  var currentLang = detectLang();
  document.querySelectorAll(".lang-select").forEach(function (sel) {
    LANGS.forEach(function (l) {
      var opt = document.createElement("option");
      opt.value = l.code;
      opt.textContent = l.native;
      sel.appendChild(opt);
    });
    sel.value = currentLang;
    sel.addEventListener("change", function () {
      var code = sel.value;
      try {
        localStorage.setItem("ow-lang", code);
      } catch (e) {}
      document.querySelectorAll(".lang-select").forEach(function (s) {
        s.value = code;
      });
      activeDict = applyLang(code);
      refreshDownloadLabels();
      if (window.__applyBilling) window.__applyBilling();
      if (window.__retypeHero) window.__retypeHero();
      if (window.__restartDemo) window.__restartDemo();
      flash();
    });
  });
  var activeDict = applyLang(currentLang);

  /* ---------- OS + arch detection ---------- */
  function detectOS() {
    var uaData = navigator.userAgentData;
    var platform = (uaData && uaData.platform) || navigator.platform || "";
    var s = (platform + " " + navigator.userAgent).toLowerCase();
    if (/mac|iphone|ipad|ipod/.test(s)) return "mac";
    if (/win/.test(s)) return "windows";
    if (/linux|x11|ubuntu|fedora|debian/.test(s)) return "linux";
    return "unknown";
  }
  // Best-effort Apple Silicon vs Intel via the WebGL GPU string.
  function detectMacArch() {
    try {
      var canvas = document.createElement("canvas");
      var gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) return "unknown";
      var ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (!ext) return "unknown";
      var r = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "").toLowerCase();
      if (r.indexOf("apple") !== -1) return "apple";
      if (r.indexOf("intel") !== -1 || r.indexOf("amd") !== -1 || r.indexOf("radeon") !== -1)
        return "intel";
      return "unknown";
    } catch (e) {
      return "unknown";
    }
  }

  var OS = detectOS();
  var MAC_ARCH = OS === "mac" ? detectMacArch() : "unknown";

  /* ---------- download model ----------
     Installers are hosted on the site (the app repo is private); OS detection
     picks the right one and the rest are listed under "all platforms". */
  function assetSet() {
    // Installers are hosted on the site (the app repo is private). Stable
    // "latest" filenames — drop the current builds at wisper.chat/downloads/.
    var base = "https://wisper.chat/downloads/";
    return {
      macApple: base + "Wisper_aarch64.dmg",
      macIntel: base + "Wisper_x64.dmg",
      windows: base + "Wisper_x64-setup.exe",
      linuxAppImage: base + "Wisper_amd64.AppImage",
      linuxDeb: base + "Wisper_amd64.deb",
      linuxRpm: base + "Wisper.x86_64.rpm",
    };
  }
  var assets = assetSet();

  function primary() {
    if (OS === "mac")
      return MAC_ARCH === "intel"
        ? { key: "dl_mac_intel", fallback: "Download for macOS (Intel)", url: assets.macIntel }
        : { key: "dl_mac_apple", fallback: "Download for macOS (Apple Silicon)", url: assets.macApple };
    if (OS === "windows")
      return { key: "dl_win", fallback: "Download for Windows", url: assets.windows };
    if (OS === "linux")
      return { key: "dl_linux", fallback: "Download for Linux", url: assets.linuxAppImage };
    return {
      key: "dl_generic",
      fallback: "Download Wisper",
      url: "https://wisper.chat/downloads/",
    };
  }
  function allList() {
    return [
      { label: "macOS · Apple Silicon (.dmg)", url: assets.macApple },
      { label: "macOS · Intel (.dmg)", url: assets.macIntel },
      { label: "Windows (.exe)", url: assets.windows },
      { label: "Linux (.AppImage)", url: assets.linuxAppImage },
      { label: "Linux (.deb)", url: assets.linuxDeb },
      { label: "Linux (.rpm)", url: assets.linuxRpm },
    ];
  }

  function refreshDownloadLabels() {
    var p = primary();
    var label = t(activeDict, p.key) || p.fallback;
    ["hero-dl", "cta-dl"].forEach(function (id) {
      var a = document.getElementById(id);
      if (!a) return;
      a.href = p.url;
      var span = a.querySelector("span");
      if (span) span.textContent = label;
    });
    var ul = document.getElementById("all-dl-list");
    if (ul) {
      ul.textContent = "";
      allList().forEach(function (d) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = d.url;
        a.textContent = d.label;
        a.rel = "noopener";
        li.appendChild(a);
        ul.appendChild(li);
      });
    }
  }
  refreshDownloadLabels();

  /* ---------- pricing: monthly / annual billing toggle ---------- */
  (function billing() {
    var card = document.querySelector(".price-card.featured");
    if (!card) return;
    var amt = card.querySelector(".pc-amt");
    var per = card.querySelector(".pc-per");
    var alt = card.querySelector(".pc-alt");
    var btns = Array.prototype.slice.call(
      document.querySelectorAll(".bill-toggle .bt-opt"),
    );
    var mode = "mo";
    function apply() {
      if (mode === "yr") {
        amt.textContent = "$72";
        per.textContent = t(activeDict, "plan_pro_period_yr") || "/yr";
        alt.textContent = t(activeDict, "plan_pro_save") || "save 25%";
      } else {
        amt.textContent = "$8";
        per.textContent = t(activeDict, "plan_pro_period") || "/mo";
        alt.textContent = "";
      }
      btns.forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-bill") === mode);
      });
    }
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        mode = b.getAttribute("data-bill");
        apply();
      });
    });
    window.__applyBilling = apply;
    apply();
  })();

  /* ---------- hero title: type the emphasized phrase like live dictation ----------
     The <em> (hero_title_b) types itself out character by character, with a
     blinking caret that fades once finished. Re-runs on language change so the
     translated phrase types too. Reduced motion shows the full phrase at once. */
  (function heroType() {
    var em = document.getElementById("hero-em");
    if (!em) return;
    var caret = document.querySelector("#hero-title .type-caret");
    var typeTimer = null;
    var doneTimer = null;
    function run() {
      var text = t(activeDict, "hero_title_b") || em.textContent || "";
      if (typeTimer) clearTimeout(typeTimer);
      if (doneTimer) clearTimeout(doneTimer);
      if (reduceMotion) {
        em.textContent = text;
        if (caret) caret.style.display = "none";
        return;
      }
      em.textContent = "";
      if (caret) caret.style.display = "";
      var n = 0;
      (function step() {
        em.textContent = text.slice(0, n);
        if (n < text.length) {
          n++;
          typeTimer = setTimeout(step, 120);
        } else if (caret) {
          doneTimer = setTimeout(function () {
            caret.style.display = "none";
          }, 1600);
        }
      })();
    }
    window.__retypeHero = run;
    run();
  })();

  /* ---------- hero demo: cycle apps + type the dictated text ---------- */
  (function demo() {
    var input = document.getElementById("demo-input");
    var tabs = Array.prototype.slice.call(
      document.querySelectorAll(".tabs .tab"),
    );
    if (!input || !tabs.length) return;
    var timer = null;
    var ai = 1; // first pass lands on ChatGPT (the tab marked active in markup)
    function setActive(i) {
      tabs.forEach(function (tab, k) {
        tab.classList.toggle("active", k === i);
      });
    }
    function loop() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      var text = t(activeDict, "demo_text") || "";
      if (reduceMotion) {
        input.textContent = text;
        return;
      }
      setActive(ai % tabs.length);
      input.textContent = "";
      var n = 0;
      (function type() {
        if (n <= text.length) {
          input.textContent = text.slice(0, n);
          n++;
          timer = setTimeout(type, 45);
        } else {
          timer = setTimeout(function () {
            ai = (ai + 1) % tabs.length;
            loop();
          }, 2000);
        }
      })();
    }
    window.__restartDemo = loop;
    loop();
  })();

  /* ---------- scroll reveals (progressive enhancement) ---------- */
  var ioTargets = document.querySelectorAll("[data-io]");
  if (ioTargets.length && "IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("has-io");
    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("seen");
            obs.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    ioTargets.forEach(function (el) {
      io.observe(el);
    });
    window.setTimeout(function () {
      ioTargets.forEach(function (el) {
        el.classList.add("seen");
      });
    }, 2500);
  }
})();
