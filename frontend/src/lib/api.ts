export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`API Error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    // Set prototype explicitly for correct instanceof behavior in ES5
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  const headers = new Headers(options.headers);
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  let body: unknown = null;
  const contentType =
    response.headers.get("Content-Type") ||
    response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    body = await response.json();
  } else {
    const text = await response.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body;
}

export const api = {
  get(path: string, options?: RequestInit) {
    return request(path, { ...options, method: "GET" });
  },
  post(path: string, body?: unknown, options?: RequestInit) {
    return request(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  put(path: string, body?: unknown, options?: RequestInit) {
    return request(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },
  delete(path: string, options?: RequestInit) {
    return request(path, { ...options, method: "DELETE" });
  },
};
