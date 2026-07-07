import "server-only";

const ACCOUNT_ID = process.env.CF_ACCOUNT_ID?.trim();
const DATABASE_ID = process.env.CF_D1_DATABASE_ID?.trim();
const API_TOKEN = process.env.CF_API_TOKEN?.trim();

export function cloudEnabled() {
  return Boolean(ACCOUNT_ID && DATABASE_ID && API_TOKEN);
}

type D1Result<T> = {
  results: T[];
  success: boolean;
};

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!cloudEnabled()) {
    throw new Error("Cloudflare D1 no está configurado (faltan CF_ACCOUNT_ID / CF_D1_DATABASE_ID / CF_API_TOKEN).");
  }
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as {
    success: boolean;
    errors?: Array<{ message: string }>;
    result?: D1Result<T>[];
  };

  if (!response.ok || !payload.success) {
    const detail = payload.errors?.map((error) => error.message).join("; ") || response.statusText;
    throw new Error(`D1 query failed: ${detail}`);
  }

  return payload.result?.[0]?.results ?? [];
}
