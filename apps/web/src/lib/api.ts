export async function apiGet<T>(url: string, token: string): Promise<T> {
  const r = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}
export async function apiPost<T>(url: string, body: unknown, token: string): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok && r.status !== 201) throw new Error(`${r.status}`);
  return r.status === 204 ? (undefined as T) : (await r.json());
}
