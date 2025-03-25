const Password = require('../models/Password');

exports.getPasswords = async (req, res) => {
  try {
    const passwords = await Password.find({ userId: req.user.id });
    res.status(200).json({ message: 'Passwords retrieved successfully', data: passwords });
  } catch (error) {
    console.error("Error retrieving passwords:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addPassword = async (req, res) => {
  try {
    const { site, username, encryptedPassword } = req.body;
    const newPassword = new Password({
      userId: req.user.id,
      site,
      username,
      encryptedPassword,
    });
    const savedPassword = await newPassword.save();
    res.status(201).json({ message: 'Password added successfully', data: savedPassword });
  } catch (error) {
    console.error("Error adding password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const updatedPassword = await Password.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!updatedPassword) return res.status(404).json({ message: "Password not found" });
    res.status(200).json({ message: 'Password updated successfully', data: updatedPassword });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deletePassword = async (req, res) => {
  try {
    const deletedPassword = await Password.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deletedPassword) return res.status(404).json({ message: "Password not found" });
    res.status(200).json({ message: 'Password deleted successfully' });
  } catch (error) {
    console.error("Error deleting password:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
