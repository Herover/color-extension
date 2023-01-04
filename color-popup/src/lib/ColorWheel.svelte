<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import chroma from "chroma-js";
	import ColorWheelCircle from './ColorWheelCircle.svelte';
	import type { SwatchColor } from './swatch';
    import { clamp, getHSLAString } from './util';

	export let height = 400;
	export let width = 400;

	let movingItem = -1;

  export let angleSteps = 360;
  export let radiusSteps = 60;

	export let colors: SwatchColor[] = [];

	export let highlighted = {};

	export let showName;

  const dispatch = createEventDispatcher<{ updateColor: UpdateColorEvent, highlight: HighlightEvent }>();

	const startSwatchItemMove = (event: CustomEvent<ColorCircleMoveEvent>) => {
		movingItem = computedColors.findIndex(e => e.id == event.detail.id);
	};
	const endSwatchItemMove = (event: CustomEvent<ColorCircleStopMoveEvent>) => {
		movingItem = -1;
	}
	const updatePosition = (event) => {
		if (movingItem != -1) {
			const rect = event.currentTarget.getBoundingClientRect();
			// computedColors has to be modified directly to svelte to pich changes up
			computedColors[movingItem].x = event.clientX - rect.left;
			computedColors[movingItem].y = event.clientY - rect.top;
			const [hue, saturation] = xyToHueSaturation(computedColors[movingItem].x, computedColors[movingItem].y);
			computedColors[movingItem].color = getHSLAString(hue, saturation, computedColors[movingItem].value, computedColors[movingItem].alpha);

			dispatch("updateColor", {
				id: computedColors[movingItem].id,
				hslColor: computedColors[movingItem].color,
				hue,
				saturation,
				value: computedColors[movingItem].value,
				alpha: computedColors[movingItem].alpha,
			});
		}

		return false;
	}

	const radius = width/2;
	const fullRadi = Math.PI * 2;

	const partRadius = 1/radiusSteps;
	const partAngle = fullRadi / angleSteps;

	const angleOffset = -Math.PI/2 - partAngle/2;

	/**
	 * 
	 * @param hue radians (0 - 2PI)
	 * @param saturation 0 - radius
	 */
	const hueSaturationToX = (hue, saturation) => {
		return radius + Math.cos(hue) * saturation;
	};
	/**
	 * 
	 * @param hue radians (0 - 2PI)
	 * @param saturation 0 - radius
	 */
	const hueSaturationToY = (hue, saturation) => {
		return radius + Math.sin(hue) * saturation;
	};

	const xyToHueSaturation = (x, y) => {
		let dx = x - radius;
		let dy = y - radius;
		let dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		let saturation = dist/radius;
		// hue_rad = acos(dot(<x, y>, <0, radius>) / (|<x, y>| * |<0, radius>|))
		let hue =
			Math.acos(
				(dx * 0 + dy * -radius)
				/
				(dist * radius)
			) * (180 / Math.PI);
		return [ dx < 0 ? 360 - hue : hue, saturation ];
	}

	$: computedColors = colors
		.map(e => {
			//const [hue, saturation] = chroma.hsl(e.hue, e.saturation, e.value).hsv();
			return {
				x: hueSaturationToX((e.hue || 0) * (Math.PI/180) + angleOffset, radius * clamp(0, 1, e.saturation)),
				y: hueSaturationToY((e.hue || 0) * (Math.PI/180) + angleOffset, radius * clamp(0, 1, e.saturation)),
				highlight: highlighted[e.id],
				color: e.color,
				id: e.id,
        hue: e.hue,
        saturation: e.saturation,
        value: e.value,
        alpha: e.alpha,
			};
		})
		.sort((a, b) => {
			if (a.highlight && b.highlight) return 0;
			if (!a.highlight && b.highlight) return -1;
			if (a.highlight && !b.highlight) return 1;
			return 0;
		});

	let canvas;
	onMount(() => {
		let ctx = canvas.getContext('2d');

		for (let angleStep = 0; angleStep < angleSteps; angleStep++) {
			for (let radiusStep = 0; radiusStep < radiusSteps; radiusStep++) {
				// @ts-ignore
				const hsvColor = chroma.hsv(
					angleStep * (360 / angleSteps),
					// Add 1 to get 100% saturation but not 0%
					(radiusStep + 1) * (1 / (radiusSteps)),
					1,
				);
				const cssColor = hsvColor.css("hsl");

				const angle1 = angleOffset + partAngle * angleStep;
				const angle2 = angleOffset + partAngle * (angleStep + 1);
				const mul1 = radius * (partRadius * (radiusStep));
				const mul2 = radius * (partRadius * (radiusStep + 1));

				ctx.fillStyle = cssColor;
				ctx.strokeStyle = cssColor;

				ctx.beginPath();

				ctx.arc(
					width/2,
					height/2,
					mul1,
					angle1,
					angle2,
					false,
				);
				ctx.lineTo(
					hueSaturationToX(angle2, mul2),
					//radius + Math.cos(angleOffset + partAngle * (angleStep + 1)) * radius * (partRadius * (radiusStep + 1)),
					hueSaturationToY(angle2, mul2),
				);
				ctx.arc(
					width/2,
					height/2,
					mul2,
					angle2,
					angle1,
					true,
				);
				ctx.lineTo(
					hueSaturationToX(angle1, mul1),
					hueSaturationToY(angle1, mul1),
				);
				
				ctx.fill();
				ctx.stroke();
			}
		}
	});
	
</script>

<div class="circle-holder">
	<canvas
		width="{width}px"
		height="{height}px"
		bind:this={canvas}
	></canvas>
	<svg
		width="{width}px"
		height="{height}px"
		on:mousemove="{updatePosition}"
	>
		{#each computedColors as color}
			<ColorWheelCircle
				color="{color.color}"
				id="{color.id}"
				x="{color.x}"
				y="{color.y}"
				highlight="{color.highlight}"
				showName="{showName}"
				on:move="{startSwatchItemMove}"
				on:stop="{endSwatchItemMove}"
				on:highlight
			/>
		{/each}
	</svg>
</div>

<style>
	svg {
		position: absolute;
		top: 0px;
		left: 0px;
	}

	.circle-holder {
		position: relative;
	}
</style>
