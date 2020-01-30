<template>
  <div>
    <h1>WebSocket TEST</h1>
    <button @click="connect">Connect</button>
    <input v-model="enteredText" />
    <button @click="sendMessage">Test</button>
  </div>
</template>

<script>
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
export default {
  name: "WebsocketGreetings",

  data() {
    return {
      connected: false,
      enteredText: "",
      messages: []
    };
  },

  methods: {
    sendMessage() {
      //   console.log("Text entered:" + this.enteredText);
      if (this.stompClient && this.stompClient.connected) {
        let msg = { name: this.enteredText };
        console.log("Sending:");
        console.log(JSON.stringify(msg));
        this.stompClient.send("/app/hello", JSON.stringify(msg), {});
      }
    },

    connect() {
      this.socket = new SockJS("http://localhost:8080/gs-guide-websocket");
      this.stompClient = Stomp.over(this.socket);
      this.stompClient.connect(
        {},
        frame => {
          this.connected = true;
          console.log("Frame:");
          console.log(frame);
          this.stompClient.subscribe("/topic/game", tick => {
            console.log("tick received:");
            console.log(tick);
            let newMessage = { message: JSON.parse(tick.body).content };
            this.messages.push(newMessage);
            console.log("Now the messages array is:");
            console.log(this.messages);
            this.enteredText = "";
          });
        },
        error => {
          console.log(error);
          this.connected = false;
        }
      );
    },

    disconnect() {
      if (this.stompClient) {
        this.stompClient.disconnect();
      }
      this.connected = false;
    }
  }
};
</script>


<style>
</style>