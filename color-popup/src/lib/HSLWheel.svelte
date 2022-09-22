<script>
	import { onMount } from 'svelte';

	export let height = 400;
	export let width = 400;

	const radius = width/2;
	const fullRadi = Math.PI * 2;

	const angleSteps = 12
	const radiusSteps = 6;

	const partRadius = 1/radiusSteps;
	const partAngle = fullRadi / angleSteps;

	let canvas;
	onMount(() => {
		console.log("mounted")
		let ctx = canvas.getContext('2d');

		for (let angleStep = 0; angleStep < angleSteps; angleStep++) {
			for (let radiusStep = 0; radiusStep < radiusSteps; radiusStep++) {
				console.log(angleStep * (360/angleSteps))
				ctx.fillStyle = `hsl(${angleStep * (360/angleSteps)}, ${radiusStep * (1/radiusSteps) * 100}%, 50%)`;
				ctx.strokeStyle = `hsl(${angleStep * (360/angleSteps)}, ${radiusStep * (1/radiusSteps) * 100}%, 50%)`;
				ctx.beginPath();
				//ctx.moveTo(radius + Math.cos(partAngle) * radius*1, radius + Math.sin(partAngle) * radius*1);
				ctx.arc(
					width/2,
					height/2,
					radius * (partRadius * (radiusStep)),
					partAngle * angleStep,
					partAngle * (angleStep + 1),
					false,
				);
				ctx.lineTo(
					radius + Math.cos(partAngle * (angleStep + 1)) * radius * (partRadius * (radiusStep + 1)),
					radius + Math.sin(partAngle * (angleStep + 1)) * radius * (partRadius * (radiusStep + 1)),
				);
				ctx.arc(
					width/2,
					height/2,
					radius * (partRadius * (radiusStep + 1)),
					partAngle * (angleStep + 1),
					partAngle * angleStep,
					true,
				);
				ctx.lineTo(
					radius + Math.cos(partAngle * angleStep) * radius * (radiusSteps/(radiusStep)),
					radius + Math.sin(partAngle * angleStep) * radius * (radiusSteps/(radiusStep)),
				);
				ctx.fill();
				ctx.stroke();
			}
		}
		


		/* ctx.beginPath();
		ctx.arc(width/2, height/2, radius, partAngle * 1, partAngle * 2, false);
		ctx.lineTo(radius + Math.cos(partAngle * 2) * radius*0.9, radius + Math.sin(partAngle * 2) * radius*0.9);
		ctx.arc(width/2, height/2, radius * 0.9, partAngle * 2, partAngle * 1, true);
		ctx.lineTo(radius + Math.cos(partAngle * 1) * radius*1, radius + Math.sin(partAngle * 1) * radius*1);
		ctx.fill();
		ctx.stroke(); */
	});
	
</script>

<canvas width="{width}px" height="{height}px" bind:this={canvas}></canvas>
