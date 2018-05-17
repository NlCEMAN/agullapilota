function Pinball(domElement, camera, gravity) {
	this.domElement = domElement || document.body;
	this.scene = new THREE.Scene();

	var ball = new THREE.Mesh(
        new THREE.SphereGeometry(1.25, 20, 20),
        new THREE.MeshPhongMaterial({ color: 0xfcaf0a })
    );
    ball.position.set(-7, 0, 15);
    this.scene.add(ball);

	//this.camera = camera || new Camera();
	this.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, -125, 90);
    this.camera.lookAt(0, 0, 0);

	this.renderer = new THREE.WebGLRenderer({ antialias: true });
	this.renderer.setSize(domElement.offsetWidth, domElement.offsetHeight);

	var pl = planck,
		Vec2 = pl.Vec2;

	this.world = new pl.World(Vec2(0, -5));
	this.physics = [];

	this.domElement.appendChild(this.renderer.domElement);
}

/*Pinball.prototype.start = function() {
	console.log(this.start);
	requestAnimationFrame(this.start);
	this.renderer.render(this.scene, this.camera.object);
}*/

Camera.TYPES = {
	PerspectiveCamera: function(def) {
		return new THREE.PerspectiveCamera(def.fov, def.aspect, def.near, def.far);
	}
}

const cameraDef = {
	fov: 45,
	aspect: 1.19,
	near: 1,
	far: 1000,
	position: [0, 0, 0]
};

function Camera(type, def) {
	this.type = Object.keys(Camera.TYPES).includes(type) ? type : 'PerspectiveCamera';

	def = setDefaults(def, cameraDef);

	this.object = Camera.TYPES[this.type](def);
	this.object.position.set(...def.position);
}

Pinball.lightTypes = {
	AmbientLight: function(def) { return new THREE.AmbientLight(def.color, def.intensity); },
	DirectionalLight: function(def) { return new THREE.DirectionalLight(def.color, def.intensity); },
	HemisphereLight: function(def) { return new THREE.HemisphereLight(def.skyColor, def.groundColor, def.intensity); },
	PointLight: function(def) { return new THREE.HemisphereLight(def.color, def.intensity, def.distance, def.decay); },
	RectAreaLight: function(def) { return new THREE.RectAreaLight(def.color, def.intensity, def.width, def.height); },
	SpotLight: function(def) { return new THREE.SpotLight( def.color, def.intensity, def.distance, def.angle, def.penumbra, def.decay); }
}

const lightDef = {
	color: 0xffffff,
	intensity: 1,
	skyColor: 0xffffff,
	groundColor: 0xffffff,
	distance: 0,
	decay: 1,
	width: 10,
	height: 10,
	position: [0, 0, 0],
	lookAt: [0, 0, 0],
}

Pinball.prototype.addLight = function(type, def) {
	this.type = Object.keys(Pinball.lightTypes).includes(type) ? type : 'AmbientLight';

	def = setDefaults(def, lightDef);

	var light = Pinball.lightTypes[this.type](def);
	light.position.set(...def.position);
	light.lookAt(...def.lookAt);

	this.scene.add(light);
}

Pinball.prototype.addObject3D = function(dae) {
	var scene = this.scene,
		loader = new THREE.ColladaLoader();

	loader.load(dae, function(collada) {
		let object = collada.scene;
		object.name = name;
		scene.add(object);
	});
}

Physics.TYPES = {
	BallPhysics: function(world, def) { return new BallPhysics(world, def.radius, def.mass); }
}

Pinball.prototype.addPhysics = function(type, def) {
	var physics = Physics.TYPES[type](this.world, def);
	this.physics.push(physics);
}

function Physics(world) {
	this.world = world;
}

Physics.prototype.addFixture = function(points, lines) {
	for(let i = 0; i < obj.lines.length; i += 2) {
        let index1 = obj.lines[i] * 3,
        	index2 = obj.lines[i + 1] * 3;
        let x1 = obj.points[index1],
        	y1 = obj.points[index1 + 2],
        	x2 = obj.points[index2],
        	y2 = obj.points[index2 + 2];
        this.body.createFixture(pl.Edge(Vec2(x1, y1), Vec2(x2, y2)), 0);
    }
}

function BallPhysics(world, radius, mass) {
	var pl = planck,
		Vec2 = pl.Vec2;
	Physics.call(this, world);
	this.body = this.world.createDynamicBody({ bullet: true });
	this.body.createFixture(pl.Circle(radius), mass);
}

BallPhysics.prototype = Object.create(Physics.prototype);

function GroundPhysics(world, def) {
	Physics.call(this, world);
	this.body = this.world.createBody(def);
}

GroundPhysics.prototype = Object.create(Physics.prototype);

/////////////////////////////////
function setDefaults(to, from) {
	to = to || {};

	/*Object.keys(from)
		.forEach(key => to[key] = to[key] || from[key]);*/

	for(var key in from) {
		to[key] = to[key] || from[key];
	}

	return to;
}