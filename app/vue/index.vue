<template>
    <div id="app">
        <video :srcObject.prop="local_media_stream" autoplay muted/>
        <video v-for="peer in peer_media_elements" :srcObject.prop="peer"/>
    </div>
</template>

<script>
    import io from 'socket.io-client';

    export default {
        name: 'index',
        // components: {
        //     appHeader,
        // },

        data() {
            return {
                signaling_peer: window.location.hostname === 'localhost' ? "http://127.0.0.1:8080" : window.location.hostname,
                local_media_stream: null,
                USE_AUDIO: true,
                USE_VIDEO: true,
                DEFAULT_CHANNEL: 'a',
                ICE_SERVERS: [
                    {url: "stun:stun.l.google.com:19302"}
                ],
                peers: {},
                peer_media_elements: {}
            }
        },

        beforeCreate() {
            const signaling_socket = io(this.signaling_peer);

            signaling_socket.on('connect', () => {
                console.log("Connected to signaling server");
                this.setup_local_media(() => {
                    this.join_chat_channel(this.DEFAULT_CHANNEL, {'whatever-you-want-here': 'stuff'});
                });
            });
            signaling_socket.on('disconnect', () => {
                console.log("Disconnected from signaling server");
                for (peer_id in this.peers) {
                    this.peers[peer_id].close();
                }

                this.peers = {};
                this.peer_media_elements = {};
            });


            signaling_socket.on('addPeer', function (config) {
                console.log('Signaling server said to add peer:', config);
                const peer_id = config.peer_id;
                if (peer_id in this.peers) {
                    console.log("Already connected to peer ", peer_id);
                    return;
                }
                const peer_connection = new RTCPeerConnection(
                    {"iceServers": ICE_SERVERS},
                    {"optional": [{"DtlsSrtpKeyAgreement": true}]}
                );

                this.peers[peer_id] = peer_connection;

                peer_connection.onicecandidate = function (event) {
                    if (event.candidate) {
                        const {sdpMLineIndex, candidate} = event.candidate;
                        signaling_socket.emit('relayICECandidate', {
                            peer_id,
                            ice_candidate: {
                                sdpMLineIndex: sdpMLineIndex,
                                candidate: candidate
                            }
                        });
                    }
                };
                peer_connection.onaddstream = function (event) {
                    const remote_media = USE_VIDEO ? $("<video autoplay playsinline>") : $("<audio>");
                    remote_media.attr("controls", false);
                    this.peer_media_elements[peer_id] = event.stream;
                };

                peer_connection.addStream(this.local_media_stream);


                if (config.should_create_offer) {
                    console.log("Creating RTC offer to ", peer_id);
                    peer_connection.createOffer(
                        function (local_description) {
                            console.log("Local offer description is: ", local_description);
                            peer_connection.setLocalDescription(local_description,
                                function () {
                                    signaling_socket.emit('relaySessionDescription',
                                        {'peer_id': peer_id, 'session_description': local_description});
                                    console.log("Offer setLocalDescription succeeded");
                                },
                                function () {
                                    console.error("Offer setLocalDescription failed!");
                                }
                            );
                        },
                        function (error) {
                            console.log("Error sending offer: ", error);
                        });
                }
            });

            signaling_socket.on('sessionDescription', function (config) {
                console.log('Remote description received: ', config);
                const peer_id = config.peer_id;
                const peer = this.peers[peer_id];
                const remote_description = config.session_description;
                console.log(config.session_description);

                const desc = new RTCSessionDescription(remote_description);
                const stuff = peer.setRemoteDescription(desc,
                    function () {
                        console.log("setRemoteDescription succeeded");
                        if (remote_description.type == "offer") {
                            peer.createAnswer(
                                function (local_description) {
                                    console.log("Answer description is: ", local_description);
                                    peer.setLocalDescription(local_description,
                                        function () {
                                            signaling_socket.emit('relaySessionDescription',
                                                {'peer_id': peer_id, 'session_description': local_description});
                                            console.log("Answer setLocalDescription succeeded");
                                        },
                                        function () {
                                            console.error("Answer setLocalDescription failed!");
                                        }
                                    );
                                },
                                function (error) {
                                    console.log("Error creating answer: ", error);
                                    console.log(peer);
                                });
                        }
                    },
                    function (error) {
                        console.log("setRemoteDescription error: ", error);
                    }
                );
                console.log("Description Object: ", desc);

            });


            signaling_socket.on('iceCandidate', function (config) {
                const peer = this.peers[config.peer_id];
                const ice_candidate = config.ice_candidate;
                peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
            });


            signaling_socket.on('removePeer', function (config) {
                console.log('Signaling server said to remove peer:', config);
                const peer_id = config.peer_id;

                if (peer_id in this.peers) {
                    this.peers[peer_id].close();
                }

                delete this.peers[peer_id];
                delete this.peer_media_elements[config.peer_id];
            });
        },

        methods: {
            a(stream) {
                this.local_media_stream = stream;
                console.log('a', this.local_media_stream)
            },
            b() {
                console.log("Access denied for audio/video");
                console.error("You chose not to provide access to the camera/microphone, demo will not work.");
            },
            setup_local_media(callback) {
                if (this.local_media_stream != null) {
                    if (callback) callback();
                    return;
                }
                console.log('b', this.local_media_stream)
                navigator.mediaDevices.getUserMedia({
                    "audio": this.USE_AUDIO,
                    "video": this.USE_VIDEO
                }).then(this.a).catch(this.b);
            },
            join_chat_channel(channel, userdata) {
                signaling_socket.emit('join', {"channel": channel, "userdata": userdata});
            },
            part_chat_channel(channel) {
                signaling_socket.emit('part', channel);
            },

            changeAudio() {
                this.USE_AUDIO = !this.USE_AUDIO
                this.local_media_stream.getAudioTracks()[0].enabled = this.USE_AUDIO;
            },
            changeVideo() {
                this.USE_VIDEO = !this.USE_VIDEO
                this.local_media_stream.getVideoTracks()[0].enabled = this.USE_VIDEO;
            },
        }
    };
</script>
