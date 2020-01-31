import Vue from "vue";
import Vuex from "vuex";
import VueRouter from "vue-router";
import api from "../back-end";
Vue.use(Vuex);
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
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
    authorized: false,
    newGp_id: "",
    shipsLocations: [
      { type: "Destroyer", locations: [] },
      { type: "Submarine", locations: [] },
      { type: "Patrol Boat", locations: [] },
      { type: "Pirogue", locations: [] },
      { type: "Titanic", locations: [] }
    ]
  },
  getters: {
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
    },
    connect() {
      this.socket = new SockJS(`${api}/gs-guide-websocket`); // Emits connection with the back end at the given address when user log in
      this.stompClient = Stomp.over(this.socket);
      this.$store.dispatch("getGames");
      this.stompClient.connect(
        {},
        response => {
          // Once the connection is established the code below will automatically run each time data is sent to the back-end.
          this.stompClient.subscribe(`/topic/games`, action => {
            this.$store.dispatch("getGames");
            console.log("GAME SOCKET RUN");
          });
        },
        error => console.log(error)
      );
    }
  },
  actions: {
    getGames({ commit }) {
      fetch(`${api}/api/games`, { credentials: "include" })
        // fetch(`/api/games`, { credentials: "include" }) // use for local
        .then(data => data.json())
        .then(newData => {
          console.log("newdata ", newData);
          commit("setData", newData);
          if (newData.player) {
            commit("syncLogged", true);
          }
        })
        .catch(error => console.log(error));
    },
    getShips({ commit }, payload) {
      // fetch(`/api/game_view/${payload}`, { credentials: "include" }) // use for local
      fetch(`${api}/api/game_view/${payload}`, { credentials: "include" })
        .then(data => {
          // console.log(data);
          if (data.ok != true) {
            commit("setAuthorized", false);
            throw Error("UNAUTHORIZED ", data.status);
          } else {
            commit("setAuthorized", true);
            return data.json();
          }
        })
        .then(shipData => {
          commit("setShipData", shipData);
          console.log("shipsdata", shipData);
        })
        .catch(error => console.log(error));
    },

    login({ getters, commit }) {
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
          console.log("Request response: ", data);
          if (data.status == 200) {
            commit("syncLogged", true);
          }

          console.log("Log status", getters.logged);
        })
        .then(newData => {
          // commit("connect");
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

    logout({ commit }) {
      fetch(`${api}/api/logout`, { method: "POST", credentials: "include" })
        // fetch(`/api/logout`, { method: "POST", credentials: "include" }) // use for local
        .then(data => {
          // console.log("Log out Succesful ", data);
          if (data.status == 200) {
            commit("syncLogged", false);
          }
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
            console.log(data);
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
          dispatch("getGames");
          commit("setNewGp_id", newData.gp_id);
          dispatch("getShips", newData.gp_id);
        })
        .catch(error => {
          console.log("Request failure: ", error);
        });
    },
    joinGame({ dispatch, commit }, payload) {
      // fetch(`/api/game/` + payload.game_id + `/players`, {
      // use for local
      fetch(`${api}/api/game/` + payload.game_id + `/players`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      })
        .then(data => {
          console.log(data);
          return data.json();
        })
        .then(newData => {
          console.log(newData);
          console.log("Success ! ", newData);
          dispatch("getGames");
          commit("setNewGp_id", newData.gp_id);
          commit("setAuthorized", true);
        })
        .catch(error => {
          console.log("Request failure: ", error);
        });
    },
    addShips({}, payload) {
      let ourData = payload.data;
      fetch(`${api}/games/players/` + payload.id + `/ships`, {
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
          console.log(data);
        })
        .catch(error => {
          console.log("Request failure: ", error);
        });
    },
    addSalvoes({}, payload) {
      let ourData = payload.data;
      // console.log(JSON.stringify(ourData));
      // fetch(`/games/players/` + payload.id + `/salvos`, {
      // use for local
      fetch(`${api}/games/players/` + payload.id + `/salvos`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST",

        body: JSON.stringify(ourData)
      })
        .then(newData => {
          console.log(newData);
          return newData.json();
        })
        .then(data => {
          console.log(data);
        })
        .catch(error => {
          console.log("Request failure: ", error);
        });
    }
  },
  modules: {}
});
