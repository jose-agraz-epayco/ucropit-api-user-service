import MomentHandlebars from 'helper-moment'
import helpers from 'handlebars-helpers'

export const setScriptPdf = (handlebars) => {
  handlebars.registerHelper('moment', MomentHandlebars)
  handlebars.registerHelper(helpers.string())
  handlebars.registerHelper(helpers.comparison())
  handlebars.registerHelper(helpers.array())
  handlebars.registerHelper('switch', function (value, options) {
    this.switch_value = value
    this.switch_break = false
    return options.fn(this)
  })
  handlebars.registerHelper('case', function (value, options) {
    if (value === this.switch_value) {
      this.switch_break = true
      return options.fn(this)
    }
  })
  handlebars.registerHelper('default', function (value, options) {
    if (this.switch_break === false) {
      return options.fn(this)
    }
  })

  handlebars.registerHelper('ifCond', function (value, list, options) {
    const activities = list.split(',')
    if (activities.includes(value)) {
      return options.fn(this)
    } else {
      options.inverse(this)
    }
    return handlebars
  })

  handlebars.registerHelper('isDistinct', (value1, value2) => {
    return value1 !== value2
  })

  return handlebars
}
