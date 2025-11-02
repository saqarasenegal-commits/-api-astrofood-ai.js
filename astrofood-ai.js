
// api/astrofood-ai.js
export const runtime = 'edge'; // Exécution rapide sur le Edge Network

export default async function handler(req) {
  // Autoriser les appels cross-origin (depuis ton site ou GitHub Pages)
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

  // Rejeter les méthodes autres que POST
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
    return new Response(
      JSON.stringify({ error: 'Missing OPENAI_API_KEY on server' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const systemPrompt =
    "Tu es Chef-AI d’AstroFood. Tu donnes des recettes courtes, structurées, avec ingrédients et étapes, adaptées au signe demandé, avec un ton chaleureux et poétique.";

  let userPrompt = message;
  if (mode === 'recipe') {
    userPrompt = `Génère une recette AstroFood pour le signe ${sign || 'Bélier'} en langue ${lang}. 
Format : 1) Nom du plat, 2) Brève introduction, 3) Ingrédients, 4) Étapes de préparation, 5) Astuce astro.`;
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
    const err = await openaiRes.text();
    return new Response(JSON.stringify({ error: 'OpenAI error', detail: err }), {
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
