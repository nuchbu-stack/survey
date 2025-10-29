/********************
 * Base elements
 ********************/
const form = document.getElementById("surveyForm");
const qUserSection = document.getElementById("qUserSection");
const q0 = document.getElementById("q0");
const q0Section = document.getElementById("q0Section");
const q0Other = document.getElementById("q0Other");
const q1Options = document.querySelectorAll("#q1Options .option");
const q2Section = document.getElementById("q2Section");
const q2Other = document.getElementById("q2Other");
const thankYou = document.getElementById("thankYou");


/********************
 * Config
 ********************/
const GAS_URL = "https://script.google.com/macros/s/AKfycbyGhPwMCqvXhU0TMue4AfU0TOo2Nms7Iy9kFCfun-wqYFrb7ntTB5uBUPDDXGpYoIPa/exec";
const JSON_URL = "https://nuchbu-stack.github.io/q0Options.json";

// อ่านพารามิเตอร์ URL
const params = new URLSearchParams(location.search);
const DEPARTMENT  = params.get("unit") || "ASU_E";  // หน่วยงาน
const STAFF_PARAM = (params.get("staff") || "").trim(); // โหมดรายบุคคล
const LANG_PARAM  = (params.get("lang") || "").toLowerCase();

// ภาษาปัจจุบัน
let CURRENT_LANG = localStorage.getItem("lang") || "th";

// ตัวแปรเกี่ยวกับผู้ให้บริการ/ชื่อชีต (จะเซ็ตใน loadServices)
let BASE_SHEET_LABEL     = "";   // เช่น "การสร้างเจ้าของธุรกิจฯ" (รวมหน่วย)
let PROVIDER_SHEET_LABEL = "";   // เช่น "การสร้างเจ้าของธุรกิจฯ_สุภาพร" (รายบุคคล)
let PROVIDER_MODE        = "aggregate"; // "aggregate" | "url_person" | "list_person"
let PROVIDER_CODE        = "";   // เช่น "A39089"
let PROVIDER_DISPLAY     = "";   // เช่น "A39089 สุภาพร กรองกรุด"

/********************
 * i18n
 ********************/
const I18N = {
  th: {
    titleMain: "แบบประเมินความพึงพอใจ",
    titleSub: "มหาวิทยาลัยกรุงเทพ",

    qUser_label: "ผู้รับบริการคือ",
    qUser_student: "นักศึกษา",
    qUser_staff: "บุคลากรของมหาวิทยาลัย",
    qUser_parent: "ผู้ปกครอง / ศิษย์เก่า",
    qUser_external: "หน่วยงานภายนอก",
    qUser_error: "กรุณาเลือกผู้รับบริการ",

    q0_label: "เรื่องที่รับบริการ",
    q0_placeholder: "-- กรุณาเลือก --",
    q0_error: "กรุณาเลือกเรื่องที่รับบริการ",
    q0_other_placeholder: "โปรดระบุเรื่องที่รับบริการ",   // <-- เพิ่มบรรทัดนี้

    q1_label: "ระดับความพึงพอใจของท่าน",
    q1_5: "มากที่สุด",
    q1_4: "มาก",
    q1_3: "ปานกลาง",
    q1_2: "น้อย",
    q1_1: "น้อยที่สุด",
    q1_error: "กรุณาเลือกระดับความพึงพอใจ",

    q2_label: "ท่านไม่พึงพอใจในเรื่องใด",
    q2_opt_staff: "มรรยาทและความเต็มใจในการให้บริการ",
    q2_opt_delay: "ระยะเวลาที่ใช้ในการให้บริการ",
    q2_opt_accuracy: "ความสามารถในการให้ข้อมูลอย่างถูกต้อง",
    q2_opt_facility: "ความพร้อมของอุปกรณ์และสถานที่ (Facility)",
    q2_opt_other: "อื่นๆ",
    q2_other_placeholder: "โปรดระบุ",
    q2_error: "กรุณาเลือกหรือระบุเรื่องที่ไม่พึงพอใจ",

    q3_label: "ข้อเสนอแนะ/ข้อร้องเรียน",
    q3_placeholder: "พิมพ์ข้อความเพิ่มเติม",

    submit: "ส่งแบบประเมิน",
    thank_title: "รับข้อมูลเรียบร้อยแล้ว ขอบคุณค่ะ 🙏",
    thank_desc: "คุณสามารถเลือกทำแบบสอบถามใหม่หรือปิดหน้านี้ได้",
    thank_autoreturn: "กลับไปหน้าฟอร์มอัตโนมัติใน",
    thank_again: "ทำแบบสอบถามอีกครั้ง",
  },
  en: {
    titleMain: "Satisfaction Evaluation Form",
    titleSub: "Bangkok University",

    qUser_label: "Service Recipient: You are...",
    qUser_student: "Student",
    qUser_staff: "BU Personnel",
    qUser_parent: "Parent / Alumnus",
    qUser_external: "External Organization",
    qUser_error: "Please select the service recipient.",

    q0_label: "Service Category",
    q0_placeholder: "-- Please select --",
    q0_error: "Please select the service topic.",
    q0_other_placeholder: "Please specify the service received.", // <-- เพิ่มบรรทัดนี้

    q1_label: "Your satisfaction/dissatisfaction level.",
    q1_5: "Most satisfied",
    q1_4: "Very satisfied",
    q1_3: "Neutral",
    q1_2: "Somewhat dissatisfied",
    q1_1: "Very dissatisfied",
    q1_error: "Please select your satisfaction level.",

    q2_label: "Which aspect were you dissatisfied with?",
    q2_opt_staff: "Manner and willingness of the staff",
    q2_opt_delay: "Time taken to provide the service",
    q2_opt_accuracy: "Correctness of information provided",
    q2_opt_facility: "Adequacy and readiness of equipment and venue (Facility)",
    q2_opt_other: "Other(s)",
    q2_other_placeholder: "Please specify",
    q2_error: "Please select or specify what made you dissatisfied",

    q3_label: "Suggestions / Complaints",
    q3_placeholder: "Type your message here",

    submit: "Submit",
    thank_title: "Your response has been successfully recorded.\nThank you 🙏",
    thank_desc: "You may choose to complete another survey or close this page.",
    thank_autoreturn: "Returning to the form automatically in",
    thank_again: "Submit another response",
  }
};


function isOther(val) {
  if (!val) return false;
  const s = val.toString().trim().toLowerCase();
  // ไทย: อื่น, อื่นๆ, อื่น ๆ, อื่นๆ (โปรดระบุ) ฯลฯ
  if (/^อื่น(\s*ๆ)?/.test(s)) return true;
  // EN: other, others, other., others., other (please specify) ฯลฯ
  if (s.startsWith('other')) return true; // ครอบคลุม others/other./other (...)
  return false;
}

// เพิ่ม helper สำหรับ label 2 ภาษา และตั้งชื่อหน่วยบนหน้า
function pickLabel(obj, lang = "th") {
  if (!obj) return "";
  if (lang === "en") return (obj.en || obj.th || "").trim();
  return (obj.th || obj.en || "").trim();
}

// ตั้งชื่อหน่วยที่ "แสดงบนเว็บ" (บรรทัดรอง/ใต้ titleMain)
function setWebUnitTitle(text) {
  const el = document.getElementById("title-sub");
  if (el) el.textContent = text || "";
}


/********************
 * Auto return timers
 ********************/
let autoBackTimer = null;
let countdownTimer = null;
const autoReturnNote = document.getElementById("autoReturnNote");

// ใช้เป็น state กลางของเลขวินาที
let countdownSeconds = 10;

// อย่า cache element; หาใหม่ทุกครั้ง เพราะเราเขียนทับ innerHTML ตอนสลับภาษา
function getCountdownEl() {
  return document.getElementById("countdown");
}


function bumpCountdown() {
  const el = getCountdownEl();
  if (!el) return;
  el.classList.remove("animate");
  void el.offsetWidth;
  el.classList.add("animate");
}

function backToForm() {
  if (autoBackTimer) { clearTimeout(autoBackTimer); autoBackTimer = null; }
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }

  thankYou.classList.add("hidden");
  form.classList.remove("hidden");

  if (autoReturnNote) autoReturnNote.style.display = "none";

  // รีเซ็ตตัวเลขกลับเป็น 10 และอัปเดตลง DOM (ถ้ามี)
  countdownSeconds = 10;
  const cEl = getCountdownEl();
  if (cEl) {
    cEl.textContent = countdownSeconds;
    cEl.classList.remove("animate");
  }

  // …(โค้ดล้าง error/รีเซ็ต UI อื่น ๆ คงเดิม)…
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/********************
 * Helpers: error texts (เปลี่ยนสดตอนสลับภาษา)
 ********************/
function setErrorText(elId, i18nKey) {
  const el = document.getElementById(elId);
  if (!el) return;
  const t = I18N[CURRENT_LANG]?.[i18nKey];
  if (t) el.textContent = t;
}
function updateErrorTexts() {
  setErrorText("qUserError","qUser_error");
  setErrorText("q0Error","q0_error");
  setErrorText("q1Error","q1_error");
  setErrorText("q2Error","q2_error");
}

/********************
 * Load Services (Q0)
 * เก็บค่า value เป็น "ไทยเสมอ" เพื่อทำสรุปในชีทง่าย
 * รองรับ options เป็น string (ไทยล้วน) หรือ object { th, en }
 ********************/

// แปลง option เป็น { value, label } โดย:
//   value = ไทย (canonical) เสมอ
//   label = แสดงตามภาษา UI ปัจจุบัน
function buildQ0OptionObj(item, lang) {
  if (typeof item === "string") {
    const v = item.trim();                 // ไทยล้วน
    return { value: v, label: v };         // ไม่มี en ก็แสดงไทยไป
  }
  const th = (item?.th || "").trim();
  const en = (item?.en || "").trim();
  const value = th || en;                  // ถ้าไม่มี th จริง ๆ ค่อย fallback เป็น en
  const label = (lang === "th") ? (th || en) : (en || th);
  return { value, label };
}

// รองรับ “Templates/use/extend” สำหรับ Q0 (นอกเหนือจาก conf.options เดิม)
function resolveOptions(data, conf) {
  if (Array.isArray(conf)) return conf; // รองรับโครงเก่า (options เป็น array ตรงๆ)

  const templates = data?.Templates || {};
  let base = [];

  if (conf?.use && templates[conf.use]) {
    base = templates[conf.use];
  }

  if (conf?.extend?.use && templates[conf.extend.use]) {
    base = templates[conf.extend.use];

    if (Array.isArray(conf.extend.remove) && conf.extend.remove.length) {
      const rm = new Set(conf.extend.remove.map(s => String(s).trim()));
      base = base.filter(item => {
        const v = (typeof item === "string") ? item.trim()
                 : (item?.th || item?.en || "").trim();
        return !rm.has(v);
      });
    }

    if (Array.isArray(conf.extend.add)) {
      base = base.concat(conf.extend.add);
    }
  }

  if (Array.isArray(conf?.options)) base = conf.options;

  return Array.isArray(base) ? base : [];
}

// เพิ่มระบบ “ผู้ให้บริการ 3 โหมด” (aggregate / URL รายบุคคล / ลิสต์ให้เลือก)
function renderProvider(data, cfg) {
  // <p> ใต้หัวฟอร์มไว้แสดงชื่อผู้ให้บริการ
  const header = document.querySelector(".form-header");
  let headerP = header?.querySelector("p.provider-display");
  if (!headerP && header) {
    headerP = document.createElement("p");
    headerP.className = "provider-display";
    header.appendChild(headerP);
  }
  const setHeader = (text) => { if (headerP) headerP.textContent = text || ""; };

  // container สำหรับลิสต์ (สร้างอัตโนมัติ)
  let providerWrap = document.getElementById("providerWrap");
  let providerSelect = document.getElementById("providerSelect");
  const ensureWrap = () => {
    if (!providerWrap) {
      providerWrap = document.createElement("div");
      providerWrap.id = "providerWrap";
      providerWrap.className = "question";
      const label = document.createElement("label");
      label.className = "label";
      label.id = "providerLabel";
      const sel = document.createElement("select");
      sel.id = "providerSelect";
      providerWrap.append(label, sel);
      const anchor = document.getElementById("q0Section") || document.getElementById("qUserSection") || document.querySelector("form");
      anchor?.parentNode?.insertBefore(providerWrap, anchor);
      providerSelect = sel;
    }
  };
  const hideWrap = () => providerWrap?.classList.add("hidden");
  const showWrap = () => providerWrap?.classList.remove("hidden");

  // reset state
  PROVIDER_MODE        = "aggregate";
  PROVIDER_CODE        = "";
  PROVIDER_DISPLAY     = "";
  PROVIDER_SHEET_LABEL = "";
  setHeader("");

  const pv = cfg.providers || { mode: "aggregate" };
  const mode   = (pv.mode || "aggregate").toLowerCase();
  const people = Array.isArray(pv.people) ? pv.people : [];

  // โหมด 1: รวมทั้งหน่วย
  if (mode === "aggregate") { hideWrap(); setHeader(""); return; }

  // โหมด auto: URL → ลิสต์ → รวม
  // (2) URL รายบุคคล
  if (STAFF_PARAM && people.length) {
    const found = people.find(p => p.code === STAFF_PARAM);
    if (found) {
      PROVIDER_MODE        = "url_person";
      PROVIDER_CODE        = found.code;
      PROVIDER_DISPLAY     = (found.display_th || found.code).trim();
      PROVIDER_SHEET_LABEL = (found.sheet_label || BASE_SHEET_LABEL).trim();
      hideWrap();
      setHeader(PROVIDER_DISPLAY);
      return;
    }
  }

  // (3) ลิสต์ให้เลือก (ถ้ายังไม่ล็อกจาก URL และมีรายชื่อ)
  if (people.length) {
    ensureWrap();
    const labelEl  = document.getElementById("providerLabel");
    if (labelEl) labelEl.textContent = pickLabel(pv.label, CURRENT_LANG) || "ผู้ให้บริการ";

    const allowAgg = !!pv.allow_aggregate_in_list;
    const aggText  = pickLabel(pv.aggregate_label, CURRENT_LANG) || "ประเมินรวมทั้งหน่วยงาน";

    let opts = `<option value="">— ${pickLabel(pv.label, CURRENT_LANG) || "ผู้ให้บริการ"} —</option>`;
    if (allowAgg) {
      opts += `<option value="__AGG__" data-display="${aggText}" data-sheet="${BASE_SHEET_LABEL}">${aggText}</option>`;
    }
    opts += people.map(p =>
      `<option value="${p.code}"
               data-display="${(p.display_th||p.code).replace(/"/g,'&quot;')}"
               data-sheet="${(p.sheet_label||BASE_SHEET_LABEL).replace(/"/g,'&quot;')}">${p.display_th||p.code}</option>`
    ).join("");
    providerSelect.innerHTML = opts;

    if (pv.require_on_list && !allowAgg) providerSelect.setAttribute("required","required");
    else providerSelect.removeAttribute("required");

    providerSelect.onchange = () => {
      const v = providerSelect.value;
      const opt = providerSelect.selectedOptions[0];
      if (v === "__AGG__") {
        PROVIDER_MODE        = "aggregate";
        PROVIDER_CODE        = "";
        PROVIDER_DISPLAY     = "";
        PROVIDER_SHEET_LABEL = BASE_SHEET_LABEL;
        setHeader("");
      } else if (v) {
        PROVIDER_MODE        = "list_person";
        PROVIDER_CODE        = v;
        PROVIDER_DISPLAY     = opt?.dataset?.display || v;
        PROVIDER_SHEET_LABEL = opt?.dataset?.sheet || BASE_SHEET_LABEL;
        setHeader(PROVIDER_DISPLAY);
      } else {
        PROVIDER_MODE        = "aggregate";
        PROVIDER_CODE        = "";
        PROVIDER_DISPLAY     = "";
        PROVIDER_SHEET_LABEL = "";
        setHeader("");
      }
    };

    showWrap();
    return;
  }

  // ไม่มีรายชื่อเลย → รวม
  hideWrap(); setHeader("");
}


async function loadServices() {
  try {
    q0.disabled = true;
    q0.innerHTML = `<option disabled selected>${I18N[CURRENT_LANG].q0_placeholder}</option>`;

    const res = await fetch(JSON_URL + "?v=" + Date.now());
    const data = await res.json();

    // QUser: เปิด/ปิดตาม Features.UserType
    const hasUserType = !!data?.Features?.UserType?.includes(DEPARTMENT);
    qUserSection?.classList.toggle("hidden", !hasUserType);
    if (!hasUserType) document.getElementById("qUserError")?.classList.add("hidden");

    // อ่าน config ของหน่วย
    let conf = data[DEPARTMENT];
    if (!conf) {
      // กันพลาด: ไม่มีหน่วย → ซ่อน Q0/QUser
      q0Section?.classList.add("hidden");
      qUserSection?.classList.add("hidden");
      return;
    }
    // รองรับโครงเก่า (array options ตรงๆ)
    if (Array.isArray(conf)) conf = { config: { hasServices: true }, options: conf };
    const cfg = conf.config || {};

    // ภาษา per-unit (langs + default_lang + override จาก URL)
    const langs = Array.isArray(cfg.langs) && cfg.langs.length ? cfg.langs : ["th"];
    const defaultLang = (cfg.default_lang || "th").toLowerCase();
    const storedLang  = localStorage.getItem("lang");

    function pickInitialLang() {
      if (LANG_PARAM && langs.includes(LANG_PARAM)) return LANG_PARAM;
      if (storedLang && langs.includes(storedLang)) return storedLang;
      if (defaultLang && langs.includes(defaultLang)) return defaultLang;
      if (langs.includes("th")) return "th";
      return langs[0];
    }
    CURRENT_LANG = pickInitialLang();
    localStorage.setItem("lang", CURRENT_LANG);

    // ปุ่มสลับภาษา: ซ่อนถ้าไทยล้วน
    const langSwitch = document.querySelector(".lang-switch");
    if (langs.length === 1 && langs[0] === "th") langSwitch?.classList.add("hidden");
    else langSwitch?.classList.remove("hidden");

    // ถ้ายังไม่มี switchLang ให้สร้าง (ล็อกไม่ให้เลือกภาษาที่หน่วยไม่รองรับ)
    if (typeof window.switchLang === "function") {
      const _orig = window.switchLang;
      window.switchLang = function(nextLang) {
        if (!langs.includes(nextLang)) return;
        localStorage.setItem("lang", nextLang);
        CURRENT_LANG = nextLang;
        _orig(nextLang);
        rerenderDynamicParts(data, conf);
      };
    } else {
      window.switchLang = function(nextLang) {
        if (!langs.includes(nextLang)) return;
        localStorage.setItem("lang", nextLang);
        CURRENT_LANG = nextLang;
        applyLang(CURRENT_LANG);
        rerenderDynamicParts(data, conf);
      };
    }

    // ตั้งข้อความ UI จาก I18N ของคุณ
    applyLang(CURRENT_LANG);

    // เรื่องที่ 5: ชื่อหน่วย "ที่แสดงบนเว็บ" (display_title) → ถ้าไม่ตั้ง ใช้ I18N.titleSub → สุดท้ายใช้ sheet_label/DEPARTMENT กันว่าง
    const webTitle =
      pickLabel(cfg.display_title, CURRENT_LANG)
      || I18N[CURRENT_LANG]?.titleSub
      || (cfg.sheet_label || DEPARTMENT);
    setWebUnitTitle(webTitle);

    // ตั้งชื่อชีตฐานของหน่วยสำหรับบันทึก
    BASE_SHEET_LABEL = cfg.sheet_label || DEPARTMENT;

    // Q0: แสดง/ซ่อน
    const hasServices = (cfg.hasServices !== false);
    q0Section?.classList.toggle("hidden", !hasServices);

    // ผู้ให้บริการ 3 โหมด
    renderProvider(data, cfg);

    // เติมตัวเลือก Q0 จาก Templates/use/extend/options
    if (hasServices && q0) {
      q0.innerHTML = `<option value="" disabled selected>${I18N[CURRENT_LANG].q0_placeholder}</option>`;
      const list = resolveOptions(data, conf);
      list.forEach(item => {
        const { value, label } = buildQ0OptionObj(item, CURRENT_LANG);
        if (!value || !label) return;
        const opt = document.createElement("option");
        opt.value = value;       // บันทึกเป็นไทย
        opt.textContent = label; // แสดงตามภาษา
        q0.appendChild(opt);
      });

      q0.disabled = false;
      q0Section?.classList.remove("hidden");

      // อัปเดต placeholder ช่อง "ระบุเรื่องฯ" ให้ตรงภาษา
      if (q0Other) q0Other.placeholder = I18N[CURRENT_LANG].q0_other_placeholder;
    }
  } catch (err) {
    console.error("โหลด q0Options.json ไม่ได้", err);
    q0Section?.classList.add("hidden");
    q0.disabled = true;
    q0.value = "--";
    q0Other.value = "";
    q0Other.classList.add("hidden");
  }
}

// เพิ่ม rerenderDynamicParts() เรียกใช้ตอนสลับภาษา
function rerenderDynamicParts(data, conf) {
  applyLang(CURRENT_LANG);

  // อัปเดตชื่อหน่วยบนเว็บตามภาษา
  const cfg = conf?.config || {};
  const webTitle =
    pickLabel(cfg.display_title, CURRENT_LANG)
    || I18N[CURRENT_LANG]?.titleSub
    || (cfg.sheet_label || DEPARTMENT);
  setWebUnitTitle(webTitle);

  // re-render provider
  renderProvider(data, cfg);

  // re-render Q0
  const hasServices = (cfg.hasServices !== false);
  if (q0 && hasServices) {
    q0.innerHTML = `<option value="" disabled selected>${I18N[CURRENT_LANG].q0_placeholder}</option>`;
    const list = resolveOptions(data, conf);
    list.forEach(item => {
      const { value, label } = buildQ0OptionObj(item, CURRENT_LANG);
      if (!value || !label) return;
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      q0.appendChild(opt);
    });
    if (q0Other) q0Other.placeholder = I18N[CURRENT_LANG].q0_other_placeholder;
  }
}


/********************
 * QUser
 ********************/
document.querySelectorAll('input[name="qUser"]').forEach(radio => {
  radio.addEventListener("change", () => {
    document.getElementById("qUserError")?.classList.add("hidden");
  });
});

/********************
 * Q0 other toggle
 ********************/
q0.addEventListener("change", () => {
  document.getElementById("q0Error")?.classList.add("hidden");
  const v = q0.value;
  if (isOther(q0.value)) {
    q0Other.classList.remove("hidden");
  } else {
    q0Other.classList.add("hidden");
    q0Other.value = "";
  }
});
q0Other.addEventListener("input", () => {
  if (q0Other.value.trim() !== "") {
    document.getElementById("q0Error")?.classList.add("hidden");
  }
});

/********************
 * Q1 / Q2
 ********************/
let q1Value = "";
q1Options.forEach(opt => {
  opt.addEventListener("click", () => {
    q1Options.forEach(o => o.classList.remove("active"));
    opt.classList.add("active");
    q1Value = opt.dataset.value;

    document.getElementById("q1Error")?.classList.add("hidden");

    if (q1Value === "1" || q1Value === "2") {
      q2Section.classList.remove("hidden");
      document.getElementById("q2Error")?.classList.add("hidden");
    } else {
      q2Section.classList.add("hidden");
      document.querySelectorAll('input[name="q2"]').forEach(r => r.checked = false);
      q2Other.value = "";
      q2Other.classList.add("hidden");
    }
  });
});
document.querySelectorAll('input[name="q2"]').forEach(radio => {
  radio.addEventListener("change", () => {
    document.getElementById("q2Error")?.classList.add("hidden");
    if (isOther(radio.value)) {
      q2Other.classList.remove("hidden");
    } else {
      q2Other.classList.add("hidden");
      q2Other.value = "";
    }
  });
});
q2Other.addEventListener("input", () => {
  if (q2Other.value.trim() !== "") {
    document.getElementById("q2Error")?.classList.add("hidden");
  }
});

/********************
 * Submit
 ********************/
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  let valid = true;

  // QUser
  let finalQUser = "--";
  const isQUserVisible = !!(qUserSection && qUserSection.offsetParent !== null);
  if (isQUserVisible) {
    const qUserChecked = document.querySelector("input[name='qUser']:checked");
    if (!qUserChecked) {
      setErrorText("qUserError","qUser_error");
      document.getElementById("qUserError")?.classList.remove("hidden");
      valid = false;
    } else {
      finalQUser = qUserChecked.value;
      document.getElementById("qUserError")?.classList.add("hidden");
    }
  } else {
    document.getElementById("qUserError")?.classList.add("hidden");
  }

  // Q0
  let finalQ0 = "--";
  if (!q0Section.classList.contains("hidden")) {
    finalQ0 = isOther(q0.value)
              ? q0Other.value.trim()
              : q0.value;

    if (!finalQ0) {
      setErrorText("q0Error","q0_error");
      document.getElementById("q0Error")?.classList.remove("hidden");
      valid = false;
    } else {
      document.getElementById("q0Error")?.classList.add("hidden");
    }
  } else {
    document.getElementById("q0Error")?.classList.add("hidden");
  }

  // Q1
  if (!q1Value) {
    setErrorText("q1Error","q1_error");
    document.getElementById("q1Error")?.classList.remove("hidden");
    valid = false;
  } else {
    document.getElementById("q1Error")?.classList.add("hidden");
  }

  // Q2
  let finalQ2 = "";
  if (q1Value === "1" || q1Value === "2") {
    const q2Checked = document.querySelector("input[name='q2']:checked");
    if (!q2Checked) {
      setErrorText("q2Error","q2_error");
      document.getElementById("q2Error")?.classList.remove("hidden");
      valid = false;
    } else {
      finalQ2 = isOther(q2Checked.value)
        ? q2Other.value.trim()
        : q2Checked.value;

      if (isOther(q2Checked.value) && !finalQ2) {
        setErrorText("q2Error","q2_error");
        document.getElementById("q2Error")?.classList.remove("hidden");
        valid = false;
      } else {
        document.getElementById("q2Error")?.classList.add("hidden");
      }
    }
  }

  if (!valid) return;

  // department ที่จะบันทึกลงชีต (รวมหน่วย vs รายบุคคล)
  const deptToSave =
    (PROVIDER_SHEET_LABEL && PROVIDER_MODE !== "aggregate")
      ? PROVIDER_SHEET_LABEL
      : (BASE_SHEET_LABEL || DEPARTMENT);

  const payload = new URLSearchParams({
    department:      deptToSave,       // ← ชื่อชีต (เช่น "การสร้างเจ้าของธุรกิจฯ" หรือ "การสร้างเจ้าของธุรกิจฯ_สุภาพร")
    providerMode:    PROVIDER_MODE,    // "aggregate" | "url_person" | "list_person"
    providerCode:    PROVIDER_CODE,    // เช่น A39089
    providerDisplay: PROVIDER_DISPLAY, // เช่น "A39089 สุภาพร กรองกรุด"

    qUser: finalQUser,
    q0: finalQ0,
    q1: q1Value,
    q2: finalQ2,
    q3: document.getElementById("q3").value.trim()
  });


  form.classList.add("hidden");
  thankYou.classList.remove("hidden");

  // ===== เริ่มจับเวลา 10 วินาทีเพื่อกลับหน้าฟอร์มอัตโนมัติ =====
  countdownSeconds = 10;

  // แสดงค่าเริ่มต้น
  {
    const el = getCountdownEl();
    if (el) {
      el.textContent = countdownSeconds;
      el.classList.add("animate");
      setTimeout(() => el.classList.remove("animate"), 400);
    }
  }

  if (autoReturnNote) autoReturnNote.style.display = "block";

  // เดินนาฬิกา
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    countdownSeconds -= 1;
    const el = getCountdownEl();
    if (el) {
      el.textContent = countdownSeconds;
      bumpCountdown();
    }
    if (countdownSeconds <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }, 1000);

  // ตั้งเวลารีเทิร์นกลับฟอร์ม
  if (autoBackTimer) clearTimeout(autoBackTimer);
  autoBackTimer = setTimeout(() => {
    backToForm();
  }, 10000);


  // reset UI
  form.reset();
  q0Other.classList.add("hidden");
  q1Options.forEach(o => o.classList.remove("active"));
  q1Value = "";
  q2Section.classList.add("hidden");
  q2Other.classList.add("hidden");
  document.querySelectorAll('input[name="qUser"]').forEach(r => (r.checked = false));
  document.getElementById("qUserError")?.classList.add("hidden");

  fetch(GAS_URL + "?cachebust=" + Date.now(), {
    method: "POST",
    body: payload
  }).catch(err => console.error("ส่งข้อมูลไม่สำเร็จ (background)", err));
});

/********************
 * Language switch
 ********************/
function applyLang(lang) {
  CURRENT_LANG = lang;
  localStorage.setItem("lang", lang);
  const t = I18N[lang];

  // ▼ เปลี่ยนหัวข้อ
  document.getElementById("title-main")
    ?.replaceChildren(document.createTextNode(t.titleMain));


  // QUser label & options (ต้องมี id ตามนี้ใน HTML)
  document.getElementById("qUserLabel")?.replaceChildren(document.createTextNode(t.qUser_label));
  [
    ["qUser_student_text","qUser_student"],
    ["qUser_staff_text","qUser_staff"],
    ["qUser_parent_text","qUser_parent"],
    ["qUser_external_text","qUser_external"],
  ].forEach(([id,key])=>{
    const el = document.getElementById(id);
    if (el) el.textContent = t[key];
  });

  // Q0 label + placeholder
  document.getElementById("q0Label")?.replaceChildren(document.createTextNode(t.q0_label));
  const first = q0?.querySelector("option[disabled]");
  if (first) first.textContent = t.q0_placeholder;

  // Q0 placeholder (select)
  if (q0) {
    const first = q0.querySelector("option[disabled]");
    if (first) first.textContent = t.q0_placeholder;
  }

  // Q0 other placeholder (input)
  if (q0Other) {
    q0Other.placeholder = t.q0_other_placeholder;   // <-- ตั้งตามภาษาเดียว
  }


  // Q1 captions (ต้องมี .option-X span)
  [
    [".option-5 span", t.q1_5],
    [".option-4 span", t.q1_4],
    [".option-3 span", t.q1_3],
    [".option-2 span", t.q1_2],
    [".option-1 span", t.q1_1],
  ].forEach(([sel,txt])=>{
    const el = document.querySelector(sel);
    if (el) el.textContent = txt;
  });
  document.getElementById("q1Label")?.replaceChildren(document.createTextNode(t.q1_label));

  // Q2 texts
  document.getElementById("q2Label")?.replaceChildren(document.createTextNode(t.q2_label));
  [
    ["q2_opt_staff_text", t.q2_opt_staff],
    ["q2_opt_delay_text", t.q2_opt_delay],
    ["q2_opt_accuracy_text", t.q2_opt_accuracy],
    ["q2_opt_facility_text", t.q2_opt_facility],
    ["q2_opt_other_text", t.q2_opt_other],
  ].forEach(([id,txt]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  });
  const q2OtherEl = document.getElementById("q2Other");
  if (q2OtherEl) {
    q2OtherEl.placeholder = (lang === "th")
      ? `${I18N.th.q2_other_placeholder} / ${I18N.en.q2_other_placeholder}`
      : I18N.en.q2_other_placeholder;
  }

  // Q3
  document.getElementById("q3Label")?.replaceChildren(document.createTextNode(t.q3_label));
  const q3 = document.getElementById("q3"); if (q3) q3.placeholder = t.q3_placeholder;

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.textContent = t.submit;   // <<< บรรทัดนี้สำคัญ

  // Thank You texts
  const thankTitle = document.getElementById("thankTitle");
  if (thankTitle) thankTitle.textContent = t.thank_title;

  const thankDesc = document.getElementById("thankDesc");
  if (thankDesc) thankDesc.textContent = t.thank_desc;

  const againBtn = document.getElementById("againBtn");
  if (againBtn) againBtn.textContent = t.thank_again;

  const autoReturnNoteEl = document.getElementById("autoReturnNote");
  if (autoReturnNoteEl) {
    autoReturnNoteEl.innerHTML = `${I18N[lang].thank_autoreturn} <span id="countdown">${countdownSeconds}</span> ${
      lang === "th" ? "วินาที" : "seconds"
    }`;
  }

  // ปุ่มภาษา active
  document.querySelectorAll(".lang-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.lang === lang)
  );

  // อัปเดตข้อความ error ที่กำลังโชว์อยู่เท่านั้น (rerender รายการ/ชื่อหน่วยให้ switchLang จัดการ)
  updateErrorTexts();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (typeof window.switchLang === "function") {
        window.switchLang(btn.dataset.lang);
      } else {
        // fallback (รอบแรกก่อน loadServices ตั้ง switchLang)
        applyLang(btn.dataset.lang);
      }
    });
  });

  applyLang(CURRENT_LANG);

  loadServices().catch(console.error);

  // ✅ Event delegation ให้ปุ่ม "ทำแบบสอบถามอีกครั้ง" (againBtn)
  // ทำงานได้แม้ DOM ถูก re-render จากการสลับภาษา
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#againBtn");
    if (!btn) return;
    backToForm();
  });

});
