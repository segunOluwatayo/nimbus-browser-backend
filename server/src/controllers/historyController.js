const History = require('../models/History');

/**
 * Retrieve all history for the authenticated user.
 */
exports.getHistory = async (req, res) => {
  try {
    const history = await History.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.status(200).json({
      message: 'Browsing history retrieved successfully',
      data: history
    });
  } catch (error) {
    console.error("Error retrieving history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/**
 * Add a new history entry.
 * Now returns `_id` in the response as `id`.
 */
exports.addHistory = async (req, res) => {
  try {
    const { url, title, device } = req.body;
    
    const newEntry = new History({
      userId: req.user.id,
      url,
      title,
      device,
      timestamp: Date.now(),
    });

    const savedEntry = await newEntry.save();

    // Convert Mongoose doc to plain JS object
    const savedObject = savedEntry.toObject();

    // Expose `_id` as `id`
    savedObject.id = savedObject._id;

    // (Optional) You can remove _id if you only want to show `id`
    // delete savedObject._id;

    res.status(201).json({
      message: 'History entry added successfully',
      data: savedObject
    });
  } catch (error) {
    console.error("Error adding history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/**
 * Delete a history entry by ID or URL.
 * Verifies the entry's userId matches the authenticated user.
 */
exports.deleteHistoryEntry = async (req, res) => {
  try {
    const { id } = req.params;

    // 1) If we have an ID in the URL: /history/:id
    if (id) {
      // Find the document by _id
      const doc = await History.findById(id);
      if (!doc) {
        return res.status(404).json({ message: "History entry not found" });
      }

      // Ensure this document actually belongs to the logged-in user
      if (doc.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Forbidden: You do not own this history entry" });
      }

      // Remove the document from the DB
      await doc.remove();
      return res.status(200).json({ message: "History entry deleted successfully" });
    }

    // 2) If we have no :id but have a URL query parameter: /history?url=...
    const url = req.query.url;
    if (url) {
      // IMPORTANT: Only delete the specific URL for this user
      const result = await History.deleteOne({ 
        userId: req.user.id,
        url: url
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "History entry not found" });
      }

      return res.status(200).json({ 
        message: "History entry deleted successfully",
        data: { url: url, deletedCount: result.deletedCount }
      });
    }

    // 3) If no ID or URL provided, return 400
    return res.status(400).json({ message: "ID or url parameter is required" });
  } catch (error) {
    console.error("Error deleting history entry:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/**
 * Delete a history entry strictly by URL (separate route).
 * Example usage: /history/url?url=https://...
 */
exports.deleteHistoryEntryByUrl = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ message: "URL is required in query parameter" });
    }

    // Only delete for the current user
    const result = await History.deleteOne({ 
      userId: req.user.id,
      url: url
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "History entry not found" });
    }

    return res.status(200).json({ 
      message: "History entry deleted successfully",
      data: {
        url: url,
        deletedCount: result.deletedCount
      }
    });
  } catch (error) {
    console.error("Error deleting history entry by URL:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/**
 * Clear all history for the current user.
 */
exports.clearHistory = async (req, res) => {
  try {
    await History.deleteMany({ userId: req.user.id });
    res.status(200).json({ message: 'Browsing history cleared successfully' });
  } catch (error) {
    console.error("Error clearing history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
