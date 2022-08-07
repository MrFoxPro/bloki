import Cookies from 'js-cookie'
export enum BlokiCookieKey {
   Theme = 'theme',
   Language = 'lang',
}

export const BlokiCookies = Cookies.withAttributes({ sameSite: 'strict' })
