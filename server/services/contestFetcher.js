const axios = require("axios");
const cheerio = require("cheerio");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const Contest = require("../models/Contest");
const setupLogDirectory = () => {
  const logDir = path.join(__dirname, "../logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
};
const logHtml = (html, platform) => {
  try {
    const logDir = setupLogDirectory();
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\./g, "-");
    const filename = path.join(logDir, `${platform}-${timestamp}.html`);
    fs.writeFileSync(filename, html);
    console.log(`Saved ${platform} HTML to ${filename}`);
  } catch (error) {
    console.error(`Error saving HTML log for ${platform}:`, error.message);
  }
};
const logObject = (obj, name) => {
  try {
    const logDir = setupLogDirectory();
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\./g, "-");
    const filename = path.join(logDir, `${name}-${timestamp}.json`);
    fs.writeFileSync(filename, JSON.stringify(obj, null, 2));
    console.log(`Saved ${name} data to ${filename}`);
  } catch (error) {
    console.error(`Error saving data log for ${name}:`, error.message);
  }
};
function getRandomDelay(min = 1000, max = 3000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
async function fetchWithRetry(url, options = {}, retries = 3, delay = 2000) {
  try {
    await new Promise((r) => setTimeout(r, getRandomDelay()));
    return await axios(url, options);
  } catch (error) {
    if (retries <= 1) throw error;
    console.log(
      `Request to ${url} failed, retrying... (${retries - 1} attempts left)`
    );
    await new Promise((r) => setTimeout(r, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 1.5);
  }
}
const getBrowserHeaders = (referer = "") => ({
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Referer: referer,
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  DNT: "1",
  Connection: "keep-alive",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
});
async function fetchAllContests() {
  try {
    console.log("Fetching contests from all platforms...");
    await updateContestStatus();
    const [codeforcesContests, codechefContests, leetcodeContests] =
      await Promise.allSettled([
        fetchCodeforcesContests(),
        fetchCodechefContests(),
        fetchLeetcodeContests(),
      ]);
    const results = {
      codeforces:
        codeforcesContests.status === "fulfilled"
          ? codeforcesContests.value
          : [],
      codechef:
        codechefContests.status === "fulfilled" ? codechefContests.value : [],
      leetcode:
        leetcodeContests.status === "fulfilled" ? leetcodeContests.value : [],
    };
    logObject(results, "all-contests-fetched");
    const allContests = [
      ...results.codeforces,
      ...results.codechef,
      ...results.leetcode,
    ];
    console.log(
      `Total contests fetched: ${allContests.length} (Codeforces: ${results.codeforces.length}, CodeChef: ${results.codechef.length}, LeetCode: ${results.leetcode.length})`
    );
    await updateContestsDatabase(allContests);
    return allContests;
  } catch (error) {
    console.error("Error in fetchAllContests:", error);
    throw error;
  }
}
async function updateContestsDatabase(contests) {
  try {
    await updateContestStatus();
    for (const contest of contests) {
      try {
        const existingContest = await Contest.findOne({
          name: contest.name,
          platform: contest.platform,
        });
        if (contest.isPlaceholderTiming && existingContest) {
          console.log(
            `Skipping placeholder timing update for existing contest: ${contest.name}`
          );
          continue;
        }
        if (!existingContest) {
          if (contest.platform === "CodeChef" && !contest.duration) {
            contest.duration = 180;
            contest.isDurationEstimated = true;
          }
          await Contest.create(contest);
        } else {
          const updateFields = {};
          if (contest.status) updateFields.status = contest.status;
          if (contest.url) updateFields.url = contest.url;
          if (!contest.isPlaceholderTiming) {
            if (contest.startTime) updateFields.startTime = contest.startTime;
            if (contest.endTime) updateFields.endTime = contest.endTime;
          }
          if (Object.keys(updateFields).length > 0) {
            await Contest.updateOne(
              { _id: existingContest._id },
              { $set: updateFields }
            );
          }
        }
      } catch (err) {
        console.error(`Error processing contest ${contest.name}:`, err.message);
      }
    }
  } catch (error) {
    console.error("Error updating database:", error);
    throw error;
  }
}
async function updateContestStatus() {
  try {
    const now = new Date();
    console.log(`Updating contest statuses at ${now.toISOString()}`);
    const beforeCounts = await Contest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const beforeStats = {};
    beforeCounts.forEach((item) => {
      beforeStats[item._id] = item.count;
    });
    console.log("Contest counts before update:", beforeStats);
    const shouldBeOngoing = await Contest.find({
      status: "upcoming",
      startTime: { $lte: now },
    }).lean();
    const shouldBePast = await Contest.find({
      status: "ongoing",
      endTime: { $lte: now },
    }).lean();
    console.log(
      `Found ${shouldBeOngoing.length} contests to move from upcoming to ongoing`
    );
    console.log(
      `Found ${shouldBePast.length} contests to move from ongoing to past`
    );
    if (shouldBeOngoing.length > 0 || shouldBePast.length > 0) {
      if (shouldBeOngoing.length > 0) {
        console.log("Sample upcoming→ongoing contest:", {
          name: shouldBeOngoing[0].name,
          platform: shouldBeOngoing[0].platform,
          startTime: shouldBeOngoing[0].startTime,
          now: now,
        });
      }
      if (shouldBePast.length > 0) {
        console.log("Sample ongoing→past contest:", {
          name: shouldBePast[0].name,
          platform: shouldBePast[0].platform,
          endTime: shouldBePast[0].endTime,
          now: now,
        });
      }
    }
    const upcomingToOngoing = await Contest.updateMany(
      { status: "upcoming", startTime: { $lte: now } },
      { $set: { status: "ongoing" } }
    );
    const ongoingToPast = await Contest.updateMany(
      { status: "ongoing", endTime: { $lte: now } },
      { $set: { status: "past" } }
    );
    const afterCounts = await Contest.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const afterStats = {};
    afterCounts.forEach((item) => {
      afterStats[item._id] = item.count;
    });
    console.log("Contest counts after update:", afterStats);
    const diff = {};
    for (const status of ["upcoming", "ongoing", "past"]) {
      diff[status] = (afterStats[status] || 0) - (beforeStats[status] || 0);
    }
    console.log("Contest count changes:", diff);
    console.log(
      `Contest status updates: ${upcomingToOngoing.modifiedCount} became ongoing, ${ongoingToPast.modifiedCount} became past`
    );
    if (
      (shouldBeOngoing.length > 0 && upcomingToOngoing.modifiedCount === 0) ||
      (shouldBePast.length > 0 && ongoingToPast.modifiedCount === 0)
    ) {
      console.warn(
        "Warning: Expected status updates didn't occur. This may indicate an issue with the date comparison or MongoDB update operations."
      );
    }
    return {
      upcomingToOngoing: upcomingToOngoing.modifiedCount,
      ongoingToPast: ongoingToPast.modifiedCount,
    };
  } catch (error) {
    console.error("Error updating contest status:", error);
    throw error;
  }
}
async function fetchCodeforcesContests() {
  try {
    console.log("Fetching Codeforces contests...");
    try {
      const response = await fetchWithRetry(
        "https://codeforces.com/api/contest.list",
        { headers: getBrowserHeaders("https://codeforces.com") }
      );
      if (response.data.status !== "OK") {
        throw new Error(
          `Codeforces API error: ${response.data.comment || "Unknown error"}`
        );
      }
      logObject(response.data, "codeforces-raw");
      console.log(
        `Fetched ${response.data.result.length} contests from Codeforces API`
      );
      const contests = response.data.result;
      return contests
        .map((contest) => {
          if (!contest.startTimeSeconds) {
            return null;
          }
          const startTime = new Date(contest.startTimeSeconds * 1000);
          const durationInSeconds = contest.durationSeconds;
          const endTime = new Date(
            startTime.getTime() + durationInSeconds * 1000
          );
          const now = new Date();
          let status;
          if (startTime > now) {
            status = "upcoming";
          } else if (endTime > now) {
            status = "ongoing";
          } else {
            status = "past";
          }
          return {
            name: contest.name,
            platform: "Codeforces",
            startTime,
            endTime,
            url: `https://codeforces.com/contest/${contest.id}`,
            status,
            duration: Math.round(durationInSeconds / 60),
          };
        })
        .filter((contest) => contest !== null);
    } catch (error) {
      console.error(
        "Error with Codeforces API, falling back to web scraping:",
        error.message
      );
      const response = await fetchWithRetry("https://codeforces.com/contests", {
        headers: getBrowserHeaders("https://codeforces.com"),
      });
      const $ = cheerio.load(response.data);
      logHtml(response.data, "codeforces-fallback");
      const contests = [];
      $("div.contestList div.datatable table tr").each((i, el) => {
        if (i === 0) return;
        try {
          const cols = $(el).find("td");
          if (cols.length < 6) return;
          const name = $(cols[0]).text().trim();
          const startTimeStr = $(cols[2]).text().trim();
          const durationStr = $(cols[3]).text().trim();
          if (!name || !startTimeStr || !durationStr) return;
          const startTime = new Date(startTimeStr);
          if (isNaN(startTime.getTime())) return;
          const durationParts = durationStr.split(":");
          let durationMinutes = 0;
          if (durationParts.length === 2) {
            durationMinutes =
              parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
          } else {
            durationMinutes = parseInt(durationParts[0]) * 60;
          }
          const endTime = new Date(
            startTime.getTime() + durationMinutes * 60 * 1000
          );
          const now = new Date();
          let status;
          if (startTime > now) {
            status = "upcoming";
          } else if (endTime > now) {
            status = "ongoing";
          } else {
            status = "past";
          }
          const link = $(cols[0]).find("a").attr("href");
          const contestId = link ? link.split("/").pop() : "";
          contests.push({
            name,
            platform: "Codeforces",
            startTime,
            endTime,
            url: `https://codeforces.com/contest/${contestId}`,
            status,
            duration: durationMinutes,
          });
        } catch (err) {
          console.warn(`Error parsing Codeforces contest row:`, err.message);
        }
      });
      console.log(
        `Fetched ${contests.length} contests from Codeforces web scraping`
      );
      return contests;
    }
  } catch (error) {
    console.error("All Codeforces fetching methods failed:", error.message);
    return [];
  }
}
async function fetchCodechefContests() {
  try {
    console.log("Fetching CodeChef contests from API...");
    const response = await fetchWithRetry(
      "https://www.codechef.com/api/list/contests/all",
      {
        headers: getBrowserHeaders("https://www.codechef.com"),
        timeout: 15000,
      }
    );
    logObject(response.data, "codechef-api");
    const apiData = response.data;
    if (apiData.status !== "success") {
      throw new Error(
        `CodeChef API error: ${apiData.message || "Unknown error"}`
      );
    }
    console.log(
      `Fetched contests from CodeChef API: ${apiData.future_contests.length} future, ${apiData.present_contests.length} present, ${apiData.past_contests.length} past`
    );
    const contests = [];
    apiData.present_contests.forEach((contest) => {
      try {
        const startTime = new Date(contest.contest_start_date_iso);
        const endTime = new Date(contest.contest_end_date_iso);
        const duration = parseInt(contest.contest_duration);
        contests.push({
          name: contest.contest_name,
          platform: "CodeChef",
          startTime,
          endTime,
          url: `https://www.codechef.com/${contest.contest_code}`,
          status: "ongoing",
          duration,
        });
      } catch (err) {
        console.warn(`Error parsing ongoing CodeChef contest:`, err.message);
      }
    });
    apiData.future_contests.forEach((contest) => {
      try {
        const startTime = new Date(contest.contest_start_date_iso);
        const endTime = new Date(contest.contest_end_date_iso);
        const duration = parseInt(contest.contest_duration);
        contests.push({
          name: contest.contest_name,
          platform: "CodeChef",
          startTime,
          endTime,
          url: `https://www.codechef.com/${contest.contest_code}`,
          status: "upcoming",
          duration,
        });
      } catch (err) {
        console.warn(`Error parsing upcoming CodeChef contest:`, err.message);
      }
    });
    apiData.past_contests.forEach((contest) => {
      try {
        const startTime = new Date(contest.contest_start_date_iso);
        const endTime = new Date(contest.contest_end_date_iso);
        const duration = parseInt(contest.contest_duration);
        contests.push({
          name: contest.contest_name,
          platform: "CodeChef",
          startTime,
          endTime,
          url: `https://www.codechef.com/${contest.contest_code}`,
          status: "past",
          duration,
        });
      } catch (err) {
        console.warn(`Error parsing past CodeChef contest:`, err.message);
      }
    });
    console.log(`Processed ${contests.length} contests from CodeChef API`);
    if (contests.length > 0) {
      logObject(contests, "codechef-api-contests");
    }
    return contests;
  } catch (error) {
    console.error("Error fetching CodeChef contests from API:", error.message);
    console.error("Stack trace:", error.stack);
  }
}
async function fetchLeetcodeContests() {
  try {
    console.log("Fetching LeetCode contests...");
    const headers = {
      ...getBrowserHeaders("https://leetcode.com"),
      "Content-Type": "application/json",
    };
    const graphqlQuery = {
      query: `
        query getContestList {
          allContests {
            title
            titleSlug
            startTime
            duration
          }
        }
      `,
    };
    const response = await fetchWithRetry("https://leetcode.com/graphql", {
      method: "post",
      headers: headers,
      data: graphqlQuery,
    });
    logObject(response.data, "leetcode-raw");
    const allContests = response.data?.data?.allContests || [];
    if (!allContests || !Array.isArray(allContests)) {
      console.error(
        "Invalid response from LeetCode GraphQL API:",
        response.data
      );
      return [];
    }
    console.log(
      `Fetched ${allContests.length} contests from LeetCode GraphQL API`
    );
    if (allContests.length > 0) {
      console.log("Sample contest data:", {
        title: allContests[0].title,
        duration: allContests[0].duration,
        durationInMinutes: Math.round(allContests[0].duration / 60),
      });
    }
    const contests = allContests
      .filter((contest) => contest.startTime && contest.duration)
      .map((contest) => {
        const durationSeconds = parseInt(contest.duration);
        const durationMinutes = Math.round(durationSeconds / 60);
        const startTimestamp = contest.startTime * 1000;
        const startTime = new Date(startTimestamp);
        const endTime = new Date(startTimestamp + durationMinutes * 60 * 1000);
        console.log(`LeetCode contest: ${contest.title}`);
        console.log(`  Start: ${startTime.toISOString()}`);
        console.log(`  End: ${endTime.toISOString()}`);
        console.log(`  Duration: ${durationMinutes} minutes`);
        console.log(`  Calculated: ${(endTime - startTime) / 60000} minutes`);
        const now = new Date();
        let status;
        if (startTime > now) status = "upcoming";
        else if (endTime > now) status = "ongoing";
        else status = "past";
        return {
          name: contest.title,
          platform: "Leetcode",
          startTime,
          endTime,
          url: `https://leetcode.com/contest/${contest.titleSlug}`,
          status,
          duration: durationMinutes,
        };
      });
    logObject(contests, "leetcode-contests");
    return contests;
  } catch (error) {
    console.error("Error fetching LeetCode contests:", error.message);
    console.log("Falling back to web scraping approach for LeetCode");
    return fetchLeetcodeContestsByWebScraping();
  }
}
async function fetchLeetcodeContestsByWebScraping() {
  try {
    console.log("Fetching LeetCode contests via web scraping...");
    const response = await fetchWithRetry("https://leetcode.com/contest/", {
      headers: getBrowserHeaders("https://leetcode.com"),
      timeout: 15000,
    });
    logHtml(response.data, "leetcode");
    const $ = cheerio.load(response.data);
    const contests = [];
    console.log("LeetCode DOM structure detection:");
    const selectors = [
      ".contest-table .contest-table__row",
      ".swiper-slide",
      "[data-contest]",
      ".card[data-contest-id]",
    ];
    let workingSelector = null;
    for (const selector of selectors) {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`Found ${count} contests using selector: ${selector}`);
        workingSelector = selector;
        break;
      }
    }
    if (!workingSelector) {
      console.warn("No working selector found for LeetCode contests");
      return [];
    }
    const parseContest = (el) => {
      try {
        const getTitleElement = () => {
          const selectors = [".contest-title", ".title", "h4", "h3"];
          for (const selector of selectors) {
            const element = $(el).find(selector);
            if (element.length) return element;
          }
          return null;
        };
        const getTimeElement = () => {
          const selectors = [
            ".contest-start-time",
            ".time",
            "[data-time]",
            ".date",
          ];
          for (const selector of selectors) {
            const element = $(el).find(selector);
            if (element.length) return element;
          }
          return null;
        };
        const getDurationElement = () => {
          const selectors = [
            ".contest-duration",
            ".duration",
            "[data-duration]",
          ];
          for (const selector of selectors) {
            const element = $(el).find(selector);
            if (element.length) return element;
          }
          return null;
        };
        const titleElement = getTitleElement();
        const timeElement = getTimeElement();
        if (!titleElement || !timeElement) {
          console.warn("Missing elements for LeetCode contest, skipping");
          return null;
        }
        const name = titleElement.text().trim();
        let url = "";
        const anchor = titleElement.find("a");
        if (anchor.length) {
          const href = anchor.attr("href");
          if (href) {
            url = href.startsWith("/") ? `https://leetcode.com${href}` : href;
          }
        }
        let timeStr = timeElement.text().trim();
        if (!timeStr && timeElement.attr("data-time")) {
          timeStr = timeElement.attr("data-time");
        }
        if (!name || !timeStr) {
          console.warn(
            `Skipping LeetCode contest with missing data: ${name || "unnamed"}`
          );
          return null;
        }
        let startTime;
        if (timeStr.match(/^\d+$/)) {
          startTime = new Date(parseInt(timeStr) * 1000);
        } else {
          startTime = new Date(timeStr);
        }
        if (isNaN(startTime.getTime())) {
          console.warn(
            `Skipping LeetCode contest with invalid start time: ${name}, ${timeStr}`
          );
          return null;
        }
        const durationElement = getDurationElement();
        let durationMinutes = 90;
        if (durationElement) {
          const durationStr = durationElement.text().trim();
          const durationMatch = durationStr.match(/(\d+\.?\d*)\s*hour/i);
          if (durationMatch) {
            const durationHours = parseFloat(durationMatch[1]);
            durationMinutes = Math.round(durationHours * 60);
          }
        }
        const endTime = new Date(
          startTime.getTime() + durationMinutes * 60 * 1000
        );
        const now = new Date();
        let status;
        if (startTime > now) {
          status = "upcoming";
        } else if (endTime > now) {
          status = "ongoing";
        } else {
          status = "past";
        }
        return {
          name,
          platform: "Leetcode",
          startTime,
          endTime,
          url: url || `https://leetcode.com/contest/`,
          status,
          duration: durationMinutes,
        };
      } catch (err) {
        console.warn(`Error parsing a LeetCode contest:`, err.message);
        return null;
      }
    };
    $(workingSelector).each((i, el) => {
      const contest = parseContest(el);
      if (contest) contests.push(contest);
    });
    console.log(
      `Fetched ${contests.length} contests from LeetCode via web scraping`
    );
    if (contests.length > 0) {
      logObject(contests, "leetcode-scraping-contests");
    }
    return contests;
  } catch (error) {
    console.error(
      "Error fetching LeetCode contests via web scraping:",
      error.message
    );
    return [];
  }
}
cron.schedule("0 */4 * * *", async () => {
  console.log("Running scheduled contest update...");
  try {
    const contests = await fetchAllContests();
    console.log(
      `Scheduled update complete. Fetched ${contests.length} contests.`
    );
  } catch (error) {
    console.error("Error during scheduled contest update:", error.message);
  }
});
module.exports = {
  fetchAllContests,
  updateContestStatus,
};
