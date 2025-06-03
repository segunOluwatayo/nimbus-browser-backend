const Tab = require('../models/Tab');

exports.getAllTabs = async (req, res) => {
  try {
    const tabs = await Tab.find({ userId: req.user.id });

    // Map each Mongoose document to a plain object with `id = _id`
    const tabObjects = tabs.map((tabDoc) => {
      const obj = tabDoc.toObject();
      obj.id = obj._id;
      return obj;
    });

    res.status(200).json({
      message: 'Open tabs retrieved successfully',
      data: tabObjects
    });
  } catch (error) {
    console.error("Error retrieving tabs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
//

exports.createOrUpdateTab = async (req, res) => {
  try {
    const { url, title, scrollPosition, formData } = req.body;
    let tab = await Tab.findOne({ userId: req.user.id, url });

    if (tab) {
      tab.title = title;
      tab.scrollPosition = scrollPosition;
      tab.formData = formData;
      const updatedTab = await tab.save();

      // Convert updatedTab so we can add an `id` field:
      const tabObject = updatedTab.toObject();
      tabObject.id = tabObject._id;

      return res.status(200).json({
        message: 'Tab updated successfully',
        data: tabObject
      });
    } else {
      const newTab = new Tab({
        userId: req.user.id,
        url,
        title,
        scrollPosition,
        formData,
      });
      const savedTab = await newTab.save();

      // Convert savedTab so we can add an `id` field:
      const tabObject = savedTab.toObject();
      tabObject.id = tabObject._id;

      return res.status(201).json({
        message: 'Tab created successfully',
        data: tabObject
      });
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
    if (!updatedTab) {
      return res.status(404).json({ message: "Tab not found" });
    }

    const tabObject = updatedTab.toObject();
    tabObject.id = tabObject._id;

    res.status(200).json({
      message: 'Tab updated successfully',
      data: tabObject
    });
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
