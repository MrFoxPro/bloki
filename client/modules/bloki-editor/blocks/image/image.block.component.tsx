import { batch, ComponentProps, createComputed, createEffect, Match, on, splitProps, Switch } from 'solid-js';
import { Dimension, ImageBlock as ImageBlockEntity } from '@/modules/bloki-editor/types/blocks';
import s from './image.block.module.scss';
import { useBlockStore } from '../block.store';
import { useI18n } from '@solid-primitives/i18n';
import { useEditorStore } from '../../editor.store';
import { getImageOrFallback, getImgDimension, readAsDataUrl } from '../../helpers';
import throttle from 'lodash.throttle';
import cc from 'classcat';
import { WSMsgType } from '@/lib/network.types';
import { unwrap } from 'solid-js/store';

type ImageBlockProps = {
} & ComponentProps<'img'>;

export function ImageBlock(props: ImageBlockProps) {
	const [t] = useI18n();
	const [local, other] = splitProps(props, []);

	const [, { gridSize, send }] = useEditorStore();
	const [, { shadowed, block, isMeResizing, isMeDragging, blockData, isMeEditingByRoommate }] = useBlockStore<ImageBlockEntity>();

	if (shadowed) {
		return (
			<div class={cc([s.shadowed, s.imgBlock])}>
				<Switch>
					<Match when={block.value}>
						<img
							src={block.value}
							{...other}
						/>
					</Match>
					<Match when={!block.value}>
						<div class={s.mock}>
							<div class={s.dnd}>
								<div class={s.pic} />
								<div class={s.ask}>{t('blocks.attachments.image.mock.ask')}</div>
								<div class={s.orDrop}>{t('blocks.attachments.image.mock.or-drag')}</div>
							</div>
							<div class={s.inputBlock}>
								<div class={s.name}>
									{t('blocks.attachments.image.mock.or-link')}
								</div>
								<input
									type="url"
									class={s.link}
									placeholder={"https://cstor.nn2.ru/forum/data/forum/files/2014-12/108480959-9743143_original-1-.jpg"}
								/>
							</div>
						</div>
					</Match>
				</Switch>
			</div>
		);
	}
	const [editorStore, { setEditorStore }] = useEditorStore();

	let imgRef: HTMLImageElement;

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			// e.preventDefault();
		}
	}

	const dimension: Dimension = {
		width: gridSize(block.width),
		height: gridSize(block.height)
	};
	const currRatio = () => dimension.width / dimension.height;

	const defaultRelDimension: Dimension = {
		width: editorStore.document.layoutOptions.mGridWidth,
		height: 16,
	};

	function getContentDimension(transform: Dimension) {
		if (!block.value) {
			return {
				width: gridSize(defaultRelDimension.width),
				height: gridSize(defaultRelDimension.height),
			};
		}
		return {
			width: transform.width,
			height: Math.round(transform.height / currRatio())
		};
	}
	createComputed(() => {
		blockData.getContentDimension = getContentDimension;
	});

	createEffect(on(
		() => block.value,
		async () => {
			let value = block.value;
			try {
				await getImageOrFallback(block.value);
			}
			catch (e) {
				value = null;
			}
			if (!value) {
				setEditorStore('layout', editorStore.layout.indexOf(block), defaultRelDimension);
				if (value !== block.value) {
					setEditorStore('layout', editorStore.layout.indexOf(block), 'value', null);
				}
				send(WSMsgType.ChangeBlock, unwrap(block));
				dimension.width = gridSize(defaultRelDimension.width);
				dimension.height = gridSize(defaultRelDimension.height);
			}
			else if (!block.width || !block.height) {
				const { width, height } = await getImgDimension(block.value);
				const ratio = height / width;
				const relSize = {
					width: editorStore.document.layoutOptions.mGridWidth,
					height: Math.ceil(editorStore.document.layoutOptions.mGridWidth * ratio)
				};
				dimension.width = gridSize(relSize.width);
				dimension.height = gridSize(relSize.height);
				setEditorStore('layout', editorStore.layout.indexOf(block), relSize);
				send(WSMsgType.ChangeBlock, unwrap(block));
			}
		})
	);

	async function onFileChoose(e: Event & { currentTarget: HTMLInputElement; }) {
		const file = e.currentTarget.files[0];
		const base64 = await readAsDataUrl(file);
		setEditorStore('layout', editorStore.layout.indexOf(block), {
			value: base64
		});
		send(WSMsgType.ChangeBlock, unwrap(block));
	}

	async function tryToSetUrlImage(imgSrc: string) {
		if (!imgSrc) return;
		try {
			const imgPath = await getImageOrFallback(imgSrc);
			setEditorStore('layout', editorStore.layout.indexOf(block), {
				value: imgPath,
			});
			send(WSMsgType.ChangeBlock, unwrap(block));
		}
		catch (e) {
			alert('Wrong image url!');
		}
	}

	const onUrlInput = throttle((e: InputEvent & { currentTarget: HTMLInputElement; }) => {
		tryToSetUrlImage(e.currentTarget.value);
	}, 1000);

	// const onPaste = throttle((e: ClipboardEvent) => {
	//    const text = e.clipboardData.getData('text/html');
	//    console.log(e.clipboardData.types);
	//    tryToSetUrlImage(text);
	// }, 1000);


	return (
		<div
			class={s.imgBlock}
			classList={{
				[s.changing]: isMeResizing() || isMeDragging(),
				[s.shadowed]: shadowed,
			}}
		>
			<Switch>
				<Match when={block.value}>
					<img
						src={block.value}
						onKeyDown={onKeyDown}
						ref={imgRef}
						// onPaste={onPaste}
						{...other}
					/>
				</Match>
				<Match when={!block.value}>
					<div class={s.mock}>
						<div class={s.dnd}>
							<input type="file"
								class={s.hiddenInputFile}
								accept=".png, .jpg, .jpeg, .svg"
								onChange={onFileChoose}
								disabled={!!isMeEditingByRoommate()}
							/>
							<div class={s.pic} />
							<div class={s.ask}>{t('blocks.attachments.image.mock.ask')}</div>
							<div class={s.orDrop}>{t('blocks.attachments.image.mock.or-drag')}</div>
						</div>
						<div class={s.inputBlock}>
							<div class={s.name}>
								{t('blocks.attachments.image.mock.or-link')}
							</div>
							<input
								type="url"
								class={s.link}
								placeholder={"Image url"}
								onInput={onUrlInput}
								onPaste={(e) => {
									e.stopImmediatePropagation();
									e.stopPropagation();
									tryToSetUrlImage(e.currentTarget.value);
								}}
							/>
						</div>
					</div>
				</Match>
			</Switch>
		</div>
	);
}