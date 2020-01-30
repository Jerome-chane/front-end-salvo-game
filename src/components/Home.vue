<template>
  <div>
    <!-- <h1>Welcome to Battleship</h1> -->
    <Login></Login>
  </div>
</template>

<script>
import Login from "./login";
import { mapGetters } from "vuex";
export default {
  components: { Login },
  methods: {
    goToGames() {
      this.$router.push("games");
    },
    logout() {
      this.$store.dispatch("logout");
    }
  },
  computed: { ...mapGetters(["ships", "logged", "player", "ships"]) },
  created() {
    this.$store.dispatch("getGames");
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
