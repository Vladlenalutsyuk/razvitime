// frontend/admin.js

document.addEventListener("DOMContentLoaded", () => {
  const raw = localStorage.getItem("razvitime_user");
  let user = null;
  try {
    user = raw ? JSON.parse(raw) : null;
  } catch (e) {
    user = null;
  }

  // для входа как админ: role должно быть 'admin'
  if (!user || user.role !== "admin") {
    window.location.href = "auth.html#admin";
    return;
  }

  const logoutBtn = document.getElementById("logout-btn-admin");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("razvitime_user");
      localStorage.removeItem("razvitime_token");
      window.location.href = "index.html";
    });
  }

  const tabButtons = document.querySelectorAll(".tab-btn[data-section]");
  const sections = document.querySelectorAll(".parent-section");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-section");
      tabButtons.forEach((b) => b.classList.remove("active"));
      sections.forEach((s) => (s.style.display = "none"));
      btn.classList.add("active");
      const section = document.getElementById(target);
      if (section) section.style.display = "";
    });
  });

  loadAdminDashboard();
  loadAdminCenters();
  loadAdminParents();
  loadAdminAnalytics();
  loadAdminTickets();    // новая вкладка "Обращения"
});

// ------------------------------
// 4.1. Дашборд
// ------------------------------
async function loadAdminDashboard() {
  const statsBox = document.getElementById("admin-dashboard-stats");
  const usersBox = document.getElementById("admin-dashboard-users");
  const enrBox = document.getElementById("admin-dashboard-enrollments");

  try {
    const res = await fetch(`${API_BASE}/api/admin/dashboard`);
    const data = await res.json();

    statsBox.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number stat-green">${data.totals.parents}</div>
          <div class="stat-label">Родителей</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-green">${data.totals.kids}</div>
          <div class="stat-label">Детей</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-orange">${data.totals.centers}</div>
          <div class="stat-label">Центров</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-orange">${data.totals.activities}</div>
          <div class="stat-label">Кружков</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-green">${data.totals.active_subscriptions}</div>
          <div class="stat-label">Активных подписок</div>
        </div>
      </div>
    `;

    usersBox.innerHTML =
      data.parents_by_month && data.parents_by_month.length
        ? `<ul class="upcoming-list">
          ${data.parents_by_month
            .map(
              (r) =>
                `<li>${r.month.slice(0, 7)} — ${r.total} новых родителей</li>`
            )
            .join("")}
          </ul>`
        : "Нет данных.";

    enrBox.innerHTML =
      data.enrollments_by_month && data.enrollments_by_month.length
        ? `<ul class="upcoming-list">
          ${data.enrollments_by_month
            .map(
              (r) =>
                `<li>${r.month.slice(0, 7)} — ${r.total} заявок</li>`
            )
            .join("")}
          </ul>`
        : "Нет данных по заявкам.";
  } catch (err) {
    console.error("admin dashboard error", err);
    statsBox.textContent = "Ошибка загрузки дашборда.";
    usersBox.textContent = "";
    enrBox.textContent = "";
  }
}

// ------------------------------
// 4.2. Центры и подписки
// ------------------------------
async function loadAdminCenters() {
  const box = document.getElementById("admin-centers-list");
  if (!box) return;
  box.textContent = "Загрузка центров...";

  try {
    const res = await fetch(`${API_BASE}/api/admin/centers`);
    const centers = await res.json();

    if (!centers.length) {
      box.innerHTML = "<p>Центров пока нет.</p>";
      return;
    }

    box.innerHTML = centers
      .map(
        (c) => `
      <article class="split-card" data-center-id="${c.id}">
        <h3>${c.name}</h3>
        <p class="section-subtitle">
          ${c.city || ""} · Кружков: ${c.activities_count || 0}
        </p>
        <p class="section-subtitle">
          Статус: <b>${c.is_active ? "активен" : "заблокирован"}</b><br>
          Тариф: ${c.tariff_name || "—"} · до ${c.subscription_end || "—"}
        </p>
        <div class="split-card-footer">
          <button class="btn btn-secondary btn-sm" data-toggle-center="${c.id}">
            ${c.is_active ? "Заблокировать" : "Активировать"}
          </button>
          <button class="btn btn-outline btn-sm" data-extend-sub="${c.id}">
            Продлить PRO на год (демо)
          </button>
        </div>
      </article>
    `
      )
      .join("");

    box.querySelectorAll("[data-toggle-center]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.toggleCenter);
        const card = box.querySelector(`[data-center-id="${id}"]`);
        const statusText = card.querySelector("b").textContent;
        const currentlyActive = statusText === "активен";
        updateCenterStatus(id, !currentlyActive);
      });
    });

    box.querySelectorAll("[data-extend-sub]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.extendSub);
        extendCenterSubscriptionDemo(id);
      });
    });
  } catch (err) {
    console.error("admin centers load error", err);
    box.textContent = "Ошибка загрузки центров.";
  }
}

async function updateCenterStatus(id, isActive) {
  try {
    const res = await fetch(`${API_BASE}/api/admin/centers/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) throw new Error("status error");
    loadAdminCenters();
  } catch (err) {
    console.error("admin center status error", err);
    alert("Ошибка изменения статуса центра");
  }
}

// демо: продлить PRO (tariff_id = 2) на год от сегодня
async function extendCenterSubscriptionDemo(id) {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(
    today.getFullYear() + 1,
    today.getMonth(),
    today.getDate()
  );
  const end = endDate.toISOString().slice(0, 10);

  try {
    const res = await fetch(
      `${API_BASE}/api/admin/centers/${id}/subscription`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tariff_id: 2, start_date: start, end_date: end }),
      }
    );
    if (!res.ok) throw new Error("sub error");
    loadAdminCenters();
    loadAdminDashboard();
  } catch (err) {
    console.error("admin sub error", err);
    alert("Ошибка продления подписки");
  }
}

// ------------------------------
// 4.3. Родители
// ------------------------------
async function loadAdminParents() {
  const box = document.getElementById("admin-parents-list");
  if (!box) return;
  box.textContent = "Загрузка родителей...";

  try {
    const res = await fetch(`${API_BASE}/api/admin/parents`);
    const parents = await res.json();

    if (!parents.length) {
      box.innerHTML = "<p>Родителей пока нет.</p>";
      return;
    }

    box.innerHTML = parents
      .map(
        (p) => `
      <article class="split-card">
        <h3>${p.full_name || p.email}</h3>
        <p class="section-subtitle">
          Email: ${p.email || "—"} · Телефон: ${p.phone || "—"}
        </p>
        <p class="section-subtitle">
          Город: ${p.city || "—"} · Дата регистрации: ${
          p.created_at ? p.created_at.slice(0, 10) : "—"
        }
        </p>
        <p class="section-subtitle">
          Детей: ${p.kids_count || 0} · Активных записей: ${
          p.active_enrollments || 0
        }
        </p>
      </article>
    `
      )
      .join("");
  } catch (err) {
    console.error("admin parents load error", err);
    box.textContent = "Ошибка загрузки родителей.";
  }
}

// ------------------------------
// 4.4. Аналитика
// ------------------------------
async function loadAdminAnalytics() {
  const ageBox = document.getElementById("admin-analytics-age");
  const catBox = document.getElementById("admin-analytics-categories");
  const cityBox = document.getElementById("admin-analytics-cities");

  try {
    const res = await fetch(`${API_BASE}/api/admin/analytics`);
    const data = await res.json();

    ageBox.innerHTML =
      data.age_buckets && data.age_buckets.length
        ? `<ul class="upcoming-list">
        ${data.age_buckets
          .map((a) => `<li>${a.age_group}: ${a.total} детей</li>`)
          .join("")}
      </ul>`
        : "Нет данных по возрастам.";

    catBox.innerHTML =
      data.popular_categories && data.popular_categories.length
        ? `<ul class="upcoming-list">
        ${data.popular_categories
          .map(
            (c) =>
              `<li>${c.category || "Без категории"} — ${
                c.enrollments_count
              } записей</li>`
          )
          .join("")}
      </ul>`
        : "Нет данных по категориям.";

    cityBox.innerHTML =
      data.centers_by_city && data.centers_by_city.length
        ? `<ul class="upcoming-list">
        ${data.centers_by_city
          .map((c) => `<li>${c.city || "—"} — ${c.total} центров</li>`)
          .join("")}
      </ul>`
        : "Нет данных по городам.";
  } catch (err) {
    console.error("admin analytics error", err);
    ageBox.textContent = "Ошибка загрузки аналитики.";
    catBox.textContent = "";
    cityBox.textContent = "";
  }
}

// ------------------------------
// 4.5. Обращения (support tickets)
// ------------------------------
async function loadAdminTickets() {
  const box = document.getElementById("admin-tickets-list");
  if (!box) return;
  box.textContent = "Загрузка обращений...";

  try {
    const res = await fetch(`${API_BASE}/api/admin/support-tickets`);
    const tickets = await res.json();

    if (!tickets.length) {
      box.innerHTML = "<p>Обращений пока нет.</p>";
      return;
    }

    box.innerHTML = tickets
      .map(
        (t) => `
      <article class="split-card">
        <h3>#${t.id} — ${t.subject}</h3>
        <p class="section-subtitle">
          Пользователь: ${t.user_email || "Гость"} · Роль: ${t.role}
        </p>
        <p class="section-subtitle">
          Статус: ${t.status} · Создано: ${
          t.created_at ? t.created_at.slice(0, 16).replace("T", " ") : "—"
        }
        </p>
      </article>
    `
      )
      .join("");
  } catch (err) {
    console.error("admin tickets load error", err);
    box.textContent = "Ошибка загрузки обращений.";
  }
}
