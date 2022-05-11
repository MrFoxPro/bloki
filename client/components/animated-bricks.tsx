import { mergeProps } from 'solid-js';
import s from './animated-bricks.module.scss';

type AnimatedBricksProps = {
    color1?: string;
    color2?: string;
    color3?: string;
};
export function AnimatedBricks(props: AnimatedBricksProps) {

    props = mergeProps({
        color1: '#FFC632',
        color2: '#FFA41B',
        color3: '#FF842B'
    }, props);

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="372" height="345" fill="none">
            <rect width="125" height="173.5" x="85" y="70" fill={props.color1} rx="7.6" transform="rotate(-34 85 70)" />
            <rect width="125" height="125" x="198" y="236" fill={props.color2} rx="7.6" transform="rotate(-34 197 236)" />
            <rect width="125" height="152" y="219" fill={props.color3} rx="7.6" transform="rotate(-34 0 219)" />
        </svg>
    );
}
