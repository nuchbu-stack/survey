document.addEventListener('DOMContentLoaded', () => {
  const q2 = document.getElementById('q2');
  const q2OtherContainer = document.getElementById('q2_other_container');
  const form = document.getElementById('surveyForm');
  const q1Options = document.querySelectorAll('.emoji-option input');

  // จัดการ active state ของข้อ 1
  q1Options.forEach(input => {
    input.addEventListener('change', () => {
      q1Options.forEach(i => i.parentElement.querySelector('div').classList.remove('border-blue-700', 'shadow-lg'));
      if (input.checked) {
        const box = input.parentElement.querySelector('div');
        box.classList.add('border-blue-700', 'shadow-lg'); // ขอบและ shadow สำหรับ active
      }
    });
  });

  // แสดงช่องอื่นๆ ถ้าเลือก "อื่นๆ"
  q2.addEventListener('change', () => {
    if (q2.value === 'อื่นๆ') {
      q2OtherContainer.classList.remove('hidden');
      q2OtherContainer.querySelector('input').required = true;
    } else {
      q2OtherContainer.classList.add('hidden');
      q2OtherContainer.querySelector('input').required = false;
    }
  });

  // ส่งฟอร์ม
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let q2Value = form.q2.value;
    if (q2Value === 'อื่นๆ') q2Value = document.getElementById('q2_other').value;

    const formData = new URLSearchParams();
    formData.append('q1', form.q1.value);
    formData.append('q2', q2Value);
    formData.append('q3', form.q3.value);

    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbxBjkxTETG4LMtiKiUZcItojm2ulpYzekZQqwJmyAjPFX3PwGEZMkAWyo6qLcxUKHOqNg/exec', { // เปลี่ยนเป็น Web App URL
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (result.status === 'success') {
        form.classList.add('hidden');
        document.getElementById('successMsg').classList.remove('hidden');
      } else {
        alert('เกิดข้อผิดพลาดขณะบันทึก: ' + result.message);
      }
    } catch(err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดขณะบันทึก กรุณาลองใหม่');
    }
  });
});
