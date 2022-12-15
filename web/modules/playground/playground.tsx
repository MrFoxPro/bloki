// import { css } from 'solid-styled-components'
import { css } from '@linaria/core'

export default function Playground() {
	const VARS = {
		main: () => 'red',
		secondary: 'green',
		test: 'orange',
	} as const

	const t = (props) => {
		console.log('hi!')
		return props.children
	}
	return (
		<main>
			<t ru>Hello</t>
			<t en>Hello</t>
		</main>
	)
}
