<template>
  <div class="container">
    <!-- @dragover.prevent @drop.prevent="dropp"> -->
    <div :id="id" class="harbor">
      <slot>
        <Boat id="patrol_boat" draggable="true" name="Patrol Boat" data="1">
          <span>B1</span>
        </Boat>
        <Boat id="submarine" draggable="true" name="Submarine" data="2">
          <span>B2</span>
        </Boat>
        <Boat id="destroyer" draggable="true" name="Destroyer" data="3">
          <span>B3</span>
        </Boat>
        <Boat id="pirogue" draggable="true" name="Pirogue" data="4">
          <span>B4</span>
        </Boat>
        <Boat id="titanic" draggable="true" name="Titanic" data="6">
          <span>B5</span>
        </Boat>
      </slot>
    </div>
  </div>
</template>

<script>
import Boat from "../components/boat";
export default {
  components: {
    Boat
  },
  props: ["id", "name", "value"],
  methods: {
    dropp: e => {
      let boat_id = e.dataTransfer.getData("boat_id");
      let boat = document.getElementById(boat_id);
      boat.style.display = "block";
      e.target.appendChild(boat);
    }
  }
};
</script>

<style scoped>
.harbor {
  /* border: solid 1px black; */
  display: flex;
  justify-content: space-evenly;
  height: 50px;
  /* margin-top: -50px; */
}
</style>