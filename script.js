/********************
 * Base elements
 ********************/
const form = document.getElementById("surveyForm");
const qUserSection = document.getElementById("qUserSection");
const studentInfoSection = document.getElementById("studentInfoSection");
const studentIdInput = document.getElementById("studentIdInput");
const studentProgramSelect = document.getElementById("studentProgramSelect");
const studentFacultySelect = document.getElementById("studentFacultySelect");
const studentFacultyProgramSelect = document.getElementById("studentFacultyProgramSelect");
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
// ⚠️ นี่คือ URL ของ deployment เดิม (ของจริง) — ตอนทดสอบต้องเปลี่ยนเป็น /exec URL
// ของ Web App ที่ deploy จาก Apps Script โปรเจกต์ใหม่ (ที่ผูกกับ Google Sheet ทดสอบ) เท่านั้น
// วิธีเอา URL: ในโปรเจกต์ Apps Script ใหม่ > Deploy > New deployment > Web app
//   Execute as: Me, Who has access: Anyone > Deploy > copy URL ที่ลงท้ายด้วย /exec
const GAS_URL = "https://script.google.com/macros/s/AKfycby-SDiwfLzoZgonW_Civm9nvOOkM9YJGxltU5wu0eOPK62BeFdmOvi_WLdA4UE1uf75/exec";
const JSON_URL = new URL("q0Options.json", window.location.href).href;
const PROGRAMS_URL = GAS_URL + "?action=programs"; // อ่านลิสต์คณะ/หลักสูตรจากแท็บ Programs (โหมด faculty_program)
const CONFIG_URL = GAS_URL + "?action=config"; // อ่านค่า override รายหน่วยงานจากแท็บ UnitsConfig (admin ตั้งค่าผ่าน Sheet แทนแก้ q0Options.json)

// อ่านพารามิเตอร์ URL
const params = new URLSearchParams(location.search);
const DEPARTMENT  = params.get("unit") || "ASU_HM";  // หน่วยงาน
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
let GROUP                = ""; // กลุ่มหน่วยงาน (faculty/support/...)

// ตัวแปรเกี่ยวกับฟิลด์ "รหัสนักศึกษา / หลักสูตร" (ตั้งค่าต่อหน่วยงานผ่าน config.studentInfo)
let STUDENT_INFO_MODE = "off";  // "id" | "program" | "off"
let STUDENT_INFO_CFG  = null;   // config.studentInfo ดิบของหน่วยงานนั้น
let DEFAULT_STUDENT_INFO = null; // data.Defaults.studentInfo — ใช้เมื่อหน่วยงานไม่ได้ตั้งค่า config.studentInfo ของตัวเองไว้
let PROGRAMS_DATA_PROMISE = null; // cache: fetch แค่ครั้งเดียวต่อการโหลดหน้า แม้จะสลับภาษา/เรียก renderStudentInfo หลายรอบ
let PROGRAMS_CACHE = { faculties: [], programs: [] }; // ผลลัพธ์ล่าสุดจาก fetchProgramsData() ใช้กรองหลักสูตรตามคณะที่เลือก

// ดึงลิสต์คณะ/หลักสูตรจาก Apps Script (แท็บ Programs) — cache ไว้ใน promise เดียวกันกันยิงซ้ำ
function fetchProgramsData() {
  if (!PROGRAMS_DATA_PROMISE) {
    PROGRAMS_DATA_PROMISE = fetch(PROGRAMS_URL)
      .then(r => r.json())
      .then(d => (d && d.status === "ok") ? d : { faculties: [], programs: [] })
      .catch(err => {
        console.error("โหลดลิสต์คณะ/หลักสูตรไม่สำเร็จ:", err);
        return { faculties: [], programs: [] };
      });
  }
  return PROGRAMS_DATA_PROMISE;
}

// ข้อความปิดปรับปรุงระบบ (เก็บไว้ re-render ตอนสลับภาษาระหว่างที่ปิดอยู่)
let MAINTENANCE_MSG_OBJ = null;

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

    studentId_label: "รหัสนักศึกษา",
    studentId_placeholder: "กรอกเฉพาะตัวเลข 10 หลัก",
    studentId_error: "กรุณากรอกรหัสนักศึกษาให้ถูกต้อง",
    program_label: "หลักสูตรที่เรียน",
    program_placeholder: "-- กรุณาเลือกหลักสูตร --",
    program_error: "กรุณาเลือกหลักสูตรที่เรียน",
    faculty_label: "คณะที่นักศึกษาสังกัด",
    faculty_placeholder: "-- กรุณาเลือกคณะ --",
    faculty_error: "กรุณาเลือกคณะและหลักสูตรที่เรียน",
    loading_label: "กำลังโหลดรายชื่อคณะ...",

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

    studentId_label: "Student ID",
    studentId_placeholder: "Digits only, 10 characters",
    studentId_error: "Please enter a valid student ID.",
    program_label: "Program of study",
    program_placeholder: "-- Please select your program --",
    program_error: "Please select your program of study.",
    faculty_label: "Student's Faculty",
    faculty_placeholder: "-- Please select your faculty --",
    faculty_error: "Please select your faculty and program of study.",
    loading_label: "Loading faculty list...",

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
 * เปิด/ปิดฟอร์มทั้งระบบ หรือรายหน่วยงาน
 * เรียกจาก loadServices(): เช็ค data.System.enabled (ทั้งระบบ) แล้วค่อยเช็ค cfg.enabled (รายหน่วย)
 * enabled:false -> ซ่อนฟอร์มทั้งหมด โชว์ข้อความแทน ไม่ต้องเปลี่ยน URL/redeploy ใดๆ
 ********************/
function showMaintenance(msgObj) {
  MAINTENANCE_MSG_OBJ = msgObj || null;
  form?.classList.add("hidden");
  qUserSection?.classList.add("hidden");

  const fallback = CURRENT_LANG === "en"
    ? "The system is temporarily closed for maintenance. Please check back later."
    : "ขณะนี้ระบบปิดปรับปรุงชั่วคราว กรุณากลับมาใหม่ภายหลัง";

  const msgEl = document.getElementById("maintenanceMessage");
  if (msgEl) msgEl.textContent = pickLabel(MAINTENANCE_MSG_OBJ, CURRENT_LANG) || fallback;

  document.getElementById("maintenanceNotice")?.classList.remove("hidden");
}

function hideMaintenance() {
  MAINTENANCE_MSG_OBJ = null;
  document.getElementById("maintenanceNotice")?.classList.add("hidden");
  form?.classList.remove("hidden");
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
  setErrorText("studentInfoError",
    STUDENT_INFO_MODE === "faculty_program" ? "faculty_error" :
    STUDENT_INFO_MODE === "program" ? "program_error" : "studentId_error");
}

/********************
 * Student Info (รหัสนักศึกษา / หลักสูตร)
 * เปิด/ปิด และเลือกโหมดต่อหน่วยงานผ่าน config.studentInfo:
 *   { mode: "id" }                              -> กรอกรหัสนักศึกษา (text, validate ด้วย idPattern)
 *   { mode: "program", programs: [...] }        -> เลือกหลักสูตรจาก dropdown (ลิสต์ตายตัวใน q0Options.json)
 *   { mode: "faculty_program" }                 -> เลือกคณะก่อน แล้วกรองหลักสูตรตามคณะ (อ่านสดจากแท็บ Programs ผ่าน doGet?action=programs)
 *   ไม่ใส่ / { mode: "off" }                     -> ไม่แสดงฟิลด์นี้เลย (ค่า default)
 * โชว์เฉพาะตอนที่ผู้ตอบเลือก "นักศึกษา" ใน qUser เท่านั้น
 ********************/
function updateStudentInfoVisibility() {
  const checked = document.querySelector('input[name="qUser"]:checked');
  const isStudent = !!checked && checked.value === "นักศึกษา";
  const shouldShow = isStudent && STUDENT_INFO_MODE !== "off";

  studentInfoSection?.classList.toggle("hidden", !shouldShow);
  if (!shouldShow) {
    document.getElementById("studentInfoError")?.classList.add("hidden");
  }
}

function renderStudentInfo(cfg) {
  // ลำดับ: config.studentInfo ของหน่วยนั้นเอง (ถ้ามี ใช้อันนี้เสมอ แม้จะเป็น {mode:"off"})
  // -> ถ้าหน่วยไม่ได้ตั้งค่าอะไรเลย (undefined) ใช้ Defaults.studentInfo แทน
  const si = (cfg && cfg.studentInfo !== undefined) ? cfg.studentInfo : DEFAULT_STUDENT_INFO;
  STUDENT_INFO_MODE = si && si.mode ? String(si.mode).toLowerCase() : "off";
  STUDENT_INFO_CFG = si;

  const labelEl = document.getElementById("studentInfoLabel");
  studentIdInput?.classList.add("hidden");
  studentProgramSelect?.classList.add("hidden");
  studentFacultySelect?.classList.add("hidden");
  studentFacultyProgramSelect?.classList.add("hidden");

  if (STUDENT_INFO_MODE === "id") {
    const labelText = pickLabel(si.label, CURRENT_LANG) || I18N[CURRENT_LANG].studentId_label;
    if (labelEl) labelEl.textContent = labelText;

    if (studentIdInput) {
      studentIdInput.placeholder =
        pickLabel(si.idPatternHint, CURRENT_LANG) || I18N[CURRENT_LANG].studentId_placeholder;
      studentIdInput.classList.remove("hidden");
    }
  } else if (STUDENT_INFO_MODE === "program") {
    const labelText = pickLabel(si.label, CURRENT_LANG) || I18N[CURRENT_LANG].program_label;
    if (labelEl) labelEl.textContent = labelText;

    if (studentProgramSelect) {
      const prevSelected = studentProgramSelect.value || "";
      const placeholder = I18N[CURRENT_LANG].program_placeholder;
      let opts = `<option value="" disabled selected>${placeholder}</option>`;

      (Array.isArray(si.programs) ? si.programs : []).forEach(item => {
        const { value, label } = buildQ0OptionObj(item, CURRENT_LANG);
        if (!value || !label) return;
        opts += `<option value="${value.replace(/"/g, '&quot;')}">${label}</option>`;
      });

      studentProgramSelect.innerHTML = opts;
      studentProgramSelect.classList.remove("hidden");

      if (prevSelected) studentProgramSelect.value = prevSelected;
    }
  } else if (STUDENT_INFO_MODE === "faculty_program") {
    const labelText = pickLabel(si.label, CURRENT_LANG) || I18N[CURRENT_LANG].faculty_label;
    if (labelEl) labelEl.textContent = labelText;

    if (studentFacultySelect && studentFacultyProgramSelect) {
      const prevFaculty = studentFacultySelect.value || "";
      const prevProgram = studentFacultyProgramSelect.value || "";

      studentFacultySelect.classList.remove("hidden");
      // ดรอปดาวน์หลักสูตรยังไม่โชว์จนกว่าจะเลือกคณะก่อน (populateFacultyProgramOptions จะเป็นคนโชว์/ซ่อนเอง)
      studentFacultyProgramSelect.innerHTML = "";
      studentFacultyProgramSelect.classList.add("hidden");

      // ถ้ายังไม่มีข้อมูลคณะ cache ไว้เลย (ครั้งแรกที่ยังโหลดไม่เสร็จ) ใส่ข้อความ "กำลังโหลด..." ไว้ก่อน
      // กันไม่ให้ dropdown ดูว่างเปล่า/ค้าง — ถ้าเคยโหลดมาแล้ว (สลับภาษา/รีเรนเดอร์ซ้ำ) จะข้ามส่วนนี้ไปเลย
      if (!PROGRAMS_CACHE.faculties || !PROGRAMS_CACHE.faculties.length) {
        studentFacultySelect.innerHTML =
          `<option value="" disabled selected>${I18N[CURRENT_LANG].loading_label}</option>`;
      }

      fetchProgramsData().then(d => {
        PROGRAMS_CACHE = d;
        let opts = `<option value="" disabled selected>${I18N[CURRENT_LANG].faculty_placeholder}</option>`;
        (d.faculties || []).forEach(f => {
          const label = pickLabel(f.label, CURRENT_LANG) || f.value;
          if (!f.value || !label) return;
          opts += `<option value="${String(f.value).replace(/"/g, '&quot;')}">${label}</option>`;
        });
        studentFacultySelect.innerHTML = opts;

        if (prevFaculty) {
          studentFacultySelect.value = prevFaculty;
          populateFacultyProgramOptions(prevFaculty, prevProgram);
        }
      });
    }
  }

  updateStudentInfoVisibility();
}

// เติมตัวเลือก "หลักสูตร" ในดรอปดาวน์ที่สอง โดยกรองจาก PROGRAMS_CACHE.programs ตามคณะที่เลือก (facultyValue)
// keepSelected: ค่าหลักสูตรเดิมที่อยากคงไว้ถ้ายังอยู่ในลิสต์ที่กรองแล้ว (ใช้ตอนสลับภาษา ไม่ใช่ตอนผู้ใช้เปลี่ยนคณะเอง)
// ถ้าคณะนั้นมีหลักสูตรเดียว/ไม่มีข้อมูล (ไม่มีสาขาให้เลือกจริงๆ เช่น คณะบัญชี) จะซ่อนดรอปดาวน์นี้ทิ้ง
// และ "ไม่บันทึกชื่อหลักสูตรเลย" (ปล่อยว่าง) เพราะไม่ใช่ข้อมูลที่ผู้ตอบเลือกเอง แค่คณะอย่างเดียวก็พอสื่อความหมายแล้ว
// dataset.hasChoice บอก submit handler ว่าต้องบังคับเลือกหลักสูตรมั้ย ("0" = ไม่ต้องบังคับ)
function populateFacultyProgramOptions(facultyValue, keepSelected) {
  if (!studentFacultyProgramSelect) return;
  const placeholder = I18N[CURRENT_LANG].program_placeholder;

  const matched = (PROGRAMS_CACHE.programs || [])
    .filter(p => p.faculty === facultyValue && p.value);

  if (matched.length <= 1) {
    // ไม่มีสาขาให้เลือกจริง (0 หรือ 1 รายการ) -> ซ่อนดรอปดาวน์ ไม่บังคับเลือก ไม่บันทึกค่าใดๆ
    studentFacultyProgramSelect.innerHTML = "";
    studentFacultyProgramSelect.value = "";
    studentFacultyProgramSelect.classList.add("hidden");
    studentFacultyProgramSelect.dataset.hasChoice = "0";
    return;
  }

  // มีมากกว่า 1 หลักสูตร -> โชว์ดรอปดาวน์ให้เลือกตามปกติ และบังคับเลือก
  studentFacultyProgramSelect.dataset.hasChoice = "1";
  studentFacultyProgramSelect.classList.remove("hidden");
  let opts = `<option value="" disabled selected>${placeholder}</option>`;
  matched.forEach(p => {
    const label = pickLabel(p.label, CURRENT_LANG) || p.value;
    if (!label) return;
    opts += `<option value="${String(p.value).replace(/"/g, '&quot;')}">${label}</option>`;
  });

  studentFacultyProgramSelect.innerHTML = opts;
  if (keepSelected) studentFacultyProgramSelect.value = keepSelected;
}

document.querySelectorAll('input[name="qUser"]').forEach(radio => {
  radio.addEventListener("change", () => {
    document.getElementById("qUserError")?.classList.add("hidden");
    updateStudentInfoVisibility();
  });
});

studentIdInput?.addEventListener("input", () => {
  if (studentIdInput.value.trim() !== "") {
    document.getElementById("studentInfoError")?.classList.add("hidden");
  }
});
studentProgramSelect?.addEventListener("change", () => {
  if (studentProgramSelect.value) {
    document.getElementById("studentInfoError")?.classList.add("hidden");
  }
});
studentFacultySelect?.addEventListener("change", () => {
  // เปลี่ยนคณะ -> รีเซ็ตหลักสูตรที่เคยเลือกไว้ แล้วกรองลิสต์หลักสูตรใหม่ตามคณะนี้
  populateFacultyProgramOptions(studentFacultySelect.value, "");
  document.getElementById("studentInfoError")?.classList.add("hidden");
});
studentFacultyProgramSelect?.addEventListener("change", () => {
  if (studentFacultyProgramSelect.value) {
    document.getElementById("studentInfoError")?.classList.add("hidden");
  }
});

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
// รองรับ templates + use + extend(remove/add) + options
function resolveOptions(data, conf) {
  // โครงเก่า: conf เป็น array ตรง ๆ
  if (Array.isArray(conf)) return conf;

  const templates = data?.Templates || {};
  let base = [];

  // 1) เริ่มจาก template ที่อ้างด้วย use (ถ้ามี)
  if (conf?.use && Array.isArray(templates[conf.use])) {
    base = templates[conf.use].slice();
  }

  // 2) ประมวลผล extend เสมอ แม้จะไม่มี extend.use
  const ext = conf?.extend;
  if (ext) {
    // ถ้ามี extend.use ให้สลับฐานเป็น template อื่น
    if (ext.use && Array.isArray(templates[ext.use])) {
      base = templates[ext.use].slice();
    }

    // helper: ทำ normalization ให้จับคู่ได้ทั้ง "อื่นๆ" และ "อื่น ๆ"
    const norm = (x) => String(x || "")
      .replace(/\s+/g, " ")
      .replace(/อื่น\s*ๆ/g, "อื่นๆ")
      .trim();

    // 2.1 remove
    if (Array.isArray(ext.remove) && ext.remove.length) {
      const rm = new Set(ext.remove.map(s => {
        if (typeof s === "string") return norm(s);
        if (s && typeof s === "object") return norm(s.th || s.en || "");
        return norm(String(s));
      }));
      base = base.filter(item => {
        const raw = (typeof item === "string")
          ? item
          : (item?.th || item?.en || "");
        return !rm.has(norm(raw));
      });
    }

    // 2.2 add
    if (Array.isArray(ext.add) && ext.add.length) {
      base = base.concat(ext.add);
    }
  }

  // 3) ถ้ามี options ให้ override ทั้งหมด
  if (Array.isArray(conf?.options)) {
    base = conf.options;
  }

  return Array.isArray(base) ? base : [];
}


// ตัวช่วยเลือกข้อความ (วางเหนือ renderProvider)
function personUIandSaveLabels(p, uiLang = "th") {
  const code = (p.code || "").trim();
  const th   = (p.display_th || "").trim();
  const en   = (p.display_en || "").trim();

  // ข้อความที่ "ผู้ใช้เห็น" (ตามภาษา UI; ถ้าไม่มีภาษานั้น ให้ fallback อีกภาษา; ถ้าไม่มีเลย ใช้ code)
  const ui = (uiLang === "en") ? (en || th || code) : (th || en || code);

  // ข้อความที่ "บันทึกลงชีต" (แนะนำคงที่เสมอ: ใช้เวอร์ชันภาษาไทยถ้ามี ไม่งั้นใช้ EN หรือ code)
  const toSave = th || en || code;

  return { ui, toSave };
}


function renderProvider(data, cfg) {
  const header = document.querySelector(".form-header");
  let headerP = header?.querySelector("p.provider-display");
  if (!headerP && header) {
    headerP = document.createElement("p");
    headerP.className = "provider-display";
    header.appendChild(headerP);
  }

  const setHeader = (text) => {
    if (!headerP) return;
    const s = (text || "").trim();
    headerP.textContent = s;
    headerP.classList.toggle("hidden", s === "");
  };

  // --- existing elements (may already exist) ---
  let providerWrap = document.getElementById("providerWrap");
  let providerSelect = document.getElementById("providerSelect");

  // ✅ เก็บค่าที่เลือกไว้ก่อน rebuild (สำคัญมาก)
  const prevSelected = providerSelect?.value || "";

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
      const anchor =
        document.getElementById("q0Section") ||
        document.getElementById("qUserSection") ||
        document.querySelector("form");
      anchor?.parentNode?.insertBefore(providerWrap, anchor);
      providerSelect = sel;
    } else {
      // refresh ref
      providerSelect = document.getElementById("providerSelect");
    }
  };

  const hideWrap = () => providerWrap?.classList.add("hidden");
  const showWrap = () => providerWrap?.classList.remove("hidden");

  // helpers
  const pickPersonUI = (p) => {
    const code = (p?.code || "").trim();
    const th = (p?.display_th || "").trim();
    const en = (p?.display_en || "").trim();
    return (CURRENT_LANG === "en") ? (en || th || code) : (th || en || code);
  };
  const pickPersonSave = (p) => {
    const code = (p?.code || "").trim();
    const th = (p?.display_th || "").trim();
    const en = (p?.display_en || "").trim();
    return th || en || code; // บันทึกลงชีตให้คงที่ (ไทยก่อน)
  };

  // reset state (เหมือนเดิม)
  PROVIDER_MODE        = "aggregate";
  PROVIDER_CODE        = "";
  PROVIDER_DISPLAY     = "";
  PROVIDER_SHEET_LABEL = "";
  window.PROVIDER_DISPLAY_UI = "";
  setHeader("");

  const pv = cfg.providers || { mode: "aggregate" };
  const mode   = (pv.mode || "aggregate").toLowerCase();
  const people = Array.isArray(pv.people) ? pv.people : [];

  // mode aggregate
  if (mode === "aggregate") {
    hideWrap();
    setHeader("");
    return;
  }

  // URL person
  if (STAFF_PARAM && people.length) {
    const found = people.find(p => p.code === STAFF_PARAM);
    if (found) {
      const uiLabel   = pickPersonUI(found);
      const saveLabel = pickPersonSave(found);

      PROVIDER_MODE        = "url_person";
      PROVIDER_CODE        = (found.code || "").trim();
      PROVIDER_DISPLAY     = saveLabel;
      window.PROVIDER_DISPLAY_UI = uiLabel;
      PROVIDER_SHEET_LABEL = (found.sheet_label || BASE_SHEET_LABEL).trim();

      hideWrap();
      setHeader(uiLabel);
      return;
    }
  }

  // list select
  if (people.length) {
    ensureWrap();

    const labelEl = document.getElementById("providerLabel");
    const labelText = pickLabel(pv.label, CURRENT_LANG) || (CURRENT_LANG === "en" ? "Service provider" : "ผู้ให้บริการ");
    if (labelEl) labelEl.textContent = labelText;

    const allowAgg = !!pv.allow_aggregate_in_list;
    const aggText  = pickLabel(pv.aggregate_label, CURRENT_LANG) || (CURRENT_LANG === "en" ? "Evaluate the unit" : "ประเมินรวมทั้งหน่วยงาน");

    let opts = `<option value="">— ${labelText} —</option>`;

    if (allowAgg) {
      const aggSave = pickLabel(pv.aggregate_label, "th") || aggText;
      opts += `<option value="__AGG__"
                  data-ui="${aggText.replace(/"/g,'&quot;')}"
                  data-save="${aggSave.replace(/"/g,'&quot;')}"
                  data-sheet="${(BASE_SHEET_LABEL || "").replace(/"/g,'&quot;')}">${aggText}</option>`;
    }

    opts += people.map(p => {
      const ui   = pickPersonUI(p);
      const save = pickPersonSave(p);
      const sheet = (p.sheet_label || BASE_SHEET_LABEL || "").replace(/"/g,'&quot;');
      return `<option value="${(p.code || "").replace(/"/g,'&quot;')}"
                data-ui="${ui.replace(/"/g,'&quot;')}"
                data-save="${save.replace(/"/g,'&quot;')}"
                data-sheet="${sheet}">${ui}</option>`;
    }).join("");

    providerSelect.innerHTML = opts;

    if (pv.require_on_list && !allowAgg) providerSelect.setAttribute("required","required");
    else providerSelect.removeAttribute("required");

    providerSelect.onchange = () => {
      const v = providerSelect.value;
      const opt = providerSelect.selectedOptions[0];

      if (v === "__AGG__") {
        PROVIDER_MODE        = "aggregate";
        PROVIDER_CODE        = "";
        PROVIDER_DISPLAY     = opt?.dataset?.save || "";
        window.PROVIDER_DISPLAY_UI = opt?.dataset?.ui || "";
        PROVIDER_SHEET_LABEL = BASE_SHEET_LABEL;
        setHeader(""); // aggregate ไม่โชว์ชื่อคน
      } else if (v) {
        PROVIDER_MODE        = "list_person";
        PROVIDER_CODE        = v;
        PROVIDER_DISPLAY     = opt?.dataset?.save || v;              // save -> ชีต
        window.PROVIDER_DISPLAY_UI = opt?.dataset?.ui || opt?.textContent || v; // ui -> หน้าเว็บ
        PROVIDER_SHEET_LABEL = opt?.dataset?.sheet || BASE_SHEET_LABEL;
        setHeader(window.PROVIDER_DISPLAY_UI);
      } else {
        PROVIDER_MODE        = "aggregate";
        PROVIDER_CODE        = "";
        PROVIDER_DISPLAY     = "";
        window.PROVIDER_DISPLAY_UI = "";
        PROVIDER_SHEET_LABEL = "";
        setHeader("");
      }
    };

    // ✅ restore ค่าเดิมหลัง rebuild (ถ้ามี)
    if (prevSelected) {
      providerSelect.value = prevSelected;
      providerSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }

    showWrap();
    return;
  }

  hideWrap();
  setHeader("");
}



// ใส่ตัวช่วยเลือกภาษาเริ่มต้น (บนไฟล์หรือก่อน loadServices() ก็ได้)
function pickInitialLang(langs, defaultLang) {
  const params = new URLSearchParams(location.search);
  const urlLang = (params.get("lang") || "").toLowerCase();
  const stored  = (localStorage.getItem("lang") || "").toLowerCase();
  const allow   = (x) => x && langs.includes(x);

  if (allow(urlLang))   return urlLang;
  if (allow(stored))    return stored;
  if (allow(defaultLang)) return defaultLang;
  return langs[0];
}

// เพิ่มฟังก์ชันตั้งค่าภาษาตามคอนฟิกหน่วย (วางไว้เหนือ loadServices())
function initLangForDept(cfg) {
  // อ่านค่าที่มี
  const urlLang = new URLSearchParams(location.search).get("lang");
  const langs = (Array.isArray(cfg?.langs) && cfg.langs.length) ? cfg.langs : ["th","en"];
  const defLang = cfg?.default_lang || "th";

  // 1) ถ้า URL บังคับ และอยู่ในชุดที่อนุญาต → ใช้อันนั้น
  if (urlLang && langs.includes(urlLang)) {
    CURRENT_LANG = urlLang;
  } else {
    // 2) เคารพ localStorage ถ้าอยู่ในชุดที่อนุญาต
    const saved = localStorage.getItem("lang");
    if (saved && langs.includes(saved)) {
      CURRENT_LANG = saved;
    } else {
      // 3) ไม่งั้นใช้ default_lang ถ้าอยู่ในชุดที่อนุญาต
      CURRENT_LANG = langs.includes(defLang) ? defLang : langs[0];
    }
  }

  // บันทึก/ประกาศ
  localStorage.setItem("lang", CURRENT_LANG);
  document.documentElement.lang = CURRENT_LANG;

  // แสดง/ซ่อนปุ่มสลับภาษา
  const switcher = document.querySelector(".lang-switch");
  if (switcher) switcher.style.display = (langs.length > 1) ? "" : "none";
}


async function loadServices() {
  // กันคนกดส่งฟอร์มได้ก่อนที่ข้อมูล (q0Options.json + config) จะโหลดเสร็จ — ปิดปุ่มส่งไว้ก่อน
  // แล้วค่อยเปิดกลับตอนจบฟังก์ชันนี้ (ทั้งกรณีสำเร็จและ error)
  const submitBtnEl = document.getElementById("submitBtn");
  if (submitBtnEl) submitBtnEl.disabled = true;

  // ยิงคำขอลิสต์คณะ/หลักสูตรไปตั้งแต่ต้นเลย (ไม่รอจนกว่าจะรู้ว่าหน่วยนี้ใช้โหมด faculty_program จริงมั้ย)
  // เพราะ Apps Script (Web App) มัก cold start ช้า ยิ่งเริ่มคำขอเร็วเท่าไหร่ พอถึงตอนที่ต้องโชว์ dropdown
  // คณะจริงๆ ก็ยิ่งมีโอกาสที่ผลจะกลับมาแล้วหรือใกล้เสร็จ ลดเวลาที่ผู้ตอบต้องรอ (ถ้าหน่วยนี้ไม่ได้ใช้โหมดนี้
  // ก็แค่เสียคำขอไปเปล่าๆ ไม่กระทบอะไร เพราะ fetchProgramsData() cache ผลไว้ในตัวอยู่แล้ว)
  fetchProgramsData();

  // ดึงค่า override รายหน่วยจากแท็บ UnitsConfig "แบบไม่บล็อกการโหลดหลัก" — ยิงคำขอไปพร้อมกัน
  // แต่ไม่ await ตรงนี้ เพราะ Apps Script (Web App) มักมี cold start ช้ากว่า static JSON บน GitHub Pages
  // มาก (บางทีหลายวินาที) ถ้าไปรวมไว้ใน Promise.all แล้ว await พร้อมกัน ฟอร์มทั้งหน้าจะค้างรอ endpoint
  // นี้อยู่เฉยๆ ทั้งที่ค่า override เป็นแค่ตัวเสริม ไม่ใช่ข้อมูลที่ต้องมีก่อนแสดงฟอร์มได้
  const configPromise = fetch(CONFIG_URL).then(r => r.json()).catch(() => ({}));

  try {
    q0.disabled = true;
    // ⚠️ ต้องใส่ value="" ให้ตัวเลือก placeholder เสมอ ไม่งั้น browser จะเอาข้อความ label
    // ("-- กรุณาเลือก --") มาเป็น q0.value แทน (เพราะ <option> ที่ไม่มี value attribute
    // จะถือว่า value = ข้อความในตัวเอง) ทำให้ผ่านเช็ค required ตอน submit ทั้งที่ยังไม่ได้เลือกอะไรจริง
    q0.innerHTML = `<option value="" disabled selected>${I18N[CURRENT_LANG].q0_placeholder}</option>`;

    // โหลด q0Options.json — ไฟล์นี้เท่านั้นที่จำเป็นก่อนแสดงฟอร์ม (static, อยู่บน GitHub Pages, โหลดเร็ว)
    const res = await fetch(JSON_URL + "?v=" + Date.now());
    const data = await res.json();

    // ปิดทั้งระบบชั่วคราว (System.enabled = false) — เช็คก่อนอย่างอื่นทั้งหมด
    const sys = data?.System || {};
    if (sys.enabled === false) {
      showMaintenance(sys.message);
      return;
    }
    hideMaintenance();

    // ค่า default ของฟิลด์รหัสนักศึกษา/หลักสูตร (ใช้กับหน่วยที่ไม่ได้ตั้ง config.studentInfo เอง)
    DEFAULT_STUDENT_INFO = data?.Defaults?.studentInfo || null;

    // QUser: เปิด/ปิดตาม Features.UserType (ค่า override จาก UnitsConfig จะมาทีหลังแบบ async ด้านล่าง)
    let hasUserType = !!data?.Features?.UserType?.includes(DEPARTMENT);
    qUserSection?.classList.toggle("hidden", !hasUserType);
    if (!hasUserType) document.getElementById("qUserError")?.classList.add("hidden");

    // อ่าน config ของหน่วย
    let conf = data[DEPARTMENT];
    if (!conf) {
      q0Section?.classList.add("hidden");
      qUserSection?.classList.add("hidden");
      studentInfoSection?.classList.add("hidden");
      return;
    }
    // รองรับโครงเก่า (array options ตรงๆ)
    if (Array.isArray(conf)) conf = { config: { hasServices: true }, options: conf };
    const cfg = conf.config || {};

    // ปิดเฉพาะหน่วยงานนี้ (config.enabled = false) — เผื่อหน่วยเดียวอยากปิดตอนสรุปผล/พักฟอร์ม
    if (cfg.enabled === false) {
      showMaintenance(cfg.maintenanceMessage || sys.message);
      return;
    }

    GROUP = (cfg.group || "") + "";
    window._UNIT_GROUP = GROUP;

    // -------------------------------
    // 1) ภาษา per-unit (เลือกภาษาเริ่มต้น + ซ่อนปุ่มถ้าภาษาเดียว)
    // -------------------------------
    const langs = Array.isArray(cfg.langs) && cfg.langs.length ? cfg.langs : ["th"];
    window._UNIT_LANGS = langs.slice();

    const defaultLang = (cfg.default_lang || "").toLowerCase();
    const params = new URLSearchParams(location.search);
    const LANG_PARAM = (params.get("lang") || "").toLowerCase();
    const storedLang = (localStorage.getItem("lang") || "").toLowerCase();

    function pickInitialLang(langsArr, def) {
      const allow = (x) => x && langsArr.includes(x);
      // ลำดับ: 1) URL → 2) default_lang ของหน่วย → 3) localStorage → 4) ตัวแรกของหน่วย
      if (allow(LANG_PARAM))  return LANG_PARAM;
      if (allow(def))         return def;                 // NEW (ให้ค่าจากคอนฟิกชนะ localStorage)
      if (allow(storedLang))  return storedLang;
      return langsArr[0];
    }

    CURRENT_LANG = pickInitialLang(langs, defaultLang);
    localStorage.setItem("lang", CURRENT_LANG);
    document.documentElement.setAttribute("lang", CURRENT_LANG);

    // แสดง/ซ่อนปุ่มสลับภาษา
    const switcher = document.querySelector(".lang-switch");
    if (switcher) switcher.style.display = (langs.length > 1) ? "" : "none"; // NEW (แทน class hidden)

    // อัปเดตสถานะปุ่ม active ให้ตรงภาษา
    document.querySelectorAll(".lang-btn")  // NEW
      .forEach(b => b.classList.toggle("active", b.dataset.lang === CURRENT_LANG));

    // -------------------------------
    // 2) สร้าง switchLang ที่ล็อกให้เลือกได้เฉพาะภาษาที่หน่วยรองรับ
    //    และ "อัปเดตข้อความ error ที่โชว์อยู่" + "รีเรนเดอร์ Q0"
    // -------------------------------
    const rerenderQ0 = () => {                               // NEW: ฟังก์ชันย่อยสำหรับวาด Q0 ตามภาษา
      const list = resolveOptions(data, conf) || [];
      q0.innerHTML = `<option value="" disabled selected>${I18N[CURRENT_LANG].q0_placeholder}</option>`;
      list.forEach(item => {
        const { value, label } = buildQ0OptionObj(item, CURRENT_LANG);
        if (!value || !label) return;
        const opt = document.createElement("option");
        opt.value = value;       // ✅ เก็บเป็นไทย
        opt.textContent = label; // 👁️ แสดงตามภาษา
        q0.appendChild(opt);
      });
      if (q0Other) q0Other.placeholder = I18N[CURRENT_LANG].q0_other_placeholder;
    };

    window.switchLang = function(nextLang) {                 // NEW (override เดิมให้รวมทุกอย่างไว้ที่นี่)
      if (!langs.includes(nextLang)) return;
      CURRENT_LANG = nextLang;
      localStorage.setItem("lang", nextLang);
      document.documentElement.setAttribute("lang", nextLang);

      applyLang(CURRENT_LANG);   // เปลี่ยนหัวข้อ/ป้าย/ปุ่ม
      updateErrorTexts();        // ✅ อัปเดตข้อความ error ที่กำลังโชว์อยู่ให้เป็นภาษาปัจจุบัน
      rerenderQ0();              // ✅ รีเรนเดอร์ Q0 ให้ label ตรงภาษา (value ไทยยังคงเดิม)

      // 🔹 NEW: อัปเดตชื่อหน่วยบนหัวฟอร์มตามภาษา
      const webTitle =
        pickLabel(cfg.display_title, CURRENT_LANG)
        || I18N[CURRENT_LANG]?.titleSub
        || (cfg.sheet_label || DEPARTMENT);
      setWebUnitTitle(webTitle);

      renderProvider(data, cfg); // ✅ เพิ่ม: รีเรนเดอร์ผู้ให้บริการตามภาษาปัจจุบัน
      renderStudentInfo(cfg);    // ✅ เพิ่ม: รีเรนเดอร์ฟิลด์รหัสนักศึกษา/หลักสูตรตามภาษาปัจจุบัน

      // อัปเดต active ของปุ่มภาษา
      document.querySelectorAll(".lang-btn")
        .forEach(b => b.classList.toggle("active", b.dataset.lang === CURRENT_LANG));
    };

    // -------------------------------
    // 3) ตั้งข้อความ UI รอบแรก + ชื่อหน่วยที่จะโชว์บนหัวฟอร์ม
    // -------------------------------
    applyLang(CURRENT_LANG);     // MOVE: ให้มาอยู่หลังเลือกภาษาแล้ว
    updateErrorTexts();          // NEW: ให้ error ปัจจุบันสอดรับภาษา
    const webTitle =
      pickLabel(cfg.display_title, CURRENT_LANG)
      || I18N[CURRENT_LANG]?.titleSub
      || (cfg.sheet_label || DEPARTMENT);
    setWebUnitTitle(webTitle);

    BASE_SHEET_LABEL = cfg.sheet_label || DEPARTMENT;

    // -------------------------------
    // 4) Q0: แสดง/ซ่อน และเติมตัวเลือก
    // -------------------------------
    const hasServices = (cfg.hasServices !== false);
    q0Section?.classList.toggle("hidden", !hasServices);

    renderProvider(data, cfg); // (เหมือนเดิม)
    renderStudentInfo(cfg);    // ✅ เพิ่ม: เปิด/ปิด + เติมค่าฟิลด์รหัสนักศึกษา/หลักสูตรตาม config ของหน่วยนี้

    if (hasServices && q0) {
      rerenderQ0();            // NEW: ใช้ฟังก์ชันรวมที่สร้างไว้
      q0.disabled = false;
      q0Section?.classList.remove("hidden");
    }

    // ค่า override จาก UnitsConfig (ยิงไปตั้งแต่ต้นฟังก์ชันแบบไม่บล็อก) มาถึงตอนไหนก็ค่อยเอามาใช้ตอนนั้น
    // ฟอร์มแสดงผลจาก q0Options.json ไปก่อนแล้ว ถ้ามี override จริงค่อยปรับ UI ทับอีกที (มักไวมากจนไม่ทันสังเกต
    // แต่ถ้า Apps Script cold start ช้า ก็จะไม่ไปทำให้ทั้งฟอร์มค้างรอ)
    configPromise.then(liveCfgData => {
      const unitOverride = (liveCfgData?.units && liveCfgData.units[DEPARTMENT]) || {};
      if (!Object.keys(unitOverride).length) return; // ไม่มี override อะไรเลย ไม่ต้องทำอะไรต่อ

      if (unitOverride.showUserType !== undefined) {
        qUserSection?.classList.toggle("hidden", !unitOverride.showUserType);
        if (!unitOverride.showUserType) document.getElementById("qUserError")?.classList.add("hidden");
      }
      if (unitOverride.enabled === false) {
        showMaintenance(unitOverride.maintenanceMessage || cfg.maintenanceMessage || sys.message);
        return;
      }
      if (unitOverride.studentInfo !== undefined) {
        cfg.studentInfo = unitOverride.studentInfo;
        renderStudentInfo(cfg);
      }
    });
  } catch (err) {
    console.error("โหลด q0Options.json ไม่ได้", err);
    q0Section?.classList.add("hidden");
    q0.disabled = true;
    q0.value = "--";
    q0Other.value = "";
    q0Other.classList.add("hidden");
  } finally {
    // เปิดปุ่มส่งกลับคืนเสมอไม่ว่าจะจบทางไหน (สำเร็จ/error/return กลางทางเช่นโหมดปิดปรับปรุง)
    // ถ้าเป็นโหมดปิดปรับปรุงอยู่แล้วฟอร์มทั้งหมดจะถูกซ่อนอยู่ดี ปุ่มเปิดหรือปิดจึงไม่กระทบอะไร
    if (submitBtnEl) submitBtnEl.disabled = false;
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
  renderStudentInfo(cfg);

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
// (event listener ของ qUser ผูกไว้ด้านบนแล้ว รวม updateStudentInfoVisibility())

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

  // Student Info (รหัสนักศึกษา / หลักสูตร)
  let finalStudentId = "";
  let finalStudentProgram = "";
  let finalStudentFaculty = "";
  const isStudentInfoVisible = !!(studentInfoSection && !studentInfoSection.classList.contains("hidden"));
  if (isStudentInfoVisible) {
    if (STUDENT_INFO_MODE === "id") {
      const val = (studentIdInput?.value || "").trim();
      let pattern;
      try {
        pattern = new RegExp(STUDENT_INFO_CFG?.idPattern || "^[0-9]{10}$");
      } catch (e) {
        pattern = /^[0-9]{10}$/;
      }
      if (!val || !pattern.test(val)) {
        setErrorText("studentInfoError", "studentId_error");
        document.getElementById("studentInfoError")?.classList.remove("hidden");
        valid = false;
      } else {
        finalStudentId = val;
        document.getElementById("studentInfoError")?.classList.add("hidden");
      }
    } else if (STUDENT_INFO_MODE === "program") {
      const val = studentProgramSelect?.value || "";
      if (!val) {
        setErrorText("studentInfoError", "program_error");
        document.getElementById("studentInfoError")?.classList.remove("hidden");
        valid = false;
      } else {
        finalStudentProgram = val;
        document.getElementById("studentInfoError")?.classList.add("hidden");
      }
    } else if (STUDENT_INFO_MODE === "faculty_program") {
      const facultyVal = studentFacultySelect?.value || "";
      const programVal = studentFacultyProgramSelect?.value || "";
      // ถ้าคณะนั้นไม่มีสาขาให้เลือกจริง (dataset.hasChoice === "0") ไม่ต้องบังคับเลือกหลักสูตร
      // และไม่บันทึกชื่อหลักสูตรด้วย (ปล่อยว่างตามที่ตั้งใจ — มีแค่คณะก็พอ)
      const programRequired = studentFacultyProgramSelect?.dataset.hasChoice !== "0";
      if (!facultyVal || (programRequired && !programVal)) {
        setErrorText("studentInfoError", "faculty_error");
        document.getElementById("studentInfoError")?.classList.remove("hidden");
        valid = false;
      } else {
        finalStudentFaculty = facultyVal;
        finalStudentProgram = programRequired ? programVal : "";
        document.getElementById("studentInfoError")?.classList.add("hidden");
      }
    }
  } else {
    document.getElementById("studentInfoError")?.classList.add("hidden");
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
    group: GROUP,

    qUser: finalQUser,

    // รหัสนักศึกษา / หลักสูตร (มีค่าแค่ฟิลด์เดียวตาม STUDENT_INFO_MODE ของหน่วยนี้)
    studentInfoMode: isStudentInfoVisible ? STUDENT_INFO_MODE : "",
    studentId:       finalStudentId,
    studentProgram:  finalStudentProgram,
    studentFaculty:  finalStudentFaculty,

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

  // reset ฟิลด์รหัสนักศึกษา/หลักสูตร
  if (studentIdInput) studentIdInput.value = "";
  if (studentProgramSelect) studentProgramSelect.value = "";
  if (studentFacultySelect) studentFacultySelect.value = "";
  if (studentFacultyProgramSelect) studentFacultyProgramSelect.value = "";
  document.getElementById("studentInfoError")?.classList.add("hidden");
  updateStudentInfoVisibility(); // จะซ่อนกลับเพราะไม่มี qUser ถูกเลือกแล้ว

  fetch(GAS_URL + "?cachebust=" + Date.now(), {
    method: "POST",
    body: payload
  }).catch(err => console.error("ส่งข้อมูลไม่สำเร็จ (background)", err));
});

/********************
 * Language switch
 ********************/
function applyLang(lang) {
  CURRENT_LANG = lang;                  // ใช้ค่า lang ที่ถูกเลือกมาแล้ว
  const t = I18N[lang];

  // ===== Header =====
  document.getElementById("title-main")
    ?.replaceChildren(document.createTextNode(t.titleMain));
  // document.getElementById("title-sub")
  //  ?.replaceChildren(document.createTextNode(t.titleSub));

  // ===== QUser =====
  document.getElementById("qUserLabel")
    ?.replaceChildren(document.createTextNode(t.qUser_label));

  [
    ["qUser_student_text","qUser_student"],
    ["qUser_staff_text","qUser_staff"],
    ["qUser_parent_text","qUser_parent"],
    ["qUser_external_text","qUser_external"],
  ].forEach(([id,key])=>{
    const el = document.getElementById(id);
    if (el) el.textContent = t[key];
  });

  // ===== Q0 =====
  document.getElementById("q0Label")
    ?.replaceChildren(document.createTextNode(t.q0_label));

  if (q0) {
    const first = q0.querySelector("option[disabled]");
    if (first) first.textContent = t.q0_placeholder;
  }

  if (q0Other) {
    q0Other.placeholder = t.q0_other_placeholder;
  }

  // ===== Q1 =====
  document.getElementById("q1Label")
    ?.replaceChildren(document.createTextNode(t.q1_label));

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

  // ===== Q2 =====
  document.getElementById("q2Label")
    ?.replaceChildren(document.createTextNode(t.q2_label));

  [
    ["q2_opt_staff_text",   t.q2_opt_staff],
    ["q2_opt_delay_text",   t.q2_opt_delay],
    ["q2_opt_accuracy_text",t.q2_opt_accuracy],
    ["q2_opt_facility_text",t.q2_opt_facility],
    ["q2_opt_other_text",   t.q2_opt_other],
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

  // ===== Q3 =====
  document.getElementById("q3Label")
    ?.replaceChildren(document.createTextNode(t.q3_label));
  const q3 = document.getElementById("q3");
  if (q3) q3.placeholder = t.q3_placeholder;

  // ===== ปุ่ม submit =====
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.textContent = t.submit;

  // ===== Thank You =====
  const thankTitle = document.getElementById("thankTitle");
  if (thankTitle) thankTitle.textContent = t.thank_title;

  const thankDesc = document.getElementById("thankDesc");
  if (thankDesc) thankDesc.textContent = t.thank_desc;

  const againBtn = document.getElementById("againBtn");
  if (againBtn) againBtn.textContent = t.thank_again;

  const autoReturnNoteEl = document.getElementById("autoReturnNote");
  if (autoReturnNoteEl) {
    autoReturnNoteEl.innerHTML =
      `${I18N[lang].thank_autoreturn} <span id="countdown">${countdownSeconds}</span> ${
        lang === "th" ? "วินาที" : "seconds"
      }`;
  }

  // 🔹 ไม่ยุ่งกับการซ่อน/แสดงปุ่มภาษาใน applyLang แล้ว
  // (ถ้าจะให้ปุ่ม active หรือไม่ active แนะนำให้ไปทำใน switchLang หรือ loadServices)

  // อัปเดตข้อความ error ให้ตรงภาษา
  updateErrorTexts();
}

document.addEventListener("DOMContentLoaded", () => {
  // ===== ปุ่มสลับภาษา =====
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetLang = btn.dataset.lang;

      // ถ้ามี _UNIT_LANGS (ตั้งจาก loadServices) ให้เช็คว่าหน่วยนี้รองรับภาษานั้นไหม
      if (Array.isArray(window._UNIT_LANGS) && window._UNIT_LANGS.length) {
        if (!window._UNIT_LANGS.includes(targetLang)) {
          // หน่วยนี้ไม่รองรับภาษา targetLang → ไม่ต้องทำอะไร
          return;
        }
      }

      // ถ้ามี switchLang (จาก loadServices) ให้ใช้ตัวนั้นเป็นหลัก
      if (typeof window.switchLang === "function") {
        window.switchLang(targetLang);
      } else {
        // fallback กรณีหน่วยเก่า ๆ ที่ยังไม่มี switchLang
        CURRENT_LANG = targetLang;
        localStorage.setItem("lang", targetLang);
        applyLang(targetLang);
      }

      // ถ้ากำลังอยู่ในโหมดปิดปรับปรุง ให้ re-render ข้อความตามภาษาที่เพิ่งเลือกด้วย
      if (MAINTENANCE_MSG_OBJ) showMaintenance(MAINTENANCE_MSG_OBJ);
    });
  });

  // ===== ปุ่ม "ทำแบบสอบถามอีกครั้ง" =====
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#againBtn");
    if (!btn) return;
    backToForm();
  });

  // ✅ สำคัญมาก: เรียกโหลด config + Q0 + ภาษา ตามหน่วยงาน
  loadServices();
});