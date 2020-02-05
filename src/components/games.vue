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

      <div v-if="games.length ==0" class="lds-roller">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <br />
      <p v-if="games.length ==0" class="alert alert-secondary">Please wait while the magic happen...</p>
      <br />
      <br />
      <div class="container2">
        <table class="table">
          <thead>
            <tr>
              <th>Game</th>
              <th>Players</th>
              <th>Status</th>
            </tr>
          </thead>
          <tr v-for="(game, index) in games" :key="index">
            <td>Game {{game.game_id}}</td>
            <td>
              <span v-for="(gp, index) in game.gamePlayers" :key="index">
                <span>
                  {{gp.player.firstName}} {{gp.player.lastName}}
                  <br />
                </span>
              </span>
              <br />
            </td>
            <td>
              <p v-if="game.status && game.gamePlayers.length !=0">{{game.status}}</p>
              <button
                v-if="game.gamePlayers.length ==0 && logged"
                @click="join(game)"
                class="btn btn-warning"
              >Join</button>
              <span v-if="player">
                <span v-for="(item, index) in game.players_ids" :key="index">
                  <span v-if=" logged && player.id == item">
                    <span
                      v-if=" game.status == 'Victory!' || game.status == 'You Lost!' || game.status == 'Draw!'"
                      class="btn btn-success"
                      @click="goTo(game)"
                    >View</span>

                    <span
                      v-if=" game.status == 'Shoot!' || game.status == 'Place your Ships' || game.status == 'Waiting for player to join..' || game.status == 'Waiting for Opponent to Place ships..' "
                      class="btn btn-info"
                      @click="goTo(game)"
                    >Re-join</span>
                  </span>

                  <button
                    v-if="game.gamePlayers.length <2 && logged && player.id != item"
                    @click="join(game)"
                    class="btn btn-warning"
                  >Join</button>
                </span>
              </span>
            </td>
          </tr>
        </table>
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
    ...mapGetters([
      "games",
      "logged",
      "player",
      "authorized",
      "newGp_id",
      "ships"
    ])
  },
  watch: {
    games() {
      if (this.scores.length == 0 && this.lb.length == 0) {
        this.getScores();
        setTimeout(this.start(), 200);
      }
    },
    logged() {
      if (this.logged == true) {
        console.log("GAMES WATCH CONNECT SOCKET");

        this.$store.dispatch("connect");
      }
    }
  },
  methods: {
    newGame() {
      this.$store.dispatch("newGame");
    },

    join(data) {
      this.$store.dispatch("joinGame", data);
    },
    goTo(game) {
      // console.log("rejoin", game);
      for (let i in game.gamePlayers) {
        if (this.player.id == game.gamePlayers[i].player.player_id) {
          this.$router.push({
            name: "Game View",
            params: { gp_id: game.gamePlayers[i].gp_id }
          });
          this.$store.commit("setGameId", game.game_id);
        }
      }
    },
    getScores() {
      this.scores = [];
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
      let jsonObject = allPlayers.map(JSON.stringify); // loop in all the players
      let uniqueSet = new Set(jsonObject); // create a new Set
      this.scores = Array.from(uniqueSet).map(JSON.parse); // Add all uniquep players to the new Set
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
      // },
      // updateSocket() {
      //   if (this.stompClient && this.stompClient.connected) {
      //     // check if the conexion has been established
      //     // Each time the player sends data (such as ships/or/salvoes) this code will run. This sends an empty string to the back end At the given game ID. The back end will send back an empty string. When the string is received we know that an upsate was made and a fetch will run to get the new data
      //     this.stompClient.send(`/app/games`, JSON.stringify(""), {});
      //   } else {
      //     // if connexion is not estsblished this will connect and send the message afterwards
      //     this.connect;
      //     setTimeout(
      //       this.stompClient.send(`/app/games`, JSON.stringify(""), {}),
      //       650
      //     );
      //   }
      // },
      // connect() {
      //   this.socket = new SockJS(`${api}/gs-guide-websocket`); // Emits connection with the back end at the given address
      //   // this.socket = new SockJS(`http://localhost:8080/gs-guide-websocket`);
      //   this.stompClient = Stomp.over(this.socket);
      //   this.$store.dispatch("getGames");
      //   this.stompClient.connect(
      //     {},
      //     response => {
      //       // Once the connection is established the code below will automatically run each time data is sent to the back-end.
      //       // this.stompClient.subscribe(
      //       //   `${api}/topic/${this.ships.game.game_id}`,
      //       this.stompClient.subscribe(`/topic/games`, action => {
      //         this.$store.dispatch("getGames");
      //         console.log("GAME SOCKET RUN");
      //       });
      //     },
      //     error => console.log(error)
      //   );
      // }
    }
  },
  created() {
    this.$store.dispatch("getGames");
  }
};
</script>

<style>
.container2 {
  margin-left: 7%;
  margin-right: 7%;
}
.lds-roller {
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;
}
.lds-roller div {
  animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
  transform-origin: 40px 40px;
}
.lds-roller div:after {
  content: " ";
  display: block;
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgb(2, 1, 1);
  margin: -4px 0 0 -4px;
}
.lds-roller div:nth-child(1) {
  animation-delay: -0.036s;
}
.lds-roller div:nth-child(1):after {
  top: 63px;
  left: 63px;
}
.lds-roller div:nth-child(2) {
  animation-delay: -0.072s;
}
.lds-roller div:nth-child(2):after {
  top: 68px;
  left: 56px;
}
.lds-roller div:nth-child(3) {
  animation-delay: -0.108s;
}
.lds-roller div:nth-child(3):after {
  top: 71px;
  left: 48px;
}
.lds-roller div:nth-child(4) {
  animation-delay: -0.144s;
}
.lds-roller div:nth-child(4):after {
  top: 72px;
  left: 40px;
}
.lds-roller div:nth-child(5) {
  animation-delay: -0.18s;
}
.lds-roller div:nth-child(5):after {
  top: 71px;
  left: 32px;
}
.lds-roller div:nth-child(6) {
  animation-delay: -0.216s;
}
.lds-roller div:nth-child(6):after {
  top: 68px;
  left: 24px;
}
.lds-roller div:nth-child(7) {
  animation-delay: -0.252s;
}
.lds-roller div:nth-child(7):after {
  top: 63px;
  left: 17px;
}
.lds-roller div:nth-child(8) {
  animation-delay: -0.288s;
}
.lds-roller div:nth-child(8):after {
  top: 56px;
  left: 12px;
}
@keyframes lds-roller {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>