import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

globalThis.securityAlertCache = globalThis.securityAlertCache || {}

async function sendTelegramSecurityAlert(alert) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
    return
  }

  const text =
    `🚨 CrewOceanLink Security Alert\n\n` +
    `Ship: ${alert.ship_name}\n` +
    `Status: ${alert.status}\n\n` +
    `Voucher Usage: ${alert.voucher_gb} GB\n` +
    `Router Usage: ${alert.router_gb} GB\n` +
    `Deviation: ${alert.deviation_percent}%\n\n` +
    `Time: ${new Date().toISOString()}`

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    }
  )

  const result = await response.json()

  if (!response.ok) {
    console.error('TELEGRAM SECURITY ALERT ERROR:', result)
  }
}

export default async function handler(req, res) {
  const cookies = req.headers.cookie || ''
  const isAdmin = cookies.includes('admin_auth=true')

  if (!isAdmin) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized',
    })
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed',
    })
  }

  try {
    const { data: ships, error: shipsError } = await supabase
      .from('ships')
      .select('*')

    if (shipsError) throw shipsError

    const results = []

    for (const ship of ships || []) {
      const { data: vouchers, error: vouchersError } = await supabase
        .from('crew_vouchers')
        .select('gb_used')
        .eq('ship_id', ship.id)

      if (vouchersError) throw vouchersError

      const voucherGB = (vouchers || []).reduce(
        (sum, v) => sum + Number(v.gb_used || 0),
        0
      )

      const { data: routerRows, error: routerError } = await supabase
        .from('router_usage')
        .select('bytes_total')
        .eq('ship_id', ship.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (routerError) throw routerError

      const routerBytes = Number(routerRows?.[0]?.bytes_total || 0)
      const routerGB = routerBytes / 1024 / 1024 / 1024

const { data: starlinkRows, error: starlinkError } = await supabase
  .from('starlink_usage')
  .select('bytes_total, timestamp')
  .eq('ship_id', ship.id)
  .order('timestamp', { ascending: true })

if (starlinkError) throw starlinkError

let starlinkBytes = 0

for (let i = 1; i < (starlinkRows || []).length; i++) {
  const prev = Number(starlinkRows[i - 1].bytes_total || 0)
  const curr = Number(starlinkRows[i].bytes_total || 0)

  if (curr >= prev) {
    starlinkBytes += curr - prev
  } else {
    starlinkBytes += curr
  }
}

const starlinkGB = starlinkBytes / 1024 / 1024 / 1024

      // High Usage Check: Verbrauch in den letzten 5 Minuten
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

      const { data: recentRows, error: recentError } = await supabase
        .from('router_usage')
        .select('bytes_total, created_at')
        .eq('ship_id', ship.id)
        .gte('created_at', fiveMinutesAgo.toISOString())
        .order('created_at', { ascending: true })

      if (recentError) throw recentError

      let highUsageGB = 0

      if (recentRows && recentRows.length >= 2) {
        const firstBytes = Number(recentRows[0].bytes_total || 0)
        const lastBytes = Number(recentRows[recentRows.length - 1].bytes_total || 0)
        const diffBytes = lastBytes - firstBytes

        if (diffBytes > 0) {
          highUsageGB = diffBytes / 1024 / 1024 / 1024
        }
      }

      let highUsageStatus = 'GREEN'

      if (highUsageGB > 1) {
        highUsageStatus = 'RED'
      } else if (highUsageGB > 0.5) {
        highUsageStatus = 'YELLOW'
      }

      const absoluteDiff = Math.abs(routerGB - voucherGB)

      let deviationPercent = 0
      let status = 'GREEN'

      // 👉 Minimum Traffic Filter (wichtig!)
      if (routerGB < 2) {
        deviationPercent = 0
        status = 'GREEN'
      } else {
        deviationPercent = (absoluteDiff / routerGB) * 100

        if (absoluteDiff < 0.1) {
          status = 'GREEN'
        } else if (deviationPercent < 5) {
          status = 'GREEN'
        } else if (deviationPercent < 10) {
          status = 'YELLOW'
        } else {
          status = 'RED'
        }
      }

const result = {
  ship_id: ship.id,
  ship_name: ship.name,
  voucher_gb: Number(voucherGB.toFixed(3)),
  router_gb: Number(routerGB.toFixed(3)),
  starlink_gb: Number(starlinkGB.toFixed(3)), // <-- NEU
  deviation_percent: Number(deviationPercent.toFixed(2)),
  status,
  high_usage_gb_5min: Number(highUsageGB.toFixed(3)),
  high_usage_status: highUsageStatus,
}

      results.push(result)

      if (highUsageStatus === 'RED') {
        const cacheKey = `${ship.id}-HIGH-USAGE-RED`
        const lastSent = globalThis.securityAlertCache[cacheKey] || 0
        const now = Date.now()
        const cooldownMs = 30 * 60 * 1000

        if (now - lastSent > cooldownMs) {
          globalThis.securityAlertCache[cacheKey] = now
          await sendTelegramSecurityAlert({
            ...result,
            status: 'HIGH USAGE RED',
          })
        }
      }

      if (status === 'RED') {
        const cacheKey = `${ship.id}-RED`
        const lastSent = globalThis.securityAlertCache[cacheKey] || 0
        const now = Date.now()
        const cooldownMs = 30 * 60 * 1000

        if (now - lastSent > cooldownMs) {
          globalThis.securityAlertCache[cacheKey] = now
          await sendTelegramSecurityAlert(result)
        }
      }
    }

    return res.status(200).json({
      ok: true,
      checked_at: new Date().toISOString(),
      ships: results,
    })
  } catch (error) {
    console.error('Security check failed:', error)

    return res.status(500).json({
      ok: false,
      error: 'Security check failed',
    })
  }
}