const S = {
  screen: 'profile',
  salary: 20000,
  sso: true,
  company: 'basic', // none | basic | custom
  companyAmount: 30000,
  cart: [],          // { id, name, icon, price }
  ins: new Set(),    // ids ของโค้ดประกันที่เก็บแล้ว
};

const baht = n => (n < 0 ? '−฿' : '฿') + Math.round(Math.abs(n)).toLocaleString('th-TH');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// จำนวนเงินเป็นตัวเลข หรือ { salaryMonths } (ดู data.js)
const amount = (v, salary) => (typeof v === 'object' ? v.salaryMonths * salary : v) || 0;

// โค้ดส่วนลดที่ใช้อยู่ตอนนี้
function activeDiscounts(s) {
  return DATA.discounts.flatMap(d => {
    if (d.kind === 'sso') return s.sso ? [d] : [];
    if (d.kind === 'company') {
      if (s.company === 'none') return [];
      if (s.company === 'custom') return [{ ...d, covers: { ipd: s.companyAmount, accident: s.companyAmount } }];
      return [d];
    }
    return s.ins.has(d.id) ? [d] : [];
  });
}

// คำนวณทั้งหมด: ค่าส่งแต่ละความเสี่ยง, ส่วนลด, gap, งบ
function calc(s) {
  const ds = activeDiscounts(s);
  const risks = DATA.risks.map(r => {
    const cost = amount(r.cost, s.salary);
    let left = cost;
    const lines = [];
    for (const d of ds) {
      if (!(r.id in d.covers) || left <= 0) continue;
      const cut = Math.min(left, amount(d.covers[r.id], s.salary));
      if (cut > 0) { lines.push({ name: d.name, cut }); left -= cut; }
    }
    return { ...r, cost, lines, gap: left };
  });
  const cartTotal = s.cart.reduce((t, i) => t + (+i.price || 0), 0);
  const premiums = ds.reduce((t, d) => t + d.premium, 0);
  return {
    risks, cartTotal, premiums,
    spend: cartTotal + premiums,
    budgetLeft: s.salary - cartTotal - premiums,
    totalRisk: risks.reduce((t, r) => t + r.cost, 0),
    totalGap: risks.reduce((t, r) => t + r.gap, 0),
  };
}

// self-check ตรรกะคำนวณ
(() => {
  const t = calc({ salary: 20000, sso: false, company: 'custom', companyAmount: 100000, cart: [{ price: 5000 }], ins: new Set() });
  console.assert(t.risks.find(r => r.id === 'ipd').gap === 0, 'วงเงินบริษัทเกินค่าส่ง ต้องเหลือ gap 0 ไม่ติดลบ');
  console.assert(t.budgetLeft === 15000, 'งบคงเหลือ = เงินเดือน - ตะกร้า');
  const u = calc({ salary: 20000, sso: false, company: 'none', cart: [], ins: new Set(['incomeins']) });
  console.assert(u.risks.find(r => r.id === 'income').gap === 120000 && u.premiums === 400, 'salaryMonths ต้องคูณเงินเดือน');
})();

const app = document.getElementById('app');
const go = screen => { S.screen = screen; render(); scrollTo(0, 0); };

function render() {
  const banner = DATA.isTestData ? '<div class="test-banner">⚠️ ตัวเลขทดสอบ ยังไม่ใช่ข้อมูลจริง</div>' : '';
  app.innerHTML = banner + { profile: profileView, shop: shopView, checkout: checkoutView }[S.screen]();
}

function profileView() {
  const radio = (name, val, text) =>
    `<label><input type="radio" name="${name}" value="${val}" ${String(S[name]) === val ? 'checked' : ''}>${text}</label>`;
  return `
  <header><h1>🛍️ ProtectTheGap</h1></header>
  <section>
    <h2>เงินเดือนแรกมาแล้ว! ช้อปให้สุด…แต่อย่าลืมค่าส่ง</h2>
    <p class="hint">กรอก 3 ข้อ ใช้เวลาไม่ถึง 30 วินาที</p>
    <form id="profile">
      <label for="salary">เงินเดือน (บาท)</label>
      <input id="salary" name="salary" type="number" min="1" inputmode="numeric" required value="${S.salary}">
      <label>มีประกันสังคม (ม.33) ไหม</label>
      <div class="choices">${radio('sso', 'true', 'มี')}${radio('sso', 'false', 'ไม่มี')}</div>
      <label>สวัสดิการค่ารักษาจากบริษัท</label>
      <div class="choices">${radio('company', 'none', 'ไม่มี')}${radio('company', 'basic', 'มีแบบพื้นฐาน')}${radio('company', 'custom', 'รู้วงเงิน')}</div>
      <div id="customBox" ${S.company === 'custom' ? '' : 'hidden'}>
        <label for="companyAmount">วงเงินค่ารักษาต่อปี (บาท)</label>
        <input id="companyAmount" name="companyAmount" type="number" min="0" inputmode="numeric" value="${S.companyAmount}">
      </div>
      <button class="btn">เริ่มช้อป →</button>
    </form>
  </section>`;
}

function shopView() {
  const inCart = id => S.cart.some(i => i.id === id);
  const c = calc(S);
  return `
  <header><h1>🛍️ ProtectTheGap</h1><button data-go="profile">แก้ข้อมูล</button></header>
  <section><h2>ของที่อยากได้เดือนนี้</h2><p class="hint">ราคาเป็นรายเดือน แก้ราคาได้ตอนชำระเงิน</p></section>
  <div class="grid">
    ${DATA.products.map(p => `
      <div class="card">
        <div class="pic" aria-hidden="true">${p.icon}</div>
        <div class="name">${esc(p.name)}</div>
        <div class="price">${baht(p.price)}<span class="muted">/เดือน</span></div>
        <button data-toggle="${p.id}" class="${inCart(p.id) ? 'in' : ''}">${inCart(p.id) ? '✓ อยู่ในตะกร้า' : '+ ใส่ตะกร้า'}</button>
      </div>`).join('')}
  </div>
  <section>
    <h2>เพิ่มของเอง</h2>
    <form id="custom" class="choices">
      <input name="name" type="text" placeholder="ชื่อสินค้า" required aria-label="ชื่อสินค้า" style="flex:2">
      <input name="price" type="number" min="0" inputmode="numeric" placeholder="฿/เดือน" required aria-label="ราคาต่อเดือน" style="flex:1">
      <button class="btn" style="margin-top:0">+ ใส่ตะกร้า</button>
    </form>
  </section>
  <div class="bottom"><div class="inner">
    ${budgetBar(c)}
    <button class="btn" data-go="checkout" ${S.cart.length ? '' : 'disabled'}>🛒 ตะกร้า (${S.cart.length}) ${baht(c.cartTotal)} · ชำระเงิน</button>
  </div></div>`;
}

function budgetBar(c) {
  const pct = Math.min(100, (c.spend / S.salary) * 100);
  return `<div class="bar ${c.budgetLeft < 0 ? 'bad' : ''}">
    <div class="lbl"><span>💰 งบคงเหลือ</span><b class="money">${baht(c.budgetLeft)} / ${baht(S.salary)}</b></div>
    <div class="track"><div class="fill" style="width:${pct}%"></div></div></div>`;
}

function gapBar(c) {
  const pct = c.totalRisk ? (c.totalGap / c.totalRisk) * 100 : 0;
  return `<div class="bar ${c.totalGap > 0 ? 'bad' : ''}">
    <div class="lbl"><span>🚚 gap ที่ต้องจ่าย</span><b class="money">${baht(c.totalGap)}</b></div>
    <div class="track"><div class="fill" style="width:${pct}%"></div></div></div>`;
}

function checkoutView() {
  const c = calc(S);
  const free = activeDiscounts(S).filter(d => d.premium === 0);
  const insurance = DATA.discounts.filter(d => d.kind === 'insurance');
  const coversText = d => DATA.risks.filter(r => r.id in d.covers).map(r => r.name).join(', ');
  return `
  <header><button data-go="shop" aria-label="กลับไปช้อป">←</button><h1>ทำการสั่งซื้อ</h1></header>

  <section>
    <h2>🛒 สินค้า (รายเดือน)</h2>
    ${S.cart.map((i, n) => `
      <div class="row">
        <span class="ic" aria-hidden="true">${i.icon}</span>
        <span class="grow">${esc(i.name)}</span>
        <input type="number" min="0" inputmode="numeric" value="${i.price}" data-price="${n}" aria-label="ราคา ${esc(i.name)}">
        <button class="x" data-remove="${n}" aria-label="ลบ ${esc(i.name)}">✕</button>
      </div>`).join('') || '<p class="hint">ตะกร้าว่าง</p>'}
    <div class="row"><span class="grow"><b>รวมค่าสินค้า</b></span><b class="money">${baht(c.cartTotal)}/เดือน</b></div>
  </section>

  <section>
    <h2>🚚 ค่าขนส่ง: ความเสี่ยงที่ first jobber อาจเจอ</h2>
    <p class="hint">ค่าส่งไม่ได้เก็บทุกเดือน แต่ถ้าเกิดเรื่องขึ้น จะมาเป็นบิลก้อนนี้ แตะที่ ⓘ เพื่อดูตัวอย่าง</p>
    ${c.risks.map(r => `
      <div class="risk">
        <div class="top"><span aria-hidden="true">${r.icon}</span>${r.name}<span class="money">${baht(r.cost)}</span></div>
        <details><summary>ⓘ เกิดอะไรขึ้นได้บ้าง</summary>${r.desc}</details>
        ${r.lines.map(l => `<div class="line"><span>🎟️ ${l.name}</span><span class="money">−${baht(l.cut)}</span></div>`).join('')}
        <div class="own ${r.gap > 0 ? 'bad' : 'green'}"><span>${r.gap > 0 ? 'คุณจ่ายเอง' : '✓ ครอบคลุมแล้ว'}</span><span class="money">${baht(r.gap)}</span></div>
      </div>`).join('')}
  </section>

  <section>
    <h2>🎟️ โค้ดส่วนลดค่าส่ง</h2>
    <p class="hint">โค้ดฟรีใช้ให้อัตโนมัติ แต่ลดค่าส่งได้แค่บางส่วน</p>
    ${free.map(d => `
      <div class="voucher"><span aria-hidden="true">${d.icon}</span>
        <div class="grow">${d.name}<small>ลด: ${coversText(d)}</small></div><span class="free">ฟรี · ใช้แล้ว</span></div>`).join('') || '<p class="hint">คุณยังไม่มีโค้ดฟรี</p>'}
    <p class="hint" style="margin-top:12px">โค้ดประกันต้องจ่าย "ค่าโค้ด" ทุกเดือน และค่าโค้ดจะบวกเข้ายอดรายเดือน</p>
    ${insurance.map(d => `
      <div class="voucher"><span aria-hidden="true">${d.icon}</span>
        <div class="grow">${d.name}<small>ลด: ${coversText(d)} · ${baht(d.premium)}/เดือน</small></div>
        <button data-ins="${d.id}" class="${S.ins.has(d.id) ? 'on' : ''}" aria-pressed="${S.ins.has(d.id)}">${S.ins.has(d.id) ? '✓ เก็บแล้ว' : 'เก็บโค้ด'}</button>
      </div>`).join('')}
  </section>

  <section>
    <div class="row"><span class="grow">ค่าสินค้า</span><span class="money">${baht(c.cartTotal)}</span></div>
    <div class="row"><span class="grow">ค่าโค้ดประกัน</span><span class="money">${baht(c.premiums)}</span></div>
    <div class="row"><span class="grow"><b>ยอดรวมต่อเดือน</b></span><b class="money">${baht(c.spend)}</b></div>
  </section>

  <div class="bottom"><div class="inner">
    ${budgetBar(c)}${gapBar(c)}
    <button class="btn" data-confirm>ยืนยันคำสั่งซื้อ</button>
  </div></div>`;
}

function showSummary() {
  const c = calc(S);
  const worst = [...c.risks].sort((a, b) => b.gap - a.gap)[0];
  const priciest = [...S.cart].sort((a, b) => b.price - a.price)[0];
  const tips = [];
  if (c.budgetLeft < 0) tips.push(`ใช้เกินเงินเดือน ${baht(-c.budgetLeft)}` + (priciest ? ` ลองตัด "${esc(priciest.name)}" ออกดูไหม` : ''));
  if (worst.gap > 0) tips.push(`ถ้าเกิด "${worst.name}" คุณต้องจ่ายเอง ${baht(worst.gap)} เท่ากับเงินเดือน ${(worst.gap / S.salary).toFixed(1)} เดือน`);
  if (c.budgetLeft >= 0 && worst.gap > 0) tips.push(`ยังมีงบเหลือ ${baht(c.budgetLeft)}/เดือน ลองดูว่าโค้ดประกันตัวไหนช่วยลด gap ได้`);
  if (c.budgetLeft >= 0 && c.totalGap === 0) tips.push('ครอบคลุมครบและไม่เกินงบ 🎉 แต่ชีวิตจริงยังควรมีเงินสำรองฉุกเฉิน 3–6 เดือน');
  tips.push('ไม่จำเป็นต้องอุด gap ให้เป็น 0 ทุกช่อง ให้เริ่มจากความเสี่ยงที่เกิดบ่อยและบิลแพงก่อน');
  const dlg = document.getElementById('summary');
  dlg.innerHTML = `
    <h2>สรุปคำสั่งซื้อ</h2>
    <p>gap ที่ต้องจ่าย</p>
    <div class="big ${c.totalGap > 0 ? 'red' : 'green'}">${baht(c.totalGap)}</div>
    <p>งบคงเหลือต่อเดือน <b class="${c.budgetLeft < 0 ? 'red' : 'green'}">${baht(c.budgetLeft)}</b></p>
    <ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>
    <p class="muted">เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำให้ซื้อผลิตภัณฑ์ใด${DATA.isTestData ? ' · ตัวเลขทดสอบ' : ''}</p>
    <button class="btn" data-close>กลับไปปรับตะกร้า</button>`;
  dlg.showModal();
}

app.addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (e.target.id === 'profile') {
    S.salary = Math.max(1, +f.get('salary'));
    S.sso = f.get('sso') === 'true';
    S.company = f.get('company');
    S.companyAmount = Math.max(0, +f.get('companyAmount') || 0);
    go('shop');
  } else if (e.target.id === 'custom') {
    S.cart.push({ id: 'c' + Date.now(), name: f.get('name').trim(), icon: '🛍️', price: Math.max(0, +f.get('price')) });
    render();
  }
});

app.addEventListener('change', e => {
  const t = e.target;
  if (t.name === 'company') document.getElementById('customBox').hidden = t.value !== 'custom';
  if (t.dataset.price) { S.cart[t.dataset.price].price = Math.max(0, +t.value || 0); render(); }
});

app.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const d = b.dataset;
  if (d.go) go(d.go);
  else if (d.toggle) {
    const i = S.cart.findIndex(x => x.id === d.toggle);
    i >= 0 ? S.cart.splice(i, 1) : S.cart.push({ ...DATA.products.find(p => p.id === d.toggle) });
    render();
  } else if (d.remove) { S.cart.splice(d.remove, 1); render(); }
  else if (d.ins) { S.ins.has(d.ins) ? S.ins.delete(d.ins) : S.ins.add(d.ins); render(); }
  else if ('confirm' in d) showSummary();
});

document.getElementById('summary').addEventListener('click', e => {
  if (e.target.closest('[data-close]')) e.currentTarget.close();
});

render();
