const express = require("express");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");
const Chat = require("../models/chatModels");
const Message = require("../models/messageModel");

const route = express.Router();

// authorization for chats
route.use(requireAuth);

// send messages
route.post("/", async (req, res) => {
  const { content, chatId } = req.body;

  if (!chatId || !content) {
    console.log("Invalid content");
    return res.json({ message: "Invalid content" });
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "Chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });
    res.json(message);
  } catch (error) {
    res.status(400);
    // throw new Error(error.message);
  }
});

// get all messages
route.get("/:chatId", async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    // throw new Error(error.message);
  }
});

module.exports = route;
