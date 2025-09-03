export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response('Missing unsubscribe token', { status: 400 });
  }
  
  try {
    const result = await env.NEWSLETTER_DB.prepare(
      'UPDATE subscribers SET active = FALSE WHERE unsubscribe_token = ?'
    ).bind(token).run();
    
    if (result.changes === 0) {
      return new Response('Invalid unsubscribe token', { status: 404 });
    }
    
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            a { color: #007cba; }
          </style>
        </head>
        <body>
          <h1>Successfully Unsubscribed</h1>
          <p>You've been removed from our newsletter.</p>
          <a href="/">Return to site</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
    
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response('Error processing request', { status: 500 });
  }
}