<template>
  <div class="container">
    <Header />

    <button v-if="logged" @click="newGame" class="btn btn-success">New Game</button>
    <br />
    <br />

    <div>
      <h2>Scores</h2>

      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Total Score</th>
            <th>Total Games</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Ties</th>
          </tr>
        </thead>
        <tr v-for="(score, index) in this.lb" :key="index">
          <td>
            <b>{{index+1}}</b>
          </td>
          <td>
            {{score.player}}
            <b>{{score.pseudo}}</b>
          </td>
          <td>{{score.total_score}}</td>
          <td>{{score.total_games}}</td>
          <td>{{score.wins}}</td>
          <td>{{score.losses}}</td>
          <td>{{score.ties}}</td>
        </tr>
      </table>
      <br />

      <div v-for="(game, index) in games" :key="index">
        <h2>Game {{game.game_id}}</h2>

        <button
          v-if="game.gamePlayers.length ==0 && logged"
          @click="join(game)"
          class="btn btn-warning"
        >Join</button>

        <div v-if="player">
          <div v-for="(item, index) in game.players_ids" :key="index">
            <span
              v-if="logged && player.id == item"
              class="btn btn-info"
              @click="goTo(game)"
            >Re-join</span>
            <button
              v-if="game.gamePlayers.length <2 && logged && player.id != item"
              @click="join(game)"
              class="btn btn-warning"
            >Join</button>
          </div>
        </div>

        <br />
        <span>Created:</span>
        {{game.created}}
        <br />
        <br />

        <h4>Lobby:</h4>

        <div>
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Game Player Id</th>
                <th>Name</th>
                <th>Username</th>
                <!-- <th>Email</th> -->
              </tr>

              <tr v-for="(gp, index) in game.gamePlayers" :key="index">
                <td>{{gp.gp_id}}</td>
                <td>{{gp.player.firstName}} {{gp.player.lastName}}</td>
                <td>{{gp.player.userName}}</td>
                <!-- <td>{{gp.player.email}}</td> -->
              </tr>
            </thead>
          </table>
        </div>

        <br />
        <br />
        <hr />
      </div>
    </div>
  </div>
</template>

<script>
import Header from "./login";
import { mapGetters } from "vuex";
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import api from "../back-end";
export default {
  components: { Header },
  props: ["gp_id"],
  data: () => {
    return {
      scores: [],
      lb: []
    };
  },
  computed: {
    ...mapGetters(["games", "logged", "player", "authorized", "newGp_id"])
    // logged() {
    //   this.connect;
    // }
  },
  methods: {
    newGame() {
      this.$store.dispatch("newGame");
      setTimeout(this.redirect, 1500);
      setTimeout(this.updateSocket, 600);
    },
    redirect() {
      this.$router.push({
        name: "Game View",
        params: { gp_id: this.newGp_id }
      });
    },
    join(data) {
      // console.log("join" + data);
      this.$store.dispatch("joinGame", data);
      setTimeout(this.redirect, 400);
    },
    goTo(game) {
      // console.log("rejoin", game);
      for (let i in game.gamePlayers) {
        if (this.player.id == game.gamePlayers[i].player.player_id) {
          this.$router.push({
            name: "Game View",
            params: { gp_id: game.gamePlayers[i].gp_id }
          });
        }
      }
    },

    getScores() {
      let allPlayers = [];
      for (let key in this.games) {
        for (let player in this.games[key].gamePlayers) {
          allPlayers.push({
            player_id: `${this.games[key].gamePlayers[player].player.player_id}`,
            name: `${this.games[key].gamePlayers[player].player.firstName} ${this.games[key].gamePlayers[player].player.lastName}`,
            pseudo: `${this.games[key].gamePlayers[player].player.userName}`,
            results: this.games[key].gamePlayers[player].player.all_results
          });
        }
      }
      let jsonObject = allPlayers.map(JSON.stringify);
      let uniqueSet = new Set(jsonObject);
      this.scores = Array.from(uniqueSet).map(JSON.parse);
      // console.log(this.scores);
      return this.scores;
    },
    start() {
      for (let obj in this.scores) {
        this.leaderBoard(this.scores[obj]);
      }
    },
    leaderBoard(player) {
      let totalScore = {
        player: null,
        pseudo: null,
        total_score: 0,
        total_games: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        ratio: 0,
        rank: 0
      };
      totalScore.player = player.name;
      totalScore.pseudo = player.pseudo;
      for (let score in player.results) {
        if (player.results[score] != null) {
          totalScore.total_score += player.results[score];
          totalScore.total_games += 1;
        }
        if (player.results[score] == 0) {
          totalScore.losses += 1;
        }
        if (player.results[score] == 1) {
          totalScore.wins += 1;
        }
        if (player.results[score] == 0.5) {
          totalScore.ties += 1;
        }
        if (player.results[score] == null) {
        }
        totalScore.ratio = totalScore.total_score / totalScore.total_games;
        if (!totalScore.ratio) {
          totalScore.ratio = 0;
        }
        if (totalScore.ratio == 0 && totalScore.total_games > 0) {
          totalScore.ratio -= 1;
        }
      }
      this.lb.push(totalScore);
      this.lb.sort((a, b) => (a.ratio < b.ratio ? 1 : -1));

      return this.lb;
    },
    updateSocket() {
      if (this.stompClient && this.stompClient.connected) {
        // check if the conexion has been established
        // Each time the player sends data (such as ships/or/salvoes) this code will run. This sends an empty string to the back end At the given game ID. The back end will send back an empty string. When the string is received we know that an upsate was made and a fetch will run to get the new data
        this.stompClient.send(`/app/games`, JSON.stringify(""), {});
      } else {
        // if connexion is not estsblished this will connect and send the message afterwards
        this.connect;
        setTimeout(
          this.stompClient.send(`/app/games`, JSON.stringify(""), {}),
          650
        );
      }
    },
    connect() {
      this.socket = new SockJS(`${api}/gs-guide-websocket`); // Emits connection with the back end at the given address
      // this.socket = new SockJS(`http://localhost:8080/gs-guide-websocket`);
      this.stompClient = Stomp.over(this.socket);
      this.$store.dispatch("getGames");
      this.stompClient.connect(
        {},
        response => {
          // Once the connection is established the code below will automatically run each time data is sent to the back-end.
          // this.stompClient.subscribe(
          //   `${api}/topic/${this.ships.game.game_id}`,
          this.stompClient.subscribe(`/topic/games`, action => {
            this.$store.dispatch("getGames");
            console.log("GAME SOCKET RUN");
          });
        },
        error => console.log(error)
      );
    }
  },
  created() {
    this.$store.dispatch("getGames");
    setTimeout(this.start, 400);
    setTimeout(this.getScores, 300);
    this.sync;

    setTimeout(this.connect, 600);
  }
};
</script>

<style>
</style>