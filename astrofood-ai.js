export const runtime = 'edge';

export default async function handler(req) {
  // Préflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = await req.json().catch(() => ({}));
  const { mode = 'chat', message = '', sign = '', lang = 'fr' } = body;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY on server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const systemPrompt =
    "Tu es Chef-AI d'AstroFood. Tu donnes des recettes courtes, structurées, avec ingrédients + étapes, adaptées au signe demandé, en gardant le ton chaleureux.";

  let userPrompt = message;
  if (mode === 'recipe') {
    userPrompt =
      `Génère une recette AstroFood pour le signe ${sign || 'Bélier'} en langue ${lang}. ` +
      `Format: 1) Nom, 2) Intro courte, 3) Ingrédients (liste), 4) Préparation (étapes numérotées), 5) Astuce astro.`;
  }

  const openaiRes = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5-chat-latest',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    return new Response(JSON.stringify({ error: 'OpenAI error', detail: errText }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await openaiRes.json();
  let text = '';
  try {
    text = data.output[0].content[0].text;
  } catch (e) {
    text = JSON.stringify(data);
  }

  return new Response(JSON.stringify({ ok: true, text }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
