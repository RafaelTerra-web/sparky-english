import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";
import {
  CHALLENGE_COOKIE,
  SESSION_COOKIE,
  SESSION_SECONDS,
  cookieOptions,
  emailAllowed,
  googleConfigured,
  makeNonce,
  sameOrigin,
  sameValue,
  seal,
  unseal,
} from "@/lib/auth-session";

const verifier = new OAuth2Client();
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  if (!googleConfigured())
    return NextResponse.json(
      { error: "A entrada com Google está sendo configurada." },
      { status: 503, headers },
    );
  const nonce = makeNonce();
  const response = NextResponse.json(
    { clientId: process.env.SPARKY_GOOGLE_CLIENT_ID, nonce },
    { headers },
  );
  response.cookies.set(
    CHALLENGE_COOKIE,
    await seal({ nonce }, "google-challenge", 600),
    { ...cookieOptions, maxAge: 600 },
  );
  return response;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origem inválida." },
      { status: 403, headers },
    );
  if (!googleConfigured())
    return NextResponse.json(
      { error: "A entrada com Google está sendo configurada." },
      { status: 503, headers },
    );
  if (Number(request.headers.get("content-length") ?? 0) > 20000)
    return NextResponse.json(
      { error: "Solicitação inválida." },
      { status: 413, headers },
    );
  const body = await request.json().catch(() => null);
  const challenge = await unseal(
    request.cookies.get(CHALLENGE_COOKIE)?.value,
    "google-challenge",
  );
  if (
    !challenge ||
    !sameValue(body?.nonce, challenge.nonce) ||
    typeof body?.credential !== "string" ||
    body.credential.length > 16000
  ) {
    return NextResponse.json(
      {
        error:
          "A tentativa de entrada expirou. Atualize a página e tente novamente.",
      },
      { status: 401, headers },
    );
  }
  try {
    const ticket = await verifier.verifyIdToken({
      idToken: body.credential,
      audience: process.env.SPARKY_GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const tokenNonce = (payload as typeof payload & { nonce?: string })?.nonce;
    if (
      !payload?.sub ||
      payload.email_verified !== true ||
      !payload.email ||
      !sameValue(tokenNonce, challenge.nonce)
    )
      throw new Error("Invalid identity");
    if (!emailAllowed(payload.email)) {
      const denied = NextResponse.json(
        {
          error:
            "Esse e-mail ainda não tem convite. Entre com o e-mail autorizado pelo administrador.",
        },
        { status: 403, headers },
      );
      denied.cookies.set(CHALLENGE_COOKIE, "", { ...cookieOptions, maxAge: 0 });
      return denied;
    }
    const user = {
      id: payload.sub,
      email: payload.email.toLowerCase(),
      name: (payload.given_name || payload.name || "Estudante").slice(0, 80),
    };
    const response = NextResponse.json(
      { authenticated: true, user },
      { headers },
    );
    response.cookies.set(
      SESSION_COOKIE,
      await seal(
        { sub: user.id, email: user.email, name: user.name },
        "session",
        SESSION_SECONDS,
      ),
      { ...cookieOptions, maxAge: SESSION_SECONDS },
    );
    response.cookies.set(CHALLENGE_COOKIE, "", { ...cookieOptions, maxAge: 0 });
    response.cookies.set("sparky_access", "", { ...cookieOptions, maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json(
      {
        error:
          "Não foi possível validar sua conta Google. Tente entrar novamente.",
      },
      { status: 401, headers },
    );
  }
}
