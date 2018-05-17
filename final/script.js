window.onload = () => {
	var camera = new Camera('PerspectiveCamera', {
		fov: 30,
		aspect: document.body.offsetWidth / document.body.offsetHeight,
		near: 1,
		far: 1000,
		position: [0, -125, 90]
	});

	var pinball = new Pinball(document.body, camera, [0, -5]);

	pinball.addLight('DirectionalLight', {
		color: 0xffffff,
		intensity: 1,
		position: [0, -125, 75]
	});

	pinball.addLight('AmbientLight', {
		color: 0xffffff,
		intensity: 0.3
	});

	pinball.addObject3D('models/supreme.dae', 'StaticObject3D', {});

	pinball.addPhysics('BallPhysics', {
		radius: 1.25,
		mass: 1
	});

	console.log(pinball.physics);

	var animate = function() {
		requestAnimationFrame(animate);
		pinball.renderer.render(pinball.scene, pinball.camera);
	}

	animate();
}