import { langs } from '@/modules/i18n/i18n'
import toast from 'solid-toast'

export function reportBlokiError(e: any) {
   console.error(e)
   toast.error(t().error_happened(e || 'Unknown'))
}
const t = langs({
   en: {
      error_happened: (comp) => `Error was happened in ${comp}, check console`,
   },
})
