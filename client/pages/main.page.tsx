import s from '@/styles';
import { useNavigate } from 'solid-app-router';
import LogoTitle from '@/assets/images/logo-title.svg';
import { createSignal, onCleanup } from 'solid-js';
import { AnimatedBricks } from '@/components/animated-bricks';
import { langs } from '@/modules/i18n/i18n.module';

const t = langs({
    ru: {
        go: 'Начать',
    },
    en: {
        go: 'Explore'
    }
});

// TODO: Landing
export function MainPage() {
    const navigate = useNavigate();
    const [icon, setIcon] = createSignal();
    async function change() {
    }
    change();

    const interval = setInterval(change, 800);
    onCleanup(() => clearInterval(interval));

    return (
        <main
            class={s.page}
            style={{
                'background-color': '#292B2E',
                'display': 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                'justify-content': 'center',
                'gap': '45px',
            }}>
            <div
                style={{
                    'display': 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'gap': '45px',
                }}>
                <AnimatedBricks />
                {/* {icon()} */}
                <LogoTitle />
            </div>
            <a
                href='/welcome'
                id='gotowelcome'
                style={{
                    color: 'white'
                }}>
                {t().go}
            </a>
        </main >
    );
};
export default MainPage;
