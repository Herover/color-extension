<script>
	import { onMount } from 'svelte';
	import chroma from "chroma-js";

	export let height = 400;
	export let width = 400;

  export let angleSteps = 360;
  export let radiusSteps = 60;

	const radius = width/2;
	const fullRadi = Math.PI * 2;

	const partRadius = 1/radiusSteps;
	const partAngle = fullRadi / angleSteps;

	const angleOffset = -Math.PI/2 - partAngle/2;



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

				ctx.fillStyle = hslColor;
				ctx.strokeStyle = hsvColor;

				ctx.beginPath();

				ctx.arc(
					width/2,
					height/2,
					radius * (partRadius * (radiusStep)),
					angleOffset + partAngle * angleStep,
					angleOffset + partAngle * (angleStep + 1),
					false,
				);
				ctx.lineTo(
					radius + Math.cos(angleOffset + partAngle * (angleStep + 1)) * radius * (partRadius * (radiusStep + 1)),
					radius + Math.sin(angleOffset + partAngle * (angleStep + 1)) * radius * (partRadius * (radiusStep + 1)),
				);
				ctx.arc(
					width/2,
					height/2,
					radius * (partRadius * (radiusStep + 1)),
					angleOffset + partAngle * (angleStep + 1),
					angleOffset + partAngle * angleStep,
					true,
				);
				ctx.lineTo(
					radius + Math.cos(angleOffset + partAngle * angleStep) * radius * (partRadius * (radiusStep)),
					radius + Math.sin(angleOffset + partAngle * angleStep) * radius * (partRadius * (radiusStep)),
				);
				
				ctx.fill();
				ctx.stroke();
			}
		}
	});
	
</script>

<canvas width="{width}px" height="{height}px" bind:this={canvas}></canvas>
