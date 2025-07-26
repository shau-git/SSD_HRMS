function validateId(req, res, next) {
    // Parse the ID from request parameters
    const id = parseInt(req.params.id);

    // Check if the parsed ID is a valid positive number
    if (isNaN(id) || id <= 0) {
        // If not valid, send a 400 response
        return res
        .status(400)
        .json({ error: "Invalid ID. ID must be a positive number" });
    }

    // If validation succeeds, pass control to the next middleware/route handler
    next();
}


module.exports = validateId