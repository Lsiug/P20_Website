async function p20GetItems(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

async function p20AddItem(key, item) {
  const user = p20GetUser();
  const items = await p20GetItems(key);
  const newItem = {
    ...item,
    id: Date.now(),
    author: user ? user.name : 'Ambassador',
    publishedDate: new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    }),
  };
  items.unshift(newItem);
  localStorage.setItem(key, JSON.stringify(items));
  return newItem;
}

async function p20RemoveItem(key, id) {
  const items = await p20GetItems(key);
  localStorage.setItem(key, JSON.stringify(items.filter(i => i.id !== id)));
}

async function p20UpdateItem(key, id, updates) {
  const items = await p20GetItems(key);
  const idx = items.findIndex(i => i.id === id);
  if (idx === -1) return;
  items[idx] = { ...items[idx], ...updates };
  localStorage.setItem(key, JSON.stringify(items));
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
