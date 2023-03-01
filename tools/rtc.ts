export class RTC {
    connection: RTCPeerConnection;
    channel?: RTCDataChannel;

    constructor() {
        this.connection = new RTCPeerConnection();
    }

    #waitForSDP() {
        return new Promise((resolve) => {
            const handler = (e: RTCPeerConnectionIceEvent) => {
                // Do nothing if the gathering isn't complete
                if (this.connection.iceGatheringState !== 'complete' || !!e.candidate) return;
                resolve(this.connection.localDescription!);
                this.connection.removeEventListener('icecandidate', handler);
            };
            this.connection.addEventListener('icecandidate', handler);
        }) satisfies Promise<RTCSessionDescription>;
    }

    async createOffer() {
        // Create a default means of communication
        this.channel = this.connection.createDataChannel('default');

        // Register the listeners to receive latest SDP after ICE
        // candidates have trickled in.
        const sdp = this.#waitForSDP();

        const offer = await this.connection.createOffer();
        await this.connection.setLocalDescription(offer);

        // Return the promise that will eventually resolve with the SDP.
        return sdp;
    }

    async receiveOffer(offer: RTCSessionDescription) {
        // Receive the default data channel.
        const handler = ({ channel }: RTCDataChannelEvent) => {
            this.channel = channel;
            this.connection.removeEventListener('datachannel', handler);
        };
        this.connection.addEventListener('datachannel', handler);

        const sdp = this.#waitForSDP();

        // First register the remote description to base the answer off of.
        await this.connection.setRemoteDescription(offer);
        const answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(answer);

        // Last step is to register this as the remote description on the
        // initializer's connection object.
        return sdp;
    }

    async receiveAnswer(answer: RTCSessionDescription) {
        await this.connection.setRemoteDescription(answer);
    }
}
