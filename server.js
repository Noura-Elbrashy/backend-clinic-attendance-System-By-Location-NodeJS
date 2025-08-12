// const express = require("express");
// const mongoose = require("mongoose");
// require("dotenv").config();

// const userRoutes = require("./routes/userRoutes");
// const attendanceRoutes = require("./routes/attendanceRoutes");
// const authRoutes = require("./routes/authRoutes");
// const adminRoutes = require("./routes/adminRoutes");
// const branchRoutes = require("./routes/branchRoutes");

// const app = express();

// // Middlewares
// app.use(express.json());

// // Routes
// app.use("/api/users", userRoutes);
// app.use("/api/attendance", attendanceRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/branches", branchRoutes);

// // DB Connection
// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("✅ MongoDB connected");
//     app.listen(5000, () => console.log("🚀 Server running on port 5000"));
//   })
//   .catch((err) => console.error("❌ MongoDB connection error:", err));
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const branchRoutes = require("./routes/branchRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Middlewares
app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/report",reportRoutes);

// DB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(5000, () => console.log("🚀 Server running on port 5000"));
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));