const express = require("express");
const router = express.Router();
const Contest = require("../models/Contest");
const rateLimit = require("express-rate-limit");
const {
  fetchAllContests,
  updateContestStatus,
} = require("../services/contestFetcher");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
router.get("/", limiter, async (req, res) => {
  try {
    const { platforms, status, lastWeekOnly } = req.query;
    const query = {};
    if (platforms) {
      query.platform = { $in: platforms.split(",") };
    }
    if (status) {
      if (typeof status !== 'string') {
        return res.status(400).send("Bad request");
      }
      query.status = { $in: status.split(",") };
    }
    if (lastWeekOnly === "true" && (!status || status.includes("past"))) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (query.status && query.status.$in.includes("past")) {
        query.endTime = { $gte: oneWeekAgo };
      } else if (query.status) {
        if (!Array.isArray(query.status.$in)) {
          query.status.$in = [query.status.$in];
        }
        query.$or = [
          { status: { $in: query.status.$in.filter((s) => s !== "past") } },
          { status: "past", endTime: { $gte: oneWeekAgo } },
        ];
        delete query.status;
      } else {
        query.$or = [
          { status: { $ne: "past" } },
          { status: "past", endTime: { $gte: oneWeekAgo } },
        ];
      }
    }
    console.log(
      "Fetching contests with query:",
      JSON.stringify(query, null, 2)
    );
    const contests = await Contest.find(query).sort({ startTime: 1 });
    console.log(`Retrieved ${contests.length} contests`);
    const statusCounts = {};
    const platformCounts = {};
    contests.forEach((contest) => {
      statusCounts[contest.status] = (statusCounts[contest.status] || 0) + 1;
      platformCounts[contest.platform] =
        (platformCounts[contest.platform] || 0) + 1;
    });
    console.log("Contest status distribution:", statusCounts);
    console.log("Contest platform distribution:", platformCounts);
    res.json(contests);
  } catch (err) {
    console.error("Error fetching all contests:", err.message);
    res.status(500).json({ message: err.message });
  }
});
router.get("/upcoming", limiter, async (req, res) => {
  try {
    const { platforms } = req.query;
    const query = { status: "upcoming" };
    if (platforms) {
      query.platform = { $in: platforms.split(",") };
    }
    console.log("Fetching upcoming contests with query:", query);
    const contests = await Contest.find(query).sort({ startTime: 1 });
    console.log(`Retrieved ${contests.length} upcoming contests`);
    res.json(contests);
  } catch (err) {
    console.error("Error fetching upcoming contests:", err.message);
    res.status(500).json({ message: err.message });
  }
});
router.get("/ongoing", limiter, async (req, res) => {
  try {
    const { platforms } = req.query;
    const query = { status: "ongoing" };
    if (platforms) {
      query.platform = { $in: platforms.split(",") };
    }
    console.log("Fetching ongoing contests with query:", query);
    const contests = await Contest.find(query).sort({ endTime: 1 });
    console.log(`Retrieved ${contests.length} ongoing contests`);
    res.json(contests);
  } catch (err) {
    console.error("Error fetching ongoing contests:", err.message);
    res.status(500).json({ message: err.message });
  }
});
router.get("/past", limiter, async (req, res) => {
  try {
    const { platforms, limit, lastWeekOnly } = req.query;
    const query = { status: "past" };
    if (platforms) {
      query.platform = { $in: platforms.split(",") };
    }
    if (lastWeekOnly === "true") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      query.endTime = { $gte: oneWeekAgo };
      console.log(
        `Filtering past contests to after ${oneWeekAgo.toISOString()}`
      );
    }
    console.log(
      "Fetching past contests with query:",
      JSON.stringify(query, null, 2)
    );
    const totalPastContests = await Contest.countDocuments(query);
    console.log(`Total past contests matching query: ${totalPastContests}`);
    let contestQuery = Contest.find(query).sort({ endTime: -1 });
    if (limit && !isNaN(parseInt(limit))) {
      const limitValue = parseInt(limit);
      console.log(`Applying limit of ${limitValue} to past contests query`);
      contestQuery = contestQuery.limit(limitValue);
    }
    const contests = await contestQuery;
    console.log(`Retrieved ${contests.length} past contests`);
    if (contests.length === 0 && totalPastContests === 0) {
      console.log(
        "No past contests found that match the query. Running status update to check for contests that should be marked as past..."
      );
      const statusUpdates = await updateContestStatus();
      console.log(`Status update results: ${JSON.stringify(statusUpdates)}`);
      const updatedContests = await contestQuery;
      console.log(
        `After status update: Retrieved ${updatedContests.length} past contests`
      );
      return res.json(updatedContests);
    }
    res.json(contests);
  } catch (err) {
    console.error("Error fetching past contests:", err.message);
    res.status(500).json({ message: err.message });
  }
});
router.post("/update", limiter, async (req, res) => {
  try {
    console.log("Manual contest update triggered");
    const statusUpdates = await updateContestStatus();
    console.log("Contest statuses updated:", statusUpdates);
    const contests = await fetchAllContests();
    console.log(`Manual update complete. Fetched ${contests.length} contests.`);
    res.json({
      message: "Contests updated successfully",
      count: contests.length,
      statusUpdates,
    });
  } catch (err) {
    console.error("Error updating contests:", err.message);
    res.status(500).json({ message: err.message });
  }
});
router.post("/force-update-past", async (req, res) => {
  try {
    console.log("Force updating past contests");
    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);
    const shouldBePast = await Contest.find({
      endTime: { $lt: now },
      status: { $ne: "past" },
    });
    console.log(
      `Found ${shouldBePast.length} contests that should be marked as past`
    );
    if (shouldBePast.length > 0) {
      console.log(
        "Examples of contests to update:",
        shouldBePast.slice(0, 3).map((c) => ({
          name: c.name,
          platform: c.platform,
          endTime: c.endTime,
          status: c.status,
        }))
      );
      const updateResult = await Contest.updateMany(
        { endTime: { $lt: now }, status: { $ne: "past" } },
        { $set: { status: "past" } }
      );
      console.log(
        `Update result: ${updateResult.modifiedCount} contests updated to past status`
      );
      res.json({
        message: "Force update completed",
        updated: updateResult.modifiedCount,
      });
    } else {
      res.json({
        message: "No contests needed to be updated",
        updated: 0,
      });
    }
  } catch (err) {
    console.error("Error force updating past contests:", err.message);
    res.status(500).json({ message: err.message });
  }
});
router.get("/:id", async (req, res) => {
  try {
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }
    res.json(contest);
  } catch (err) {
    console.error(`Error fetching contest ID ${req.params.id}:`, err.message);
    res.status(500).json({ message: err.message });
  }
});
router.post("/:id/solution", [limiter, auth, admin], async (req, res) => {
  try {
    const { solutionUrl } = req.body;
    if (!solutionUrl) {
      return res.status(400).json({ message: "Solution URL is required" });
    }
    const youtubeUrlPattern =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeUrlPattern.test(solutionUrl)) {
      return res.status(400).json({ message: "Invalid YouTube URL format" });
    }
    const contest = await Contest.findById(req.params.id);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }
    if (contest.status !== "past") {
      return res
        .status(400)
        .json({ message: "Can only add solutions to past contests" });
    }
    contest.solutionUrl = solutionUrl;
    await contest.save();
    res.json(contest);
  } catch (err) {
    console.error(
      `Error updating solution for contest ${req.params.id}:`,
      err.message
    );
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;
