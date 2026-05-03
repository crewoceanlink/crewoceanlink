export default async function handler(req, res) {
  const cookies = req.headers.cookie || "";
  const isAdmin = cookies.includes("admin_auth=true");

  if (!isAdmin) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  const key = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

  try {
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    return res.status(200).json({
      success: true,
      supabaseUrl: url,
      hasKey: Boolean(key),
      status: response.status,
      statusText: response.statusText,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      supabaseUrl: url,
      hasKey: Boolean(key),
      error: err.message,
    });
  }
}