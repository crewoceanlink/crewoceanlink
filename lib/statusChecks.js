export async function checkMikrotikStatus() {
  const host = process.env.MIKROTIK_HOST || "192.168.88.1";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`http://${host}`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return res.ok || res.status === 401 || res.status === 403;
  } catch {
    return false;
  }
}

export async function checkStarlinkStatus() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch("https://www.google.com", {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return res.ok;
  } catch {
    return false;
  }
}