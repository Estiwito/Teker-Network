export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { product_name } = req.body;

  if (!product_name) {
    return res.status(400).json({ error: 'Falta el nombre del producto' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la GEMINI_API_KEY' });
  }

  const prompt = `
    Actúa como un experto en compras masivas e importación para el club de compras Teker Network.
    Analiza la sugerencia de compra de un miembro: "${product_name}".

    Proporciona un análisis breve en formato texto plano con la siguiente estructura:
    1. Categoria general del producto.
    2. Estimación de volumen mínimo (MOQ) para obtener precios directos de fábrica.
    3. Recomendación de dónde buscar el fabricante (ej: España, UE, Asia).
    4. Estimación del porcentaje de ahorro potencial respecto al PVP de mercado.
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No se pudo generar el análisis.';

    return res.status(200).json({ analysis: resultText });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}