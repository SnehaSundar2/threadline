process.env.DATA_DIR = require('os').tmpdir() + '/tl-test-' + Date.now();
const assert = require('assert');
const app = require('./server');
const srv = app.listen(0, async () => {
  const base = `http://localhost:${srv.address().port}`;
  const j = (p, o) => fetch(base + p, o).then(async r => ({ s: r.status, b: await r.json().catch(() => null) }));
  const post = body => j('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  try {
    assert.strictEqual((await j('/api/health')).s, 200);
    const all = await j('/api/products'); assert.strictEqual(all.b.length, 12);
    assert.ok((await j('/api/products?category=Polo')).b.every(p => p.cat === 'Polo'));
    assert.strictEqual((await j('/api/products/999')).s, 404);
    const c = { name: 'Test', email: 't@example.com', address: '1 Street' };
    assert.strictEqual((await post({ customer: c, items: [] })).s, 400);
    assert.strictEqual((await post({ customer: { ...c, email: 'bad' }, items: [{ id: 1, color: 'Black', size: 'M', qty: 1 }] })).s, 400);
    assert.strictEqual((await post({ customer: c, items: [{ id: 1, color: 'Pink', size: 'M', qty: 1 }] })).s, 400);
    const ok = await post({ customer: c, items: [{ id: 1, color: 'Black', size: 'M', qty: 1, price: 0.01 }] });
    assert.strictEqual(ok.s, 201); assert.strictEqual(ok.b.subtotal, 24); assert.strictEqual(ok.b.shipping, 5);
    const free = await post({ customer: c, items: [{ id: 4, color: 'Navy', size: 'L', qty: 2 }] });
    assert.strictEqual(free.b.total, 88);
    console.log('All API tests passed');
  } catch (e) { console.error(e); process.exitCode = 1; } finally { srv.close(); }
});
