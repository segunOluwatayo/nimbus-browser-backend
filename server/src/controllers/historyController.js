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
    const deletedEntry = await History.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedEntry) return res.status(404).json({ message: "History entry not found" });
    res.status(200).json({ message: 'History entry deleted successfully' });
  } catch (error) {
    console.error("Error deleting history entry:", error);
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
