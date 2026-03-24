// frontend/schedule.html helper
document.addEventListener("DOMContentLoaded", () => {
  const userRaw = localStorage.getItem("razvitime_user");
  const guestBox = document.getElementById("schedule-guest-message");
  const content = document.getElementById("schedule-content");

  let user = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (e) {
    user = null;
  }

  if (!user || user.role !== "parent") {
    guestBox.style.display = "block";
    content.style.display = "none";
  } else {
    guestBox.style.display = "none";
    content.style.display = "block";
  }
});
