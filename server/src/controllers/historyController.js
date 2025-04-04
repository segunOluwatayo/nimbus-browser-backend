const History = require('../models/History');

exports.getHistory = async (req, res) => {
  try {
    const history = await History.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.status(200).json({ message: 'Browsing history retrieved successfully', data: history });
  } catch (error) {
    console.error("Error retrieving history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

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
    res.status(201).json({ message: 'History entry added successfully', data: savedEntry });
  } catch (error) {
    console.error("Error adding history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteHistoryEntry = async (req, res) => {
  try {
    const { id } = req.params;
    
    // If we have an ID, delete by ID
    if (id) {
      const result = await History.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).json({ message: "History entry not found" });
      }
      return res.status(200).json({ message: "History entry deleted successfully" });
    }
    
    // If we have a URL query parameter, delete by URL
    const url = req.query.url;
    if (url) {
      console.log(`Deleting history entry with URL: ${url}`);
      
      // IMPORTANT: Only delete the specific URL for this user, not all entries!
      const result = await History.deleteOne({ 
        userId: req.user.id,
        url: url
      });
      
      console.log(`Deletion result: ${JSON.stringify(result)}`);
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "History entry not found" });
      }
      
      return res.status(200).json({ 
        message: "History entry deleted successfully",
        data: { url: url, deletedCount: result.deletedCount }
      });
    }
    
    // If no ID or URL provided, return error
    return res.status(400).json({ message: "ID or URL parameter is required" });
    
  } catch (error) {
    console.error("Error deleting history entry:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteHistoryEntryByUrl = async (req, res) => {
  try {
    // We read `url` from the query string: /history/url?url=...
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ message: "URL is required in query parameter" });
    }

    // Delete only this user's entry for that URL
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

exports.clearHistory = async (req, res) => {
  try {
    await History.deleteMany({ userId: req.user.id });
    res.status(200).json({ message: 'Browsing history cleared successfully' });
  } catch (error) {
    console.error("Error clearing history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
