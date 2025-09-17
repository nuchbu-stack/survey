// script.js
// แทนที่ตรงนี้ด้วย URL ที่ได้จากการ Deploy Google Apps Script Web App
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBjkxTETG4LMtiKiUZcItojm2ulpYzekZQqwJmyAjPFX3PwGEZMkAWyo6qLcxUKHOqNg/exec";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("surveyForm");
  const q2 = document.getElementById("q2");
  const q2_other = document.getElementById("q2_other");

  // แสดงช่องอื่นๆ เมื่อเลือก "อื่นๆ"
  q2.addEventListener("change", function () {
    if (this.value === "อื่นๆ") {
      q2_other.classList.remove("hidden");
      q2_other.required = true;
    } else {
      q2_other.classList.add("hidden");
      q2_other.required = false;
    }
  });

  // ส่งข้อมูลแบบ JSON ไป Apps Script
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // เตรียมค่า
    let q1 = form.q1 ? form.q1.value : "";
    let q2Val = q2.value;
    if (q2Val === "อื่นๆ") q2Val = q2_other.value.trim();
    let q3 = form.q3 ? form.q3.value.trim() : "";

    if (!q1) {
      alert("กรุณาเลือกระดับความพึงพอใจ");
      return;
    }

    const payload = {
      q1: q1,
      q2: q2Val,
      q3: q3
    };

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (json && json.status === "success") {
        form.classList.add("hidden");
        document.getElementById("successMsg").classList.remove("hidden");
      } else {
        console.error("Response:", json);
        alert("เกิดข้อผิดพลาดขณะบันทึก กรุณาลองใหม่");
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบ URL และการ Deploy ของ Apps Script");
    }
  });
});
