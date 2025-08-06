import { readChat } from '@util/chat-store';
import { UI_MESSAGE_STREAM_HEADERS } from 'ai';
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream';
// Import or define a function to get the current user ID from the request
import { getCurrentUserId } from '@util/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Get the current authenticated user ID
  const userId = await getCurrentUserId(request);

  if (!userId) {
    // Unauthorized if no user is authenticated
    return new Response('Unauthorized', { status: 401 });
  }

  // Read the chat data
  const chat = await readChat(id);

  // Authorization check: verify the chat belongs to the user
  if (chat.userId !== userId) {
    return new Response('Forbidden', { status: 403 });
  }

  if (chat.activeStreamId == null) {
    // no content response when there is no active stream
    return new Response(null, { status: 204 });
  }

  const streamContext = createResumableStreamContext({
    waitUntil: after,
  });

  return new Response(
    await streamContext.resumeExistingStream(chat.activeStreamId),
    { headers: UI_MESSAGE_STREAM_HEADERS },
  );
}
