export default {
  mounted() {
    this.el.innerHTML = "This is rendered by a hook on mount."
  },

  updated() {
    this.el.innerHTML = "This is rendered by a hook on update."
  }
}