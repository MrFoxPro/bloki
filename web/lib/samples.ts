export type BlokiDocument = {
   id: string
   shared: boolean
   title: string
   blobUrl: string
   layout: any[]
   gridOptions: {
      gap: number
      size: number
      width: number
      height: number
      flowWidth: number
   }
   showGrid: boolean
   showResizeAreas: boolean
}
export const sampleDoc: BlokiDocument = {
   id: '1781f9ec-c470-47a5-922a-de9db7da6b85',
   shared: false,
   title: 'Example',
   blobUrl: '/static/blobs/1781f9ec-c470-47a5-922a-de9db7da6b85.png',
   layout: [],
   gridOptions: {
      gap: 4,
      size: 16,
      width: 80,
      height: 150,
      flowWidth: 26,
   },
   showGrid: false,
   showResizeAreas: false,
}
export const landingDoc: BlokiDocument = {
   id: '1781f9ec-c470-47a5-922a-de9db7da6b85',
   shared: false,
   title: 'Example',
   blobUrl: '/static/blobs/1781f9ec-c470-47a5-922a-de9db7da6b85.png',
   layout: [],
   gridOptions: {
      gap: 4,
      size: 16,
      width: 80,
      height: 150,
      flowWidth: 26,
   },
   showGrid: true,
   showResizeAreas: false,
}
