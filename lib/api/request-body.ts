import "server-only";

export class RequestBodyTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Request body exceeds ${maxBytes} bytes.`);
    this.name = "RequestBodyTooLargeError";
  }
}

export class InvalidJsonBodyError extends Error {
  constructor() {
    super("Request body is not valid JSON.");
    this.name = "InvalidJsonBodyError";
  }
}

export async function readJsonBodyWithLimit(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const contentLengthHeader =
    request.headers.get("content-length");

  if (contentLengthHeader) {
    const contentLength =
      Number(contentLengthHeader);

    if (
      Number.isFinite(contentLength) &&
      contentLength > maxBytes
    ) {
      throw new RequestBodyTooLargeError(
        maxBytes,
      );
    }
  }

  if (!request.body) {
    throw new InvalidJsonBodyError();
  }

  const reader =
    request.body.getReader();

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const {
        done,
        value,
      } = await reader.read();

      if (done) {
        break;
      }

      if (!value) {
        continue;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maxBytes) {
        await reader
          .cancel()
          .catch(() => undefined);

        throw new RequestBodyTooLargeError(
          maxBytes,
        );
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body =
    new Uint8Array(totalBytes);

  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  const text =
    new TextDecoder().decode(body);

  if (!text.trim()) {
    throw new InvalidJsonBodyError();
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidJsonBodyError();
  }
}
