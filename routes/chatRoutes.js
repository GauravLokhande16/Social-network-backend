const express = require("express");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const requireAuth = require("../middleware/requireAuth");
const Chat = require("../models/chatModels");

const route = express.Router();

// authorization for chats
route.use(requireAuth);

// access chats or create a chat
route.post("/", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        console.log("userId is not found.");
    }

    var isChat = await Chat.find({
        isGroupChat: false,
        $and: [
            { user: { $elemMatch: { $eq: req.user._id } } },
            { user: { $elemMatch: { $eq: userId } } },
        ],
    })
        .populate("user", "-password")
        .populate("latestMessage");

    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name pic email",
    });
    if (isChat.length > 0) {
        res.send(isChat[0]);
    } else {
        var chatData = {
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId],
        };

        try {
            const createChat = await Chat.create(chatData);
            const fullChat = await Chat.findOne({ _id: createChat._id }).populate(
                "users",
                "-password"
            );

            res.status(200).send(fullChat);
        } catch (error) {
            res.status(400);
            // throw new Error(error.message);
        }
    }
});

// fetch chats
route.get("/", async(req, res) => {
    try {
        Chat.find({ users: { $elemMatch: { $eq: req.params.id } } })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 })                                                                                                                                                    
            .then(async (results) => {
                results = await User.populate(results, {
                    path: "latestMessage.sender",
                    select: "name pic email",
                });
                res.status(200).send(results);
            });d
    } catch (error) {
        res.status(400);
        // throw new Error(error.message);
    }
});

// create a group
route.post("/group", async (req, res) => {
    const { users, name } = req.body;
    if (!users || !name) {
        res.status(404).send({ message: "Please fill all the fields" });
    }
    var user = JSON.parse(users);

    if (user.length < 2) {
        return res.status(404)
            .send({ message: "More than 2 users are required to form a group chat" })
    }
    user.push(req.user);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.name,
            users: user,
            isGroupChat: true,
            groupAdmin: req.user,
        });

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(200).json(fullGroupChat);

    } catch (error) {
        res.status(400)
        throw new Error(error.message);
    }
}
);

// rename froup chats
route.put("/rename", async(req, res) => {
    const {chatId, chatName} = req.body

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,{
            chatName
        },{
            new:true
        }
    ).populate("users", "-password")
    .populate("groupAdmin","-password")

    if(!updatedChat){
        res.status(404)
        throw new Error("Chat not Exists")
    }else{
        res.json(updatedChat)
    }
 });

// remove from group chats
route.put("/groupremove", async(req, res) => { 
    const {chatId, userId} = req.body

    const remove = await Chat.findByIdAndUpdate(
        chatId,
        {
            $pull: {users: userId}
        },
        {new:true}
    )
    .populate("users", "-password")
    .populate("groupAdmin","-password")

    if(!remove){
        res.status(404)
        throw new Error("Chat Mot Found")
    }else{
        res.json(remove)
    }
});

// add to group chat
route.put("/groupadd", async(req, res) => {
    const {chatId, userId} = req.body

    const added = await Chat.findByIdAndUpdate(
        chatId,
        {
            $push: {users: userId}
        },
        {new:true}
    )
    .populate("users", "-password")
    .populate("groupAdmin","-password")

    if(!added){
        res.status(404)
        throw new Error("Chat Mot Found")
    }else{
        res.json(added)
    }
 });


module.exports = route;
