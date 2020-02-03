<template>
  <div>
    <div
      @click="turn"
      :id="id"
      class="boat"
      :name="name"
      :data="data"
      :draggable="draggable"
      @dragstart="dragStart"
      @dragover.stop
    >
      <slot />
    </div>
    <!-- <select v-model="position" @change="turn">
      <option value="vertical">Vertical</option>
      <option value="horizontal">Horizontal</option>
    </select>-->
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: ["id", "draggable", "name", "value", "data"],
  computed: {
    ...mapGetters(["shipsLocations"])
  },
  data() {
    return {
      position: "horizontal",
      locations: [
        { type: "Destroyer", locations: [] },
        { type: "Submarine", locations: [] },
        { type: "Patrol Boat", locations: [] },
        { type: "Pirogue", locations: [] },
        { type: "Titanic", locations: [] }
      ],
      letters: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
      turneable: true
      // add ship variable and update from here when turning and see id the chsnges are possible from here. Updaste fimnal data before sending
    };
  },
  methods: {
    turn() {
      if (this.position == "vertical") {
        this.position = "horizontal";
      } else {
        this.position = "vertical";
      }
      // console.log("current item pos: "); to implement: check the boat current coordinates and turn if possible
      let currentPos = [];
      this.turneable = true;
      if (this.name == "Patrol Boat") {
        currentPos = this.shipsLocations[2].locations;
      }
      if (this.name == "Submarine") {
        currentPos = this.shipsLocations[1].locations;
      }
      if (this.name == "Destroyer") {
        currentPos = this.shipsLocations[0].locations;
      }
      if (this.name == "Pirogue") {
        currentPos = this.shipsLocations[3].locations;
      }
      if (this.name == "Titanic") {
        currentPos = this.shipsLocations[4].locations;
      }

      if (currentPos.length == 0) {
        if (this.position == "vertical") {
          document
            .getElementById(this.id)
            .setAttribute("class", `${this.id}_vertical`);
        } else {
          document
            .getElementById(this.id)
            .setAttribute("class", `${this.id}_horizontal`);
        }
      } else {
        let temp = currentPos[0].split("");
        let letter = temp[0];
        let number = temp[1];
        if (temp.length == 3) {
          number = 10;
        }
        let newPos = [];
        // console.log("current pos is: ", currentPos);
        // -----------------------------------------------------------------------
        if (this.position == "horizontal") {
          // returns newPos = to an array of positions if the ship is able to te turned
          let maxNum = Number(number) + Number(this.data);
          if (maxNum > 10) {
            this.position = "vertical";
            this.turneable = false;
          } else {
            for (let e = 0; e <= this.data; e++) {
              // let temp = [letter.toUpperCase()];
              let temp = [letter];
              let newNumber = Number(number) + e;
              temp.push(newNumber.toString());
              let tempPos = temp.join("");
              newPos.push(tempPos);
            }
            // console.log("New horizontal pos: ", newPos);
          }
          //-----------------------------------------------------------------------------------
        } else if (this.position == "vertical") {
          // returns newPos = to an array of positions if the ship is able to te turned
          let indexOfLetter = this.letters.indexOf(letter);
          let maxIndex = Number(this.data) + indexOfLetter;
          if (maxIndex > 9) {
            this.position = "horizontal";
            this.turneable = false;
            // console.log("Unable to turn ship");
          } else {
            for (let i = 0; i <= this.data; i++) {
              let temp = [];
              let newIndex = indexOfLetter + i;
              // temp.push(this.letters[newIndex].toUpperCase());
              temp.push(this.letters[newIndex]);
              temp.push(number);
              let tempPos = temp.join("");
              newPos.push(tempPos);
            }
            // console.log("New vertical pos: ", newPos);
          }
        }
        let allLocs = [];
        this.shipsLocations.forEach(ship => {
          if (this.name != ship.type) {
            ship.locations.forEach(e => allLocs.push(e));
          }
        });

        let duplicate = allLocs.filter(loc => {
          let found = false;
          newPos.forEach(np => {
            if (np == loc) {
              found = true;
            }
          });
          return found;
        });

        let list = duplicate.join(",");
        // console.log("duplicates: ", list);
        // console.log("turneable: ", this.turneable);
        if (list.length != 0) {
          if (this.position == "vertical") {
            this.position = "horizontal";
          } else this.position = "vertical";
        }
        if (list.length == 0 && this.turneable) {
          if (this.name == "Patrol Boat") {
            this.locations[2].locations = newPos;
          }
          if (this.name == "Submarine") {
            this.locations[1].locations = newPos;
          }
          if (this.name == "Destroyer") {
            this.locations[0].locations = newPos;
          }
          if (this.name == "Pirogue") {
            this.locations[3].locations = newPos;
          }
          if (this.name == "Titanic") {
            this.locations[4].locations = newPos;
          }

          if (this.position == "horizontal") {
            document
              .getElementById(this.id)
              .setAttribute("class", `${this.id}_horizontal`);
          }
          if (this.position == "vertical") {
            document
              .getElementById(this.id)
              .setAttribute("class", `${this.id}_vertical`);
          }
          this.$store.commit("setShipsLocations", this.locations);
        }
      }
    },

    dragStart(e) {
      let target = e.target;
      e.dataTransfer.setData("boat_id", target.id);
      e.dataTransfer.setData("position", this.position);
      e.dataTransfer.setData("name", this.name);
      e.dataTransfer.setData("length", this.data);
    }
  },
  created() {
    setTimeout(this.turn, 20);
    this.locations = this.shipsLocations;
  }
};
</script>

<style>
.pirogue_horizontal {
  background-color: rgb(201, 59, 165);
  height: 40px !important;
  width: 200px !important;
  z-index: 1 !important;
}
.pirogue_vertical {
  background-color: rgb(201, 59, 165);
  height: 200px !important;
  width: 40px !important;
  z-index: 1 !important;
}
.titanic_horizontal {
  background-color: rgb(113, 59, 201);
  height: 40px !important;
  width: 240px !important;
  z-index: 1 !important;
}
.titanic_vertical {
  background-color: rgb(113, 59, 201);
  height: 240px !important;
  width: 40px !important;
  z-index: 1 !important;
}

.patrol_boat_horizontal {
  background-color: rgb(201, 144, 59);
  height: 40px !important;
  width: 80px !important;
  z-index: 1 !important;
}
.patrol_boat_vertical {
  background-color: rgb(201, 144, 59);
  height: 80px !important;
  width: 40px !important;
  z-index: 1 !important;
}

.submarine_horizontal {
  background-color: rgb(71, 71, 221);
  height: 40px !important;
  width: 120px !important;
}
.submarine_vertical {
  background-color: rgb(71, 71, 221);
  height: 120px !important;
  width: 40px !important;
}

.destroyer_horizontal {
  background-color: rgb(211, 48, 48);
  height: 40px !important;
  width: 160px !important;
}
.destroyer_vertical {
  background-color: rgb(211, 48, 48);
  height: 160px !important;
  width: 40px !important;
}
</style>