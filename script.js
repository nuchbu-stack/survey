// script.js (อัปเดต)
// ส่งข้อมูลแบบ form-urlencoded เพื่อหลีกเลี่ยงปัญหา CORS preflight
// แทนที่ค่า APPS_SCRIPT_URL ด้วย URL ที่ได้จาก Apps Script Deploy

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBjkxTETG4LMtiKiUZcItojm2ulpYzekZQqwJmyAjPFX3PwGEZMkAWyo6qLcxUKHOqNg/exec"; // <-- ใส่ URL จริง

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("surveyForm");
  const q2 = document.getElementById("q2");
  const q2_other = document.getElementById("q2_other");
  const successMsg = document.getElementById("successMsg");
  const submitBtn = document.getElementById("submitBtn");

  // แสดง/ซ่อนช่อง "อื่นๆ" และจัดการ required
  if (q2) {
    q2.addEventListener("change", () => {
      if (q2.value === "อื่นๆ") {
        q2_other.classList.remove("hidden");
        q2_other.required = true;
      } else {
        q2_other.classList.add("hidden");
        q2_other.required = false;
      }
    });
  }

  // ฟังก์ชันช่วยตรวจว่ามี radio q1 ถูกเลือกหรือไม่
  function getSelectedQ1() {
    // form.q1 อาจเป็น NodeList หรือ undefined ขึ้นกับ DOM
    const radios = form.querySelectorAll('input[name="q1"]');
    for (const r of radios) {
      if (r.checked) return r.value;
    }
    return null;
  }

  // Event submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ตรวจ q1 ก่อน: ถ้าไม่มี เลือก -> แจ้งผู้ใช้ (เพื่อหลีกเลี่ยง error "invalid form control ... not focusable")
    const q1Val = getSelectedQ1();
    if (!q1Val) {
      alert("กรุณาเลือกระดับความพึงพอใจ (คำถามที่ 1)");
      return;
    }

    // q2: ถ้าเลือก "อื่นๆ" ให้ใช้ค่าจากช่องอื่นๆ
    let q2Val = "";
    if (q2) {
      q2Val = q2.value === "อื่นๆ" && q2_other ? q2_other.value.trim() : q2.value;
    }

    const q3Val = form.q3 ? form.q3.value.trim() : "";

    // disable ปุ่มป้องกันการกดซ้ำ
    submitBtn.disabled = true;
    submitBtn.classList.add("opacity-60", "cursor-not-allowed");

    // เตรียม payload แบบ form-urlencoded
    const params = new URLSearchParams();
    params.append("q1", q1Val);
    params.append("q2", q2Val);
    params.append("q3", q3Val);

    try {
      const resp = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: params // browser จะตั้ง Content-Type เป็น application/x-www-form-urlencoded
      });

      // พยายาม parse เป็น JSON (Apps Script ควรคืน JSON)
      let json;
      try {
        json = await resp.json();
      } catch (err) {
        // ถ้า parse ไม่ได้ ก็แสดงข้อความดิบ
        const text = await resp.text();
        console.error("Non-JSON response:", text);
        throw new Error("Response ไม่ใช่ JSON: " + text);
      }

      if (json && json.status === "success") {
        // แสดงผลสำเร็จ
        form.classList.add("hidden");
        if (successMsg) successMsg.classList.remove("hidden");
        else alert("บันทึกเรียบร้อย ขอบคุณที่ตอบแบบประเมิน");
      } else {
        console.error("Response:", json);
        alert("เกิดข้อผิดพลาดขณะบันทึก กรุณาลองใหม่ (ดู console สำหรับรายละเอียด)");
      }
    } catch (err) {
      console.error("Send error:", err);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบ URL และการ Deploy ของ Apps Script");
    } finally {
      // เปิดปุ่มกลับ ถ้ายังไม่ได้เปลี่ยนหน้า
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-60", "cursor-not-allowed");
    }
  });
});
