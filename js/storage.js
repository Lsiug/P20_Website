/* Thin async wrapper around the Express/SQLite API. */

async function p20GetItems(key) {
  const res = await fetch(`/api/store/${encodeURIComponent(key)}`);
  return res.ok ? res.json() : [];
}

async function p20AddItem(key, item) {
  const user = p20GetUser();
  const payload = {
    ...item,
    author: user ? user.name : 'Ambassador',
    publishedDate: new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    }),
  };
  const res = await fetch(`/api/store/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.ok ? res.json() : null;
}

async function p20RemoveItem(key, id) {
  await fetch(`/api/store/${encodeURIComponent(key)}/${id}`, { method: 'DELETE' });
}

async function p20UpdateItem(key, id, updates) {
  const items = await p20GetItems(key);
  const item = items.find(i => i.id === id);
  if (!item) return;
  await p20RemoveItem(key, id);
  await p20AddItem(key, { ...item, ...updates });
}

/* Ambassador-specific helpers */

async function p20GetAmbassadors(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/ambassadors${qs ? '?' + qs : ''}`);
  return res.ok ? res.json() : [];
}

async function p20AddAmbassador(data) {
  const user = p20GetUser();
  const res = await fetch('/api/ambassadors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, author: user ? user.name : 'Ambassador' }),
  });
  return res.ok ? res.json() : null;
}

async function p20DeleteAmbassador(id) {
  await fetch(`/api/ambassadors/${id}`, { method: 'DELETE' });
}
