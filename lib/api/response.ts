import type { NextRequest } from "next/server";

export type ApiError = { status: number; message: string; fields?: Record<string, string[]> };

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status: number, fields?: ApiError["fields"]): Response {
  return json({ error: { message, ...(fields ? { fields } : {}) } }, status);
}

export async function readBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw Object.assign(new Error("Invalid JSON body"), { statusCode: 400 } as const);
  }
}

export function getSearchParam(req: NextRequest, name: string): string | null {
  return new URL(req.url).searchParams.get(name);
}

export function requireBody<T>(body: unknown, schema: { parse: (input: unknown) => T }): T {
  try {
    return schema.parse(body);
  } catch (err: any) {
    if (err?.issues) {
      const fields: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const path = issue.path.join(".");
        (fields[path] = fields[path] || []).push(issue.message);
      }
      throw Object.assign(new Error("Validation failed"), {
        statusCode: 400,
        fields,
      } as const);
    }
    throw Object.assign(new Error("Invalid request body"), { statusCode: 400 } as const);
  }
}
