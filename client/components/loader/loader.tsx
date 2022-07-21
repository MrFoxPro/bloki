import './loader.scss';

type LoaderProps = {
   size: 'small' | 'medium' | 'large';
   center: boolean;
};
export function Loader(props: LoaderProps) {
   return <div class="loader" classList={{ [props.size]: true, center: props.center }}></div>;
}
