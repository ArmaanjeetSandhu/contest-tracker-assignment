/**
 * Helper function to convert month name to month number
 * @param {string} monthName - Three-letter month abbreviation (Jan, Feb, etc.)
 * @returns {number} Month number (1-12)
 */
function getMonthNumber(monthName) {
  const months = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };
  return months[monthName] || 1;
}
/**
 * Create a date object with the correct timezone handling
 * CodeChef contests are in Indian Standard Time (IST) which is UTC+5:30
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @param {number} day - Day of month
 * @param {number} hour - Hour (24-hour format)
 * @param {number} minute - Minute
 * @returns {Date} Date object
 */
function createDateWithIST(year, month, day, hour, minute) {
  const dateString = `${year}-${String(month + 1).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")}:00+05:30`;
  return new Date(dateString);
}
/**
 * Parses clipboard content from the CodeChef contests page and extracts contest information
 * @param {string} clipboardText - The text content copied from CodeChef contests page
 * @returns {Array} Array of contest objects with platform, name, startTime, endTime, url, status, and duration
 */
function parseCodeChefClipboardContent(clipboardText) {
  try {
    console.log("Parsing CodeChef clipboard content...");
    const contests = [];
    const lines = clipboardText.split("\n").map((line) => line.trim());
    const upcomingContestsIdx = lines.findIndex(
      (line) => line === "Upcoming Contests"
    );
    const pastContestsIdx = lines.findIndex((line) => line === "Past Contests");
    if (upcomingContestsIdx === -1 || pastContestsIdx === -1) {
      console.warn("Could not locate contest sections in clipboard content");
      return [];
    }
    console.log(
      `Found Upcoming Contests section at line ${upcomingContestsIdx}`
    );
    console.log(`Found Past Contests section at line ${pastContestsIdx}`);
    let i = upcomingContestsIdx + 1;
    while (i < pastContestsIdx && !lines[i].match(/^START|^COOK|^LTIME/)) {
      i++;
    }
    while (i < pastContestsIdx) {
      try {
        const code = lines[i];
        if (!code.match(/^START|^COOK|^LTIME/)) {
          i++;
          continue;
        }
        i++;
        while (i < pastContestsIdx && lines[i] === "") {
          i++;
        }
        const name = lines[i];
        i++;
        while (i < pastContestsIdx && lines[i] === "") {
          i++;
        }
        const startDate = lines[i];
        i++;
        while (i < pastContestsIdx && lines[i] === "") {
          i++;
        }
        const dayTime = lines[i];
        i++;
        while (i < pastContestsIdx && lines[i] === "") {
          i++;
        }
        const duration = lines[i];
        while (i < pastContestsIdx && !lines[i].match(/^START|^COOK|^LTIME/)) {
          i++;
        }
        const dateParts = startDate.split(" ");
        const day = parseInt(dateParts[0]);
        const month = getMonthNumber(dateParts[1]);
        const year = parseInt(dateParts[2]);
        const timeParts = dayTime.split(" ")[1].split(":");
        const hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1] || "0");
        const startTimeObj = createDateWithIST(
          year,
          month - 1,
          day,
          hour,
          minute
        );
        const durationMatch = duration.match(/(\d+)\s*Hrs(?:\s*(\d+)\s*Min)?/);
        const durationHours = durationMatch ? parseInt(durationMatch[1]) : 2;
        const durationMinutes =
          durationMatch && durationMatch[2] ? parseInt(durationMatch[2]) : 0;
        const totalDurationMinutes = durationHours * 60 + durationMinutes;
        const endTimeObj = new Date(
          startTimeObj.getTime() + totalDurationMinutes * 60000
        );
        contests.push({
          name,
          platform: "CodeChef",
          startTime: startTimeObj,
          endTime: endTimeObj,
          url: `https://www.codechef.com/${code}`,
          status: "upcoming",
          duration: totalDurationMinutes,
        });
      } catch (err) {
        console.warn(
          `Error parsing upcoming contest at index ${i}:`,
          err.message
        );
        while (i < pastContestsIdx && !lines[i].match(/^START|^COOK|^LTIME/)) {
          i++;
        }
      }
    }
    console.log(
      `Parsed ${
        contests.filter((c) => c.status === "upcoming").length
      } upcoming contests`
    );
    i = pastContestsIdx + 1;
    while (i < lines.length && !lines[i].match(/^START|^COOK|^LTIME/)) {
      i++;
    }
    while (i < lines.length) {
      try {
        const code = lines[i];
        if (!code.match(/^START|^COOK|^LTIME/)) {
          i++;
          continue;
        }
        i++;
        while (i < lines.length && lines[i] === "") {
          i++;
        }
        const name = lines[i];
        i++;
        while (i < lines.length && lines[i] === "") {
          i++;
        }
        const startDate = lines[i];
        i++;
        while (i < lines.length && lines[i] === "") {
          i++;
        }
        const dayTime = lines[i];
        i++;
        while (i < lines.length && lines[i] === "") {
          i++;
        }
        const duration = lines[i];
        while (i < lines.length && !lines[i].match(/^START|^COOK|^LTIME/)) {
          i++;
        }
        const dateParts = startDate.split(" ");
        const day = parseInt(dateParts[0]);
        const month = getMonthNumber(dateParts[1]);
        const year = parseInt(dateParts[2]);
        const timeParts = dayTime.split(" ")[1].split(":");
        const hour = parseInt(timeParts[0]);
        const minute = parseInt(timeParts[1] || "0");
        const startTimeObj = createDateWithIST(
          year,
          month - 1,
          day,
          hour,
          minute
        );
        const durationMatch = duration.match(/(\d+)\s*Hrs(?:\s*(\d+)\s*Min)?/);
        const durationHours = durationMatch ? parseInt(durationMatch[1]) : 2;
        const durationMinutes =
          durationMatch && durationMatch[2] ? parseInt(durationMatch[2]) : 0;
        const totalDurationMinutes = durationHours * 60 + durationMinutes;
        const endTimeObj = new Date(
          startTimeObj.getTime() + totalDurationMinutes * 60000
        );
        contests.push({
          name,
          platform: "CodeChef",
          startTime: startTimeObj,
          endTime: endTimeObj,
          url: `https://www.codechef.com/${code}`,
          status: "past",
          duration: totalDurationMinutes,
        });
      } catch (err) {
        console.warn(`Error parsing past contest at index ${i}:`, err.message);
        while (i < lines.length && !lines[i].match(/^START|^COOK|^LTIME/)) {
          i++;
        }
      }
    }
    console.log(
      `Parsed ${
        contests.filter((c) => c.status === "past").length
      } past contests`
    );
    return contests;
  } catch (error) {
    console.error("Error parsing CodeChef clipboard content:", error.message);
    console.error("Stack trace:", error.stack);
    return [];
  }
}
module.exports = { parseCodeChefClipboardContent };
