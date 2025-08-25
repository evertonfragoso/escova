import { I18n } from 'i18n-js'
// import ptBR from 'i18n-js/json/pt-BR.json' with { type: 'json' }
// import en from 'i18n-js/json/en.json' with { type: 'json' }
import ptBR from '#locales/pt-br.json' with { type: 'json' }
import en from '#locales/en.json' with { type: 'json' }

const i18n = new I18n({ ...ptBR, ...en, })
i18n.defaultLocale = 'pt-BR'

export default class Locales {
    constructor(locale = 'pt-BR') {
        this.locale(locale)
    }

    /**
     * @param {string} text
     * @param {object} data
     * @returns string
     */
    translate(text, data = undefined) { return i18n.t(text, data) }

    /**
     * @param {string} locale
     */
    locale(locale) { i18n.locale = locale }
}
