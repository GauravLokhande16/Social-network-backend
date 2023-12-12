const express = require("express");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");
const Chat = require("../models/chatModels");


const routes = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY , { expiresIn: "30d" });
};

routes.post("/register", async (req, res) => {
  const { name, password, email, profilePic } = req.body;
  const user = await User.findOne({ email });

  if (user) return res.json("User already exist");

  const data = await User.create({
    name,
    email,
    password,
    pic: profilePic,
  });
  res.json({
    name,
    email,
    pic: data.pic,
    id:data._id,
    token: generateToken(data._id),
  });
});

routes.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    
    if (user && (await user.matchPassword(password))) {
      res.json({
        name: user.name,
        email,
        pic: user.pic,
        id: user._id,
        token: generateToken(user._id),
      });
    } else {
      // User not found or passwords don't match
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    // Handle any errors that occur during the process
    res.status(500).json({ message: "Internal server error" });
  }
});


// search users
routes.get("/", async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};
  const user = await User.find(keyword).find({_id: {$ne: req.query.id}})
  res.json(user);
});

routes.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
try {
  // Use the `populate` method to populate the `users` field with user information
  const chat = await Chat.findById(id).populate({
    path: 'users', // The field to populate
    model: "User", // The model to use for populating
    select: '-password', // Exclude the password field from users
  });

  if (chat) {
    res.json(chat);
  } else {
    res.status(404).json({ message: "Chat not found" });
  }
} catch (error) {
  res.status(500).json({ error: error.message });
}

});

module.exports = routes;
