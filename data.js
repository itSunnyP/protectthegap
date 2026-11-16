// ⚠️ ตัวเลขทดสอบทั้งหมด — แทนที่ด้วยตัวเลขจริงก่อนเผยแพร่ แล้วเปลี่ยน isTestData เป็น false
// จำนวนเงินเขียนได้ 2 แบบ: ตัวเลข (บาท) หรือ { salaryMonths: n } = n เท่าของเงินเดือนผู้ใช้
const DATA = {
  isTestData: true,

  // ของในตะกร้า (รายเดือน) — ผู้ใช้แก้ราคาได้
  // icon = ชื่อไอคอน Lucide ที่มีใน sprite ของ index.html (ถ้าเพิ่มใหม่ ต้องเพิ่ม <symbol> ด้วย)
  products: [
    { id: 'condo', name: 'ค่าเช่าคอนโดใกล้ BTS', icon: 'building-2', price: 8000 },
    { id: 'food', name: 'ค่ากิน 3 มื้อ', icon: 'utensils', price: 6000 },
    { id: 'travel', name: 'ค่าเดินทาง BTS / Grab', icon: 'train-front', price: 3000 },
    { id: 'iphone', name: 'ผ่อนไอโฟนรุ่นใหม่ 0%', icon: 'smartphone', price: 4500 },
    { id: 'credit', name: 'จ่ายบัตรเครดิต', icon: 'credit-card', price: 3000 },
    { id: 'cafe', name: 'คาเฟ่ทุกวันทำงาน', icon: 'coffee', price: 2200 },
    { id: 'stream', name: 'Netflix + Spotify', icon: 'clapperboard', price: 600 },
    { id: 'japan', name: 'เก็บเงินเที่ยวญี่ปุ่น', icon: 'plane', price: 3000 },
    { id: 'gym', name: 'ฟิตเนส', icon: 'dumbbell', price: 1500 },
    { id: 'parents', name: 'ให้พ่อแม่', icon: 'hand-heart', price: 3000 },
  ],

  // ค่าขนส่ง = ความเสี่ยง (บิลก้อนเมื่อเกิดเรื่อง)
  risks: [
    { id: 'ipd', name: 'ป่วยนอนโรงพยาบาล', icon: 'hospital', cost: 80000, desc: 'เช่น ไข้เลือดออก ไส้ติ่งอักเสบ นอน รพ.เอกชน 3–5 วัน' },
    { id: 'accident', name: 'อุบัติเหตุ', icon: 'bone', cost: 60000, desc: 'เช่น มอไซค์ล้ม กระดูกหัก ต้องผ่าตัด' },
    { id: 'ci', name: 'โรคร้ายแรง', icon: 'ribbon', cost: 1000000, desc: 'เช่น มะเร็ง ต้องรักษาต่อเนื่องหลายปี' },
    { id: 'income', name: 'ทุพพลภาพ / ขาดรายได้', icon: 'trending-down', cost: { salaryMonths: 12 }, desc: 'ทำงานไม่ได้ 1 ปี รายได้หายไปทั้งก้อน (คิด 12 เท่าของเงินเดือน)' },
  ],

  // ส่วนลด = สิ่งที่ช่วยจ่ายค่าขนส่ง  kind: sso | company | insurance
  discounts: [
    { id: 'sso', kind: 'sso', name: 'ประกันสังคม ม.33', icon: 'id-card', premium: 0,
      covers: { ipd: 30000, accident: 30000, ci: 200000, income: { salaryMonths: 6 } } },
    { id: 'company', kind: 'company', name: 'สวัสดิการบริษัท', icon: 'building-2', premium: 0,
      covers: { ipd: 20000, accident: 20000 } }, // ค่า "แบบพื้นฐาน"; ถ้าผู้ใช้กรอกวงเงินเอง จะใช้วงเงินนั้นแทนทั้ง 2 ช่อง
    { id: 'health', kind: 'insurance', name: 'ประกันสุขภาพ', icon: 'heart-pulse', premium: 1500,
      covers: { ipd: 1000000, accident: 1000000 } },
    { id: 'pa', kind: 'insurance', name: 'ประกันอุบัติเหตุ (PA)', icon: 'bandage', premium: 300,
      covers: { accident: 100000 } },
    { id: 'ciins', kind: 'insurance', name: 'ประกันโรคร้ายแรง (CI)', icon: 'ribbon', premium: 500,
      covers: { ci: 500000 } },
    { id: 'incomeins', kind: 'insurance', name: 'ประกันชดเชยรายได้', icon: 'briefcase', premium: 400,
      covers: { income: { salaryMonths: 6 } } },
  ],
};
