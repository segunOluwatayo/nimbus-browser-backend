const Bookmark = require('../models/Bookmark');

exports.getAllBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id });
    res.status(200).json({ message: 'Bookmarks retrieved successfully', data: bookmarks });
  } catch (error) {
    console.error("Error retrieving bookmarks:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createBookmark = async (req, res) => {
  try {
    const { title, url, folder } = req.body;
    const newBookmark = new Bookmark({
      userId: req.user.id,
      title,
      url,
      folder,
    });
    const savedBookmark = await newBookmark.save();
    res.status(201).json({ message: 'Bookmark created successfully', data: savedBookmark });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getBookmarkById = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOne({ _id: req.params.id, userId: req.user.id });
    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    res.status(200).json({ message: 'Bookmark retrieved successfully', data: bookmark });
  } catch (error) {
    console.error("Error retrieving bookmark:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateBookmark = async (req, res) => {
  try {
    const updatedBookmark = await Bookmark.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updatedBookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    res.status(200).json({ message: 'Bookmark updated successfully', data: updatedBookmark });
  } catch (error) {
    console.error("Error updating bookmark:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteBookmark = async (req, res) => {
  try {
    const deletedBookmark = await Bookmark.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedBookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    res.status(200).json({ message: 'Bookmark deleted successfully' });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
