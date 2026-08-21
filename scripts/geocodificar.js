/**
 * geocodificar.js
 * Busca todos os empreendimentos sem lat/lng e geocodifica
 * usando Nominatim (OpenStreetMap) — grátis, sem API key
 *
 *   node scripts/geocodificar.js
 */
const API   = 'https://soconstrutoras-production.up.railway.app/api/v1';
const ADMIN_EMAIL = 'admin@soconstrutoras.com.br';
const ADMIN_SENHA = 'Admin@2024';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function api(url, opts = {}) {
  const res = await fetch(`${API}${url}`, opts);
  const txt = await res.text();
  try { return { status: res.status, data: JSON.parse(txt) }; }
  catch { return { status: res.status, data: txt }; }
}

async function geocode(bairro, cidade, estado) {
  const query = [bairro, cidade, estado, 'Brasil']
    .filter(Boolean)
    .filter(v => v !== cidade || v === cidade)  // dedupe genérico
    .join(', ');
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=br`;
  const res = await fetch(url, { headers: { 'User-Agent': 'SoConstrutoras/1.0' } });
  const data = await res.json();
  if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  // fallback: só cidade
  const url2 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cidade + ', ' + estado + ', Brasil')}&format=json&limit=1&countrycodes=br`;
  const res2 = await fetch(url2, { headers: { 'User-Agent': 'SoConstrutoras/1.0' } });
  const data2 = await res2.json();
  if (data2?.[0]) return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };
  return null;
}

async function main() {
  console.log('🗺️  Geocodificando empreendimentos...\n');

  // Login como admin
  const login = await api('/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_SENHA }),
  });
  if (!login.data?.access_token) throw new Error('Admin login falhou: ' + JSON.stringify(login.data));
  const TOKEN = login.data.access_token;
  console.log('✅ Admin logado\n');

  // Buscar todos os empreendimentos (admin)
  const list = await api('/empreendimentos/admin/listar', { headers: { Authorization: `Bearer ${TOKEN}` } });
  const emps = Array.isArray(list.data) ? list.data : (list.data?.data ?? []);
  console.log(`Total: ${emps.length} empreendimentos`);

  const semCoord = emps.filter(e => !e.lat || !e.lng);
  console.log(`Sem coordenadas: ${semCoord.length}\n`);

  let ok = 0, falha = 0;

  for (const emp of semCoord) {
    const bairro = emp.bairro !== emp.cidade ? emp.bairro : null;
    const coords = await geocode(bairro, emp.cidade || 'Belo Horizonte', emp.estado || 'MG');
    await sleep(1100); // respeitar rate limit Nominatim (1 req/s)

    if (!coords) {
      console.log(`  ⚠ [${emp.id}] ${emp.nome} — não geocodificado`);
      falha++;
      continue;
    }

    const upd = await api(`/empreendimentos/${emp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ lat: coords.lat, lng: coords.lng }),
    });

    if (upd.status === 200 || upd.data?.id) {
      console.log(`  ✅ ${emp.nome} → ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
      ok++;
    } else {
      console.log(`  ✗ ${emp.nome} — erro: ${JSON.stringify(upd.data).slice(0,80)}`);
      falha++;
    }
  }

  console.log(`\n✅ ${ok} geocodificados  |  ⚠ ${falha} sem coordenada`);
}

main().catch(err => { console.error(err); process.exit(1); });
