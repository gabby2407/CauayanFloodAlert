import { supabase, isSupabaseConfigured } from './supabase.js';

const form = document.querySelector('#login-form');
const message = document.querySelector('#message');
if (!isSupabaseConfigured) message.textContent = 'Add your Supabase Project URL and anon key in supabase-config.js first.';
else {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) location.replace('/admin');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!isSupabaseConfigured) return;
  const button = form.querySelector('button'); button.disabled = true; message.textContent = 'Signing in…';
  const { error } = await supabase.auth.signInWithPassword({
    email: form.elements.email.value.trim(), password: form.elements.password.value
  });
  if (error) { message.textContent = error.message; button.disabled = false; return; }
  location.assign('/admin');
});
