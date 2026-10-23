export async function POST(request: Request) {
  const body = (await request.json()) as { role?: string };
  const role = body.role;

  if (!role) {
    return Response.json({ ok: false, error: 'Role is required.' }, { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `pg_role=${encodeURIComponent(role)}; Path=/; SameSite=Lax${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`,
    },
  });
}
