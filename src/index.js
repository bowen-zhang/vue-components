import DateSelector from './DateSelector.vue'
import PhotoSelector from './PhotoSelector.vue'

export { DateSelector, PhotoSelector }

export default {
  install(app) {
    app.component('DateSelector', DateSelector);
    app.component('PhotoSelector', PhotoSelector);
  }
}
