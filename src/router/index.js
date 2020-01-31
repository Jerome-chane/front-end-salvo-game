import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../components/Home.vue";
import Games from "../components/games.vue";
import Ships from "../components/ships";
// import signup from "../components/signup.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: Games
  },
  {
    path: "/about",
    name: "about",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue")
  },
  // {
  //   path: "/games",
  //   name: "Games",
  //   component: Games
  // },
  // {
  //   path: "/ships",
  //   name: "Ships",
  //   component: Ships
  // },
  {
    path: "/game_view/:gp_id",
    name: "Game View",
    component: Ships,
    props: true
  }
  // {
  //   path: "/signup",
  //   name: "signup",
  //   component: signup
  // }
];

const router = new VueRouter({
  routes,
  mode: "history"
});

export default router;
