// frontend/parent.js
const API_BASE = "http://localhost:5000";

let PARENT_ID = null;

// ---------------------------------------------------------
// ИНИЦИАЛИЗАЦИЯ
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // проверяем авторизацию
  const raw = localStorage.getItem("razvitime_user");
  let user = null;
  try {
    user = raw ? JSON.parse(raw) : null;
  } catch (e) {
    user = null;
  }

  // если не авторизован или не родитель — отправляем на страницу входа
  if (!user || user.role !== "parent" || !user.parent_id) {
    window.location.href = "auth.html#parent";
    return;
  }

  PARENT_ID = user.parent_id;

  // === КНОПКА ВЫХОДА ===
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("razvitime_user");
      localStorage.removeItem("razvitime_token");
      window.location.href = "index.html";
    });
  }

  // переключение вкладок (разделы кабинета)
  const tabButtons = document.querySelectorAll(".tab-btn[data-section]");
  const sections = document.querySelectorAll(".parent-section");
  const REMINDERS_KEY = "razvitime_reminders";

  function getRemindersList() {
    try {
      return JSON.parse(localStorage.getItem(REMINDERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveRemindersList(list) {
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(list));
  }

  function renderNotificationsDropdown() {
    const bell = document.getElementById("notifications-bell");
    const badge = document.getElementById("notifications-badge");
    const dropdown = document.getElementById("notifications-dropdown");
    if (!bell || !badge || !dropdown) return;

    const reminders = getRemindersList();
    const unreadCount = reminders.length;

    if (unreadCount > 0) {
      badge.hidden = false;
      badge.textContent = unreadCount;
    } else {
      badge.hidden = true;
    }

    if (!reminders.length) {
      dropdown.innerHTML = `<div class="section-subtitle">Активных напоминаний нет.</div>`;
      return;
    }

    dropdown.innerHTML = reminders
      .map(
        (r) => `
      <div class="notification-item">
        <div class="notification-title">${r.title}</div>
        <div class="notification-meta">
          ${r.time_label || "Напоминание"}${
          r.center_name ? " · " + r.center_name : ""
        }
        </div>
        ${
          r.note
            ? `<div class="notification-note">${r.note}</div>`
            : ""
        }
        <div class="notification-actions">
          <button class="btn btn-outline btn-sm"
                  data-reminder-id="${r.id}">
            Закрыть
          </button>
        </div>
      </div>
    `
      )
      .join("");

    dropdown
      .querySelectorAll("button[data-reminder-id]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.getAttribute("data-reminder-id"));
          const list = getRemindersList().filter((r) => r.id !== id);
          saveRemindersList(list);
          renderNotificationsDropdown();
        });
      });
  }

  function setupNotificationsBell() {
    const bell = document.getElementById("notifications-bell");
    const dropdown = document.getElementById("notifications-dropdown");
    if (!bell || !dropdown) return;

    renderNotificationsDropdown();

    bell.addEventListener("click", () => {
      dropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (
        !e.target.closest(".nav-notifications") &&
        dropdown.classList.contains("open")
      ) {
        dropdown.classList.remove("open");
      }
    });
  }

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

  // загрузки и настройка форм
  loadDashboard();
  loadKids();
  loadProfile();
  setupKidsForm();
  setupSearch();
  setupProfileSave();
  setupSchoolForm();   // форма для школьного расписания
  loadSchoolLessons(); // подгрузка школьных уроков + кружков
  setupScheduleExport();
  setupScheduleControls();
  setupNotificationsBell();
});

// ---------------------------------------------------------
// 2.1. Дашборд
// ---------------------------------------------------------
async function loadDashboard() {
  const greetingBox = document.getElementById("parent-greeting");
  const upcomingBox = document.getElementById("parent-upcoming");
  if (!greetingBox || !upcomingBox || !PARENT_ID) return;

  try {
    const res = await fetch(
      `${API_BASE}/api/parent/dashboard?parentId=${PARENT_ID}`
    );
    const data = await res.json();

    // 1) Приветствие + блок "О платформе" + кнопка "Инструкция"
    greetingBox.innerHTML = `
      <div class="dashboard-hero">
        <h2 class="section-title" style="margin-bottom:8px;">
          Здравствуйте, ${data.parent_name || "родитель"}!
        </h2>
        <p class="section-subtitle">
          РазвиТайм — это онлайн-помощник для родителей: здесь можно
          вести школьное расписание, записывать детей на кружки и
          получать напоминания о занятиях в одном удобном месте.
        </p>

        <div class="platform-info">
          <h3>Что умеет кабинет родителя</h3>
          <ul class="platform-info-list">
            <li>Добавлять детей и хранить их основные данные.</li>
            <li>Вести школьное расписание по предметам и урокам.</li>
            <li>Подбирать кружки и секции в городе в разделе «Найти занятия».</li>
            <li>Записывать ребёнка в группы центров (через заявки).</li>
            <li>Видеть общее расписание «школа + кружки» по дням недели.</li>
            <li>Настраивать напоминания о занятиях.</li>
            <li>Экспортировать расписание ребёнка в картинку для распечатки или отправки бабушке 😊</li>
          </ul>
        </div>

        <button class="btn btn-secondary btn-sm" id="parent-instruction-toggle">
          Инструкция по кабинету
        </button>

        <div id="parent-instruction" class="instruction-panel" style="display:none;">
          <ol>
            <li><strong>Добавьте детей</strong> во вкладке «Дети» — ФИО, дата рождения, опционально фото.</li>
            <li><strong>Заполните школьное расписание</strong> во вкладке «Расписание» через кнопку
                «Изменить школьное расписание».</li>
            <li><strong>Найдите кружки</strong> во вкладке «Найти занятия» и подберите подходящие по возрасту и городу.</li>
            <li><strong>Запишите ребёнка</strong> на занятия (через заявки в центр, если включено).</li>
            <li><strong>Следите за общим расписанием</strong> (школа + кружки) и выбирайте вид «день / неделя».</li>
            <li><strong>Настройте напоминания</strong> на вкладке «Напоминания» (email / Telegram / др.).</li>
            <li><strong>Экспортируйте расписание</strong> одним кликом в картинку, чтобы поделиться с семьёй.</li>
          </ol>
        </div>
      </div>
    `;

    const instructionToggle = document.getElementById(
      "parent-instruction-toggle"
    );
    const instructionPanel = document.getElementById("parent-instruction");
    if (instructionToggle && instructionPanel) {
      instructionToggle.addEventListener("click", () => {
        const visible = instructionPanel.style.display === "block";
        instructionPanel.style.display = visible ? "none" : "block";
      });
    }

    // 2) Ближайшие занятия
    if (!data.upcoming || !data.upcoming.length) {
      upcomingBox.textContent = "Пока нет записанных занятий.";
    } else {
      upcomingBox.innerHTML = `
        <ul class="upcoming-list">
          ${data.upcoming
            .map(
              (x) => `
            <li>
              <strong>${x.kid_name}</strong> · ${x.activity_title || "Занятие"}
              <br>
              ${weekdayName(x.weekday)}, ${x.start_time.slice(0, 5)}–${x.end_time.slice(0, 5)}
              ${x.center_name ? ` · ${x.center_name}` : ""}
            </li>`
            )
            .join("")}
        </ul>
      `;
    }

    // 3) Карусель отзывов (демо, на фронтенде)
    initReviewsCarousel();
  } catch (err) {
    console.error("dashboard error", err);
    greetingBox.textContent = "Ошибка загрузки данных.";
    upcomingBox.textContent = "Ошибка загрузки занятий.";
  }
}

const DEMO_REVIEWS = [
  {
    center: "Демо Центр развития детей",
    text: "Очень нравится, что РазвиТайм собрал все занятия в одном расписании. Больше не путаемся с кружками!",
    parent: "Анна, мама Ани (9 лет)",
  },
  {
    center: "Школа плавания «Дельфин»",
    text: "Удобно видеть уроки и секции в одном месте. Ребёнок сам смотрит расписание и собирает рюкзак.",
    parent: "Марина, мама Ильи (7 лет)",
  },
  {
    center: "Студия творчества «АртMix»",
    text: "Добавила двум детям расписание школы и кружков — и наконец-то не забываю про сменку и форму.",
    parent: "Ольга, мама Даши и Кирилла",
  },
];

function initReviewsCarousel() {
  const carousel = document.getElementById("reviews-carousel");
  const dotsContainer = document.getElementById("reviews-dots");
  if (!carousel || !dotsContainer) return;

  carousel.innerHTML = "";
  dotsContainer.innerHTML = "";

  DEMO_REVIEWS.forEach((r, idx) => {
    const slide = document.createElement("div");
    slide.className = "review-slide" + (idx === 0 ? " active" : "");
    slide.innerHTML = `
      <div class="review-text">“${r.text}”</div>
      <div class="review-meta">
        <span class="review-center">${r.center}</span>
        <span class="review-parent">${r.parent}</span>
      </div>
    `;
    carousel.appendChild(slide);

    const dot = document.createElement("button");
    dot.className = "review-dot" + (idx === 0 ? " active" : "");
    dot.setAttribute("data-index", idx);
    dotsContainer.appendChild(dot);
  });

  let current = 0;
  const slides = carousel.querySelectorAll(".review-slide");
  const dots = dotsContainer.querySelectorAll(".review-dot");

  function goTo(idx) {
    slides[current].classList.remove("active");
    dots[current].classList.remove("active");
    current = idx;
    slides[current].classList.add("active");
    dots[current].classList.add("active");
  }

  dots.forEach((d) => {
    d.addEventListener("click", () => {
      const idx = Number(d.getAttribute("data-index"));
      goTo(idx);
    });
  });

  setInterval(() => {
    const next = (current + 1) % slides.length;
    goTo(next);
  }, 6000);
}

function weekdayName(num) {
  const map = {
    1: "Пн",
    2: "Вт",
    3: "Ср",
    4: "Чт",
    5: "Пт",
    6: "Сб",
    7: "Вс",
  };
  return map[num] || "";
}

// ---------------------------------------------------------
// 2.3. Дети (CRUD)
// ---------------------------------------------------------
let editingKidId = null;

async function loadKids() {
  const list = document.getElementById("kids-list");
  if (!list) return;
  try {
    const res = await fetch(
      `${API_BASE}/api/parent/kids?parentId=${PARENT_ID}`
    );
    const kids = await res.json();

    if (kids.length === 0) {
      list.innerHTML = "<p>Пока нет добавленных детей.</p>";
      return;
    }

    list.innerHTML = kids
      .map((kid) => {
        const age = kid.birth_date ? calcAge(kid.birth_date) : "—";
        return `
        <div class="split-card">
          <div style="display:flex; gap:12px;">
            <div>
              ${
                kid.photo_url
                  ? `<img src="${kid.photo_url}" alt="${kid.full_name}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">`
                  : `<div style="width:60px;height:60px;border-radius:50%;background:#e4f6e4;display:flex;align-items:center;justify-content:center;font-size:24px;">${
                      kid.full_name[0] || "?"
                    }</div>`
              }
            </div>
            <div>
              <h3>${kid.full_name}</h3>
              <p class="section-subtitle">Возраст: ${age}</p>
            </div>
          </div>
          <div class="split-card-footer">
            <button class="btn btn-secondary btn-sm" onclick="editKid(${
              kid.id
            }, '${kid.full_name}', '${kid.birth_date || ""}', '${
          kid.gender || ""
        }', '${kid.photo_url || ""}')">
              Редактировать
            </button>
            <button class="btn btn-outline btn-sm" onclick="deleteKid(${
              kid.id
            })">Удалить</button>
          </div>
        </div>`;
      })
      .join("");
  } catch (err) {
    console.error("kids load error", err);
    list.textContent = "Ошибка загрузки списка детей.";
  }
}

function calcAge(dateStr) {
  if (!dateStr) return "—";
  try {
    const clean = dateStr.includes("T") ? dateStr.slice(0, 10) : dateStr;
    const [y, m, d] = clean.split("-").map(Number);
    if (!y || !m || !d) return "—";
    const birth = new Date(y, m - 1, d);
    if (Number.isNaN(birth.getTime())) return "—";
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const mDiff = now.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} лет`;
  } catch {
    return "—";
  }
}

function normalizeDateForInput(value) {
  if (!value) return "";
  // Если пришло ISO "2025-05-10T21:00:00.000Z" — берём только дату
  if (typeof value === "string" && value.includes("T")) {
    return value.slice(0, 10);
  }
  // Если вдруг пришла строка длиннее 10 символов — тоже обрежем
  if (typeof value === "string" && value.length > 10) {
    return value.slice(0, 10);
  }
  return value;
}

function setupKidsForm() {
  const addBtn = document.getElementById("add-kid-btn");
  const formBlock = document.getElementById("kid-form-block");
  const title = document.getElementById("kid-form-title");
  const saveBtn = document.getElementById("kid-save-btn");
  const cancelBtn = document.getElementById("kid-cancel-btn");

  if (!addBtn || !formBlock) return;

  addBtn.addEventListener("click", () => {
    editingKidId = null;
    title.textContent = "Добавить ребёнка";
    document.getElementById("kid-name").value = "";
    document.getElementById("kid-birth").value = "";
    document.getElementById("kid-gender").value = "";
    document.getElementById("kid-photo").value = "";
    formBlock.style.display = "block";
  });

  cancelBtn.addEventListener("click", () => {
    formBlock.style.display = "none";
  });

  saveBtn.addEventListener("click", async () => {
    const full_name = document.getElementById("kid-name").value.trim();
    const birth_date = document.getElementById("kid-birth").value || null;
    const gender = document.getElementById("kid-gender").value || null;
    const photo_url = document.getElementById("kid-photo").value || null;

    if (!full_name) {
      alert("Введите имя ребёнка");
      return;
    }

    const body = { full_name, birth_date, gender, photo_url };
    const url =
      editingKidId === null
        ? `${API_BASE}/api/parent/kids?parentId=${PARENT_ID}`
        : `${API_BASE}/api/parent/kids/${editingKidId}?parentId=${PARENT_ID}`;
    const method = editingKidId === null ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Ошибка сохранения");
      formBlock.style.display = "none";
      loadKids();
    } catch (err) {
      console.error("kid save error", err);
      alert("Ошибка сохранения ребёнка");
    }
  });
}

function editKid(id, name, birth, gender, photo) {
  editingKidId = id;
  const formBlock = document.getElementById("kid-form-block");
  const title = document.getElementById("kid-form-title");

  title.textContent = "Редактировать ребёнка";
  document.getElementById("kid-name").value = name || "";
  document.getElementById("kid-birth").value = normalizeDateForInput(birth);
  document.getElementById("kid-gender").value = gender || "";
  document.getElementById("kid-photo").value = photo || "";
  formBlock.style.display = "block";
}

async function deleteKid(id) {
  if (!confirm("Удалить этого ребёнка?")) return;
  try {
    const res = await fetch(
      `${API_BASE}/api/parent/kids/${id}?parentId=${PARENT_ID}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Ошибка удаления");
    loadKids();
  } catch (err) {
    console.error("kid delete error", err);
    alert("Ошибка удаления ребёнка");
  }
}

// ---------------------------------------------------------
// 2.4. Поиск кружков
// ---------------------------------------------------------
function setupSearch() {
  const btn = document.getElementById("search-activities-btn");
  const simpleBtn = document.getElementById("simple-search-btn");
  const textInput = document.getElementById("filter-text");
  if (!btn) return;

  async function runSearch() {
    const text = textInput ? textInput.value.trim() : "";
    const city = document.getElementById("filter-city").value.trim();
    const age = document.getElementById("filter-age").value.trim();
    const category = document.getElementById("filter-category").value;

    const params = new URLSearchParams();
    if (text) params.append("q", text);       // обычный поиск
    if (city) params.append("city", city);
    if (age) params.append("age", age);
    if (category) params.append("category", category);

    const box = document.getElementById("activities-results");
    box.textContent = "Загрузка...";

    try {
      const url = `${API_BASE}/api/parent/search-activities?${params.toString()}`;
      const res = await fetch(url);
      const activities = await res.json();
      if (!activities.length) {
        box.textContent = "Ничего не найдено.";
        return;
      }

      box.innerHTML = activities
        .map(
          (a) => `
        <article class="activity-card">
          <div class="activity-main">
            <h3>${a.title}</h3>
            <div class="activity-meta">
              <button class="link-as-button" onclick="openCenter(${a.center_id})">
                ${a.center_name}
              </button> · ${a.center_city}
            </div>
            <div class="activity-tags">
              <span class="tag-chip">${a.category || "Без категории"}</span>
              ${
                a.min_age || a.max_age
                  ? `<span class="tag-chip">${a.min_age || "?"}–${a.max_age || "?"} лет</span>`
                  : ""
              }
            </div>
          </div>
          <div class="activity-side">
            <div class="activity-price">Цена по запросу</div>
            <div>
              <button class="btn btn-primary btn-sm" onclick="openActivity(${a.id})">
                Подробнее
              </button>
            </div>
          </div>
        </article>`
        )
        .join("");
    } catch (err) {
      console.error("search error", err);
      box.textContent = "Ошибка поиска кружков.";
    }
  }

  btn.addEventListener("click", runSearch);

  if (simpleBtn) {
    simpleBtn.addEventListener("click", runSearch);
  }

  if (textInput) {
    textInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        runSearch();
      }
    });
  }

  // ПЕРВЫЙ ЗАПУСК БЕЗ ФИЛЬТРОВ: показать все занятия
  runSearch();
}

function openCenter(id) {
  // новая публичная страница центра
  window.location.href = `center_info.html?id=${id}`;
}

function openActivity(id) {
  // можно сделать отдельную страницу activity.html?id=...
  window.location.href = `activity.html?id=${id}`;
}

// ---------------------------------------------------------
// 2.2. Профиль родителя
// ---------------------------------------------------------
async function loadProfile() {
  try {
    const res = await fetch(
      `${API_BASE}/api/parent/profile?parentId=${PARENT_ID}`
    );
    const p = await res.json();

    document.getElementById("profile-city").value = p.city || "";
    document.getElementById("profile-phone").value = p.phone || "";
    document.getElementById("profile-telegram").value = p.telegram || "";
    document.getElementById("profile-whatsapp").value = p.whatsapp || "";
    document.getElementById("profile-extra-email").value =
      p.extra_email || "";
    document.getElementById("profile-avatar").value = p.avatar_url || "";
  } catch (err) {
    console.error("profile load error", err);
  }
}

function setupProfileSave() {
  const btn = document.getElementById("profile-save-btn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const body = {
      city: document.getElementById("profile-city").value.trim(),
      phone: document.getElementById("profile-phone").value.trim(),
      telegram: document.getElementById("profile-telegram").value.trim(),
      whatsapp: document.getElementById("profile-whatsapp").value.trim(),
      extra_email: document
        .getElementById("profile-extra-email")
        .value.trim(),
      avatar_url: document.getElementById("profile-avatar").value.trim(),
    };
    try {
      const res = await fetch(
        `${API_BASE}/api/parent/profile?parentId=${PARENT_ID}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) throw new Error("Ошибка сохранения");
      alert("Профиль сохранён");
    } catch (err) {
      console.error("profile save error", err);
      alert("Ошибка сохранения профиля");
    }
  });
}

// ---------------------------------------------------------
// Расписание: школа + кружки
// ---------------------------------------------------------
let SCHOOL_LESSONS = [];
let SCHEDULE_KIDS = [];
let KID_COLORS = {};
let currentScheduleView = "week";
let scheduleTypeFilter = "all";
let EXTRA_SLOTS = [];

const KID_COLOR_PALETTE = [
  "#c6f1a9", // зелёный бренда
  "#ffc7a6", // оранжевый бренда
  "#a9d5ff",
  "#f7b6ff",
  "#ffeaa6",
];

function assignKidColors(kids) {
  KID_COLORS = {};
  kids.forEach((k, idx) => {
    KID_COLORS[k.id] = KID_COLOR_PALETTE[idx % KID_COLOR_PALETTE.length];
  });
}

function loadKidColorsFromStorage() {
  try {
    const raw = localStorage.getItem(`razvitime_kid_colors_${PARENT_ID}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveKidColorsToStorage() {
  try {
    localStorage.setItem(
      `razvitime_kid_colors_${PARENT_ID}`,
      JSON.stringify(KID_COLORS)
    );
  } catch (e) {
    console.error("kid colors save error", e);
  }
}

function initKidColors(kids) {
  const stored = loadKidColorsFromStorage();
  if (stored) {
    KID_COLORS = stored;
  } else {
    assignKidColors(kids);
    saveKidColorsToStorage();
  }
  renderKidColorsUI(kids);
}

function renderKidColorsUI(kids) {
  const card = document.getElementById("kid-colors-card");
  const list = document.getElementById("kid-colors-list");
  if (!card || !list) return;
  if (!kids || !kids.length) {
    card.style.display = "none";
    return;
  }
  card.style.display = "block";

  list.innerHTML = kids
    .map((k) => {
      const color = getKidColor(k.id);
      return `
        <div class="kid-color-item">
          <span>${k.full_name}</span>
          <input type="color"
                 value="${color}"
                 data-kid-id="${k.id}">
        </div>
      `;
    })
    .join("");

  list.querySelectorAll('input[type="color"]').forEach((input) => {
    input.addEventListener("input", () => {
      const kidId = Number(input.getAttribute("data-kid-id"));
      KID_COLORS[kidId] = input.value;
      saveKidColorsToStorage();
      renderScheduleTable();
    });
  });
}

function getKidColor(kidId) {
  return KID_COLORS[kidId] || "#e5f0ff";
}

// ---------------------------------------------------------
// Загрузка школьных уроков + кружков
// ---------------------------------------------------------
async function loadSchoolLessons() {
  const box = document.getElementById("school-lessons-list");
  const kidSelect = document.getElementById("school-kid-select");
  const scheduleKidFilter = document.getElementById("schedule-kid-filter");
  if (!PARENT_ID) return;

  try {
    // 1. Дети
    const kidsRes = await fetch(
      `${API_BASE}/api/parent/kids?parentId=${PARENT_ID}`
    );
    const kids = await kidsRes.json();

    if (kidSelect) {
      kidSelect.innerHTML = kids
        .map((k) => `<option value="${k.id}">${k.full_name}</option>`)
        .join("");
    }

    SCHEDULE_KIDS = kids;
    initKidColors(kids);

    if (scheduleKidFilter) {
      scheduleKidFilter.innerHTML =
        `<option value="all">Все дети</option>` +
        kids
          .map((k) => `<option value="${k.id}">${k.full_name}</option>`)
          .join("");
    }

    // 2. Объединённое расписание (школа + кружки)
    const res = await fetch(
      `${API_BASE}/api/parent/school-lessons?parentId=${PARENT_ID}`
    );
    const lessons = await res.json();

    SCHOOL_LESSONS = lessons.filter((l) => l.item_type === "school");
    EXTRA_SLOTS = lessons.filter((l) => l.item_type !== "school");

    if (box) {
      box.textContent =
        "Школьные уроки учитываются в общей таблице расписания выше.";
    }

    renderScheduleTable();
  } catch (err) {
    console.error("school lessons load error", err);
    if (box) {
      box.textContent = "Ошибка загрузки расписания.";
    }
  }
}

function renderScheduleTable() {
  const wrapper = document.getElementById("schedule-table-wrapper");
  const kidFilter = document.getElementById("schedule-kid-filter");
  if (!wrapper || !kidFilter) return;

  const kidId = kidFilter.value === "all" ? null : Number(kidFilter.value);

  // 1) Фильтруем школьные уроки по ребёнку
  let lessons = SCHOOL_LESSONS || [];
  if (kidId) {
    lessons = lessons.filter((l) => l.kid_id === kidId);
  }

  // 2) Фильтруем кружки по ребёнку
  let extra = EXTRA_SLOTS || [];
  if (kidId) {
    extra = extra.filter((e) => e.kid_id === kidId);
  }

  // Применяем фильтр типов
  if (scheduleTypeFilter === "school") {
    extra = [];
  } else if (scheduleTypeFilter === "extras") {
    lessons = [];
  }

  if (!lessons.length && !extra.length) {
    wrapper.textContent =
      "Расписание пока пусто. Добавьте школьные уроки и/или запишите ребёнка на кружки.";
    return;
  }

  const weekdays = [1, 2, 3, 4, 5, 6, 7];
  const weekdayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  // Максимальный номер урока (для школьной части)
  const maxLesson =
    lessons.reduce((max, l) => Math.max(max, l.lesson_number || 1), 1) || 1;

  let visibleWeekdays = weekdays;

  if (currentScheduleView === "day") {
    const jsDay = new Date().getDay(); // 0..6 (0 = Вс)
    const weekday = jsDay === 0 ? 7 : jsDay;
    visibleWeekdays = [weekday];
  }

  const headerTitle =
    currentScheduleView === "day"
      ? "Расписание на сегодня"
      : "Расписание на неделю";

  let html = `<h3 style="margin-top:0;margin-bottom:8px;">${headerTitle}</h3>`;
  html += `<div class="schedule-table-scroll"><table class="schedule-table">`;

  // THEAD
  html += "<thead><tr><th>Урок / блок</th>";
  visibleWeekdays.forEach((wd) => {
    html += `<th>${weekdayLabels[wd - 1]}</th>`;
  });
  html += "</tr></thead>";

  // TBODY
  html += "<tbody>";

  // 1) Строки с уроками школы
  for (let lessonNum = 1; lessonNum <= maxLesson; lessonNum++) {
    html += `<tr><td class="schedule-lesson-num">${lessonNum}</td>`;
    visibleWeekdays.forEach((wd) => {
      const cellItems = lessons.filter(
        (l) => (l.lesson_number || 1) === lessonNum && l.weekday === wd
      );
      if (!cellItems.length) {
        html += `<td class="schedule-cell schedule-cell-empty"></td>`;
      } else {
        const cellHtml = cellItems
          .map((l) => {
            const color = getKidColor(l.kid_id);
            return `
              <div class="schedule-badge schedule-badge-school" style="background:${color};">
                <div class="schedule-badge-subject">${l.subject}</div>
                <div class="schedule-badge-kid">${l.kid_name}</div>
              </div>
            `;
          })
          .join("");
        html += `<td class="schedule-cell">${cellHtml}</td>`;
      }
    });
    html += "</tr>";
  }

  // 2) ДОП. ЗАНЯТИЯ (КРУЖКИ) — ОТДЕЛЬНАЯ СТРОКА
  html += `<tr><td class="schedule-lesson-num">Кружки</td>`;
  visibleWeekdays.forEach((wd) => {
    const daySlots = extra.filter((e) => e.weekday === wd);
    if (!daySlots.length) {
      html += `<td class="schedule-cell schedule-cell-empty"></td>`;
    } else {
      const cellHtml = daySlots
        .map((e) => {
          const color = getKidColor(e.kid_id);
          return `
            <div class="schedule-badge schedule-badge-extra" style="border-color:${color};">
              <div class="schedule-badge-subject">${e.activity_title}</div>
              <div class="schedule-badge-kid">
                ${e.kid_name} · ${e.start_time.slice(0, 5)}–${e.end_time.slice(
            0,
            5
          )}
              </div>
              <div class="schedule-badge-center">${e.center_name}</div>
            </div>
          `;
        })
        .join("");
      html += `<td class="schedule-cell">${cellHtml}</td>`;
    }
  });
  html += "</tr>";

  html += "</tbody></table></div>";

  wrapper.innerHTML = html;
}

function setupScheduleControls() {
  const kidFilter = document.getElementById("schedule-kid-filter");
  const viewButtons = document.querySelectorAll(".view-btn");
  const typeRadios = document.querySelectorAll('input[name="schedule-type"]');

  typeRadios.forEach((r) => {
    r.addEventListener("change", () => {
      scheduleTypeFilter = r.value || "all";
      renderScheduleTable();
    });
  });

  const toggleSchoolFormBtn = document.getElementById("toggle-school-form-btn");
  const schoolFormContainer = document.getElementById("school-form-container");

  if (kidFilter) {
    kidFilter.addEventListener("change", () => {
      renderScheduleTable();
    });
  }

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      viewButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentScheduleView = btn.getAttribute("data-view") || "week";
      renderScheduleTable();
    });
  });

  if (toggleSchoolFormBtn && schoolFormContainer) {
    toggleSchoolFormBtn.addEventListener("click", () => {
      const visible = schoolFormContainer.style.display === "block";
      schoolFormContainer.style.display = visible ? "none" : "block";
    });
  }
}

function setupSchoolForm() {
  const btn = document.getElementById("school-add-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const kid_id = document.getElementById("school-kid-select").value;
    const weekday = document.getElementById("school-weekday").value;
    const lesson_number =
      document.getElementById("school-lesson-number").value;
    const subject = document
      .getElementById("school-subject")
      .value.trim();

    if (!kid_id || !weekday || !subject) {
      alert("Выберите ребёнка, день и введите предмет");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/parent/school-lessons?parentId=${PARENT_ID}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kid_id: Number(kid_id),
            weekday: Number(weekday),
            lesson_number: lesson_number ? Number(lesson_number) : null,
            subject,
          }),
        }
      );
      if (!res.ok) throw new Error("Ошибка сохранения");
      document.getElementById("school-subject").value = "";
      loadSchoolLessons();
    } catch (err) {
      console.error("school lessons save error", err);
      alert("Ошибка сохранения урока");
    }
  });
}

function setupScheduleExport() {
  const btn = document.getElementById("export-schedule-btn");
  const wrapper = document.getElementById("schedule-table-wrapper");
  if (!btn || !wrapper) return;

  btn.addEventListener("click", async () => {
    try {
      const canvas = await html2canvas(wrapper);
      const link = document.createElement("a");
      link.download = "raspisanie.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("export error", err);
      alert("Не удалось экспортировать расписание.");
    }
  });
}
