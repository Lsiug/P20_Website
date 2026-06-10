function p20GetItems(key) {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function p20SaveItems(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function p20AddItem(key, item) {
  const items = p20GetItems(key);
  item.id = Date.now();
  item.publishedDate = new Date().toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
  const user = p20GetUser();
  item.author = user ? user.name : 'Ambassador';
  items.unshift(item);
  p20SaveItems(key, items);
  return item;
}

function p20UpdateItem(key, id, updates) {
  const items = p20GetItems(key);
  const idx = items.findIndex(i => i.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates };
    p20SaveItems(key, items);
  }
}

function p20RemoveItem(key, id) {
  p20SaveItems(key, p20GetItems(key).filter(i => i.id !== id));
}
