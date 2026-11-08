import { supabase, isSupabaseConfigured, ALERT_ID } from './supabase.js';

const form = document.querySelector('#alert-form');
const message = document.querySelector('#message');
const saveButton = form.querySelector('button[type=submit]');
const logoutButton = document.querySelector('#logout');

let isReady = false;
let hasLocalEdits = false;

// Attach handlers immediately, so slow Supabase reads cannot swallow clicks.
form.addEventListener('input', () => { hasLocalEdits = true; });
form.addEventListener('change', () => { hasLocalEdits = true; });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isSupabaseConfigured) {
    message.textContent = 'Configure Supabase before saving alerts.';
    return;
  }
  if (!isReady) {
    message.textContent = 'Checking your admin session. Please try again in a moment.';
    return;
  }

  saveButton.disabled = true;
  message.textContent = 'Saving alert...';
  message.className = 'form-message';
  const locations = form.elements.locations.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);

  try {
    const { error } = await supabase.from('flood_alerts').upsert({
      id: ALERT_ID,
      signal_level: form.elements.signal.value,
      flood_status: form.elements.flood.value,
      affected_locations: locations,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });

    if (error) message.textContent = `Could not save alert: ${error.message}`;
    else {
      message.textContent = 'Alert updated successfully.';
      message.classList.add('success');
      hasLocalEdits = false;
    }
  } catch (error) {
    message.textContent = `Could not save alert: ${error.message || 'Network request failed.'}`;
  } finally {
    saveButton.disabled = false;
  }
});

logoutButton.addEventListener('click', async () => {
  if (!isSupabaseConfigured) return;
  logoutButton.disabled = true;
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      message.textContent = `Could not sign out: ${error.message}`;
      logoutButton.disabled = false;
      return;
    }
    location.assign('/');
  } catch (error) {
    message.textContent = `Could not sign out: ${error.message || 'Network request failed.'}`;
    logoutButton.disabled = false;
  }
});

async function initializeDashboard() {
  if (!isSupabaseConfigured) {
    message.textContent = 'Add your Supabase Project URL and anon key in supabase-config.js first.';
    saveButton.disabled = true;
    logoutButton.disabled = true;
    return;
  }

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      location.replace('/login');
      return;
    }

    isReady = true;
    supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!currentSession) location.replace('/login');
    });

    const { data, error } = await supabase.from('flood_alerts').select('*').eq('id', ALERT_ID).maybeSingle();
    if (error) {
      message.textContent = `Could not load alert: ${error.message}`;
      return;
    }
    // Do not replace text the admin has already started entering.
    if (data && !hasLocalEdits) {
      form.elements.signal.value = data.signal_level;
      form.elements.flood.value = data.flood_status;
      form.elements.locations.value = (data.affected_locations || []).join('\n');
    }
  } catch (error) {
    message.textContent = `Could not initialize admin dashboard: ${error.message || 'Network request failed.'}`;
  }
}

initializeDashboard();
