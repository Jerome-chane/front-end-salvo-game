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

    connect(payload) {
      this.socket = new SockJS(`${api}/gs-guide-websocket`);
      this.stompClient = Stomp.over(this.socket);
      this.stompClient.connect(
        {},
        frame => {
          this.connected = true;
          // console.log("Frame:");
          console.log(frame);
          this.stompClient.subscribe(`/topic/${payload}`, tick => {
            // console.log("tick received:");
            console.log(tick);
            let newMessage = { message: JSON.parse(tick.body).content };
            this.messages.push(newMessage);
            // console.log("Now the messages array is:");
            console.log(this.messages);
            // this.enteredText = "";
          });
        },
        error => {
          console.log(error);
          this.connected = false;
        }
      );
    }
  },
  actions: {
    getGames({ commit }) {
      fetch(`${api}/api/games`, { credentials: "include" })
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

    login({ getters, commit, dispatch }) {
      let ourData = {
        email: getters.email,
        pwd: getters.password
      };

      fetch(`${api}/api/login`, {
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
            dispatch("getGames");
            commit("syncLogged", true);
          }
          console.log("Log status", getters.logged);
        })
        // .then(newData => {})
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
