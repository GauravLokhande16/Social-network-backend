const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const Chat = require("../models/chatModels");
const Notification = require("../models/notificationModel");
const Message = require("../models/messageModel");

const routes = express.Router();

routes.use(requireAuth);

// Use the requireAuth middleware for this specific route
routes.post("/", async (req, res) => {
  const { chatId, messageId, senderId } = req.body;

  if (!chatId || !messageId || !senderId) {
    console.log("Invalid content");
    return res.json({ message: "Invalid content" });
  }

  try {
    const notification = await Notification.create({
      chat: chatId,
      message: messageId,
      sender: senderId,
    });
    const data = await Notification.find({})
      .populate("chat")
      .populate("message");

    res.json(data);
  } catch (error) {
    res.json({ error: error.message });
    // throw new Error(error.message);
  }
});

// routes.get("/:userId", async (req, res) => {
//   const { userId } = req.params;

//   if (!userId) {        
//     console.log("Invalid content");
//     return res.json({ message: "Invalid content" });
//   }
//   try {
//     // const chats = await Chat.find({ users: { $in: [userId] } });
//     // const chatIds = chats.map(chat => chat._id);
//     // const messages = await Message.find({ chat: { $in: chatIds } });
//     // const messageIds = messages.map(message => message.sender);
//     // const notifications = await Notification.find({ message: { $in: messageIds } });

//     const notifications = await Notification.find();
//     const notMessageIds = notifications.map((not) => not.message);
//     const messages = await Message.find({ _id: notMessageIds }).find({
//       sender: { $ne: userId},
//     }).populate("sender")

//     res.json(messages);
//   } catch (error) {
//     res.json({ error: error.message });
//     throw new Error(error.message);
//   }
// });

routes.get("/:userId", async (req, res) => {
    const { userId } = req.params;
  
    if (!userId) {
      console.log("Invalid content");
      return res.json({ message: "Invalid content" });
    }
  
    try {
      // Fetch all notifications that belong to messages sent by other users to the userId
      const notifications = await Notification.find();
      const notMessageIds = notifications.map((not) => not.message);
  
      // Fetch messages that meet the criteria
      const messages = await Message.find({
        _id: { $in: notMessageIds }, // Messages linked to notifications
        sender: { $ne: userId },    // Sent by users other than userId
      }).populate("sender").populate("chat");        // Populate the "sender" field to get user details
  
      // Extract notification IDs from the retrieved messages
      const notificationIds = messages.map((message) => {
        const notification = notifications.find((not) => not.message.equals(message._id));
        return notification ? notification._id : null;
      });
  
      // Create an array of objects with message and notification IDs
      const result = messages.map((message, index) => {
        return {
          message: message,
          notificationId: notificationIds[index],
        };
      });
  
      res.json(result);
    } catch (error) {
      res.json({ error: error.message });
      // throw new Error(error.message);
    }
  });
  

routes.delete("/:notificationId", async (req, res) => {
  const { notificationId } = req.params;
  console.log(notificationId);

  if (!notificationId) {
    console.log("Invalid content");
    return res.json({ message: "Invalid content" });
  }

  try {
    const notification = await Notification.findByIdAndDelete(notificationId)
      .populate("chat")
      .populate("message");
  
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
  
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = routes; // Corrected the "module.exports" spelling
