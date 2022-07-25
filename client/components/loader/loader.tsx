import './loader.scss';
import { mergeProps } from 'solid-js';
import LoaderWebmVideo from './loader.webm';

type LoaderProps = {
   size: 'small' | 'medium' | 'large';
   center: boolean;
};
export function Loader(props: LoaderProps) {
   props = mergeProps(props, {
      size: 'small'
   });
   return (
      <div class="loader" classList={{ [props.size]: true, center: props.center }}>
         <video muted loop autoplay playsinline>
            <source src={LoaderWebmVideo} type="video/webm" />
         </video>
         <span>Loading...</span>
      </div>
   );
}
