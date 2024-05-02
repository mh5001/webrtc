const { uuidv4, bodyParserUrl } = require('./util');
const path = require('path');
const express = require('express');
const app = express();

const server = app.listen(5002, () => {
    console.log('Server is up');
});
const io = require('socket.io')(server, {
    maxHttpBufferSize: 1e8
});

app.use(express.static('./public'));
app.use(express.static('./public/room'));

const rooms = {};
app.get('/room/:id', (req, res) => {
    const { id } = req.params;
    if (!rooms[id]) {
        return res.redirect('/');
    }
    res.sendFile('index.html', { root: path.join(__dirname, 'public', 'room') });
});

app.post('/room', bodyParserUrl, (req, res) => {
    const uuid = uuidv4();
    rooms[uuid] = {
        url: req.body['url'],
        count: 0
    };
    res.redirect('/room/' + uuid);
});

io.on("connection_error", (err) => {
    console.log(err.req);      // the request object
    console.log(err.code);     // the error code, for example 1
    console.log(err.message);  // the error message, for example "Session ID unknown"
    console.log(err.context);  // some additional error context
});

io.on('connection', socket => {
    socket.on('init', roomId => {
        if (!rooms[roomId]) {
            socket.leave(roomId);
            return;
        }
        rooms[roomId].count++;
        socket.roomId = roomId;
        socket.join(roomId);
        if (rooms[roomId].count == 1) {
            socket.emit('host', rooms[roomId].url);
            return;
        }
        socket.emit('leech', rooms[socket.roomId].tracks);
    });
    socket.on('tracks', tracks => {
        rooms[socket.roomId].tracks = tracks;
    });
    socket.on('chunk', (data) => {
        socket.to(socket.roomId).emit('chunk', data);
    });
    socket.on('disconnect', () => {
        if (!rooms[socket.roomId]) {
            delete rooms[socket.roomId];
            return;
        }
        rooms[socket.roomId].count--;
        if (rooms[socket.roomId].count <= 0) {
            delete rooms[socket.roomId];
        }
    });
    socket.on("ping", (callback) => {
        callback();
    });
});

