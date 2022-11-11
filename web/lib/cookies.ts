import Cookies from 'js-cookie'

export enum BlokiCookieKey {
   Theme = 'theme',
   Language = 'lang',
   Auth = 'auth',
}

export const BlokiCookies = Cookies.withAttributes({ sameSite: 'strict' })
