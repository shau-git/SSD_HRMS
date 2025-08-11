const { Op } = require("sequelize")
const { convertToSGT } = require("./convertToSGT")
 /**
 * Creates a Sequelize `Op.between` filter for a date range based on
 * the provided year, month, and day parameters.
 * @param {object} params - The query parameters.
 * @param {string|number} [params.year] - The year to filter by (e.g., '2025').
 * @param {string|number} [params.month] - The month to filter by (1-12).
 * @param {string|number} [params.day] - The day to filter by (1-31).
 * @returns {object} A Sequelize filter object for the 'start_date_time' column.
 */
function createDateFilter({ year, month, day }) {
    let start, end;
    const now = new Date();
    const currentYear = now.getFullYear();

    // Convert string inputs to numbers and handle empty values
    year = year ? parseInt(year, 10) : undefined;
    month = month ? parseInt(month, 10) : undefined;
    day = day ? parseInt(day, 10) : undefined;

    if (year && month && day) {
        // Case 1: All three are provided (query a specific day)
        start = new Date(year, month - 1, day);
        end = new Date(year, month - 1, day);
    } else if (year && month) {
        // Case 2: Year and month are provided (query an entire month)
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0); // Common trick: day 0 of next month is the last day of the current month
    } else if (year) {
        // Case 3: Only year is provided (query the entire year)
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31);
    } else if (month) {
        // Case 4: Only month is provided (query the month in the current year)
        start = new Date(now.getFullYear(), month - 1, 1);
        end = new Date(now.getFullYear(), month - 1, 31);
    } else {
        // Default to the current day if no parameters are given
        start = new Date(currentYear, now.getMonth(), now.getDate());
        end = new Date(currentYear, now.getMonth(), now.getDate());
    }

    // Set the time boundaries for the query to ensure the full range is covered
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return  { [Op.between]: [convertToSGT(start), convertToSGT(end)] }

}

module.exports = createDateFilter