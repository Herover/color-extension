<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import chroma from "chroma-js";
	import ColorWheelCircle from './ColorWheelCircle.svelte';

	export let height = 400;
	export let width = 400;

	let movingItem = -1;

  export let angleSteps = 360;
  export let radiusSteps = 60;

	export let colors = [];

  const dispatch = createEventDispatcher();

	const startSwatchItemMove = (event) => {
		movingItem = computedColors.findIndex(e => e.id == event.detail.id);
	};
	const endSwatchItemMove = (event) => {
		movingItem = -1;
	}
	const updatePosition = (event) => {
		if (movingItem != -1) {
			const rect = event.currentTarget.getBoundingClientRect();
			// computedColors has to be modified directly to svelte to pich changes up
			computedColors[movingItem].x = event.clientX - rect.left;
			computedColors[movingItem].y = event.clientY - rect.top;
			const color = chroma(computedColors[movingItem].color);
			const [hue, saturation] = xyToHueSaturation(computedColors[movingItem].x, computedColors[movingItem].y);
			computedColors[movingItem].color = `hsl(${Math.floor(hue*100)/100}, ${Math.floor(saturation*10000)/100}%, ${Math.floor(color.hsl()[2]*10000)/100}%)`;

			dispatch("updateColor", { id: movingItem, hslColor: computedColors[movingItem].color });
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

	$: computedColors = colors.map(e => {
		const chromaColor = chroma(e.color);
		// Note: black, gray, white will have hue NaN
		const [hue, saturation] = chromaColor.hsl();
		
		return {
			x: hueSaturationToX((hue || 0) * (Math.PI/180) + angleOffset, radius * saturation),
			y: hueSaturationToY((hue || 0) * (Math.PI/180) + angleOffset, radius * saturation),
			color: e.color,
			id: e.id,
		};
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
				const hslColor = hsvColor.css("hsl");

				const angle1 = angleOffset + partAngle * angleStep;
				const angle2 = angleOffset + partAngle * (angleStep + 1);
				const mul1 = radius * (partRadius * (radiusStep));
				const mul2 = radius * (partRadius * (radiusStep + 1));

				ctx.fillStyle = hslColor;
				ctx.strokeStyle = hslColor;

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
	<canvas width="{width}px" height="{height}px" bind:this={canvas}></canvas>
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
				on:move="{startSwatchItemMove}"
				on:stop="{endSwatchItemMove}"
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
