/**
 * Health Check Endpoint
 * Used by Kubernetes liveness and readiness probes
 */
export async function GET() {
  return Response.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'frontend-web',
    },
    { status: 200 }
  );
}
