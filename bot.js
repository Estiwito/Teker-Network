import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).send('Bot activo');

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).send('OK');

  const chatId = message.chat.id;
  const text = message.text.trim();

  // Comando /start
  if (text.startsWith('/start')) {
    const responseText = 
      "👑 *Bienvenido a Teker Network*\n\n" +
      "Para consultar tu estatus y saldo, envía tu correo registrado usando:\n" +
      "`/mi_rango tu_email@ejemplo.com`\n\n" +
      "Si aún no te has unido, regístrate en nuestra web por 1€.";
    
    await sendTelegramMessage(chatId, responseText);
  }

  // Comando /mi_rango
  if (text.startsWith('/mi_rango')) {
    const email = text.split(' ')[1];

    if (!email) {
      await sendTelegramMessage(chatId, "❌ Debes incluir tu email. Ej: `/mi_rango tu@email.com`");
      return res.status(200).send('OK');
    }

    // Consultar perfil en Supabase
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (!profile) {
      await sendTelegramMessage(chatId, "⚠️ No encontramos esa cuenta. Regístrate en la web primero.");
    } else {
      const msg = 
        `🛡️ *Perfil Teker Network*\n\n` +
        `👤 *Rango:* ${profile.rank}\n` +
        `🪙 *Tokens Teker:* ${profile.tokens_balance}\n` +
        `👥 *Referidos:* ${profile.referral_count}\n\n` +
        `🔗 *Tu enlace único:*\n\`https://tucomunidad.vercel.app?ref=${profile.referral_code}\``;

      await sendTelegramMessage(chatId, msg);
    }
  }

  return res.status(200).send('OK');
}

async function sendTelegramMessage(chatId, text) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    })
  });
}