const {Op} = require("sequelize")
const {BadRequestError} = require("../../errors/errors")

// All values from the query string are initially strings (in JSON format).  
// This function parses/converts them into the correct types  
// so the database can process them properly

// localhost:3012/api/employee?filters={"employee_id":{"gt":3}, "annual_leave": {"lt":1}}&order={"employee_id": "asc", "first_name": "desc", "last_name": "asc"}&limit=3

/*
SAMPLE DATA FROM reqBody:
reqQuery = {
    filters: '{"employee_id":{"gt":3}, "annual_leave": {"lt":1}}',
    order: '{"employee_id": "asc", "first_name": "desc", "last_name": "asc"}'
}
*/

const SPECIAL_CASE_COLS = {
    capitalize: ['status', 'type', 'role'], // field that the value should be capitalized
    numeric: ['employee_id', 'attendance_id', 'leave_id', 'manager_id', 'total_min_work'] // field that store int
};

/**
 * Processes query parameters to build Sequelize-compatible filter and order conditions
 * @param {Object} queryObject - Sequelize query object to modify (ex: const queryObject = {where: {}}  )in employeeContoller
 * @param {Object} reqQuery - Request query parameters
 * @returns {void}
 */
function parseReqQuery(queryObject, reqQuery) {
    //console.log(reqQuery)
    try {
        // Process filters if they exist
        // (ex: filters={"employee_id":{"gt":3}, "annual_leave": {"lt":1}}    )
        if (reqQuery.filters) {
            const filters = parseJSONParam(reqQuery.filters);
            processFilters(queryObject, filters, SPECIAL_CASE_COLS);
        }
        
        // Process order if it exists
        // (ex: order={"employee_id": "asc", "first_name": "desc", "last_name": "asc"}   )
        if (reqQuery.order) {
            const order = parseJSONParam(reqQuery.order);
            processOrder(queryObject, order);
        }

        // set the is_active to true, because we only want to query the active employee, those inactive one means already resigned
        queryObject.where.is_active = true

        // Process limit if it exist (ex: limit=5)
        if (reqQuery.limit) {queryObject.limit = parseInt(reqQuery.limit)}
        console.log(queryObject)
    } catch (error) {
        console.error('Error processing query parameters:', error);
        throw new BadRequestError('Invalid query parameters format');
    }
}

/**
 * Parses JSON string parameter with error handling
 * @param {string} param - JSON string to parse
 * @returns {Object} Parsed object
 */
function parseJSONParam(param) {
    try {
        return JSON.parse(param);
    } catch (error) {
        throw new BadRequestError(`Invalid JSON format: ${param}`);
    }
}

/**
 * Processes filter conditions
 * @param {Object} queryObject - Sequelize query object
 * @param {Object} filters - Filter conditions (ex: {"employee_id":{"gt":3}, "annual_leave": {"lt":1}}  )
 * @param {Object} specialCols - Special column handling config
 */
function processFilters(queryObject, filters, specialCols) {
    for (const [field, condition] of Object.entries(filters)) {
        // Handle numeric columns (ex: 'employee_id', 'attendance_id', 'leave_id')
        if (specialCols.numeric.includes(field)) {
            processNumericCondition(queryObject, field, condition);
            continue;
        }

        // Handle special case columns (ex: status, type, role )
        if (specialCols.capitalize.includes(field) && typeof condition === 'string') {
            queryObject.where[field] = condition.toUpperCase();
            continue;
        }

        // Handle boolean values, covert 'true' to true (ex: is_active, is_ot)
        if (typeof condition === 'string') {
            const converted = convertValue(condition);
            queryObject.where[field] = converted;
            continue;
        }

        // Handle operator conditions (gt, lt, etc.)
        if (typeof condition === 'object') {
            processOperatorConditions(queryObject, field, condition);
        }

    }
}

/**
 * Processes order conditions (sorting)
 * @param {Object} queryObject - Sequelize query object
 * @param {Object} order - Order conditions (ex: {"employee_id": "asc", "first_name": "desc", "last_name": "asc"})
 */
function processOrder(queryObject, order) {
    queryObject.order = [];
    for (const [field, direction] of Object.entries(order)) {
        if (!['asc', 'desc'].includes(direction.toLowerCase())) {
            throw new BadRequestError(`Invalid sort direction: ${direction}`);
        }
        queryObject.order.push([field, direction.toUpperCase()]);
        /*
            (ex: const queryObject = {
                order: [
                    ["employee_id": ASC],
                    ["first_name": DESC]
                ]
            })
        */
    }
}

/**
 * Processes numeric field conditions
 * @param {Object} queryObject - Sequelize query object
 * @param {string} field - Field name  (ex: 'employee_id')
 * @param {Object|string|number} condition - Condition to process (ex: {"gt":3})
 */
function processNumericCondition(queryObject, field, condition) {
    if (typeof condition === 'object') {
        for (const [operator, value] of Object.entries(condition)) {
            if (!Op[operator]) {
                throw new BadRequestError(`Invalid operator: ${operator}`);
            }
            queryObject.where[field] = {
                [Op[operator]]: Number(value)
                // sample:
                // queryObject{
                //   where{
                //      employee_id: [Op[gt]: 3]
                //    }
                // }
            };
        }
    } else {
        queryObject.where[field] = Number(condition);
    }
}

/**
 * Processes operator conditions (gt, lt, etc.)
 * @param {Object} queryObject - Sequelize query object
 * @param {string} field - Field name
 * @param {Object} condition - Operator conditions
 */
function processOperatorConditions(queryObject, field, condition) {
    for (const [operator, value] of Object.entries(condition)) {
        if (!Op[operator]) {
            throw new BadRequestError(`Invalid operator: ${operator}`);
        }
        
        const processedValue = SPECIAL_CASE_COLS.numeric.includes(field) 
            ? Number(value) 
            : convertValue(value);
            
        queryObject.where[field] = {
            [Op[operator]]: processedValue
        };
    }
}

/**
 * Converts string values to proper types
 * @param {string} value - Value to convert
 * @returns {boolean|string} Converted value
 */
function convertValue(value) {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
}

module.exports = {parseReqQuery}