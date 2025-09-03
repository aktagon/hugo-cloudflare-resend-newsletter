import { randomUUID } from 'crypto';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response("Invalid email", { status: 400 });
    }

    const unsubscribeToken = randomUUID();

    await env.NEWSLETTER_DB.prepare(
      "INSERT OR REPLACE INTO subscribers (email, unsubscribe_token, active) VALUES (?, ?, TRUE)"
    )
      .bind(email, unsubscribeToken)
      .run();

    return new Response("Subscribed!", { status: 200 });
  } catch (error) {
    console.error("Subscription error:", error);
    return new Response("Error", { status: 500 });
  }
}