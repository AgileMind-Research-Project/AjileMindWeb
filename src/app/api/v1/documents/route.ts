/**
 * API Route: GET/POST /api/v1/documents
 * Proxies requests to the backend API
 */

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    
    let apiUrl = 'http://localhost:8000/api/v1/documents';
    if (date) {
      apiUrl += `?date=${date}`;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      return Response.json(
        { detail: 'Failed to fetch documents' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return Response.json(
      { detail: 'Error fetching documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');

    const formData = await request.formData();

    const headers: HeadersInit = {};

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch('http://localhost:8000/api/v1/documents/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData = { detail: 'Upload failed' };
      
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
    console.error('Error uploading document:', error);
    return Response.json(
      { detail: error instanceof Error ? error.message : 'Error uploading document' },
      { status: 500 }
    );
  }
}
