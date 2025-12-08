require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment-timezone");

const app = express();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB connection error:", err));

const statSchema = new mongoose.Schema({
  year: String,
  month: String,
  day: String,
  hour: String,
  count: { type: Number, default: 0 }
});

const Stat = mongoose.model("Stat", statSchema);

function getJakartaTime() {
  const now = moment().tz("Asia/Jakarta");
  return {
    year: now.format("YYYY"),
    month: now.format("MM"),
    day: now.format("DD"),
    hour: now.format("HH")
  };
}

app.use(async (req, res, next) => {
  const { year, month, day, hour } = getJakartaTime();

  await Stat.findOneAndUpdate(
    { year, month: null, day: null, hour: null },
    { $inc: { count: 1 } },
    { upsert: true }
  );

  await Stat.findOneAndUpdate(
    { year, month, day: null, hour: null },
    { $inc: { count: 1 } },
    { upsert: true }
  );

  await Stat.findOneAndUpdate(
    { year, month, day, hour: null },
    { $inc: { count: 1 } },
    { upsert: true }
  );

  await Stat.findOneAndUpdate(
    { year, month, day, hour },
    { $inc: { count: 1 } },
    { upsert: true }
  );

  next();
});

app.get("/", (req, res) => {
  res.json({ ok: true });
});

function cleanStats(stats) {
  return stats.map(stat => {
    const obj = {};
    if (stat.year) obj.year = stat.year;
    if (stat.month) obj.month = stat.month;
    if (stat.day) obj.day = stat.day;
    if (stat.hour) obj.hour = stat.hour;
    obj.count = stat.count;
    return obj;
  });
}

app.get("/stats", async (req, res) => {
  const stats = await Stat.find().lean();
  res.json(cleanStats(stats));
});

app.get("/stats/today", async (req, res) => {
  const { year, month, day } = getJakartaTime();
  const stats = await Stat.find({ year, month, day, hour: { $ne: null } }).lean();
  res.json(cleanStats(stats));
});

app.get("/stats/days", async (req, res) => {
  const stats = await Stat.find({ hour: null, day: { $ne: null } }).lean();
  res.json(cleanStats(stats));
});

app.get("/stats/months", async (req, res) => {
  const stats = await Stat.find({ hour: null, day: null, month: { $ne: null } }).lean();
  res.json(cleanStats(stats));
});

app.get("/stats/years", async (req, res) => {
  const stats = await Stat.find({ hour: null, day: null, month: null, year: { $ne: null } }).lean();
  res.json(cleanStats(stats));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));