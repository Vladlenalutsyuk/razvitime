document.addEventListener("DOMContentLoaded", () => {
  const parentBtn = document.getElementById("demo-parent-btn");
  const centerBtn = document.getElementById("demo-center-btn");
  const adminBtn = document.getElementById("demo-admin-btn");

  if (parentBtn) {
    parentBtn.addEventListener("click", () => {
      const user = {
        id: 1,
        role: "parent",
        parent_id: 1,
        email: "parent_demo@example.com",
      };
      localStorage.setItem("razvitime_user", JSON.stringify(user));
      window.location.href = "parent.html"; // сюда ведёт кабинет родителя
    });
  }

  if (centerBtn) {
    centerBtn.addEventListener("click", () => {
      const user = {
        id: 2,
        role: "center_admin",
        center_id: 1,
        email: "center_demo@example.com",
      };
      localStorage.setItem("razvitime_user", JSON.stringify(user));
      window.location.href = "center.html"; // кабинет центра
    });
  }

  if (adminBtn) {
    adminBtn.addEventListener("click", () => {
      const user = {
        id: 3,
        role: "admin",
        email: "admin@example.com",
      };
      localStorage.setItem("razvitime_user", JSON.stringify(user));
      window.location.href = "admin.html"; // админка
    });
  }
});
