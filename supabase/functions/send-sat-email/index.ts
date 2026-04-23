const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-mail-token',
};

type CorreoPayload = {
  to?: string;
  subject?: string;
  text?: string;
  pdfUrl?: string;
  parteId?: string;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Metodo no permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const requiredToken = Deno.env.get('MAIL_FUNCTION_TOKEN');
  if (requiredToken) {
    const token = req.headers.get('x-mail-token');
    if (token !== requiredToken) {
      return new Response(JSON.stringify({ error: 'Token invalido' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  let body: CorreoPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const destino = (body.to || Deno.env.get('SAT_TO_EMAIL') || 'sat@cotepa.com').trim();
  const asunto = (body.subject || 'Informe SAT').trim();
  const texto = (body.text || '').trim();
  const pdfUrl = (body.pdfUrl || '').trim();

  if (!destino || !asunto || !texto || !pdfUrl) {
    return new Response(JSON.stringify({ error: 'Campos requeridos faltantes' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('SAT_FROM_EMAIL');

  if (!resendApiKey || !fromEmail) {
    return new Response(JSON.stringify({ error: 'Faltan secrets RESEND_API_KEY o SAT_FROM_EMAIL' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const html = [
    '<p>Se genero un nuevo informe de parte de trabajo SAT.</p>',
    `<p><strong>Parte:</strong> ${body.parteId || 'sin-id'}</p>`,
    `<p><strong>PDF:</strong> <a href="${pdfUrl}">${pdfUrl}</a></p>`,
  ].join('');

  const respuestaResend = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [destino],
      subject: asunto,
      text: `${texto}\n\nPDF: ${pdfUrl}`,
      html,
    }),
  });

  const data = await respuestaResend.json().catch(() => ({}));

  if (!respuestaResend.ok) {
    return new Response(JSON.stringify({ error: 'Fallo envio con proveedor', detalle: data }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true, provider: 'resend', data }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
