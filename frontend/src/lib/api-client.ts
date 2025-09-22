// api client
const API = "https://client-portal.qilife.workers.dev";
let accessToken: string | null = null;
let refreshing: Promise<string> | null = null;

export function setToken(t: string|null){ accessToken = t; }

async function refresh() {
  if (!refreshing) {
    refreshing = fetch(API+"/api/auth/refresh", {
      method:"POST", headers:{authorization:`Bearer ${accessToken}`}
    })
    .then(r => r.ok ? r.json() : Promise.reject(r))
    .then(({token}:{token:string}) => { accessToken = token; return token; })
    .finally(()=> { refreshing = null; });
  }
  return refreshing;
}

export async function api(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  let res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    await refresh().catch(()=>{ setToken(null); throw new Error("unauthorized"); });
    const h2 = new Headers(init.headers);
    if (accessToken) h2.set("authorization", `Bearer ${accessToken}`);
    res = await fetch(url, { ...init, headers: h2 });
  }
  if (!res.ok) throw new Error(String(res.status));
  return res.status === 204 ? null : res.json();
}
