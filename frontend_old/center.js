// frontend/center.js

let CENTER_ID = null;
let editingActivityId = null;

// лимит и счётчик активных занятий по тарифу
let TARIFF_LIMIT = Infinity;
let ACTIVE_ACTIVITIES_COUNT = 0;
let editingWasActive = false;

document.addEventListener("DOMContentLoaded", () => {
  // --- ПРОВЕРКА АВТОРИЗАЦИИ ЦЕНТРА ---
  const raw = localStorage.getItem("razvitime_user");
  let user = null;
  try {
    user = raw ? JSON.parse(raw) : null;
  } catch (e) {
    user = null;
  }

  // важно: при логине центра в localStorage должны быть role: 'center_admin' и center_id
  if (!user || user.role !== "center_admin" || !user.center_id) {
    window.location.href = "auth.html#center";
    return;
  }

  CENTER_ID = user.center_id;

  // Кнопка выхода
  const logoutBtn = document.getElementById("logout-btn-center");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("razvitime_user");
      localStorage.removeItem("razvitime_token");
      window.location.href = "index.html";
    });
  }

  // Переключение вкладок
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

  // Загрузки/инициализация
  loadCenterDashboard();
  loadCenterProfile();
  setupCenterProfileSave();
  loadCenterActivities();
  setupActivityForm();
  loadCenterEnrollments();
  setupEnrollFilters();
});

// --------------------------------
// ВСПОМОГАТЕЛЬНОЕ: лимит по тарифу
// --------------------------------
function deriveTariffLimit(subscription) {
  if (!subscription) return Infinity;

  // если бэкенд сразу отдал лимит — используем его
  if (typeof subscription.max_active_activities === "number") {
    return subscription.max_active_activities;
  }
  if (typeof subscription.max_posts === "number") {
    return subscription.max_posts;
  }
  if (typeof subscription.limit === "number") {
    return subscription.limit;
  }

  const name = (subscription.tariff_name || "").toLowerCase();

  // Маппинг по названию тарифа (на всякий случай)
  if (name.includes("1 пост") || name.includes("единораз")) {
    return 1;
  }
  if (name.includes("10 пост") || name.includes("до 10")) {
    return 10;
  }
  if (name.includes("20 пост") || name.includes("до 20")) {
    return 20;
  }
  if (name.includes("безлим") || name.includes("unlimited")) {
    return Infinity;
  }

  return Infinity;
}

// --------------------------------
// 3.1. Дашборд центра
// --------------------------------
async function loadCenterDashboard() {
  const headerBox = document.getElementById("center-dashboard-header");
  const statsBox = document.getElementById("center-dashboard-stats");
  const latestBox = document.getElementById("center-dashboard-latest");

  try {
    const res = await fetch(
      `${API_BASE}/api/center/dashboard?centerId=${CENTER_ID}`
    );
    const data = await res.json();

    // обновляем лимит по тарифу
    TARIFF_LIMIT = deriveTariffLimit(data.subscription);

    headerBox.innerHTML = `
      <h2>${data.center_name || "Ваш центр"}</h2>
      <p class="section-subtitle">${data.center_city || ""}</p>
    `;

    const limitLabel =
      TARIFF_LIMIT === Infinity
        ? "Без лимита по активным занятиям"
        : `Лимит активных занятий: ${TARIFF_LIMIT}`;

    statsBox.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number stat-green">${data.activities_count || 0}</div>
          <div class="stat-label">Кружков в системе</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-orange">${data.requests_last_30d || 0}</div>
          <div class="stat-label">Заявок за 30 дней</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-green">
            ${data.subscription ? data.subscription.tariff_name : "—"}
          </div>
          <div class="stat-label">
            Активный тариф<br>
            <span class="stat-note">${limitLabel}</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${data.subscription ? data.subscription.end_date : "—"}</div>
          <div class="stat-label">Подписка до</div>
        </div>
      </div>
    `;

    if (!data.latest_enrollments || !data.latest_enrollments.length) {
      latestBox.textContent = "Пока нет заявок.";
    } else {
      latestBox.innerHTML = `
        <ul class="upcoming-list">
          ${data.latest_enrollments
            .map(
              (e) => `<li>${e.activity_title} — ${e.kid_name} (${e.status})</li>`
            )
            .join("")}
        </ul>
      `;
    }
  } catch (err) {
    console.error("center dashboard error", err);
    headerBox.textContent = "Ошибка загрузки дашборда.";
    statsBox.textContent = "";
    latestBox.textContent = "";
  }
}

// --------------------------------
// 3.2. Профиль центра
// --------------------------------
async function loadCenterProfile() {
  try {
    const res = await fetch(
      `${API_BASE}/api/center/profile?centerId=${CENTER_ID}`
    );
    if (!res.ok) throw new Error("profile error");
    const p = await res.json();

    document.getElementById("center-name").value = p.name || "";
    document.getElementById("center-city").value = p.city || "";
    document.getElementById("center-address").value = p.address || "";
    document.getElementById("center-phone").value = p.phone || "";
    document.getElementById("center-whatsapp").value = p.whatsapp || "";
    document.getElementById("center-website").value = p.website || "";
    document.getElementById("center-instagram").value = p.instagram || "";
    document.getElementById("center-description").value = p.description || "";
  } catch (err) {
    console.error("center profile load error", err);
  }
}

function setupCenterProfileSave() {
  const btn = document.getElementById("center-profile-save-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const body = {
      name: document.getElementById("center-name").value.trim(),
      city: document.getElementById("center-city").value.trim(),
      address: document.getElementById("center-address").value.trim(),
      phone: document.getElementById("center-phone").value.trim(),
      whatsapp: document.getElementById("center-whatsapp").value.trim(),
      website: document.getElementById("center-website").value.trim(),
      instagram: document.getElementById("center-instagram").value.trim(),
      description: document
        .getElementById("center-description")
        .value.trim(),
    };

    try {
      const res = await fetch(
        `${API_BASE}/api/center/profile?centerId=${CENTER_ID}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error("save error");
      alert("Профиль центра сохранён");
      loadCenterDashboard();
    } catch (err) {
      console.error("center profile save error", err);
      alert("Ошибка сохранения профиля центра");
    }
  });
}

// --------------------------------
// 3.3. Занятия центра + лимит по тарифу
// --------------------------------
async function loadCenterActivities() {
  const list = document.getElementById("activities-list");
  if (!list) return;

  list.textContent = "Загрузка кружков...";

  try {
    const res = await fetch(
      `${API_BASE}/api/center/activities?centerId=${CENTER_ID}`
    );
    const activities = await res.json();

    if (!activities.length) {
      ACTIVE_ACTIVITIES_COUNT = 0;
      list.innerHTML =
        "<p>Пока нет добавленных кружков. Нажмите «Добавить занятие».</p>";
      return;
    }

    // считаем активные занятия
    ACTIVE_ACTIVITIES_COUNT = activities.filter((a) => a.is_active).length;

    const limitInfo =
      TARIFF_LIMIT === Infinity
        ? `Активных занятий: ${ACTIVE_ACTIVITIES_COUNT} (без лимита)`
        : `Активных занятий: ${ACTIVE_ACTIVITIES_COUNT} из ${TARIFF_LIMIT}`;

    list.innerHTML =
      `<p class="section-subtitle" style="margin-bottom:8px;">${limitInfo}</p>` +
      activities
        .map(
          (a) => `
      <article class="activity-card" data-activity-id="${a.id}">
        <div class="activity-main">
          <h3>
            ${a.title}
            ${
              a.is_active
                ? '<span class="badge">активно</span>'
                : '<span class="badge" style="background:#f0f0f3;color:#555;">неактивно</span>'
            }
          </h3>
          <div class="activity-meta">${a.category || "Без категории"}</div>
          <div class="activity-tags">
            ${
              a.min_age || a.max_age
                ? `<span class="tag-chip">${a.min_age || "?"}–${
                    a.max_age || "?"
                  } лет</span>`
                : ""
            }
            ${a.level ? `<span class="tag-chip">${a.level}</span>` : ""}
          </div>
        </div>
        <div class="activity-side">
          <div class="activity-price">
            Заявок: ${a.enrollments_count || 0}
          </div>
          <div>
            <button class="btn btn-secondary btn-sm" data-edit-activity="${a.id}">Редактировать</button>
            <button class="btn btn-outline btn-sm" data-delete-activity="${a.id}">Удалить</button>
          </div>
        </div>
      </article>
    `
        )
        .join("");

    // навесим обработчики после вставки
    list.querySelectorAll("[data-edit-activity]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.editActivity);
        const card = list.querySelector(
          `[data-activity-id="${id}"]`
        );
        openActivityFormForEdit(id, card);
      });
    });
    list.querySelectorAll("[data-delete-activity]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.deleteActivity);
        deleteActivity(id);
      });
    });
  } catch (err) {
    console.error("center activities load error", err);
    list.textContent = "Ошибка загрузки кружков.";
  }
}

function setupActivityForm() {
  const addBtn = document.getElementById("add-activity-btn");
  const block = document.getElementById("activity-form-block");
  const titleEl = document.getElementById("activity-form-title");
  const saveBtn = document.getElementById("activity-save-btn");
  const cancelBtn = document.getElementById("activity-cancel-btn");

  if (!addBtn || !block) return;

  addBtn.addEventListener("click", () => {
    editingActivityId = null;
    editingWasActive = false;
    titleEl.textContent = "Новое занятие";
    document.getElementById("activity-title").value = "";
    document.getElementById("activity-category").value = "";
    document.getElementById("activity-description").value = "";
    document.getElementById("activity-min-age").value = "";
    document.getElementById("activity-max-age").value = "";
    document.getElementById("activity-level").value = "";
    document.getElementById("activity-active").checked = true;
    block.style.display = "block";
  });

  cancelBtn.addEventListener("click", () => {
    block.style.display = "none";
  });

  saveBtn.addEventListener("click", async () => {
    const body = {
      title: document.getElementById("activity-title").value.trim(),
      category: document
        .getElementById("activity-category")
        .value.trim(),
      description: document
        .getElementById("activity-description")
        .value.trim(),
      min_age:
        Number(document.getElementById("activity-min-age").value || 0) ||
        null,
      max_age:
        Number(document.getElementById("activity-max-age").value || 0) ||
        null,
      level: document.getElementById("activity-level").value.trim(),
      is_active: document.getElementById("activity-active").checked,
    };

    if (!body.title) {
      alert("Введите название занятия");
      return;
    }

    const isNew = editingActivityId === null;

    // --- ПРОВЕРКА ЛИМИТА АКТИВНЫХ ЗАНЯТИЙ ---
    if (TARIFF_LIMIT !== Infinity && body.is_active) {
      let newActiveCount = ACTIVE_ACTIVITIES_COUNT;

      if (isNew) {
        newActiveCount = ACTIVE_ACTIVITIES_COUNT + 1;
      } else if (!editingWasActive && body.is_active) {
        // перевод из неактивного в активное
        newActiveCount = ACTIVE_ACTIVITIES_COUNT + 1;
      }

      if (newActiveCount > TARIFF_LIMIT) {
        alert(
          `По вашему тарифу доступно не более ${TARIFF_LIMIT} активных занятий.\n` +
            `Сейчас активных: ${ACTIVE_ACTIVITIES_COUNT}.\n` +
            `Сделайте какое-то занятие неактивным или смените тариф, чтобы добавить новое активное.`
        );
        return;
      }
    }

    const url =
      editingActivityId === null
        ? `${API_BASE}/api/center/activities?centerId=${CENTER_ID}`
        : `${API_BASE}/api/center/activities/${editingActivityId}?centerId=${CENTER_ID}`;
    const method = editingActivityId === null ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("save error");
      block.style.display = "none";
      await loadCenterActivities();
      await loadCenterDashboard();
    } catch (err) {
      console.error("activity save error", err);
      alert("Ошибка сохранения занятия");
    }
  });
}

function openActivityFormForEdit(id, cardEl) {
  editingActivityId = id;
  const titleEl = document.getElementById("activity-form-title");
  const block = document.getElementById("activity-form-block");

  const name = cardEl.querySelector("h3").childNodes[0].textContent.trim();
  document.getElementById("activity-title").value = name;
  // остальные поля можно отредактировать вручную (для простоты демо)
  document.getElementById("activity-description").value = "";
  document.getElementById("activity-category").value = "";
  document.getElementById("activity-min-age").value = "";
  document.getElementById("activity-max-age").value = "";
  document.getElementById("activity-level").value = "";

  const isActiveBadge = cardEl.querySelector(".badge");
  editingWasActive =
    isActiveBadge && isActiveBadge.textContent.includes("актив");

  document.getElementById("activity-active").checked = !!editingWasActive;

  titleEl.textContent = "Редактировать занятие (основные поля)";
  block.style.display = "block";
}

async function deleteActivity(id) {
  if (!confirm("Удалить это занятие вместе с привязанными группами/заявками?"))
    return;
  try {
    const res = await fetch(
      `${API_BASE}/api/center/activities/${id}?centerId=${CENTER_ID}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("delete error");
    await loadCenterActivities();
    await loadCenterDashboard();
  } catch (err) {
    console.error("activity delete error", err);
    alert("Ошибка удаления занятия");
  }
}

// --------------------------------
// 3.4. Заявки + бейджик "новые"
// --------------------------------
async function loadCenterEnrollments() {
  const list = document.getElementById("enrollments-list");
  const statusSelect = document.getElementById("enroll-filter-status");
  if (!list) return;

  const filterStatus = statusSelect ? statusSelect.value : "";

  list.textContent = "Загрузка заявок...";

  try {
    // всегда берём ВСЕ заявки, а фильтр применяем на фронте,
    // чтобы посчитать количество новых (pending) для бейджа
    const res = await fetch(
      `${API_BASE}/api/center/enrollments?centerId=${CENTER_ID}`
    );
    const allRows = await res.json();

    const pendingCount = allRows.filter((e) => e.status === "pending").length;
    updateEnrollmentsBadge(pendingCount);

    const rows = filterStatus
      ? allRows.filter((e) => e.status === filterStatus)
      : allRows;

    if (!rows.length) {
      list.innerHTML = "<p>Заявок нет.</p>";
      return;
    }

    list.innerHTML = rows
      .map((e) => {
        const age = e.birth_date ? calcAge(e.birth_date) : "—";
        return `
        <article class="split-card" data-enroll-id="${e.id}">
          <h3>${e.activity_title}</h3>
          <p class="section-subtitle">
            Ребёнок: ${e.kid_name} (${age}) · Родитель: ${e.parent_name}
          </p>
          <p class="section-subtitle">
            Контакты: ${e.parent_phone || ""} ${e.parent_email || ""}</p>
          <p class="section-subtitle">
            Статус: <b>${statusLabel(e.status)}</b>
          </p>
          ${
            e.comment
              ? `<p class="section-subtitle">Комментарий: ${e.comment}</p>`
              : ""
          }
          <div class="split-card-footer">
            <button class="btn btn-secondary btn-sm" data-approve="${e.id}">Подтвердить</button>
            <button class="btn btn-outline btn-sm" data-reject="${e.id}">Отклонить</button>
          </div>
        </article>
      `;
      })
      .join("");

    list.querySelectorAll("[data-approve]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.approve);
        updateEnrollmentStatus(id, "approved");
      });
    });
    list.querySelectorAll("[data-reject]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.reject);
        updateEnrollmentStatus(id, "rejected");
      });
    });
  } catch (err) {
    console.error("center enrollments load error", err);
    list.textContent = "Ошибка загрузки заявок.";
  }
}

function setupEnrollFilters() {
  const btn = document.getElementById("enroll-filter-apply");
  if (!btn) return;
  btn.addEventListener("click", () => {
    loadCenterEnrollments();
  });
}

// обновление бейджа "Записи" в боковом меню
function updateEnrollmentsBadge(count) {
  const badge = document.getElementById("center-enrollments-badge");
  if (!badge) return;

  if (count > 0) {
    badge.hidden = false;
    badge.textContent = count > 99 ? "99+" : String(count);
  } else {
    badge.hidden = true;
    badge.textContent = "";
  }
}

function statusLabel(s) {
  switch (s) {
    case "pending":
      return "Ожидание";
    case "approved":
      return "Подтверждено";
    case "rejected":
      return "Отклонено";
    case "waitlist":
      return "Лист ожидания";
    default:
      return s || "";
  }
}

async function updateEnrollmentStatus(id, newStatus) {
  const comment = prompt(
    `Комментарий для родителя (не обязательно):`,
    ""
  );
  try {
    const res = await fetch(
      `${API_BASE}/api/center/enrollments/${id}/status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, comment }),
      }
    );
    if (!res.ok) throw new Error("status error");
    await loadCenterEnrollments();
    await loadCenterDashboard();
  } catch (err) {
    console.error("center enrollment status error", err);
    alert("Ошибка изменения статуса заявки");
  }
}

// утилита возраста (как в parent.js)
function calcAge(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const mDiff = now.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} лет`;
}
