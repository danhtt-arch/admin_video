// Dashboard: thống kê + Chart.js
import { supabase } from "./config.js";
import { checkAuth } from "./auth.js";
import { renderLayout } from "./layout.js";
import {
  formatNumber, formatDate, formatBytes, showToast, getErrorMessage, escapeHtml, PLACEHOLDER_THUMB,
} from "./utils.js";

const PRIMARY = "#2563EB";
const PRIMARY_FILL = "rgba(37, 99, 235, 0.12)";

let barChart = null;
let lineChart = null;
let viewRows = [];
let range = "day";

function setState(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  if (html === null) el.classList.add("hidden");
  else {
    el.classList.remove("hidden");
    el.innerHTML = html;
  }
}

// Supabase/PostgREST giới hạn mặc định 1000 dòng/request → đọc theo trang để không bị cắt số liệu.
async function fetchAll(buildQuery) {
  const PAGE = 1000;
  const rows = [];
  for (let from = 0; from < 100 * PAGE; from += PAGE) {
    const { data, error } = await buildQuery().range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

async function loadStats() {
  const videos = await fetchAll(() =>
    supabase
      .from("videos")
      .select("id, title, views_count, storage_size_mb, thumbnail_url, created_at, video_categories(name)")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
  );

  const totalViews = videos.reduce((s, v) => s + Number(v.views_count || 0), 0);
  const totalMB = videos.reduce((s, v) => s + Number(v.storage_size_mb || 0), 0);

  document.getElementById("stat-videos").textContent = formatNumber(videos.length);
  document.getElementById("stat-views").textContent = formatNumber(totalViews);
  document.getElementById("stat-storage").textContent = formatBytes(totalMB, "MB");

  renderBarChart(videos);
  renderActivity(videos.slice(0, 5));
}

function renderBarChart(videos) {
  const top = [...videos]
    .sort((a, b) => Number(b.views_count) - Number(a.views_count))
    .slice(0, 10);

  if (!top.length) {
    setState("bar-state", '<i class="fa-regular fa-chart-bar"></i><span>Chưa có dữ liệu</span>');
    return;
  }
  setState("bar-state", null);

  const labels = top.map((v) => (v.title.length > 22 ? v.title.slice(0, 22) + "…" : v.title));
  barChart?.destroy();
  barChart = new Chart(document.getElementById("bar-chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Lượt xem",
        data: top.map((v) => Number(v.views_count)),
        backgroundColor: PRIMARY,
        borderRadius: 6,
        maxBarThickness: 36,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => top[items[0].dataIndex].title,
            label: (ctx) => ` ${formatNumber(ctx.parsed.y)} lượt xem`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45, color: "#64748b" } },
        y: { beginAtZero: true, grid: { color: "#e2e8f0" }, ticks: { color: "#64748b", callback: (v) => formatNumber(v) } },
      },
    },
  });
}

async function loadViews() {
  viewRows = await fetchAll(() =>
    supabase
      .from("video_views")
      .select("view_date, views_count")
      .order("view_date", { ascending: true })
      .order("id", { ascending: true })
  );
  renderLineChart();
}

function renderLineChart() {
  const buckets = new Map();
  for (const row of viewRows) {
    const key = range === "month" ? row.view_date.slice(0, 7) : row.view_date;
    buckets.set(key, (buckets.get(key) || 0) + Number(row.views_count || 0));
  }
  let entries = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  entries = range === "month" ? entries.slice(-12) : entries.slice(-30);

  if (!entries.length) {
    lineChart?.destroy();
    lineChart = null;
    setState("line-state", '<i class="fa-regular fa-chart-bar"></i><span>Chưa có dữ liệu lượt xem</span>');
    return;
  }
  setState("line-state", null);

  const labels = entries.map(([k]) => {
    if (range === "month") {
      const [y, m] = k.split("-");
      return `${m}/${y}`;
    }
    const [, m, d] = k.split("-");
    return `${d}/${m}`;
  });

  lineChart?.destroy();
  lineChart = new Chart(document.getElementById("line-chart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Lượt xem",
        data: entries.map(([, v]) => v),
        borderColor: PRIMARY,
        backgroundColor: PRIMARY_FILL,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: "#fff",
        pointBorderColor: PRIMARY,
        pointBorderWidth: 2,
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ` ${formatNumber(ctx.parsed.y)} lượt xem` } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748b" } },
        y: { beginAtZero: true, grid: { color: "#e2e8f0" }, ticks: { color: "#64748b", callback: (v) => formatNumber(v) } },
      },
    },
  });
}

function renderActivity(videos) {
  const list = document.getElementById("activity-list");
  if (!videos.length) {
    list.innerHTML = '<li class="table-state"><i class="fa-regular fa-folder-open"></i>Chưa có video nào.</li>';
    return;
  }
  list.innerHTML = videos
    .map((v) => `
      <li class="activity-item">
        <img class="activity-thumb" src="${escapeHtml(v.thumbnail_url || PLACEHOLDER_THUMB)}" alt="" onerror="this.src='${PLACEHOLDER_THUMB}'" />
        <div class="activity-info">
          <div class="activity-title">${escapeHtml(v.title)}</div>
          <div class="activity-meta">${escapeHtml(v.video_categories?.name || "Chưa phân loại")} · ${formatBytes(v.storage_size_mb, "MB")}</div>
        </div>
        <div class="activity-meta">${formatDate(v.created_at)}</div>
      </li>`)
    .join("");
}

function bindRangeTabs() {
  document.querySelectorAll(".range-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".range-tab").forEach((t) => t.classList.toggle("active", t === tab));
      range = tab.dataset.range;
      renderLineChart();
    });
  });
}

async function init() {
  const auth = await checkAuth();
  if (!auth) return;
  renderLayout({ active: "dashboard", title: "Dashboard", auth });
  bindRangeTabs();

  const results = await Promise.allSettled([loadStats(), loadViews()]);
  results.forEach((r) => {
    if (r.status === "rejected") showToast(getErrorMessage(r.reason), "error");
  });
  if (results[0].status === "rejected") {
    setState("bar-state", '<i class="fa-solid fa-triangle-exclamation"></i><span>Không tải được dữ liệu</span>');
    document.getElementById("activity-list").innerHTML =
      '<li class="table-state"><i class="fa-solid fa-triangle-exclamation"></i>Không tải được dữ liệu.</li>';
  }
  if (results[1].status === "rejected") {
    setState("line-state", '<i class="fa-solid fa-triangle-exclamation"></i><span>Không tải được dữ liệu</span>');
  }
}

init();
