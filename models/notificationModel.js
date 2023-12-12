const mongoose = require("mongoose");

const notificationModel = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    message: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps:true,
}
);

const Notification = mongoose.model("Notification", notificationModel);

module.exports = Notification;
