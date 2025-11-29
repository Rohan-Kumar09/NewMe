import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const tests = [
    "https://www.google.com",
    "https://vision.googleapis.com",
    "https://generativelanguage.googleapis.com",
  ];

  const results: any[] = [];

  for (const url of tests) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, { method: "GET", signal: controller.signal });
      clearTimeout(id);

      results.push({
        url,
        ok: true,
        status: res.status,
        statusText: res.statusText,
      });
    } catch (e: any) {
      results.push({
        url,
        ok: false,
        errorName: e?.name,
        errorMessage: e?.message,
        errorCode: e?.code,
      });
    }
  }

  return NextResponse.json(results);
}
