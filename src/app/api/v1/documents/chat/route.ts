/**
 * API Route: POST /api/v1/documents/chat
 * Proxies chat requests to the backend RAG API
 */

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch('http://localhost:8000/api/v1/documents/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData = { detail: 'Chat request failed' };
      
      if (contentType?.includes('application/json')) {
        try {
          errorData = await response.json();
        } catch {
          errorData = { detail: await response.text() };
        }
      }

      return Response.json(
        errorData,
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error calling chat API:', error);
    return Response.json(
      { detail: error instanceof Error ? error.message : 'Error calling chat API' },
      { status: 500 }
    );
  }
}
