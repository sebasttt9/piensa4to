// Script para verificar usuarios de producción
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bggsqbvrpenahcppvuyc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZ3NxYnZycGVuYWhjcHB2dXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NDcyODIsImV4cCI6MjA4MzMyMzI4Mn0.Be2FU3ojJoFuAdiI2bXJ2lErH1SdbVsTpmtevBh9L1c'
);

async function checkUsers() {
  console.log('Verificando usuarios de producción...');

  const users = ['superadmin@datapulse.local', 'admin@datapulse.local'];

  for (const email of users) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email)
      .single();

    if (error) {
      console.log(`❌ Usuario ${email}: No encontrado`);
    } else {
      console.log(`✅ Usuario ${email}: ${data.name} (${data.role})`);
    }
  }
}

checkUsers().catch(console.error);