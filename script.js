// แทนที่โค้ดเดิมใน script.js (fetch แบบ JSON) ด้วยโค้ดนี้
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBjkxTETG4LMtiKiUZcItojm2ulpYzekZQqwJmyAjPFX3PwGEZMkAWyo6qLcxUKHOqNg/exec"; // <-- ใส่ URL จริง

document.getElementById('surveyForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  let q1 = this.q1 ? this.q1.value : '';
  let q2 = this.q2 ? this.q2.value : '';
  if (q2 === 'อื่นๆ' && this.q2_other) q2 = this.q2_other.value.trim();
  let q3 = this.q3 ? this.q3.value.trim() : '';

  if (!q1) { alert('กรุณาเลือกระดับความพึงพอใจ'); return; }

  const params = new URLSearchParams();
  params.append('q1', q1);
  params.append('q2', q2);
  params.append('q3', q3);

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: params // ส่งเป็น form-urlencoded — เบราว์เซอร์ตั้ง Content-Type ให้เอง
    });

    // ถ้า Apps Script ตอบ JSON ก็อ่านได้
    const json = await res.json();
    if (json && json.status === 'success') {
      this.classList.add('hidden');
      document.getElementById('successMsg').classList.remove('hidden');
    } else {
      console.error('Response:', json);
      alert('เกิดข้อผิดพลาดขณะบันทึก กรุณาลองใหม่');
    }
  } catch (err) {
    console.error(err);
    alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบ URL และการ Deploy ของ Apps Script');
  }
});
