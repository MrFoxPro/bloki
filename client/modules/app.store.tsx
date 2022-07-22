import { createContext, ParentProps, useContext } from 'solid-js';
import { createStore, SetStoreFunction } from 'solid-js/store';
// import { IApiProvider } from "../lib/api-providers/api-provider.interface";
// import Cookie from 'js-cookie';
// import { gqlClient } from '@/lib/client';
// import { BlokiDocument, GridRenderMethod } from '@/lib/schema.auto';
import { Theme } from './theme.store';
import { Lang } from './i18n/i18n.module';
import { BlokiNetworkDocument } from '@/lib/network.types';

export type AppStoreValues = {
   settings: {
      locale: Lang;
      theme: string;
   };
   selectedDocument: BlokiNetworkDocument;
};

type AppStoreHandlers = {
   setAppStore: SetStoreFunction<AppStoreValues>;
};

const sampleDoc = {
   id: '1781f9ec-c470-47a5-922a-de9db7da6b85',
   shared: false,
   title: 'Example',
   blobUrl: '/static/blobs/1781f9ec-c470-47a5-922a-de9db7da6b85.png',
   layout: [
      {
         type: 5,
         value: 'Look at work, not our faces.',
         fontFamily: 'Inter',
         height: 2,
         width: 26,
         x: 27,
         y: 34,
         id: '4cafb142-9434-4e06-8e58-d0f50a7782aa'
      },
      {
         type: 2,
         value: 'The pandemic didn’t catalyze a new superior way of working, but instead threw us all into a murky unknown territory we weren’t prepared for. In the rush to find a “new normal” while trying to hold on to the old way of working, companies simply shifted in-person work dynamics to Zoom calls, making offices of our homes and requiring us to sit in front of a camera for eight hours a day. And that tore us down.',
         fontFamily: 'Inter',
         height: 7,
         width: 26,
         x: 27,
         y: 18,
         id: '3a217597-ee39-4bf4-9bba-fbe1b6a83985'
      },
      {
         type: 2,
         value: 'For designers, this shift has had a major impact on how we collaborate. Relying on meetings is problematic because meetings are linear, while collaboration is, in many ways, spatial. ',
         fontFamily: 'Inter',
         height: 3,
         width: 26,
         x: 27,
         y: 26,
         id: 'd7b58061-bdab-4e4b-93c0-b2eef90388f0'
      },
      {
         type: 2,
         value: 'We need a space for making, not for talking about making.',
         fontFamily: 'Inter',
         height: 1,
         width: 26,
         x: 27,
         y: 30,
         id: '829270af-2e9f-4577-b654-bb5a7cb4bd6e'
      },
      {
         type: 2,
         value: 'Collaboration is crucial to UX; after all, our users will never interact with our static artboards or UI prototypes. The common practice of jumping straight into Figma, Google Docs, and other tools after we end our calls is a hint that we should put our work (not our faces) at the center of our screen.',
         fontFamily: 'Inter',
         height: 5,
         width: 26,
         x: 27,
         y: 36,
         id: 'd40b0a9d-576a-4989-af66-e97dc3b4e5fa'
      },
      {
         type: 5,
         value: 'Not a one-space-fits-all.',
         fontFamily: 'Inter',
         height: 2,
         width: 26,
         x: 27,
         y: 43,
         id: '26f83194-a2e0-4a41-b934-8b4c4ae215bf'
      },
      {
         type: 2,
         value: 'As in our houses we need different spaces for different activities, at work we need different spaces for different tasks. And like a house, work at times can feel like a messy closet (that long Slack thread) or a labyrinth of drawers (all those folders on Google Drive).',
         fontFamily: 'Inter',
         height: 4,
         width: 26,
         x: 27,
         y: 45,
         id: 'e2926f94-71a4-4861-b13a-b555e2ab5f3a'
      },
      {
         type: 5,
         value: 'Don’t try to copy old models.',
         fontFamily: 'Inter',
         height: 2,
         width: 26,
         x: 27,
         y: 51,
         id: '43be6f72-88ca-4fae-b1e0-2e82ac0007b2'
      },
      {
         type: 2,
         value: 'Let’s take this opportunity to rethink how we can work together in a way that fits everyone’s needs — whether over voice notes or words, in real-time or asynchronously. We can do a better job working towards inclusivity in our workspaces, instead of replicating the old office space in a virtual dimension.',
         fontFamily: 'Inter',
         height: 5,
         width: 26,
         x: 27,
         y: 53,
         id: '59cf322b-7887-41d4-9aa0-3a9a5b28323d'
      },
      {
         type: 5,
         value: 'That Zoom call could have been a Figjam.',
         fontFamily: 'Inter',
         height: 2,
         width: 26,
         x: 27,
         y: 72,
         id: 'caefbe5f-906a-4d1d-b9f3-86ba30be65c8'
      },
      {
         type: 2,
         value: 'With Figjam, Miro, Freehand, and other whiteboard tools, we designers have finally invited product managers into our world.',
         fontFamily: 'Inter',
         height: 2,
         width: 26,
         x: 27,
         y: 74,
         id: '3fd47383-ac11-46ed-a9a4-66712c59a8e1'
      },
      {
         type: 5,
         value: 'Audio everywhere.',
         fontFamily: 'Inter',
         height: 2,
         width: 26,
         x: 27,
         y: 78,
         id: 'acdf4338-a235-47c6-bd35-791c7e40aaa3'
      },
      {
         type: 2,
         value: 'Many of the tools we use every day are making audio chat accessible in one click. Audio creates the feeling of being together without the pressure of looking good on camera.\n',
         fontFamily: 'Inter',
         height: 3,
         width: 26,
         x: 27,
         y: 80,
         id: 'ebe45048-5092-4b4c-b6a0-4934d8966861'
      },
      {
         type: 5,
         value: 'New etiquette.',
         fontFamily: 'Inter',
         height: 2,
         width: 26,
         x: 27,
         y: 85,
         id: 'd0832297-4135-4bbb-868c-f736a50f2dab'
      },
      {
         type: 2,
         value: 'You can’t cross someone else’s cursor in a design file without saying hello or doing a little cursor dance. Come on, don’t be rude.',
         fontFamily: 'Inter',
         height: 2,
         width: 26,
         x: 27,
         y: 87,
         id: '5a1dc0cd-6dbf-46c2-bea3-73f85e73150c'
      }
   ],
   layoutOptions: {
      fGridWidth: 80,
      fGridHeight: 150,
      mGridHeight: 150,
      mGridWidth: 26,
      gap: 4,
      size: 16,
      blockMinSize: {
         width: 1,
         height: 1
      },
      blockMaxSize: {
         width: 45,
         height: 45
      },
      showGridGradient: false,
      showResizeAreas: false
   }
};

const AppStore = createContext<[AppStoreValues, AppStoreHandlers]>([
   {
      settings: {
         locale: 'en',
         theme: Theme.Light
      },
      selectedDocument: sampleDoc
   },
   {
      setAppStore: () => void 0
   }
]);

type AppStoreProps = ParentProps;

export function AppStoreProvider(props: AppStoreProps) {
   const [state, setAppStore] = createStore<AppStoreValues>(AppStore.defaultValue[0]);
   return <AppStore.Provider value={[state, { setAppStore }]}>{props.children}</AppStore.Provider>;
}

export const useAppStore = () => useContext(AppStore);
