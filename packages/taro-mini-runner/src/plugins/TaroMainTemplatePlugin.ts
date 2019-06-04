import * as NodeMainTemplatePlugin from 'webpack/lib/node/NodeMainTemplatePlugin'
import * as Template from 'webpack/lib/Template'

const PLUGIN_NAME = 'TaroMainTemplatePlugin'

export default class TaroMainTemplatePlugin {
  apply (mainTemplate) {
    new NodeMainTemplatePlugin({ 'asyncChunkLoading': false }).apply(mainTemplate)
    mainTemplate.hooks.bootstrap.tap(PLUGIN_NAME, (source, chunk, hash) => {
      return Template.asString([
        source,
        ``,
        `// install a JSONP callback for chunk loaded`,
        `function webpackJsonpCallback (chunkIds, moreModules, executeModules) { `,
          Template.indent([
            `for (var moduleId in moreModules) { `,
              Template.indent([
                `if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) { `,
                  Template.indent([
                    mainTemplate.renderAddModule(hash, chunk, "moduleId", "moreModules[moduleId]"),
                  ]),
                `}`,
              ]),
            `}`,
          ]),
          ``,
          Template.indent([
            `if (executeModules && executeModules.length) { `,
              Template.indent([
                `return ${mainTemplate.requireFn}(${mainTemplate.requireFn}.s = executeModules[0])`
              ]),
            `}`,
          ]),
        `}`,
      ])
    })

     mainTemplate.hooks.beforeStartup.tap(PLUGIN_NAME, source => {
      const jsonpFunction = mainTemplate.outputOptions.jsonpFunction
      return Template.asString([
        `var g = typeof window !== 'undefined' && window.Math === Math ? window : typeof global === 'object' ? global : this`,
        ``,
        `if (g) { `,
            Template.indent([`g[${JSON.stringify(jsonpFunction)}] = webpackJsonpCallback`]),
        `}`,
        source,
      ])
    })
  }
}
