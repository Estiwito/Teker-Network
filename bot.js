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

  // 1. Comando /start
  if (text.startsWith('/start')) {
    const responseText = 
      "👑 *Bienvenido a Teker Network*\n\n" +
      "Para consultar tu estatus y saldo, envía tu correo registrado usando:\n" +
      "`/mi_rango tu_email@ejemplo.com`\n\n" +
      "Para analizar un producto para compras comunitarias, usa:\n" +
      "`/sugerir Nombre del producto`\n\n" +
      "Si aún no te has unido, regístrate en nuestra web por 1€.";
    
    await sendTelegramMessage(chatId, responseText);
  }

  // 2. Comando /mi_rango <email>
  else if (text.startsWith('/mi_rango')) {
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
        `🔗 *Tu enlace único:*\n\`https://teker-network.vercel.app/?ref=${profile.referral_code}\``;

      await sendTelegramMessage(chatId, msg);
    }
  }

  // 3. Comando /sugerir <producto> (Integración con Gemini IA)
  else if (text.startsWith('/sugerir')) {
    const product = text.replace('/sugerir', '').trim();

    if (!product) {
      await sendTelegramMessage(chatId, "❌ Indica qué producto quieres. Ej: `/sugerir Paneles solares 500W`");
      return res.status(200).send('OK');
    }

    await sendTelegramMessage(chatId, "🤖 *Analizando producto con IA Teker...* Dame un momento.");

    try {
      const host = req.headers.host;
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      
      const aiResponse = await fetch(`${protocol}://${host}/api/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_name: product })
      });

      const aiData = await aiResponse.json();
      
      const analysisText = aiData.analysis || aiData.error || 'No se pudo obtener el análisis.';
      const replyMsg = `🛍️ *Análisis de Compra Teker Network*\n\n*Producto:* ${product}\n\n${analysisText}`;
      
      await sendTelegramMessage(chatId, replyMsg);

    } catch (e) {
      await sendTelegramMessage(chatId, "⚠️ Hubo un error al procesar el análisis de la IA.");
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