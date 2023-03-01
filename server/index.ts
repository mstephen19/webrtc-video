import { createServer } from 'http';
import nextJS from 'next';
import { Server } from 'socket.io';

const PORT = process.env.PORT || 3001;

const next = nextJS({ dev: process.env.NODE_ENV !== 'production' });
const handler = next.getRequestHandler();

const app = createServer(handler);

const io = new Server(app, {
    cors: {
        origin: /.*/,
        methods: ['GET', 'POST'],
    },
});

io.on('connect', (socket) => {
    // Join a room with a room name and an offer containing SDP
    socket.on('join_room', ({ room }: { room: string }, cb: (count: number) => void) => {
        // The number of users currently in the room
        const count = io.sockets.adapter.rooms.get(room)?.size ?? 0;
        // Only allow a maximum of 2 users per room
        if (count >= 2) return cb(-1);
        socket.join(room);
        // Acknowledge with the number of users in the room PRIOR to
        // the current user being joined
        cb(count);

        const handleOffer = ({ offer }: { offer: any }) => {
            // Send the offer to those already in the room
            socket.to(room).emit('offer', offer);
        };
        socket.on('offer', handleOffer);

        // When the socket sends an answer, signal that to the
        // other party
        const handleAnswer = ({ answer }: { answer: any }) => {
            socket.to(room).emit('answer', answer);
        };
        socket.on('answer', handleAnswer);

        const handleLeave = () => {
            socket.leave(room);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
        };

        socket.once('disconnect', handleLeave);
        socket.once('leave_room', handleLeave);
    });
});

await next.prepare();
app.listen(PORT);
