const express = require('express')
const mongoose = require('mongoose');
const dotenv = require('dotenv')
const cors = require('cors')
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notifactionRoutes = require('./routes/notificationRoutes');
const socket = require('socket.io');

dotenv.config()

const port = process.env.PORT 

const app = express()
app.use(express.json())
app.use(cors({
    origin:"*"
}))

mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log("Mongodb Connected");
    })
    .catch((err) => {
        console.log(err.message);
    });

    app.use("/api/user",userRoutes)
    app.use("/api/chat",chatRoutes)
    app.use("/api/message",messageRoutes)
    app.use("/api/notification", notifactionRoutes)
    

const server = app.listen(port, () => {
    console.log("Server started at : "+port);
})

const io = socket(server,{
    pingTimeOut: 6000,
    cors:{
        origin:process.env.SOCKET_URL
    }
})

io.on("connection",(socket)=>{
    socket.on("setup",(userData)=>{
        socket.join(userData.id)
        socket.emit("Connected")
    })

    socket.on("join chat",(user)=>{
        socket.join(user)
        console.log("User joined chat with : " + user);
    })

    socket.on("new message",(newMessageRecieved)=>{
        var chat = newMessageRecieved.chat;

        if(!chat.users) return console.log("chat.user is empty");

        chat.users.forEach(user=>{
            if(user === newMessageRecieved._id) return;

            socket.in(user).emit("message recieved", newMessageRecieved);
        })
    })

    socket.on("typing", (room)=> socket.in(room).emit("typing"))
    socket.on("stop typing", (room)=> socket.in(room).emit("stop typing"))


    socket.off("setup",(userData)=>{
        console.log("User Disconnected");
        socket.leave(userData.id);
    })
})