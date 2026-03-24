// frontend/script.js
const API_BASE = "http://localhost:5000";

function animateStatNumbers() {
  const numbers = document.querySelectorAll(".stat-number[data-target]");
  numbers.forEach((el) => {
    const target = Number(el.dataset.target || el.textContent) || 0;
    let current = 0;
    const step = Math.max(1, Math.round(target / 60));

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = current;
    }, 20);
  });
}

async function loadStats() {
  const statsContainer = document.getElementById("stats-container");
  if (!statsContainer) return;

  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    const data = await res.json();

    statsContainer.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number stat-green" data-target="${data.parents}">0</div>
          <div class="stat-label">Зарегистрированных родителей</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-green" data-target="${data.kids}">0</div>
          <div class="stat-label">Детей в системе</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-orange" data-target="${data.activities}">0</div>
          <div class="stat-label">Активных кружков</div>
        </div>
        <div class="stat-card">
          <div class="stat-number stat-green" data-target="${data.centers}">0</div>
          <div class="stat-label">Партнёрских центров</div>
        </div>
      </div>
    `;

    animateStatNumbers();
  } catch (err) {
    console.error("Ошибка загрузки статистики:", err);
    if (statsContainer) {
      statsContainer.textContent =
        "Не удалось загрузить статистику (проверьте сервер).";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // статистика на главной
  loadStats();

  // спрятать кнопки "Войти/Создать аккаунт" для авторизованного родителя
  let user = null;
  try {
    const raw = localStorage.getItem("razvitime_user");
    user = raw ? JSON.parse(raw) : null;
  } catch (e) {
    user = null;
  }

  if (user && user.role === "parent") {
    const loginCtas = document.querySelectorAll(".js-login-cta");
    loginCtas.forEach((el) => {
      el.style.display = "none";
    });
  }
});
