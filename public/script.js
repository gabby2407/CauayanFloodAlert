import { supabase, isSupabaseConfigured, ALERT_ID } from './supabase.js';

const signalElement = document.querySelector('#signal');
const floodElement = document.querySelector('#flood');
const locationsElement = document.querySelector('#locations');
const updatedElement = document.querySelector('#updated');
const notice = document.querySelector('#notice');

function renderAlert(alert) {
  if (!alert) {
    signalElement.textContent = 'No alert published';
    floodElement.textContent = 'No data';
    locationsElement.innerHTML = '<li class="empty-location">No locations reported.</li>';
    updatedElement.textContent = 'Last updated: No published update';
    return;
  }
  signalElement.textContent = alert.signal_level || 'No active signal';
  floodElement.textContent = alert.flood_status || 'Status unavailable';
  document.body.classList.toggle('sunny', alert.signal_level === 'NO ACTIVE SIGNAL');
  locationsElement.replaceChildren();
  const locations = Array.isArray(alert.affected_locations) ? alert.affected_locations :
    (alert.affected_locations || '').split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
  if (!locations.length) {
    const item = document.createElement('li'); item.className = 'empty-location'; item.textContent = 'No affected locations reported.'; locationsElement.append(item);
  } else {
    locations.forEach((location) => { const item = document.createElement('li'); item.textContent = location; locationsElement.append(item); });
  }
  const date = alert.updated_at ? new Date(alert.updated_at) : null;
  updatedElement.textContent = `Last updated: ${date && !Number.isNaN(date.valueOf()) ? date.toLocaleString() : 'Unknown'}`;
}

async function loadAlert() {
  if (!isSupabaseConfigured) {
    notice.textContent = 'Set the Supabase URL and anon key in public/supabase-config.js to load live alerts.';
    notice.classList.add('error'); return;
  }
  const { data, error } = await supabase.from('flood_alerts').select('*').eq('id', ALERT_ID).maybeSingle();
  if (error) {
    notice.textContent = `Unable to load alert: ${error.message}`;
    notice.classList.add('error'); return;
  }
  notice.textContent = '';
  notice.classList.remove('error');
  renderAlert(data);
}

loadAlert();
if (isSupabaseConfigured) {
  supabase.channel('public-flood-alert')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'flood_alerts', filter: `id=eq.${ALERT_ID}` }, loadAlert)
    .subscribe();
  // Keep the public page fresh if Realtime is unavailable or temporarily disconnected.
  window.setInterval(loadAlert, 60000);
}
