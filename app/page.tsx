// @ts-nocheck
"use client";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
export default function Home() {
const [rates, setRates] = useState({
  eur: null,
  chf: null,
  eurChange: null,
  chfChange: null,
});
const [timeNow, setTimeNow] = useState(new Date());
const [ships, setShips] = useState([]);
const [securityChecks, setSecurityChecks] = useState([]);
const [selectedShipIndex, setSelectedShipIndex] = useState(() => {
  if (typeof window === "undefined") return 0;

  const savedIndex = window.localStorage.getItem("selectedShipIndex");
  return savedIndex ? Number(savedIndex) : 0;
});
const [timeFilter, setTimeFilter] = useState({
  mode: "current", // current | range | history
  start: "",
  end: "",
  historyCount: 1
});
const currentMonth = new Date().toISOString().slice(0, 7);
const getPreviousMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

const previousMonth = getPreviousMonth();
const getSelectedCycles = (subscriptionsData, shipId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const shipSubs = subscriptionsData
    .filter(s => String(s.ship_id) === String(shipId))
    .map(s => {
      const [sy, sm, sd] = s.start_date.split("-");
      const [ey, em, ed] = s.end_date.split("-");

      const start = new Date(Number(sy), Number(sm) - 1, Number(sd));
      const end = new Date(Number(ey), Number(em) - 1, Number(ed));

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      return {
        ...s,
        start,
        end,
      };
    })
    .sort((a, b) => b.start.getTime() - a.start.getTime());

  if (timeFilter.mode === "current") {
    return shipSubs.filter(s => today >= s.start && today <= s.end);
  }

  if (timeFilter.mode === "history") {
    const currentIndex = shipSubs.findIndex(s => today >= s.start && today <= s.end);

    if (currentIndex === -1) return [];

    if (timeFilter.historyCount === 999) {
      return shipSubs.slice(currentIndex);
    }

    return shipSubs.slice(currentIndex, currentIndex + timeFilter.historyCount);
  }

  if (timeFilter.mode === "range") {
    if (!timeFilter.start || !timeFilter.end) return [];

    const rangeStart = new Date(timeFilter.start);
    const rangeEnd = new Date(timeFilter.end);

    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(0, 0, 0, 0);

    return shipSubs.filter(s => s.start <= rangeEnd && s.end >= rangeStart);
  }

  return [];
};

const handleAddVessel = async () => {
  const shipName = String(prompt("Ship name?") || "").trim();

  if (!shipName) {
    alert("Ship name is required");
    return;
  }

  const planType = String(prompt("Plan type? Allowed: small or large") || "")
    .trim()
    .toLowerCase();

  if (!["small", "large"].includes(planType)) {
    alert("Invalid plan type. Allowed: small or large");
    return;
  }

  const model = String(prompt("Revenue model? Allowed: M1, M2, M3") || "")
    .trim()
    .toUpperCase();

  if (!["M1", "M2", "M3"].includes(model)) {
    alert("Invalid model. Allowed: M1, M2, M3");
    return;
  }

  const planGB = planType === "small" ? 50 : 500;
  const planPriceEUR = planType === "small" ? 241 : 625;
  const hardwareEUR = 908.71;

  const confirmCreate = confirm(
    `Create vessel?\n\n` +
      `Name: ${shipName}\n` +
      `Plan: ${planType}\n` +
      `Model: ${model}\n` +
      `Subscription: ${planGB} GB / ${planPriceEUR} EUR\n` +
      `Hardware: ${hardwareEUR} EUR`
  );

  if (!confirmCreate) return;

  const { data: shipData, error: shipError } = await supabase
    .from("ships")
    .insert([
      {
        name: shipName,
        model: model,
        plan_gb: planGB,
        plan_price_eur: planPriceEUR,
        hardware_eur: hardwareEUR,
        used_gb: 0,
        tracking_start_at: new Date().toISOString(),
      },
    ])
    .select("*")
    .single();

  if (shipError || !shipData) {
    console.error("VESSEL INSERT ERROR:", shipError);
    alert(JSON.stringify(shipError, null, 2));
    return;
  }

  const today = new Date();
  const startDate = today.toISOString().split("T")[0];

  const end = new Date(today);
  end.setMonth(end.getMonth() + 1);
  end.setDate(end.getDate() - 1);
  const endDate = end.toISOString().split("T")[0];

  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .insert([
      {
        ship_id: shipData.id,
        gb: planGB,
        price_eur: planPriceEUR,
        start_date: startDate,
        end_date: endDate,
      },
    ]);

  if (subscriptionError) {
    console.error("SUBSCRIPTION INSERT ERROR:", subscriptionError);
    alert(
      "Vessel created, but subscription failed:\n\n" +
        JSON.stringify(subscriptionError, null, 2)
    );
    return;
  }

  alert(`${shipName} created successfully`);
  window.localStorage.setItem("selectedShipIndex", String(selectedShipIndex));
  window.location.reload();
};

const handleAddAddon = async () => {
  if (!ships || ships.length === 0) {
    alert("No ships loaded");
    return;
  }

  const shipName = prompt(
    `Select ship:\n${ships.map((s) => s.name).join("\n")}`
  );

  const ship = ships.find((s) => s.name === shipName);

  if (!ship) {
    alert("Ship not found");
    return;
  }

  const gb = Number(prompt("Addon GB? Allowed: 50 or 500"));

  if (![50, 500].includes(gb)) {
    alert("Invalid addon GB. Allowed: 50 or 500");
    return;
  }

  const priceEUR = gb === 50 ? 96 : 480;

  const confirmAdd = confirm(
    `Create addon for ${ship.name}?\n\n${gb} GB\n${priceEUR} EUR`
  );

  if (!confirmAdd) return;

  const { error } = await supabase.from("addons").insert([
    {
      ship_id: ship.id,
      gb: gb,
      price_eur: priceEUR,
    },
  ]);

  if (error) {
    console.error("ADDON INSERT ERROR:", error);
    alert(JSON.stringify(error, null, 2));
    return;
  }

  alert(`${gb} GB addon added for ${ship.name}`);
  window.location.reload();
};
const generateVoucherCode = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

const handleLogout = async () => {
  await fetch("/api/admin/logout", {
    method: "POST",
  });

  window.location.href = "/admin-login";
};

const handleAddVoucher = async () => {
  if (!ships || ships.length === 0) {
    alert("No ships loaded");
    return;
  }

  const shipName = prompt(
    `Select ship:\n${ships.map((s) => s.name).join("\n")}`
  );

  const ship = ships.find((s) => s.name === shipName);

  if (!ship) {
    alert("Ship not found");
    return;
  }

  const rawPlanType =
    ship.planType ||
    ship.plan_type ||
    (ship.plan?.name?.toLowerCase().includes("mini") ? "small" : "large");

  const planType = String(rawPlanType).toLowerCase();

  if (!["small", "large"].includes(planType)) {
    alert("Invalid plan type");
    return;
  }

  const allowedTypes =
    planType === "small"
      ? ["1GB", "5GB", "10GB", "20GB", "50GB"]
      : ["1GB", "5GB", "10GB", "20GB", "50GB"];

  const gbType = prompt(
    `GB Type? Allowed for ${planType}: ${allowedTypes.join(", ")}`
  );

  if (!allowedTypes.includes(gbType)) {
    alert(`${gbType} is not allowed for ${planType}`);
    return;
  }

  const amount = Number(prompt("How many vouchers?"));

  if (!amount || amount <= 0) {
    alert("Invalid amount");
    return;
  }

  const gbTotals = {
    "1GB": 1,
    "5GB": 5,
    "10GB": 10,
    "20GB": 20,
    "50GB": 50,
  };

  const requestedGB = gbTotals[gbType] * amount;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: subscriptionsData, error: subscriptionsError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("ship_id", ship.id);

  if (subscriptionsError) {
    console.error("SUBSCRIPTIONS LOAD ERROR:", subscriptionsError);
    alert(JSON.stringify(subscriptionsError, null, 2));
    return;
  }

  const subscriptions = (subscriptionsData || [])
    .map((s) => {
      const [sy, sm, sd] = s.start_date.split("-");
      const [ey, em, ed] = s.end_date.split("-");

      const start = new Date(Number(sy), Number(sm) - 1, Number(sd));
      const end = new Date(Number(ey), Number(em) - 1, Number(ed));

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      return {
        ...s,
        start,
        end,
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const currentCycle = subscriptions.find((s) => {
    return today >= s.start && today <= s.end;
  });

  if (!currentCycle) {
    alert("No active subscription cycle found for this ship.");
    return;
  }

  const previousCycles = subscriptions.filter((s) => s.end < currentCycle.start);
  const previousCycle = previousCycles.length
    ? previousCycles[previousCycles.length - 1]
    : null;

  const { data: addonsData, error: addonsError } = await supabase
    .from("addons")
    .select("*")
    .eq("ship_id", ship.id);

  if (addonsError) {
    console.error("ADDONS LOAD ERROR:", addonsError);
    alert(JSON.stringify(addonsError, null, 2));
    return;
  }

  const { data: vouchersData, error: vouchersError } = await supabase
    .from("crew_vouchers")
    .select("*")
    .eq("ship_id", ship.id);

  if (vouchersError) {
    console.error("VOUCHERS LOAD ERROR:", vouchersError);
    alert(JSON.stringify(vouchersError, null, 2));
    return;
  }

let allUsage = [];
let from = 0;
const pageSize = 1000;

while (true) {
  let query = supabase
    .from("router_usage")
    .select("*")
    .order("created_at", { ascending: true });

  // 🔹 Nur wenn ship.id existiert → filtern
  if (typeof ship !== "undefined" && ship?.id) {
    query = query.eq("ship_id", ship.id);
  }

  const { data, error } = await query.range(from, from + pageSize - 1);

  if (error) {
    console.error("USAGE LOAD ERROR:", error);
    return;
  }

  if (!data || data.length === 0) break;

  allUsage = allUsage.concat(data);

  if (data.length < pageSize) break;

  from += pageSize;
}

const usageData = allUsage;

console.log("TOTAL USAGE LOADED:", usageData.length);

  const getVoucherGB = (v) => {
    if (typeof v.gb_total === "number") return Number(v.gb_total || 0);
    if (v.voucher_type === "1GB") return 1;
    if (v.voucher_type === "5GB") return 5;
    if (v.voucher_type === "10GB") return 10;
    if (v.voucher_type === "20GB") return 20;
    if (v.voucher_type === "50GB") return 50;
    return 0;
  };

  const isDateInCycle = (dateValue, cycle) => {
    if (!dateValue || !cycle) return false;

    const date = new Date(dateValue);
    date.setHours(0, 0, 0, 0);

    return date >= cycle.start && date <= cycle.end;
  };

  const getUsedGBForCycle = (cycle) => {
    if (!cycle) return 0;

    const cycleEntries = (usageData || [])
      .filter((u) => {
        const created = new Date(u.created_at);
        return created >= cycle.start && created <= cycle.end;
      })
      .sort((a, b) => {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

    if (cycleEntries.length === 0) return 0;

    let usedBytes = 0;

let startIndex = 0;

if (firstVoucherStart) {
  const startTime = new Date(firstVoucherStart);

  startIndex = cycleEntries.findIndex((e) => {
    return new Date(e.timestamp) >= startTime;
  });

  if (startIndex === -1) return sum;
}

for (let i = startIndex + 1; i < cycleEntries.length; i++) {
  const prev = Number(cycleEntries[i - 1].bytes_total || 0);
  const curr = Number(cycleEntries[i].bytes_total || 0);

  if (curr >= prev) {
    usedBytes += curr - prev;
  } else {
    usedBytes += curr;
  }
}

    return Number((usedBytes / (1024 * 1024 * 1024)).toFixed(2));
  };

  const currentAddonGB = (addonsData || [])
    .filter((a) => isDateInCycle(a.created_at, currentCycle))
    .reduce((sum, a) => sum + Number(a.gb || 0), 0);

  let carryOverGB = 0;

  if (previousCycle) {
    const previousSoldGB = (vouchersData || [])
      .filter((v) => isDateInCycle(v.created_at, previousCycle))
      .reduce((sum, v) => sum + getVoucherGB(v), 0);

    const previousUsedGB = getUsedGBForCycle(previousCycle);

    carryOverGB = previousSoldGB - previousUsedGB;

    if (carryOverGB < 0) carryOverGB = 0;
  }

  const openStatuses = ["active", "issued", "unused"];

  const currentOpenVoucherGB = (vouchersData || [])
    .filter((v) => {
      if (!isDateInCycle(v.created_at, currentCycle)) return false;
      return openStatuses.includes(String(v.status || "").toLowerCase());
    })
    .reduce((sum, v) => {
      const total = getVoucherGB(v);
      const used = Number(v.gb_used || 0);
      const remaining = total - used;

      return sum + (remaining > 0 ? remaining : 0);
    }, 0);

  const subscriptionGB = Number(currentCycle.gb || 0);

  const sellableGB = Number(
    (
      subscriptionGB +
      currentAddonGB -
      carryOverGB -
      currentOpenVoucherGB
    ).toFixed(2)
  );

  if (requestedGB > sellableGB) {
    const missingGB = Number((requestedGB - sellableGB).toFixed(2));

    alert(
      "Not enough data capacity. Please add an add-on before creating this voucher.\n\n" +
        `Available: ${sellableGB} GB\n` +
        `Requested: ${requestedGB} GB\n` +
        `Missing: ${missingGB} GB`
    );

    return;
  }

  const revenueModel = ship.model;

  if (!["M1", "M2", "M3"].includes(revenueModel)) {
    alert("Invalid revenue share model");
    return;
  }

  const revenueShare =
    revenueModel === "M1" ? 0.75 :
    revenueModel === "M2" ? 0.80 :
    1.00;

  const crewPrices = {
    small: {
      "1GB": 6.5,
      "5GB": 31,
      "10GB": 60,
      "20GB": 116,
      "50GB": 285,
    },
    large: {
      "1GB": 4.9,
      "5GB": 23,
      "10GB": 42,
      "20GB": 80,
      "50GB": 190,
    },
  };

  const crewPriceUSD = crewPrices[planType][gbType];
  const yourRevenueUSD = Number((crewPriceUSD * revenueShare).toFixed(2));

  const vouchers = [];

  for (let i = 0; i < amount; i++) {
    vouchers.push({
      ship_id: ship.id,
      subscription_cycle_id: null,
      voucher_code: generateVoucherCode(),
      voucher_type: gbType,
      plan_type: planType,
      gb_total: gbTotals[gbType],
      gb_used: 0,
      crew_price_usd: crewPriceUSD,
      revenue_share_model: revenueModel,
      your_revenue_usd: yourRevenueUSD,
      status: "active",
      created_by: "admin",
      notes: "batch created",
    });
  }

  const { error } = await supabase
    .from("crew_vouchers")
    .insert(vouchers);

if (error) {
  console.error("FULL ERROR:", error);
  alert(JSON.stringify(error, null, 2));
  return;
}

try {
  await fetch("/api/router/mikrotik-vouchers", {
    method: "GET",
    headers: {
      "x-router-sync-token": process.env.NEXT_PUBLIC_ROUTER_SYNC_TOKEN || "",
    },
  });
} catch (syncError) {
  console.error("MIKROTIK VOUCHER SYNC ERROR:", syncError);
}

const codesArray = vouchers.map(v => v.voucher_code);
  const codesText = codesArray.join("\n");

  try {
    const res = await fetch("/api/admin/send-voucher-telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shipName: ship.name,
        gbType: gbType,
        amount: amount,
        codes: codesArray,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Telegram API ERROR:", data);
      alert("Telegram failed: " + JSON.stringify(data));
    } else {
      console.log("Telegram sent:", data);
    }
  } catch (err) {
    console.error("Telegram fetch crashed:", err);
    alert("Telegram crashed");
  }

  alert(
    `${amount} vouchers created:\n\n${codesText}`
  );

  window.location.reload();
};

const getTotalGB = (ship) => {
  const addonGB = ship.addons.reduce((sum, a) => sum + a.gb, 0);

  return ship.plan.gb + addonGB + (ship.carryOverGB || 0);
};

const getSubscriptionAndAddonGB = (ship) => {
  const addonGB = ship.addons.reduce((sum, a) => sum + (a.gb || 0), 0);

  return ship.plan.gb + addonGB;
};

const getOperatingCostUSD = (ship) => {
  if (!rates.eur) return "--";

  const subscriptionEUR = ship.plan.priceEUR;

  const addonEUR = ship.addons.reduce((sum, a) => {
    return sum + a.price_eur;
  }, 0);

  const totalEUR = subscriptionEUR + addonEUR;

  const usd = totalEUR / rates.eur;

  return "$" + usd.toFixed(0);
};
const getTotalCostUSD = (ship) => {
  if (!rates.eur) return 0;

  const planEUR = ship.plan.priceEUR;

  const addonEUR = ship.addons.reduce((sum, a) => {
    return sum + a.price_eur;
  }, 0);

  const totalEUR = planEUR + addonEUR;

  return totalEUR / rates.eur;
};
const getHardwareCostUSD = (ship) => {
  if (!rates.eur) return "--";

  const usd = ship.hardwareEUR / rates.eur;

  return "$" + usd.toFixed(0);
};
const getCycleCount = (ship) => {
  if (!ship || !ship.plan || !ship.plan.gb) return 0;

  if (ship.planType === "small") {
    return ship.plan.gb / 50;
  }

  return ship.plan.gb / 500;
};

const getHardwareDepreciationUSD = (ship) => {
  if (!rates.eur) return 0;

  const cycleCount = getCycleCount(ship);
  const monthlyEUR = ship.hardwareEUR / 24;

  return (monthlyEUR * cycleCount) / rates.eur;
};
const getSoldGB = (ship) => {
  if (!ship.vouchers) return 0;

  return (
    (ship.vouchers["1GB"] || 0) * 1 +
    (ship.vouchers["5GB"] || 0) * 5 +
    (ship.vouchers["10GB"] || 0) * 10 +
    (ship.vouchers["20GB"] || 0) * 20 +
    (ship.vouchers["50GB"] || 0) * 50
  );
};

const getLostGB = (ship) => {
  const paidGB =
    ship.plan.gb +
    ship.addons.reduce((sum, a) => sum + (a.gb || 0), 0);

  const soldGB = getSoldGB(ship);

  const lostGB = paidGB - soldGB;

  return lostGB > 0 ? Number(lostGB.toFixed(2)) : 0;
};

const getLostRevenueUSD = (ship) => {
  const lostGB = getLostGB(ship);

  if (lostGB <= 0) return 0;

  const soldGB = getSoldGB(ship);
  const revenue = getRevenueUSD(ship);

  if (!soldGB || soldGB <= 0) return 0;
  if (revenue === "--" || revenue <= 0) return 0;

  const avgRevenuePerGB = revenue / soldGB;

  return lostGB * avgRevenuePerGB;
};
const getUsageRate = (ship) => {
  if (!ship.vouchers) return "--";

const soldGB = getSoldGB(ship);

  const totalGB =
  ship.plan.gb +
  ship.addons.reduce((sum, a) => sum + a.gb, 0) +
  (ship.carryOverGB || 0);

  if (totalGB === 0) return "--";

  const usage = (soldGB / totalGB) * 100;

  return usage.toFixed(0) + "%";
};
const getCrewPricesUSD = (ship) => {
  if (ship.planType === "small") {
    return {
      "1GB": 6.5,
      "5GB": 31,
      "10GB": 60,
      "20GB": 116,
      "50GB": 285,
    };
  }

  return {
    "1GB": 4.9,
    "5GB": 23,
    "10GB": 42,
    "20GB": 80,
    "50GB": 190,
  };
};

const getYourPricesUSD = (ship) => {
  const crewPrices = getCrewPricesUSD(ship);

  if (ship.model === "M1") {
    return {
      "1GB": crewPrices["1GB"] * 0.75,
      "5GB": crewPrices["5GB"] * 0.75,
      "10GB": crewPrices["10GB"] * 0.75,
      "20GB": crewPrices["20GB"] * 0.75,
      "50GB": crewPrices["50GB"] * 0.75,
    };
  }

  if (ship.model === "M2") {
    return {
      "1GB": crewPrices["1GB"] * 0.80,
      "5GB": crewPrices["5GB"] * 0.80,
      "10GB": crewPrices["10GB"] * 0.80,
      "20GB": crewPrices["20GB"] * 0.80,
      "50GB": crewPrices["50GB"] * 0.80,
    };
  }

  return crewPrices;
};

const getRevenueUSD = (ship) => {
  if (!ship.vouchers) return "--";

  const prices = getYourPricesUSD(ship);

  const revenue =
    (ship.vouchers["1GB"] || 0) * prices["1GB"] +
    (ship.vouchers["5GB"] || 0) * prices["5GB"] +
    (ship.vouchers["10GB"] || 0) * prices["10GB"] +
    (ship.vouchers["20GB"] || 0) * prices["20GB"] +
    (ship.vouchers["50GB"] || 0) * prices["50GB"];

  return revenue;
};
const getNetProfitUSD = (ship) => {
  if (!rates.eur || !ship.vouchers) return "--";

  const revenue = getRevenueUSD(ship);
  const totalCost = getTotalCostUSD(ship);
  const hardwareDepreciation = getHardwareDepreciationUSD(ship);

  return revenue - totalCost - hardwareDepreciation;
};
const getROI = (ship) => {
  if (!rates.eur) return "--";

  const profit = getNetProfitUSD(ship);
  const hardware = ship.hardwareEUR / rates.eur;

  if (hardware === 0) return "--";

  const roi = (profit / hardware) * 100;

  return roi.toFixed(0) + "%";
};
const getBreakEvenGB = (ship) => {
  if (!rates.eur) return "--";

  const operatingCost = getTotalCostUSD(ship);
  const hardwareDepreciation = getHardwareDepreciationUSD(ship);
  const totalCost = operatingCost + hardwareDepreciation;

  const soldGB = getSoldGB(ship);
  const revenue = getRevenueUSD(ship);

  if (soldGB === 0) return "--";

  const avgRevenuePerGB = revenue / soldGB;

  if (avgRevenuePerGB === 0) return "--";

  const breakEvenGB = totalCost / avgRevenuePerGB;

  return breakEvenGB.toFixed(0) + " GB";
};

const getBreakEvenMonths = (ship) => {
  if (!rates.eur || !ship.vouchers) return "--";

  const soldGB = getSoldGB(ship);

  if (soldGB === 0) return "--";

  const breakEvenGB = parseFloat(getBreakEvenGB(ship));

  if (isNaN(breakEvenGB)) return "--";

  const cycles = breakEvenGB / soldGB;

  if (cycles > 60) return ">60 cycles";

  return cycles.toFixed(1) + " cycles";
};

const getProfitStatus = (ship) => {
  if (!rates.eur || !ship.vouchers) return "--";

  const profit = getNetProfitUSD(ship);

  if (profit === "--") return "--";

  if (profit < 0) return "loss";
  if (profit === 0) return "breakeven";
  return "profit";
};
const formatUSD = (value) => {
  if (value === "--") return "--";

  const num = Number(value);

  if (isNaN(num)) return value;

  if (num < 0) return `-$${Math.abs(num).toFixed(0)}`;
  return `$${num.toFixed(0)}`;
};

const STATUS_TIMEOUT_MINUTES = 2;

const isFreshStatus = (lastSeen) => {
  if (!lastSeen) return false;
  return new Date() - new Date(lastSeen) <= STATUS_TIMEOUT_MINUTES * 60 * 1000;
};

const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return "--";

  const diffSec = Math.floor((new Date() - new Date(lastSeen)) / 1000);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec} sec ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;

  return new Date(lastSeen).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

useEffect(() => {
  fetch("https://open.er-api.com/v6/latest/USD")
    .then((res) => res.json())
    .then((data) => {
      console.log("API RESPONSE:", data);

      if (data && data.rates) {
const eur = Number(data.rates.EUR);
const chf = Number(data.rates.CHF);

// kleine Fake Bewegung
const eurChange = ((Math.random() - 0.5) * 0.5).toFixed(2);
const chfChange = ((Math.random() - 0.5) * 0.5).toFixed(2);

setRates({
  eur,
  chf,
  eurChange,
  chfChange,
});
      }
    })
    .catch((err) => console.error(err));
}, []);
useEffect(() => {
  const interval = setInterval(() => {
    setTimeNow(new Date());
  }, 60000);

  return () => clearInterval(interval);
}, []);

  const loadShips = async () => {
  
    const selectedMonths = [];

console.log("NOW:", new Date().toISOString());
console.log("SELECTED MONTHS:", selectedMonths);

const { data: shipsData, error: shipsError } = await supabase
  .from("ships")
  .select("*");

if (shipsError) {
  console.error(shipsError);
  return;
}

const { data: subscriptionsData, error: subscriptionsError } = await supabase
  .from("subscriptions")
  .select("*");

if (subscriptionsError) {
  console.error(subscriptionsError);
  return;
}

console.log("SUBSCRIPTIONS:", subscriptionsData);

let allUsage = [];
let from = 0;
const pageSize = 1000;

while (true) {
  let query = supabase
    .from("router_usage")
    .select("*")
    .order("created_at", { ascending: true });

  // 🔹 Nur wenn ship.id existiert → filtern
  if (typeof ship !== "undefined" && ship?.id) {
    query = query.eq("ship_id", ship.id);
  }

  const { data, error } = await query.range(from, from + pageSize - 1);

  if (error) {
    console.error("USAGE LOAD ERROR:", error);
    return;
  }

  if (!data || data.length === 0) break;

  allUsage = allUsage.concat(data);

  if (data.length < pageSize) break;

  from += pageSize;
}

const usageData = allUsage;

console.log("TOTAL USAGE LOADED:", usageData.length);

let routerStatusData = [];

const { data: routerStatusRaw, error: routerStatusError } = await supabase
  .from("router_status")
  .select("*")
  .order("checked_at", { ascending: false });

if (routerStatusError) {
  console.error("router_status load failed:", routerStatusError);
} else {
  routerStatusData = routerStatusRaw || [];
}

// 🔁 AUTO RENEW LOGIK
const today = new Date();

for (const ship of shipsData) {
  const shipSubs = subscriptionsData
    .filter(s => s.ship_id === ship.id)
.sort((a, b) => {
  return new Date(b.end_date).getTime() - new Date(a.end_date).getTime();
});

  const lastSub = shipSubs[0];

  if (!lastSub) continue;

  const end = new Date(lastSub.end_date);

  // 👉 Wenn abgelaufen → neue erstellen
  if (
  today > end &&
  !shipSubs.some(s => {
    const start = new Date(s.start_date);
    return start > end;
  })
) {
    const newStart = new Date(end);
    newStart.setDate(newStart.getDate() + 1);

    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + 1);
    newEnd.setDate(newEnd.getDate() - 1);

    console.log("AUTO RENEW for ship:", ship.id);

    await supabase.from("subscriptions").insert([
      {
        ship_id: ship.id,
        gb: lastSub.gb,
        price_eur: lastSub.price_eur,
        start_date: newStart.toISOString().split("T")[0],
        end_date: newEnd.toISOString().split("T")[0],
      },
    ]);
  }
}
  
const { data: addonsData, error: addonsError } = await supabase
  .from("addons")
  .select("*");

  if (addonsError) {
  console.error(addonsError);
  return;
}

const { data: vouchersData, error: vouchersError } = await supabase
  .from("crew_vouchers")
  .select("*");

if (vouchersError) {
  console.error(vouchersError);
  return;
}

const { data: starlinkUsageData, error: starlinkUsageError } = await supabase
  .from("starlink_usage")
  .select("*");

if (starlinkUsageError) {
  console.error("STARLINK USAGE LOAD ERROR:", starlinkUsageError);
  return;
}

console.log("STARLINK USAGE:", starlinkUsageData);

console.log("SHIPS:", shipsData);
console.log("VOUCHERS:", vouchersData);

    const mapped = shipsData.map((ship) => {
  console.log("MAPPED LOOP ACTIVE:", ship.name);
      let usedGB = 0;

const relevantSubs = getSelectedCycles(subscriptionsData, ship.id);

const shipUsageAll = usageData
  .filter((u) => u.ship_id === ship.id)
  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const usageDebug = relevantSubs.map((sub) => {
  const cycleEntries = shipUsageAll.filter((u) => {
    const created = new Date(u.created_at);
    return created >= sub.start && created <= sub.end;
  });

  return {
    shipId: ship.id,
    subStart: sub.start.toISOString(),
    subEnd: sub.end.toISOString(),
    usageCount: cycleEntries.length,
    firstCreatedAt: cycleEntries[0]?.created_at || null,
    lastCreatedAt: cycleEntries[cycleEntries.length - 1]?.created_at || null,
    firstBytes: cycleEntries[0]?.bytes_total || null,
    lastBytes: cycleEntries[cycleEntries.length - 1]?.bytes_total || null,
  };
});

console.log("USED DEBUG:", usageDebug);

const usedBytes = relevantSubs.reduce((sum, sub) => {
const cycleEntries = shipUsageAll.filter((u) => {
  const created = new Date(u.created_at);

return created >= sub.start && created <= sub.end;
});

  if (cycleEntries.length === 0) return sum;

if (cycleEntries.length === 0) return sum;

const first = Number(cycleEntries[0].bytes_total || 0);
const last = Number(cycleEntries[cycleEntries.length - 1].bytes_total || 0);

const cycleUsed = last - first;

return sum + (cycleUsed > 0 ? cycleUsed : 0);
}, 0);

usedGB = Number((usedBytes / (1024 * 1024 * 1024)).toFixed(2));

const shipStarlinkAll = (starlinkUsageData || [])
  .filter((u) => u.ship_id === ship.id)
  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

const firstVoucherStart = vouchersData
  .filter((v) => v.ship_id === ship.id)
  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]?.created_at;

const starlinkEntries = shipStarlinkAll.filter((u) => {
  if (!firstVoucherStart) return true;
  return new Date(u.timestamp) >= new Date(firstVoucherStart);
});

let starlinkBytes = 0;

for (let i = 1; i < starlinkEntries.length; i++) {
  const prev = Number(starlinkEntries[i - 1].bytes_total || 0);
  const curr = Number(starlinkEntries[i].bytes_total || 0);

  if (curr >= prev) {
    starlinkBytes += curr - prev;
  } else {
    starlinkBytes += curr;
  }
}

const starlinkGB = Number((starlinkBytes / (1024 * 1024 * 1024)).toFixed(2));

console.log("STARLINK CHECK:", {
  ship: ship.name,
  firstVoucherStart,
  allStarlinkRows: shipStarlinkAll.length,
  filteredStarlinkRows: starlinkEntries.length,
  firstFiltered: starlinkEntries[0]?.timestamp,
  lastFiltered: starlinkEntries[starlinkEntries.length - 1]?.timestamp,
  firstBytes: starlinkEntries[0]?.bytes_total,
  lastBytes: starlinkEntries[starlinkEntries.length - 1]?.bytes_total,
  starlinkBytes,
  starlinkGB,
});

console.log("STARLINK SUM DEBUG:", {
  ship: ship.name,
  rows: shipStarlinkAll.length,
  first: shipStarlinkAll[0],
  last: shipStarlinkAll[shipStarlinkAll.length - 1],
  starlinkBytes,
  starlinkGB,
});

console.log("ADMIN USED DEBUG:", {
  ship: ship.name,
  shipId: ship.id,
  usageRows: shipUsageAll.length,
  firstUsage: shipUsageAll[0],
  lastUsage: shipUsageAll[shipUsageAll.length - 1],
  usedBytes,
  usedGB,
});

console.log("RELEVANT SUBS:", relevantSubs);

const totalPlanGB = relevantSubs.reduce((sum, s) => sum + (s.gb || 0), 0);
const totalPlanEUR = relevantSubs.reduce((sum, s) => sum + (s.price_eur || 0), 0);

const shipVouchersForSelectedCycles = vouchersData.filter((v) => {
  if (v.ship_id !== ship.id) return false;

  const created = new Date(v.created_at);
  created.setHours(0, 0, 0, 0);

  return relevantSubs.some((sub) => {
    return created >= sub.start && created <= sub.end;
  });
});

const soldGB = shipVouchersForSelectedCycles.reduce((sum, v) => {
  if (v.voucher_type === "1GB") return sum + 1;
  if (v.voucher_type === "5GB") return sum + 5;
  if (v.voucher_type === "10GB") return sum + 10;
  if (v.voucher_type === "20GB") return sum + 20;
  if (v.voucher_type === "50GB") return sum + 50;
  return sum;
}, 0);

const voucherUsedGB = Number(
  shipVouchersForSelectedCycles
    .reduce((sum, v) => sum + Number(v.gb_used || 0), 0)
    .toFixed(2)
);

let carryOverGB = soldGB - usedGB;

if (carryOverGB < 0) carryOverGB = 0;

console.log("GB DEBUG:", {
  ship: ship.name,
  planGB: totalPlanGB,
  carryOverGB,
});

const latestStatus = Array.isArray(routerStatusData)
  ? routerStatusData.find((s) => String(s.ship_id) === "SHIP-001")
  : null;

const lastSeenRouter = latestStatus?.last_seen_router || null;
const lastSeenStarlink = latestStatus?.last_seen_starlink || null;

const routerOnline =
  latestStatus?.router_online === true && isFreshStatus(lastSeenRouter);

const starlinkOnline =
  latestStatus?.starlink_online === true && isFreshStatus(lastSeenStarlink);

  const mappedPlanType = Number(ship.plan_gb) >= 500 ? "large" : "small";

  return {
    id: ship.id,
    name: ship.name,
    model: ship.model,
    planType: mappedPlanType,

plan: {
  name: mappedPlanType === "large" ? "Global Priority 500GB" : "Global Priority 50",
  gb: totalPlanGB,
  priceEUR: totalPlanEUR,
},

carryOverGB: carryOverGB,

addons: addonsData.filter(a => {
  if (a.ship_id !== ship.id) return false;

  const created = new Date(a.created_at);
  created.setHours(0, 0, 0, 0);

  return relevantSubs.some(sub => {
    return created >= sub.start && created <= sub.end;
  });
}),
hardwareEUR: ship.hardware_eur,
vouchers: (() => {
  const shipVouchers = vouchersData.filter(v => {
    if (v.ship_id !== ship.id) return false;

    const created = new Date(v.created_at);
    created.setHours(0, 0, 0, 0);

    return relevantSubs.find(sub => {
  return created >= sub.start && created <= sub.end;
});
  });

  return shipVouchers.reduce((acc, v) => {
    acc[v.voucher_type] = (acc[v.voucher_type] || 0) + 1;
    return acc;
  }, {});
})(),
usedGB: usedGB,
voucherUsedGB: voucherUsedGB,
starlinkGB: starlinkGB,
routerOnline,
starlinkOnline,
lastSeenRouter,
lastSeenStarlink
    };
});
    console.log("MAPPED:", mapped);
    setShips(mapped);
  };

  const loadVouchers = async () => {
    const { data, error } = await supabase
      .from("vouchers")
      .select("*");

    if (error) {
      console.error(error);
      return;
    }

    console.log("VOUCHERS:", data);
};

const loadSecurityChecks = async () => {
  try {
    const res = await fetch("/api/admin/security-check");
    const data = await res.json();

if (!res.ok) {
  console.warn("SECURITY API FAILED:", res.status);
  return;
}

if (!data || !data.ok) {
  console.warn("SECURITY DATA INVALID:", data);
  return;
}

    setSecurityChecks(data.ships || []);
  } catch (err) {
    console.error("SECURITY CHECK FETCH ERROR:", err);
  }
};

useEffect(() => {
  loadShips();
  loadVouchers();
  loadSecurityChecks();
}, [timeFilter]);

useEffect(() => {
  const interval = setInterval(() => {
    loadShips();
    loadSecurityChecks();
  }, 30000);

  return () => clearInterval(interval);
}, []);

const getTime = (timeZone) => {
  return timeNow.toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const selectedShip = ships[selectedShipIndex] || ships[0];

const selectedSecurity = selectedShip
  ? securityChecks.find((s) => String(s.ship_id) === String(selectedShip.id))
  : null;

const securityStatus =
  selectedSecurity?.status === "RED" || selectedSecurity?.high_usage_status === "RED"
    ? "RED"
    : selectedSecurity?.status === "YELLOW" || selectedSecurity?.high_usage_status === "YELLOW"
      ? "YELLOW"
      : selectedSecurity
        ? "GREEN"
        : "UNKNOWN";

const securityColor =
  securityStatus === "GREEN"
    ? "bg-green-400"
    : securityStatus === "YELLOW"
      ? "bg-yellow-400"
      : securityStatus === "RED"
        ? "bg-red-500"
        : "bg-gray-400";

const getUsageCompareColor = (value, reference) => {
  const v = Number(value || 0);
  const r = Number(reference || 0);

  // 🔹 NEU: Minimum Traffic → keine Bewertung
  if (r < 0.5) return "text-gray-500";

  const deviation = Math.abs(v - r) / r;

  if (deviation <= 0.02) return "text-green-600";
  if (deviation <= 0.05) return "text-yellow-600";
  return "text-red-600";
};

const securityLabel =
  securityStatus === "GREEN"
    ? "Healthy"
    : securityStatus === "YELLOW"
      ? "Warning"
      : securityStatus === "RED"
        ? "Critical"
        : "Unknown";

  return (
    <div className="h-screen w-full relative text-white">

      {/* Hintergrund */}
      <img
        src="/msc-ship.jpg"
        className="absolute w-full h-full object-cover"
        alt="msc ship"
      />

      {/* dunkler Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/10"></div>

      {/* Top Header (FIXED) */}
      <div className="absolute top-10 left-16 right-16 flex justify-between items-center z-20">
        <h1 className="text-white/90 text-4xl font-medium tracking-normal">
          CrewOceanLink
        </h1>

<div className="flex items-center gap-4">
  <span className="text-white/60 text-4xl">
    Admin Dashboard
  </span>

  <button
    onClick={handleLogout}
    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-sm text-white border border-white/20"
  >
    Logout
  </button>
</div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-end justify-center min-h-screen pb-6 px-6">

        {/* Grosser Glass Container */}
<div className="
w-[95%] h-[85vh] mx-auto rounded-3xl
bg-white/[0.02] backdrop-saturate-150
backdrop-blur-[4px]
border border-white/20
shadow-[0_8px_32px_rgba(0,0,0,0.25)]
p-10
">

{/* Toolbar */}
<div className="mb-8">
  <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/20 w-full flex-nowrap overflow-hidden">

<div
  onClick={handleAddVessel}
  className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 transition text-sm whitespace-nowrap shrink-0 cursor-pointer"
>
  + Vessel
</div>

<div
  onClick={handleAddAddon}
  className="px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 transition text-sm cursor-pointer whitespace-nowrap shrink-0"
>
  + Addon GB
</div>

<div
  onClick={handleAddVoucher}
  className="px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 transition text-sm cursor-pointer whitespace-nowrap shrink-0"
>
  + Voucher
</div>

<select
  value={selectedShipIndex}
  onChange={(e) => {
  const index = Number(e.target.value);
  setSelectedShipIndex(index);
  window.localStorage.setItem("selectedShipIndex", String(index));
}}
  className="px-5 py-2 rounded-full bg-white/20 hover:bg-white/30 transition text-sm text-white border border-white/20 outline-none cursor-pointer whitespace-nowrap shrink-0 appearance-none"
>
  {ships.map((ship, index) => (
    <option key={ship.id} value={index} className="bg-neutral-900 text-white">
      {ship.name}
    </option>
  ))}
</select>

<div className="ml-auto flex items-center gap-6 text-xs text-white/80 whitespace-nowrap shrink-0">

  <div className="flex items-center gap-1">
    <span className="text-white">USD/EUR</span>
    <span className="font-medium text-white">
  {rates.eur ? Number(rates.eur).toFixed(2) : "--"}
</span>

<span
  className={`text-[10px] ${
    rates.eurChange > 0 ? "text-green-400" : "text-red-400"
  }`}
>
  ({rates.eurChange > 0 ? "+" : ""}
  {rates.eurChange}%)
</span>
  </div>

  <div className="flex items-center gap-1">
    <span className="text-white">USD/CHF</span>
    <span className="font-medium text-white">
  {rates.chf ? Number(rates.chf).toFixed(2) : "--"}
</span>

<span
  className={`text-[10px] ${
    rates.chfChange > 0 ? "text-green-400" : "text-red-400"
  }`}
>
  ({rates.chfChange > 0 ? "+" : ""}
  {rates.chfChange}%)
</span>
  </div>

<div className="ml-40 flex items-center gap-3 ml-6 text-white">
  <span>UTC {getTime("UTC")}</span>
  <span>|</span>
  <span>ZRH {getTime("Europe/Zurich")}</span>
  <span>|</span>
  <span>DXB {getTime("Asia/Dubai")}</span>
  <span>|</span>
  <span>BKK {getTime("Asia/Bangkok")}</span>
  <span>|</span>
  <span>BRT {getTime("America/Sao_Paulo")}</span>
  <span>|</span>
  <span>MIA {getTime("America/New_York")}</span>
  <span>|</span>
  <span>LAX {getTime("America/Los_Angeles")}</span>
</div>

</div>

  </div>

{/* Welcome Section */}
<div className="mt-6 mb-10 px-6">
  <h2 className="text-4xl font-medium text-white/90">
    Welcome back Mike
  </h2>

  <p className="text-white/60 mt-2 text-lg">
    It's good to see you again!
  </p>
</div>

{/* Daten Container */}
<div className="
mt-10
h-[57vh]
rounded-2xl
bg-white/5
backdrop-blur-[6px]
border border-white/15
shadow-inner
">
   <div className="p-6 h-full overflow-y-auto">
<div className="flex items-center text-white/80 text-sm mb-3 tracking-wide whitespace-nowrap overflow-hidden">

  {/* LEFT */}
  <div className="w-[20%] overflow-hidden text-ellipsis">
    {selectedShip && (
      <>
        {selectedShip.name} | {selectedShip.model} | {selectedShip.plan.name}
      </>
    )}
  </div>

  {/* TIME PERIOD */}
  <div className="w-[28%] flex items-center gap-2">
    <span className="shrink-0">Time Period</span>

    <select
      value={timeFilter.mode}
      onChange={(e) =>
        setTimeFilter({
          ...timeFilter,
          mode: e.target.value,
        })
      }
      className="bg-white text-black text-xs px-2 py-1 rounded border border-white/20 shrink-0"
    >
      <option value="current">Current Cycle</option>
      <option value="range">Custom Range</option>
      <option value="history">Cycle History</option>
    </select>

    {timeFilter.mode === "history" && (
      <select
        value={timeFilter.historyCount}
        onChange={(e) =>
          setTimeFilter({
            ...timeFilter,
            historyCount: Number(e.target.value),
          })
        }
        className="bg-white text-black text-xs px-2 py-1 rounded border border-white/20 shrink-0"
      >
        <option value={1}>Last 1 Cycle</option>
        <option value={3}>Last 3 Cycles</option>
        <option value={6}>Last 6 Cycles</option>
        <option value={999}>All Cycles</option>
      </select>
    )}

    {timeFilter.mode === "range" && (
      <>
        <input
          type="date"
          value={timeFilter.start || ""}
          onChange={(e) =>
            setTimeFilter({
              ...timeFilter,
              start: e.target.value,
            })
          }
          className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/20 shrink-0"
        />
        <input
          type="date"
          value={timeFilter.end || ""}
          onChange={(e) =>
            setTimeFilter({
              ...timeFilter,
              end: e.target.value,
            })
          }
          className="bg-white/10 text-white text-xs px-2 py-1 rounded border border-white/20 shrink-0"
        />
      </>
    )}
  </div>

  {/* STATUS */}
  <div className="w-[52%] flex items-center justify-start gap-4 overflow-hidden whitespace-nowrap text-xs xl:text-sm pl-8">

    {selectedShip && (
      <>
        <div className="flex items-center gap-1.5 shrink-0 text-white/85">
          <span className={`inline-block w-2 h-2 rounded-full ${selectedShip.routerOnline ? "bg-green-400" : "bg-red-400"}`}></span>
          <span>
            Router: {selectedShip.routerOnline ? "Online" : "Offline"} · {formatLastSeen(selectedShip.lastSeenRouter)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-white/85">
          <span className={`inline-block w-2 h-2 rounded-full ${selectedShip.starlinkOnline ? "bg-green-400" : "bg-red-400"}`}></span>
          <span>
            Starlink: {selectedShip.starlinkOnline ? "Online" : "Offline"} · {formatLastSeen(selectedShip.lastSeenStarlink)}
          </span>
        </div>

        <div
title={
  selectedSecurity
    ? `Overall Status: ${securityStatus}

Voucher Usage: ${selectedSecurity.voucher_gb} GB
Router Usage: ${selectedSecurity.router_gb} GB
Starlink Usage: ${selectedSecurity.starlink_gb || 0} GB

Deviation: ${selectedSecurity.deviation_percent}%
Deviation Status: ${selectedSecurity.status}

High Usage 5min: ${selectedSecurity.high_usage_gb_5min} GB
High Usage Status: ${selectedSecurity.high_usage_status}`
    : "Security check not loaded"
}
          className="flex items-center gap-1.5 shrink-0 text-white/85 cursor-help"
        >
          <span
            className={`inline-block w-2 h-2 rounded-full ${securityColor} ${
              securityStatus === "RED" ? "animate-pulse scale-125" : ""
            }`}
          ></span>
          <span>
            Security: {securityLabel}
            {selectedSecurity
              ? selectedSecurity.high_usage_status === "RED"
                ? ` · High Usage ${selectedSecurity.high_usage_gb_5min} GB`
                : selectedSecurity.status === "RED" || selectedSecurity.status === "YELLOW"
                  ? ` · Deviation ${selectedSecurity.deviation_percent}%`
                  : ""
              : ""}
          </span>
        </div>
      </>
    )}

  </div>

</div>
{selectedShip ? (
  <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
    {Array.from({ length: 15 }).map((_, i) => (
      <div
        key={i}
className="rounded-xl bg-white/[0.8] backdrop-blur-lg px-4 py-3 border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.25)] min-h-[88px] flex flex-col justify-start transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:-translate-y-[2px]"
      >
        <div className="text-gray-500 text-sm mb-1">
          {[
            "Subscription + Addon (GB)",
            "Vouchers Sold (GB)",
            "Used Data (GB)",
            "Carry Over (GB)",
            "Lost GB",
            "Our Revenue ($)",
            "Operating Cost ($)",
            "Hardware Investment ($)",
            "Net Profit ($)",
            "ROI (%)",
            "Usage Rate (%)",
            "Break-even Status",
            "Break-even (GB)",
            "Break-even (Cycles)",
            "Lost Revenue ($)"
          ][i]}
        </div>

        <div
className={`font-semibold text-lg ${i === 2 ? "mt-1" : "mt-3"} ${
            i === 8
              ? Number(getNetProfitUSD(selectedShip)) < 0
                ? "text-red-500"
                : "text-green-500"
              : i === 9
                ? Number(getROI(selectedShip).replace("%", "")) < 0
                  ? "text-red-500"
                  : "text-green-500"
                : [4, 6, 7, 14].includes(i)
                  ? "text-red-500 font-semibold"
                  : i === 11
                    ? "text-white"
                    : "text-gray-500"
          }`}
        >
          {i === 0 && getSubscriptionAndAddonGB(selectedShip) + " GB"}
          {i === 1 && getSoldGB(selectedShip) + " GB"}
{i === 2 && (
  <div className="flex items-center justify-between w-full h-full">

{/* LEFT */}
<div className="text-gray-500 w-[75px] whitespace-nowrap">
  {selectedShip.usedGB} GB
</div>

{/* DIVIDER */}
<div className="h-8 w-[1px] bg-black/40 mx-3"></div>

{/* RIGHT */}
<div className="flex flex-col text-[12px] text-gray-500 leading-tight w-[130px] shrink-0 -ml-4">
      <div className="flex justify-between w-30">
        <span>Starlink</span>
        <span className="text-gray-500">{Number(selectedShip.starlinkGB || 0).toFixed(2)} GB</span>
      </div>
      <div className="flex justify-between w-30">
        <span>Router</span>
        <span className={getUsageCompareColor(selectedShip.usedGB, selectedShip.starlinkGB)}>
          {Number(selectedShip.usedGB || 0).toFixed(2)} GB
        </span>
      </div>
<div className="flex justify-between w-30">
  <span>Voucher</span>
  <span className={getUsageCompareColor(selectedShip.voucherUsedGB, selectedShip.starlinkGB)}>
    {Number(selectedShip.voucherUsedGB || 0).toFixed(2)} GB
  </span>
</div>
    </div>

  </div>
)}
          {i === 3 && selectedShip.carryOverGB.toFixed(1) + " GB"}
          {i === 4 && getLostGB(selectedShip) + " GB"}
          {i === 5 && formatUSD(getRevenueUSD(selectedShip))}
          {i === 6 && getOperatingCostUSD(selectedShip)}
          {i === 7 && getHardwareCostUSD(selectedShip)}
          {i === 8 && formatUSD(getNetProfitUSD(selectedShip))}
          {i === 9 && getROI(selectedShip)}
          {i === 10 && getUsageRate(selectedShip)}
          {i === 12 && getBreakEvenGB(selectedShip)}
          {i === 13 && getBreakEvenMonths(selectedShip)}
          {i === 14 && formatUSD(getLostRevenueUSD(selectedShip))}
        </div>

        {i === 11 && (() => {
          const status = getProfitStatus(selectedShip);

          if (status === "loss") {
            return (
              <div className="mt-1 flex items-center gap-1 text-xs text-red-500">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Not profitable
              </div>
            );
          }

          if (status === "breakeven") {
            return (
              <div className="mt-1 flex items-center gap-1 text-xs text-orange-500">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Break-even
              </div>
            );
          }

          return (
            <div className="mt-1 flex items-center gap-1 text-xs text-green-500">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Profitable
            </div>
          );
        })()}
      </div>
    ))}
  </div>
) : (
  <div className="rounded-xl bg-white/[0.8] backdrop-blur-lg px-6 py-6 border border-white/20 text-gray-600">
    No vessels yet. Click + Vessel to create your first ship.
  </div>
)}

{/* Divider */}
<div className="my-6 border-t border-white/20"></div>
     <div className="mt-6">

  <div className="
    rounded-xl 
    bg-white/[0.8] 
    backdrop-blur-lg
    border border-white/20
    p-4
  ">

    <div className="text-gray-500 text-sm mb-1">
      Ship Ranking
    </div>

    <div className="space-y-2">

      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">
          #1 MSC MICHELA | M1 | Global Priority Mini
        </span>
        <span className="text-gray-500 text-sm mb-1 font-medium">
          $0
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-500 text-sm">
          #1 MSC MICHELA | M1 | Global Priority Mini
        </span>
        <span className="text-gray-500 text-sm mb-1 font-medium">
          $0
        </span>
      </div>

    </div>

  </div>

</div>
   </div>
</div>

</div>

          {/* leer */}
          <div className="mb-8"></div>

        </div>

      </div>
    </div>
  );
}