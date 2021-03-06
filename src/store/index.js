import Vue from "vue";
import Vuex from "vuex";
import VueRouter from "vue-router";
import api from "../back-end";
Vue.use(Vuex);
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import router from "../router";
export default new Vuex.Store({
  state: {
    player: null,
    games: "",
    ships: null,
    email: "",
    pwd: "",
    showLoginForm: false,
    logged: false,
    userAlreadyExist: false,
    authorized: null,
    newGp_id: "",
    gameId: null,

    shipsLocations: [
      { type: "Destroyer", locations: [] },
      { type: "Submarine", locations: [] },
      { type: "Patrol Boat", locations: [] },
      { type: "Pirogue", locations: [] },
      { type: "Titanic", locations: [] }
    ]
  },
  getters: {
    gameId: state => state.gameId,
    games: state => state.games,
    ships: state => state.ships,
    email: state => state.email,
    password: state => state.pwd,
    logged: state => state.logged,
    player: state => state.player,
    showLoginForm: state => state.showLoginForm,
    userAlreadyExist: state => state.userAlreadyExist,
    authorized: state => state.authorized,
    newGp_id: state => state.newGp_id,
    shipsLocations: state => state.shipsLocations
  },
  mutations: {
    setShipsLocations: (state, payload) => (state.shipsLocations = payload),
    setData: (state, payload) => {
      state.player = payload.player;
      state.games = payload.games;
    },
    setGameId: (state, payload) => (state.gameId = payload),
    setShipData: (state, payload) => (state.ships = payload),
    reset: state => (state.ships = null),
    syncEmail: (state, payload) => (state.email = payload),
    syncPwd: (state, payload) => (state.pwd = payload),
    setLoginForm: (state, payload) => (state.showLoginForm = payload),
    setUserAlreadyExist: (state, payload) => (state.userAlreadyExist = payload),
    setAuthorized: (state, payload) => (state.authorized = payload),
    setNewGp_id: (state, payload) => (state.newGp_id = payload),
    syncLogged: (state, payload) => {
      state.logged = payload;
      if (payload == false) {
        state.person = null;
      }
    }
  },
  actions: {
    redirect({}, payload) {
      router.push({ name: "Game View", params: { gp_id: payload } });
    },
    //////////////////////////////////////////// //////////////////////////////////////////// //////////////////////////////////////////// ////////////////////////////////////////////
    connect({ dispatch }) {
      this.socket = new SockJS(`${api}/gs-guide-websocket`); // Emits connection with the back end at the given address when user log in
      this.stompClient = Stomp.over(this.socket);
      this.stompClient.connect(
        {},
        () => {
          // Once the connection is established the code below will automatically run each time data is sent to the back-end.
          this.stompClient.subscribe(`/topic/games`, () => {
            // console.log("STORE GAME SOCKET RUN");
            dispatch("getGames");
          });
        },
        error => console.log(error)
      );
    },
    updateGameSocket() {
      if (this.stompClient && this.stompClient.connected) {
        // check if the conexion has been established
        // Each time the player sends data (such as ships/or/salvoes) this code will run. This sends an empty string to the back end At the given game ID. The back end will send back an empty string. When the string is received we know that an upsate was made and a fetch will run to get the new data
        // console.log("GAME SOCKET UPDATE");
        this.stompClient.send(`/app/games`, JSON.stringify(""), {});
      } else {
        // if connexion is not estsblished this will connect and send the message afterwards
        console.log("error, not connected");
      }
    },
    //////////////////////////////////////////// //////////////////////////////////////////// //////////////////////////////////////////// ////////////////////////////////////////////
    connectShips({ getters, dispatch }, payload) {
      this.socket = new SockJS(`${api}/gs-guide-websocket`); // Emits connection with the back end at the given address
      // this.socket = new SockJS(`http://localhost:8080/gs-guide-websocket`);
      this.stompClient = Stomp.over(this.socket);
      this.stompClient.connect(
        {},

        () => {
          // console.log("SOCKET RUN");
          // Once the connection is established the code below will automatically run each time data is sent to the back-end.
          this.stompClient.subscribe(`/topic/${getters.gameId}`, () => {
            dispatch("getShips", payload); // When the back end sends a response this will fetch the data
          });
        },
        error => console.log(error)
      );
    },
    updateShipsSocket({}, payload) {
      if (this.stompClient && this.stompClient.connected) {
        // check if the conexion has been established
        // Each time the player sends data (such as ships/or/salvoes) this code will run. This sends an empty string to the back end At the given game ID. The back end will send back an empty string. When the string is received we know that an upsate was made and a fetch will run to get the new data
        this.stompClient.send(
          `/app/${payload.game_id}`,
          JSON.stringify(""),
          {}
        );
      } else {
        // if connexion is not estsblished this will connect and send the message afterwards
        console.log("Error socket is not connected");
      }
    },
    //////////////////////////////////////////// //////////////////////////////////////////// //////////////////////////////////////////// ////////////////////////////////////////////

    getGames({ commit }) {
      fetch(`${api}/api/games`, { credentials: "include" })
        // fetch(`/api/games`, { credentials: "include" }) // use for local
        .then(data => data.json())
        .then(newData => {
          // console.log("newdata ", newData);
          commit("setData", newData);
          if (newData.player != null) {
            commit("syncLogged", true);
            // dispatch("connect");
          }
        })
        .catch(error => console.log(error));
    },
    getShips({ commit }, payload) {
      return new Promise((resolve, reject) => {
        return fetch(`${api}/api/game_view/${payload}`, {
          credentials: "include"
        })
          .then(data => {
            if (data.ok) {
              // console.log(data);
              commit("setAuthorized", true);
              return data.json();
            } else {
              commit("setAuthorized", false);
              reject(new Error("error"));
            }
          })
          .then(shipData => {
            commit("setShipData", shipData); // save the fetched data in store variable
            commit("setGameId", shipData.game.game_id);
            // console.log("shipsdata", shipData);
            try {
              return resolve({ status: "ok" });
            } catch {
              reject(new Error("error"));
            }
          })
          .catch(error => console.log(error));
      });
    },
    login({ getters, dispatch, commit }) {
      let ourData = {
        email: getters.email,
        pwd: getters.password
      };
      fetch(`${api}/api/login`, {
        // fetch(`api/login`, {
        // use for local
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        method: "POST",
        body: getBody(ourData)
      })
        .then(data => {
          if (data.status == 200) {
            commit("syncLogged", true);
          }
          // console.log("Log status", getters.logged);
        })
        .then(newData => {
          dispatch("getGames");
        })
        .catch(error => {
          console.log("Request failure:2 ", error);
        });
      function getBody(json) {
        var body = [];
        for (var key in json) {
          var encKey = encodeURIComponent(key);
          var encVal = encodeURIComponent(json[key]);
          body.push(encKey + "=" + encVal);
        }
        return body.join("&");
      }
    },
    logout({ commit, dispatch }) {
      fetch(`${api}/api/logout`, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        method: "POST",
        credentials: "include"
      })
        // fetch(`/api/logout`, { method: "POST", credentials: "include" }) // use for local
        .then(data => {
          // console.log("Log out Run", data);
          if (data.status == 200) {
            commit("syncLogged", false);
          }
        })
        .then(() => {
          dispatch("getGames");
        })
        .catch(error => console.log("Error ", error));
    },
    signUp({ commit, dispatch }, payload) {
      let ourData = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        userName: payload.userName,
        email: payload.email,
        password: payload.password
      };

      fetch(`${api}/api/signup`, {
        // fetch(`api/signup`, {
        // use for local
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        // body: getBody(ourData)
        body: JSON.stringify(ourData)
      })
        .then(newData => {
          // console.log("data sent: ", JSON.stringify(ourData));
          return newData.json();
        })
        .then(data => {
          if (data.hasOwnProperty("error")) {
            console.log(" error: ", data);
            commit("setUserAlreadyExist", true);
          } else {
            commit("setUserAlreadyExist", false);
            commit("syncEmail", ourData.email);
            commit("syncPwd", ourData.password);
            commit("setLoginForm", false);
            dispatch("login");
            // console.log(data);
          }
        })
        .catch(error => {
          console.log("Request failure: ", error);
        });
    },
    newGame({ dispatch, commit }) {
      fetch(`${api}/api/games`, {
        // fetch(`/api/games`, {
        // use for local
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      })
        .then(data => {
          if (data.hasOwnProperty("error")) {
            throw Error("Unable to create Game " + data);
          } else return data.json();
        })
        .then(newData => {
          console.log("json response", newData);
          dispatch("updateGameSocket"); // send a socket message to the back end to inform that an update was made
          commit("setNewGp_id", newData.new_game.gp_id);
          commit("setGameId", newData.new_game.game_id);
          // dispatch("getShips", newData.new_game.gp_id);
          dispatch("redirect", newData.new_game.gp_id); // rediect to the game view page
        })
        .catch(error => {
          console.log("Request failure: ", error);
        });
    },
    joinGame({ dispatch, commit }, payload) {
      // fetch(`/api/game/` + payload.game_id + `/players`, {
      // use for local
      commit("setGameId", payload.game_id);
      return new Promise((resolve, reject) => {
        return fetch(`${api}/api/game/${payload.game_id}/players`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          },
          method: "POST"
        })
          .then(data => {
            if (data.ok) {
              // console.log(data);
              return data.json();
            } else {
              reject(new Error("error"));
            }
          })
          .then(newData => {
            // console.log("Success ! ", newData);
            commit("setAuthorized", true);
            commit("setNewGp_id", newData.gp_id);
            dispatch("redirect", newData.gp_id);
            // try/catch
            try {
              return resolve({ game_id: payload.game_id, gp_id: newData });
            } catch {
              reject(new Error("error"));
            }
          })
          .catch(error => {
            console.log("Request failure: ", error);
          });
      });
    },
    addShips({ dispatch }, payload) {
      let ourData = payload.data;
      fetch(`${api}/games/players/${payload.id}/ships`, {
        // fetch(`/games/players/` + payload.id + `/ships`, {
        // use for local
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(ourData)
      })
        .then(newData => {
          // console.log(newData);
          return newData.json();
        })
        .then(data => {
          // console.log(data);
          // console.log("ships added");
          dispatch("updateShipsSocket", payload); // update socket after ships are added
          dispatch("getShips", payload.id); // fetch the new ships data
        })
        .catch(error => {
          console.log("Request failure: ", error);
        });
    },
    addSalvoes({ dispatch }, payload) {
      let ourData = payload.data;
      // console.log(JSON.stringify(ourData));
      // fetch(`/games/players/` + payload.id + `/salvos`, {
      // use for local
      fetch(`${api}/games/players/${payload.id}/salvos`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(ourData)
      })
        .then(newData => {
          // console.log(newData);
          return newData.json();
        })
        .then(data => {
          // console.log(data);
          dispatch("updateShipsSocket", payload);
          // dispatch("getShips", payload.id);
        })
        .catch(error => {
          console.log("Request failure: ", error);
        });
    }
  }
});
