import presets from "./presets.json"
import Model from "./model"
import View from "./view"
import Gui from "./gui"

export default class GenerativeGraphics {

  constructor(preset = "default", debug = false) {
    this.model = new Model(presets.remembered[preset][0])
    this.view = new View(this.model)

    if (debug) {
      const gui = new Gui(preset, this.model)
      gui.subscribeToModel()
      this.view.showStats()
    }
  }

  async start() {
    await this.view.init()
  }

  getModel() {
    return this.model
  }
}
