/**
 * API Route: GET /api/v1/documents/dates
 * Fetches available document upload dates
 */

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch('http://localhost:8000/api/v1/documents/dates', {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return Response.json(
        { detail: 'Failed to fetch document dates' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching document dates:', error);
    return Response.json(
      { detail: 'Error fetching document dates' },
      { status: 500 }
    );
  }
}
