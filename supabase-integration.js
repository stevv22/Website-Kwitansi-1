/* Integrasi opsional untuk aplikasi Kwitansi HDI. */
(function () {
  'use strict';
  var client = null, timer = null, enabled = false;
  function configured() {
    var c = window.HDI_SUPABASE_CONFIG || {};
    return c.url && c.anonKey && c.url.indexOf('ISI_') !== 0 && c.anonKey.indexOf('ISI_') !== 0;
  }
  function snapshot() {
    return {
      products: Array.isArray(window.P) ? window.P : [],
      names: Array.isArray(window.NM) ? window.NM : [],
      transactions: Array.isArray(window.TX) ? window.TX : [],
      updated_at: new Date().toISOString()
    };
  }
  async function saveNow() {
    if (!enabled || !client) return;
    var result = await client.from('hdi_app_state').upsert({
      id: 'main', payload: snapshot(), updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (result.error) console.error('[Supabase] Gagal menyimpan:', result.error.message);
  }
  async function loadRemote() {
    if (!enabled || !client) return;
    var result = await client.from('hdi_app_state').select('payload').eq('id', 'main').maybeSingle();
    if (result.error) { console.error('[Supabase] Gagal memuat:', result.error.message); return; }
    var data = result.data && result.data.payload;
    if (!data) { await saveNow(); return; }
    // Remote menjadi sumber data utama hanya jika berisi data yang valid.
    if (Array.isArray(data.products) && data.products.length) {
      window.P = data.products;
      try { localStorage.setItem('hdi_p2', JSON.stringify(window.P)); } catch (e) {}
    }
    if (Array.isArray(data.names)) {
      window.NM = data.names;
      try { localStorage.setItem('hdi_names', JSON.stringify(window.NM)); } catch (e) {}
    }
    if (Array.isArray(data.transactions)) {
      window.TX = data.transactions;
      try { localStorage.setItem('hdi_tx', JSON.stringify(window.TX)); } catch (e) {}
    }
    try {
      if (typeof window.q !== 'undefined') window.q = window.P.map(function(){ return 0; });
      if (typeof window.fillKls === 'function') window.fillKls('');
      ['draw','drawProd','drawNama','drawRiw','drawData','render'].forEach(function (name) {
        if (typeof window[name] === 'function') window[name]();
      });
      if (typeof window.toast === 'function') window.toast('Data berhasil dimuat dari Supabase.');
    } catch (e) { console.error('[Supabase] Tampilan gagal diperbarui:', e); }
  }
  window.HDISupabase = {
    scheduleSave: function () {
      if (!enabled) return;
      clearTimeout(timer);
      timer = setTimeout(function(){ saveNow().catch(function(e){console.error('[Supabase]', e);}); }, 700);
    },
    syncNow: saveNow,
    isEnabled: function(){ return enabled; }
  };
  window.addEventListener('DOMContentLoaded', function () {
    if (!configured()) {
      console.info('[Supabase] Belum aktif. Isi supabase-config.js untuk mengaktifkan sinkronisasi.');
      return;
    }
    if (!window.supabase || !window.supabase.createClient) {
      console.error('[Supabase] Library Supabase gagal dimuat. Periksa koneksi internet.'); return;
    }
    var c = window.HDI_SUPABASE_CONFIG;
    client = window.supabase.createClient(c.url, c.anonKey);
    enabled = true;
    loadRemote().catch(function(e){ console.error('[Supabase] Gagal memuat:', e); });
  });
})();
