<template>
  <div class="container">
    <!-- <h1>Battleship</h1> -->

    <!-- <button @click="update" class="btn btn-success">update</button> -->
    <!-- <button @click="reset" class="btn btn-info">reset</button> -->

    <img v-if="authorized == false" src="../assets/Unauthorized.png" />
    <!-- <h1 v-if="!authorized">BITCH</h1> -->

    <div class="game_view" v-if="ships != null">
      <br />

      <h6>
        <b>{{ships.player.userName}}</b>
        <span v-if="ships.opponent != null">
          VS
          <b>{{ships.opponent.userName}}</b>
        </span>
      </h6>
      <button class="btn btn-info" @click="goBack">Go back</button>
      <h1>{{ships.status}}</h1>

      <div class="row">
        <div class="col-5">
          <div class="ships">
            <div
              class="outline"
              v-for="(letterd, i) in letters"
              :key="i"
              @dragover.prevent
              @drop.prevent="drop"
            >
              <div :id="`A${i+1}`"></div>
              <div :id="`B${i+1}`"></div>
              <div :id="`C${i+1}`"></div>
              <div :id="`D${i+1}`"></div>
              <div :id="`E${i+1}`"></div>
              <div :id="`F${i+1}`"></div>
              <div :id="`G${i+1}`"></div>
              <div :id="`H${i+1}`"></div>
              <div :id="`I${i+1}`"></div>
              <div :id="`J${i+1}`"></div>
            </div>
          </div>
        </div>
        <div class="col-2">
          <br />
          <br />
          <h6>Enemy ships</h6>
          <br />
          <br />
          <p id="opp_pb">Patrol Boat</p>
          <hr />
          <p id="opp_sub">Submarine</p>
          <hr />
          <p id="opp_des">Destroyer</p>
          <hr />
          <p id="opp_pir">Pirogue</p>
          <hr />
          <p id="opp_tit">Titanic</p>
        </div>
        <div class="col-5">
          <div class="salvos">
            <div class="outline" v-for="(letterd, i) in letters" :key="i">
              <div class="blue" @click="createSalvoes(`A${i+1}`)" :id="`SA${i+1}`"></div>
              <div class="blue" @click="createSalvoes(`B${i+1}`)" :id="`SB${i+1}`"></div>
              <div class="blue" @click="createSalvoes(`C${i+1}`)" :id="`SC${i+1}`"></div>
              <div class="blue" @click="createSalvoes(`D${i+1}`)" :id="`SD${i+1}`"></div>
              <div class="blue" @click="createSalvoes(`E${i+1}`)" :id="`SE${i+1}`"></div>
              <div class="blue" @click="createSalvoes(`F${i+1}`)" :id="`SF${i+1}`"></div>
              <div class="blue" @click="createSalvoes(`G${i+1}`)" :id="`SG${i+1}`"></div>
              <div class="blue" @click="createSalvoes(`H${i+1}`)" :id="`SH${i+1}`"></div>
              <div class="blue" @click="createSalvoes(`I${i+1}`)" :id="`SI${i+1}`"></div>
              <div class="blue" @click="createSalvoes(`J${i+1}`)" :id="`SJ${i+1}`"></div>
            </div>
          </div>
        </div>
      </div>
      <Harbor v-if="ships.ships.length ==0" />
      <button
        :disabled="!placed"
        v-if="ships.ships.length ==0"
        @click="placeShips"
        class="btn btn-success"
      >Confirm Ships placement</button>
      <button
        v-if="ships.ships.length !=0"
        :disabled="!check"
        @click="sendSalvoes"
        class="btn btn-danger"
      >Confirm Salvoes</button>

      <!-- <p>Created :{{ships.game.created}}</p> -->
    </div>
  </div>
</template>

<script>
import Login from "./login";
import Boat from "../components/boat";
import Harbor from "../components/harbor";
import { mapGetters } from "vuex";
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import api from "../back-end";
export default {
  components: { Login, Harbor },
  props: ["gp_id"],
  data: () => {
    return {
      input: null,
      letters: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
      placed: false,
      localLocations: [
        { type: "Destroyer", locations: [] },
        { type: "Submarine", locations: [] },
        { type: "Patrol Boat", locations: [] },
        { type: "Pirogue", locations: [] },
        { type: "Titanic", locations: [] }
      ],
      salvoes: [],
      shots: [],
      test: ["Destroyer", "Submarine", "Patrol Boat", "Pirogue", "Titanic"],
      connected: false
    };
  },
  computed: {
    ...mapGetters([
      "ships",
      "logged",
      "player",
      "ships",
      "authorized",
      "shipsLocations"
    ]),
    check() {
      if (this.salvoes.length == 5 && this.ships.status == "Shoot !") {
        return true;
      } else return false;
    }
  },
  methods: {
    log() {
      console.log(this.test.join("").length);
    },
    goBack() {
      this.$router.push("/");
    },
    createSalvoes(id) {
      // if () {
      if (!this.shots.includes(id)) {
        if (this.salvoes.includes(id)) {
          let index = this.salvoes.indexOf(id);
          let pos = this.salvoes[index];
          document.getElementById(`S${pos}`).innerHTML = "";
          document.getElementById(`S${pos}`).setAttribute("class", "blue");
          this.salvoes.splice(index, 1);
        } else if (this.salvoes.length < 5 && !this.salvoes.includes(id)) {
          this.salvoes.push(id);
        }
        for (let i = 0; i < this.salvoes.length; i++) {
          let id = this.salvoes[i];
          document.getElementById(`S${id}`).innerHTML = "X";
          document.getElementById(`S${id}`).setAttribute("class", "shot");
        }
      } else {
        console.log("Shot already sent");
      }
      // }
    },
    setShots() {
      for (let i in this.ships.all_salvoes) {
        for (let e in this.ships.all_salvoes[i]) {
          if (!this.shots.includes(this.ships.all_salvoes[i][e])) {
            this.shots.push(this.ships.all_salvoes[i][e]);
          }
        }
      }
    },
    sendSalvoes() {
      let payload = {
        id: this.gp_id,
        data: this.salvoes
      };
      this.$store.dispatch("addSalvoes", payload);
      this.updateSocket;
      setTimeout(this.update, 400);
      this.salvoes = [];
      this.setHits();
    },

    // log: e => console.log(e),
    drop(e) {
      this.localLocations = this.shipsLocations;
      // console.log("target id: ", e.target.id);
      let boat_id = e.dataTransfer.getData("boat_id");
      let boat = document.getElementById(boat_id);
      let pos = e.dataTransfer.getData("position");
      let name = e.dataTransfer.getData("name");
      let size = e.dataTransfer.getData("length");
      boat.style.display = "block";
      let boatLocation = [];
      // --------------------------------------------
      let id = e.target.id.split("");
      let letter = id[0];
      let number = id[1];
      let placeable = true;
      if (id.length == 3) {
        number = 10;
      }
      if (pos == "vertical") {
        let indexOfLetter = this.letters.indexOf(letter);
        let maxIndex = Number(size) + indexOfLetter;
        if (maxIndex > 9) {
          placeable = false;
          // console.log("unable to place ships");
        } else {
          for (let i = 0; i <= size; i++) {
            let temp = [];
            let newIndex = indexOfLetter + i;
            temp.push(this.letters[newIndex]);
            // temp.push(this.letters[newIndex].toUpperCase());
            temp.push(number);
            let newLoc = temp.join("");
            boatLocation.push(newLoc);
          }
        }
      }

      if (pos == "horizontal") {
        let maxNum = Number(number) + Number(size);
        if (maxNum > 10) {
          placeable = false;
          // console.log("unable to place ships");
        } else {
          for (let i = 0; i <= size; i++) {
            let temp = [];
            let newNumber = Number(number) + i;
            // temp.push(letter.toUpperCase());
            temp.push(letter);
            temp.push(newNumber);
            let newLoc = temp.join("");
            boatLocation.push(newLoc);
          }
        }
      }
      // ---------------------------------------------
      let allLocs = [];
      this.shipsLocations.forEach(ship => {
        if (name != ship.type) {
          ship.locations.forEach(e => allLocs.push(e));
        }
      });

      let duplicate = allLocs.filter(loc => {
        let found = false;
        boatLocation.forEach(bLoc => {
          if (bLoc == loc) {
            found = true;
          }
        });
        return found;
      });

      let list = duplicate.join(",");

      if (list.length == 0 && placeable) {
        e.target.appendChild(boat);
        if (name == "Patrol Boat") {
          this.localLocations[2].locations = boatLocation;
        }
        if (name == "Submarine") {
          this.localLocations[1].locations = boatLocation;
        }
        if (name == "Destroyer") {
          this.localLocations[0].locations = boatLocation;
        }
        if (name == "Pirogue") {
          this.localLocations[3].locations = boatLocation;
        }
        if (name == "Titanic") {
          this.localLocations[4].locations = boatLocation;
        }
        // console.log("local locations: ", this.localLocations);
        // console.log("no duplicate found change saved");
        this.$store.commit("setShipsLocations", this.localLocations);
      } else {
        // console.log(
        //   "unable to Place ship because it's overlapping with another"
        // );
      }
      list = [];
      if (
        this.shipsLocations[0].locations.length != 0 &&
        this.shipsLocations[1].locations.length != 0 &&
        this.shipsLocations[2].locations.length != 0
      ) {
        this.placed = true;
      }

      // console.log("all locs check,", allLocs);
      // console.log("all locations :", this.locations);
    },
    reset() {
      location.reload();
    },
    update() {
      this.$store.dispatch("getShips", this.gp_id);
      this.updateSocket();
      setTimeout(this.checkIfAuthorized, 200);
      setTimeout(this.setHits, 200);
    },
    placeShips() {
      let payload = {
        id: this.gp_id,
        data: this.shipsLocations
      };
      this.$store.dispatch("addShips", payload);
      this.updateSocket();
      setTimeout(this.update, 400);
    },
    clear() {
      this.$store.commit("reset");
      this.input = null;
    },
    setShips() {
      for (let key in this.ships.ships) {
        for (let i = 0; i < this.ships.ships[key].locations.length; i++) {
          let id = this.ships.ships[key].locations[i];
          if (this.ships.ships[key].type == "Submarine") {
            document.getElementById(id).innerHTML = "S";
            document.getElementById(id).innerHTML;
            document.getElementById(id).setAttribute("class", "submarine");
          }
          if (this.ships.ships[key].type == "Destroyer") {
            document.getElementById(id).innerHTML = "D";
            document.getElementById(id).setAttribute("class", "destroyer");
          }
          if (this.ships.ships[key].type == "Patrol Boat") {
            document.getElementById(id).innerHTML = "PB";
            document.getElementById(id).setAttribute("class", "pb");
          }
          if (this.ships.ships[key].type == "Pirogue") {
            document.getElementById(id).innerHTML = "PR";
            document.getElementById(id).setAttribute("class", "pirogue");
          }
          if (this.ships.ships[key].type == "Titanic") {
            document.getElementById(id).innerHTML = "T";
            document.getElementById(id).setAttribute("class", "titanic");
          }
        }
      }
      this.setSalvos();
    },
    setSalvos() {
      this.setHits();
      for (let key in this.ships.salvoes) {
        for (let i = 0; i < this.ships.salvoes[key].locations.length; i++) {
          let id = this.ships.salvoes[key].locations[i];
          document.getElementById(`S${id}`).innerHTML = "X";
          document.getElementById(`S${id}`).setAttribute("class", "shot");
        }
      }
      if (this.ships.opponent != null && this.ships.opponent.salvoes) {
        for (let key in this.ships.opponent.salvoes) {
          for (
            let i = 0;
            i < this.ships.opponent.salvoes[key].locations.length;
            i++
          ) {
            let id = this.ships.opponent.salvoes[key].locations[i];
            if (document.getElementById(`${id}`).innerHTML != "+") {
              // document.getElementById(`${id}`).innerHTML += " Pam!";
              document.getElementById(`${id}`).setAttribute("class", "shots");
            } else {
              // document.getElementById(`${id}`).innerHTML = " Pam!";
              document.getElementById(`${id}`).setAttribute("class", "shots");
            }
          }
        }
      }
      this.setHits();
    },
    setHits() {
      if (this.ships.history) {
        if (this.ships.history.length > 0) {
          for (let sink in this.ships.history[0].all_sink) {
            if (this.ships.history[0].all_sink[sink] == "Patrol Boat") {
              document.getElementById("opp_pb").setAttribute("class", "sink");
            }
            if (this.ships.history[0].all_sink[sink] == "Submarine") {
              document.getElementById("opp_sub").setAttribute("class", "sink");
            }
            if (this.ships.history[0].all_sink[sink] == "Destroyer") {
              document.getElementById("opp_des").setAttribute("class", "sink");
            }
            if (this.ships.history[0].all_sink[sink] == "Pirogue") {
              document.getElementById("opp_pir").setAttribute("class", "sink");
            }
            if (this.ships.history[0].all_sink[sink] == "Titanic") {
              document.getElementById("opp_tit").setAttribute("class", "sink");
            }
          }

          for (let hit in this.ships.history[0].all_hits) {
            // console.log(this.ships.history[0].all_hits[hit]);
            let id = this.ships.history[0].all_hits[hit];
            document.getElementById(`S${id}`).innerHTML = "XX";
            // '<img src="https://banner2.cleanpng.com/20180503/aye/kisspng-emoji-fire-flame-clip-art-heater-repairman-vector-5aeaf9b9beda39.0902005815253487937817.jpg">';
            document.getElementById(`S${id}`).setAttribute("class", "hit");
          }
        }
      }
    },
    checkIfAuthorized() {
      if (this.authorized) {
        setTimeout(this.setShips, 50);
        setTimeout(this.setShots, 50);
        setTimeout(this.checkSink, 50);
        if (this.ships.salvoes.length > 1) {
          setTimeout(this.setSalvos, 70);
        }
      } else console.log("unauthorized or error occured");
    },
    updateSocket() {
      if (this.stompClient && this.stompClient.connected) {
        // check if the conexion has been established
        // Each time the player sends data (such as ships/or/salvoes) this code will run. This sends an empty string to the back end At the given game ID. The back end will send back an empty string. When the string is received we know that an upsate was made and a fetch will run to get the new data
        this.stompClient.send(
          `/app/${this.ships.game.game_id}`,
          JSON.stringify(""),
          {}
        );
        // this.stompClient.send(
        //   `/app/${this.ships.game.game_id}`, // For Local  Use
        //   JSON.stringify(""),
        //   {}
        // );
      } else {
        // if connexion is not estsblished this will connect and send the message afterwards
        this.connect;
        setTimeout(
          this.stompClient.send(
            `/app/${this.ships.game.game_id}`,
            JSON.stringify(""),
            {}
          ),
          650
        );
      }
    },
    connect() {
      this.socket = new SockJS(`${api}/gs-guide-websocket`); // Emits connection with the back end at the given address
      // this.socket = new SockJS(`http://localhost:8080/gs-guide-websocket`);
      this.stompClient = Stomp.over(this.socket);
      this.stompClient.connect(
        {},
        response => {
          // Once the connection is established the code below will automatically run each time data is sent to the back-end.
          // this.stompClient.subscribe(
          //   `${api}/topic/${this.ships.game.game_id}`,
          this.stompClient.subscribe(
            `/topic/${this.ships.game.game_id}`,
            action => {
              this.$store.dispatch("getShips", this.gp_id); // When the back end sends a response this will fetch the data
              console.log("SOCKET RUN");
            }
          );
        },
        error => console.log(error)
      );
    }
  },
  created() {
    this.log();
    this.$store.dispatch("getGames");
    this.$store.dispatch("getShips", this.gp_id);
    setTimeout(this.checkIfAuthorized, 600);

    setTimeout(this.connect, 550);
    setTimeout(this.updateSocket, 1550);
  },
  beforeDestroy() {
    if (this.stompClient) {
      this.stompClient.disconnect();
    }
    this.connected = false;
  }
};
</script>

<style>
.sink {
  text-decoration: line-through;
}
.history {
  max-width: 50%;
}
.row {
  height: 430px;
  margin: 20px;
}

.ships {
  /* border: solid 1px red; */
  height: 402px;
  display: flex;
  justify-content: center;
  background-color: lightblue;
  width: fit-content;
}
.ships div {
  height: 40px;
  width: 40px;
}
.salvos {
  /* border: solid 1px red; */
  display: flex;
  justify-content: center;
}
.salvos div {
  height: 40px;
  width: 40px;
}
.outline div {
  border: solid 1px black;
}
.patrol_boat {
  background-color: brown;
}
.submarine {
  background-color: rgb(71, 71, 221);
}
.destroyer {
  background-color: rgb(211, 48, 48);
}
.pirogue {
  background-color: rgb(201, 59, 165);
}
.titanic {
  background-color: rgb(113, 59, 201);
}
.pb {
  background-color: green;
}
.blue {
  background-color: lightblue;
}
.hit {
  background-color: rgb(190, 62, 62);
}
.shot {
  background-color: rgb(223, 133, 16);
}
.shots {
  background-color: pink;
}
.row {
  margin-bottom: 0;
}
</style>