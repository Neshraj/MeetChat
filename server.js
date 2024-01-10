const express = require('express');
const http = require('http');
const hostname='0.0.0.0'
const port= process.env.PORT || 3000;


const socketIO = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const rooms = {};

app.use(express.static('public'));






io.on('connection', (socket) => {
    console.log('User connected');

  
    socket.on('createRoom', (roomDetails) => {
      const { roomName, password, userLimit, userName } = roomDetails;
  
      if (rooms[roomName]) {
        socket.emit('roomExists');
        return;
      }
  
      rooms[roomName] = { password, userLimit, users: [{ id: socket.id, name: userName, online: true }] };
      socket.join(roomName);
      socket.emit('roomCreated', { roomName, users: rooms[roomName].users });
      console.log(`Room created: ${userName}`);
    });

    socket.on('joinRoom', (roomDetails) => {
        const { roomName, password, userName } = roomDetails;
        const room = rooms[roomName];
    
        if (room && room.password === password && room.users.length < room.userLimit) {
          room.users.push({ id: socket.id, name: userName, online: true });
          socket.join(roomName);
          socket.emit('roomJoined', { roomName, users: room.users });
          io.to(roomName).emit('userJoined', { userName, userId: socket.id });
          console.log(`${userName} joined room: ${roomName}`);
        } else if (room && room.users.length >= room.userLimit) {
          socket.emit('roomFull');
        } else {
          socket.emit('invalidRoom');
        }
      });

      socket.on('sendMessage', (messageDetails) => {
        const { roomName, message } = messageDetails;
        const room = rooms[roomName];
    
        if (room && room.users.some(user => user.id === socket.id)) {
          io.to(roomName).emit('receiveMessage', { message, sender: { id: socket.id, name: getUserById(socket.id, room.users).name } });
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected abd');
        
      });
    });

    function getUserById(userId, users) {
        return users.find(user => user.id === userId);
      }


server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


