import { AccessError, authorize } from "@/services/auth/authorization";

export async function GET(request: Request) {
  // Access request-time data outside catch so Next.js can defer prerendering.
  const requestHeaders = request.headers;
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const { user } = await authorize(requestHeaders);
    // Do not serialize session tokens, IP addresses, or account credentials.
    return Response.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          role: user.role,
        },
      },
      { headers },
    );
  } catch (error) {
    if (error instanceof AccessError) {
      return Response.json(
        { error: error.message },
        { status: error.status, headers },
      );
    }
    console.error("Unable to load authenticated user.");
    return Response.json(
      { error: "Unable to load your account. Please try again." },
      { status: 503, headers },
    );
  }
}
