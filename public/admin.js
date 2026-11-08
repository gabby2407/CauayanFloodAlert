import { supabase, isSupabaseConfigured } from './supabase.js';

const form = document.querySelector('#alert-form');
const message = document.querySelector('#message');
const logout = document.querySelector('#logout');

if (!isSupabaseConfigured) {
  message.textContent = 'Add your Supabase Project URL and anon key in supabase-config.js first.';
  form.querySelector('button[type=submit]').disabled = true;
  logout.disabled = true;
} else {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) location.replace('/login');
  else {
    const { data, error } = await supabase.from('flood_alerts').select('*').eq('id', 1).maybeSingle();
    if (error) message.textContent = `Could not load alert: ${error.message}`;
    if (data) {
      form.elements.signal.value = data.signal_level;
      form.elements.flood.value = data.flood_status;
      form.elements.locations.value = (data.affected_locations || []).join('\n');
    }
  }
  supabase.auth.onAuthStateChange((_event, session) => { if (!session) location.replace('/login'); });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isSupabaseConfigured) return;
  const button = form.querySelector('button[type=submit]'); button.disabled = true; message.textContent = 'Saving alert...'; message.className = 'form-message';
  const locations = form.elements.locations.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const { error } = await supabase.from('flood_alerts').upsert({
    id: 1,
    signal_level: form.elements.signal.value,
    flood_status: form.elements.flood.value,
    affected_locations: locations,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' });
  button.disabled = false;
  if (error) message.textContent = `Could not save alert: ${error.message}`;
  else { message.textContent = 'Alert updated successfully.'; message.classList.add('success'); }
});

logout.addEventListener('click', async () => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.signOut();
  if (error) { message.textContent = `Could not sign out: ${error.message}`; return; }
  location.assign('/');
});
