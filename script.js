// script.js
// ตั้งค่า: ใส่ URL ของ Apps Script Web App ที่ได้จากการ deploy
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBjkxTETG4LMtiKiUZcItojm2ulpYzekZQqwJmyAjPFX3PwGEZMkAWyo6qLcxUKHOqNg/exec";

fetch("ttps://script.google.com/macros/s/AKfycbxBjkxTETG4LMtiKiUZcItojm2ulpYzekZQqwJmyAjPFX3PwGEZMkAWyo6qLcxUKHOqNg/exec", {
  method: "POST",
  body: new URLSearchParams(formData)
})
.then(response => response.json())
.then(data => {
  this.classList.add('hidden');
  document.getElementById('successMsg').classList.remove('hidden');
})
.catch(err => alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล"));

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("surveyForm");

  // ถ้าต้องการให้เลือก department จาก query param ?dept=IT
  const urlParams = new URLSearchParams(window.location.search);
  const presetDept = urlParams.get('dept'); // e.g. ?dept=IT
  if (presetDept) {
    // ถ้า index.html มีฟิลด์ department (hidden or select), set ค่านี้
    const deptField = document.querySelector('[name="department"]');
    if (deptField) deptField.value = presetDept;
  }

  // q2_other visibility is handled in index.html by change listener
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // ถ้า form มี field department ใช้ค่าจากฟอร์ม มิฉะนั้น fallback เป็น 'General'
    const departmentField = form.querySelector('[name="department"]');
    const department = departmentField ? departmentField.value || 'General' : (presetDept || 'General');

    const q1 = form.q1 ? form.q1.value : '';
    let q2 = form.q2 ? form.q2.value : '';
    const q2Other = form.q2_other ? form.q2_other.value.trim() : '';
    if (q2 === 'อื่นๆ' && q2Other) q2 = q2Other;

    const q3 = form.q3 ? form.q3.value : '';

    if (!q1) {
      alert("กรุณาเลือกระดับความพึงพอใจ");
      return;
    }

    const payload = { department, q1, q2, q3 };

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (result.status === 'success') {
        form.reset();
        // แสดงข้อความสำเร็จ (หากมี element #successMsg)
        const success = document.getElementById('successMsg');
        if (success) {
          form.classList.add('hidden');
          success.classList.remove('hidden');
        } else {
          alert("บันทึกเรียบร้อย");
        }
      } else {
        alert("เกิดข้อผิดพลาด: " + (result.message || 'unknown'));
      }
    } catch (err) {
      alert("ส่งข้อมูลไม่สำเร็จ: " + err);
    }
  });
});
