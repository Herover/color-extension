<script>
	import { onMount } from 'svelte';
	import chroma from "chroma-js";

	export let height = 400;
	export let width = 400;

  export let angleSteps = 360;
  export let radiusSteps = 60;

	export let colors = [];

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

	$: computedColors = colors.map(e => {
		const chromaColor = chroma(e.color);
		// Note: black, gray, white will have hue NaN
		const [hue, saturation] = chromaColor.hsl();
		
		return {
			x: hueSaturationToX((hue || 0) * (Math.PI/180) + angleOffset, radius * saturation),
			y: hueSaturationToY((hue || 0) * (Math.PI/180) + angleOffset, radius * saturation),
			color: e.color,
		};
	});

	let canvas;
	onMount(() => {
		console.log("mounted")
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
				ctx.strokeStyle = hsvColor;

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
	<svg width="{width}px" height="{height}px">
		{#each computedColors as color}
			<circle
				cx="{color.x}"
				cy="{color.y}"
				r="10"
				stroke="black"
				fill="{color.color}"
			></circle>
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
