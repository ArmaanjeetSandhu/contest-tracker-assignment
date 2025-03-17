const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const setupLogDirectory = () => {
  const logDir = path.join(__dirname, "../logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
};
const saveDebugData = (data, name) => {
  try {
    const logDir = setupLogDirectory();
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, "-")
      .replace(/\./g, "-");
    const filename = path.join(logDir, `${name}-${timestamp}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Saved ${name} data to ${filename}`);
  } catch (error) {
    console.error(`Error saving debug data for ${name}:`, error.message);
  }
};
/**
 * Parse clipboard-style text content from CodeChef contests page
 * Production-ready version with proper timezone handling
 */
async function fetchCodechefContestsWithPuppeteer() {
  let browser;
  try {
    console.log("Fetching CodeChef contests using Puppeteer...");
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    );
    console.log("Navigating to CodeChef contests page...");
    await page.goto("https://www.codechef.com/contests", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    const logDir = setupLogDirectory();
    await page.screenshot({
      path: path.join(
        logDir,
        `codechef-screenshot-${new Date().toISOString().replace(/:/g, "-")}.png`
      ),
      fullPage: true,
    });
    const pageContent = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync(
      path.join(
        logDir,
        `codechef-text-${new Date().toISOString().replace(/:/g, "-")}.txt`
      ),
      pageContent
    );
    const contests = parseCodeChefContent(pageContent);
    console.log(`Extracted ${contests.length} contests from CodeChef`);
    saveDebugData(contests, "codechef-parsed-contests");
    return contests;
  } catch (error) {
    console.error("Error fetching CodeChef contests with Puppeteer:", error);
    return [];
  } finally {
    if (browser) await browser.close();
  }
}
/**
 * Parse the text content of the CodeChef contests page
 * @param {string} content - The text content of the page
 * @returns {Array} - Array of contest objects
 */
function parseCodeChefContent(content) {
  const contests = [];
  const lines = content.split("\n").map((line) => line.trim());
  const upcomingIdx = lines.findIndex((line) => line === "Upcoming Contests");
  const pastIdx = lines.findIndex((line) => line === "Past Contests");
  if (upcomingIdx === -1 || pastIdx === -1) {
    console.warn("Could not find contest sections in CodeChef page content");
    return [];
  }
  const upcomingContests = extractContests(
    lines,
    upcomingIdx,
    pastIdx,
    "upcoming"
  );
  contests.push(...upcomingContests);
  const pastContests = extractContests(lines, pastIdx, lines.length, "past");
  contests.push(...pastContests);
  return contests;
}
/**
 * Extract contests from a specific section of the page content
 * @param {Array} lines - Array of text lines from the page
 * @param {number} startIdx - Starting index of the section
 * @param {number} endIdx - Ending index of the section
 * @param {string} status - Status of contests in this section (upcoming or past)
 * @returns {Array} - Array of contest objects
 */
function extractContests(lines, startIdx, endIdx, status) {
  const contests = [];
  const contestCodePattern = /^(START|COOK|LTIME)\d+$/;
  let i = startIdx + 1;
  while (i < endIdx && !contestCodePattern.test(lines[i])) {
    i++;
  }
  while (i < endIdx) {
    try {
      const code = lines[i];
      if (!contestCodePattern.test(code)) {
        i++;
        continue;
      }
      i++;
      while (i < endIdx && !lines[i]) i++;
      const name = lines[i];
      i++;
      while (i < endIdx && !lines[i].match(/\d+\s+[A-Za-z]{3}\s+\d{4}/)) i++;
      const dateStr = lines[i];
      i++;
      while (i < endIdx && !lines[i].match(/[A-Za-z]{3}\s+\d{2}:\d{2}/)) i++;
      const timeStr = lines[i].split(" ").pop();
      i++;
      while (i < endIdx && !lines[i].match(/\d+\s+Hrs(?:\s+\d+\s+Min)?/)) i++;
      const durationStr = lines[i];
      while (i < endIdx && !contestCodePattern.test(lines[i])) i++;
      const dateParts = dateStr.match(/(\d+)\s+([A-Za-z]{3})\s+(\d{4})/);
      if (!dateParts) {
        console.warn(`Invalid date format for contest ${name}: ${dateStr}`);
        continue;
      }
      let day = parseInt(dateParts[1]);
      const monthStr = dateParts[2];
      const year = parseInt(dateParts[3]);
      const monthMap = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };
      const month = monthMap[monthStr];
      const timeParts = timeStr.match(/(\d{2}):(\d{2})/);
      if (!timeParts) {
        console.warn(`Invalid time format for contest ${name}: ${timeStr}`);
        continue;
      }
      const hour = parseInt(timeParts[1]);
      const minute = parseInt(timeParts[2]);
      const localDate = new Date(year, month, day, hour, minute);
      console.log(
        `Original parsed date for ${name}: ${localDate.toISOString()}`
      );
      localDate.setDate(localDate.getDate() + 1);
      console.log(`Corrected date (added 1 day): ${localDate.toISOString()}`);
      const startTime = localDate;
      const durationMatch = durationStr.match(/(\d+)\s+Hrs(?:\s+(\d+)\s+Min)?/);
      const durationHours = durationMatch ? parseInt(durationMatch[1]) : 2;
      const durationMinutes =
        durationMatch && durationMatch[2] ? parseInt(durationMatch[2]) : 0;
      const totalDurationMinutes = durationHours * 60 + durationMinutes;
      const endTime = new Date(
        startTime.getTime() + totalDurationMinutes * 60 * 1000
      );
      contests.push({
        name,
        platform: "CodeChef",
        startTime,
        endTime,
        url: `https://www.codechef.com/${code}`,
        status,
        duration: totalDurationMinutes,
      });
      console.log(`Parsed ${status} contest: ${name}`);
      console.log(`  Start: ${startTime.toISOString()}`);
      console.log(`  End: ${endTime.toISOString()}`);
      console.log(`  Duration: ${totalDurationMinutes} minutes`);
    } catch (err) {
      console.warn(`Error parsing contest at line ${i}:`, err.message);
      while (i < endIdx && !contestCodePattern.test(lines[i])) i++;
    }
  }
  return contests;
}
module.exports = { fetchCodechefContestsWithPuppeteer };
