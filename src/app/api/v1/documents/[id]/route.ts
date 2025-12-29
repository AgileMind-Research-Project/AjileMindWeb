/**
 * API Route: DELETE /api/v1/documents/[id]
 * Proxies document deletion requests to the backend
 */

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const { id } = params;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const response = await fetch(`http://localhost:8000/api/v1/documents/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorData = { detail: 'Delete failed' };
      
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

    return Response.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return Response.json(
      { detail: 'Error deleting document' },
      { status: 500 }
    );
  }
}
