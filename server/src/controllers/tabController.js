const Tab = require('../models/Tab');

exports.getAllTabs = async (req, res) => {
  try {
    const tabs = await Tab.find({ userId: req.user.id });
    res.status(200).json({ message: 'Open tabs retrieved successfully', data: tabs });
  } catch (error) {
    console.error("Error retrieving tabs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createOrUpdateTab = async (req, res) => {
  try {
    const { url, title, scrollPosition, formData } = req.body;
    // If a tab with the same URL exists, update it; otherwise, create new.
    let tab = await Tab.findOne({ userId: req.user.id, url });
    if (tab) {
      tab.title = title;
      tab.scrollPosition = scrollPosition;
      tab.formData = formData;
      tab = await tab.save();
      return res.status(200).json({ message: 'Tab updated successfully', data: tab });
    } else {
      tab = new Tab({
        userId: req.user.id,
        url,
        title,
        scrollPosition,
        formData,
      });
      const savedTab = await tab.save();
      return res.status(201).json({ message: 'Tab created successfully', data: savedTab });
    }
  } catch (error) {
    console.error("Error creating/updating tab:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateTabById = async (req, res) => {
  try {
    const updatedTab = await Tab.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updatedTab) return res.status(404).json({ message: "Tab not found" });
    res.status(200).json({ message: 'Tab updated successfully', data: updatedTab });
  } catch (error) {
    console.error("Error updating tab:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteTab = async (req, res) => {
  try {
    const deletedTab = await Tab.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedTab) return res.status(404).json({ message: "Tab not found" });
    res.status(200).json({ message: 'Tab closed successfully' });
  } catch (error) {
    console.error("Error deleting tab:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
