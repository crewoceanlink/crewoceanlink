// LEGACY LOCAL TEST ONLY - DO NOT USE FOR PRODUCTION HEARTBEAT
import { spawn } from "child_process";

const intervalMs = Number(process.env.STATUS_CHECK_INTERVAL_MS || 60000);

function runCheck() {
  console.log(`[STATUS WATCHER] Run at ${new Date().toISOString()}`);

  const child = spawn("node", ["scripts/status-checker.js"], {
    stdio: "inherit",
    shell: true,
  });

  child.on("error", (err) => {
    console.error("[STATUS WATCHER] Failed:", err);
  });

  child.on("exit", (code) => {
    console.log(`[STATUS WATCHER] Finished with code ${code}`);
  });
}

console.log(`Status Watcher läuft alle ${intervalMs / 1000} Sekunden`);

runCheck();
setInterval(runCheck, intervalMs);