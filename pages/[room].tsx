import { useEffect, useState, useRef } from 'react';
import { RTC } from '../tools';
import { io } from 'socket.io-client';
import { useRouter } from 'next/router';

export default function Room() {
    const router = useRouter();
    const [loadingStatus, setLoadingStatus] = useState<string>('connecting');
    const localVideo = useRef<HTMLVideoElement>(null);
    const peerVideo = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const socket = io();
        (async () => {
            const count = await new Promise((resolve) => {
                socket.emit('join_room', { room: router.query['room'] }, (count: number) => {
                    resolve(count);
                });
            });

            // Return back to the main page if the server has told us that
            // this room is full.
            if (count === -1) return router.push('./');

            const conn = new RTC();
            conn.connection.addEventListener('connectionstatechange', () => {
                setLoadingStatus(conn.connection.connectionState);
            });

            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            localVideo.current!.srcObject = stream;
            stream.getTracks().forEach((track) => conn.connection.addTrack(track, stream));

            conn.connection.addEventListener('track', ({ streams }) => {
                console.log('hi', streams);
                const [remoteStream] = streams;
                peerVideo.current!.srcObject = remoteStream;
            });

            switch (count) {
                case 0:
                    socket.on('offer', async (offer: RTCSessionDescription) => {
                        const answer = await conn.receiveOffer(offer);
                        socket.emit('answer', { answer });
                    });
                    break;
                case 1:
                    socket.on('answer', async (answer: RTCSessionDescription) => {
                        await conn.receiveAnswer(answer);
                    });

                    const offer = await conn.createOffer();
                    socket.emit('offer', { offer });
                    break;
                default:
                    break;
            }
        })();

        return () => {
            // conn.connection.close();
            socket.emit('leave_room');
            socket.disconnect();
        };
    }, []);

    return (
        <>
            <h1>{loadingStatus}</h1>

            <p>You</p>
            <video style={{ width: '50dvw' }} ref={localVideo} autoPlay playsInline></video>

            <p>Peer</p>
            <video style={{ width: '50dvw' }} ref={peerVideo} autoPlay playsInline></video>
        </>
    );
}
