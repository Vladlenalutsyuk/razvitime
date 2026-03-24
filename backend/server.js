require("dotenv").config();
const express = require("express");
const cors = require("cors");

const statsRoute  = require("./routes/stats");
const parentRoute = require("./routes/parent");
const authRoute   = require("./routes/auth"); // ← добавили
const centerRoute = require("./routes/center");   // НОВОЕ
const adminRoute = require("./routes/admin");     // НОВОЕ

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/stats", statsRoute);
app.use("/api/parent", parentRoute);
app.use("/api/center", centerRoute);   // кабинет центра
app.use("/api/admin", adminRoute);     // админ-панель
app.use("/api/auth", authRoute); // ← подключили

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
