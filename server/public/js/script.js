var socket;

var init = function() {
    //THREE
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF4DAE3);
    var camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -110, 150);
    camera.lookAt(0, 0, 0);

    var controls = new THREE.OrbitControls(camera);

    var renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild( renderer.domElement );

    //var light = new THREE.DirectionalLight( 0xffffff, 1, 100 );
    var light = new THREE.DirectionalLight( 0xffffff, 1, 200 );
    light.position.set(0, -50, 80);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    var loader = new THREE.ColladaLoader();
    loader.load("models/upNew.dae", function(collada) {
    //loader.load("models/supreme.dae", function(collada) {
    //loader.load("models/upRickAndMorty.dae", function(collada) {
        scene.add(collada.scene);
    });

    var ball = new THREE.Mesh(
        new THREE.SphereGeometry(1.15, 20, 20),
        new THREE.MeshPhongMaterial({ color: 0xfcaf0a })
    );
    ball.position.set(-7, 0, 15);
    scene.add(ball);

    var flippers = [];
    //Physics
    pl = planck;
    Vec2 = pl.Vec2;
    //world = new pl.World(Vec2(0, -50));
    world = new pl.World(Vec2(0, -10));

    var ballBody = world.createDynamicBody({ position: Vec2(22, -46), bullet: true });
    ballBody.createFixture(pl.Circle(1.15), 1);

    var bodys = {};
    baseGround.forEach(e => bodys[e.name] = world.createBody());
    console.table(baseGround);

    var heightmapRampaLeft = [];
    var rampaLeftIsActive = false;

    //Rampa Right
    var heightmapRampaRight = [];
    var rampaRightIsActive = false;

    var onTheTop = false;
    var theTop = 8.5;

    var inShuttle = true;
    var theTopOfShuttle = 3;
    var timeToForce;
    var spacePressed = false;

    for(var obj of baseGround) {
        for(var i = 0; i < obj.lines.length; i += 2) {
            let index1 = obj.lines[i] * 3;
            let index2 = obj.lines[i + 1] * 3;
            var x1 = obj.points[index1];
            var y1 = obj.points[index1 + 2];
            var x2 = obj.points[index2];
            var y2 = obj.points[index2 + 2];
            if(obj.name != 'leftFlipper' && obj.name != 'rightFlipper') {
                bodys[obj.name].createFixture(pl.Edge(Vec2(x1, y1), Vec2(x2, y2)), 0);
            }
        }

        if(obj.name == 'heightmapRampaLeft' || obj.name == 'heightmapRampaRight') {
            for(var i = 0; i < obj.lines.length; i += 2) {
                let index1 = obj.lines[i] * 3;
                let index2 = obj.lines[i + 1] * 3;
                if(obj.points[index1 + 2] > obj.points[index2 + 2]) {
                    index2 = obj.lines[i] * 3;
                    index1 = obj.lines[i + 1] * 3;
                }
                var point = {
                    x1: obj.points[index1],
                    z1: obj.points[index1 + 1],
                    y1: obj.points[index1 + 2],
                    x2: obj.points[index2],
                    z2: obj.points[index2 + 1],
                    y2: obj.points[index2 + 2]
                };
                if(obj.name == 'heightmapRampaLeft') heightmapRampaLeft.push(point);
                else heightmapRampaRight.push(point);
            }
        }
    }

    //8.73, 36.5
    flippers.push(createFlipper(true, new THREE.Vector3(-7.34, -37.5, 1), bodys['groundInt'], scene, world, pl, Vec2, baseGround));
    flippers.push(createFlipper(false, new THREE.Vector3(7.34, -37.5, 1), bodys['groundInt'], scene, world, pl, Vec2, baseGround));

    heightmapRampaLeft.sort((a, b) => a.y1 - b.y1);
    heightmapRampaRight.sort((a, b) => a.y1 - b.y1);

    var filterCategoryBall = 0x0001;
    var filterCategoryGround = 0x0002;
    var filterCategoryRamp = 0x0004;
    var filterCategorySensor =  0x0008;
    var filterCategoryLanzadera = 0x0010;

    ballBody.getFixtureList().m_filterCategoryBits = filterCategoryBall;
    ballBody.getFixtureList().m_filterMaskBits = filterCategoryBall | filterCategoryLanzadera | filterCategorySensor;
    ballBody.getFixtureList().setRestitution(0.2);
    //ballBody.setFixedRotation(true);

    //GroundExt
    let fixture = bodys['groundExt'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryGround;
        fixture = fixture.getNext();
    }
    //GroundInt
    fixture = bodys['groundInt'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryGround;
        fixture = fixture.getNext();
    }
    //Pelotas
    fixture = bodys['pelotas'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryGround;
        fixture = fixture.getNext();
    }
    //Triangulos
    fixture = bodys['triangulos'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryGround;
        fixture = fixture.getNext();
    }
    //Tronchos
    fixture = bodys['tronchos'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryGround;
        fixture = fixture.getNext();
    }
    //RampaLeft
    fixture = bodys['rampaLeft'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryRamp;
        fixture = fixture.getNext();
    }
    //RampaRight
    fixture = bodys['rampaRight'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryRamp;
        fixture = fixture.getNext();
    }
    //entradaRampaLeftSensor
    fixture = bodys['entradaRampaLeftSensor'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //entradaRampaRightSensor
    fixture = bodys['entradaRampaRightSensor'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //salidaRampaLeftSensor
    fixture = bodys['salidaRampaLeftSensor'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //salidaRampaRightSensor
    fixture = bodys['salidaRampaRightSensor'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //topRampaLeftSensor
    fixture = bodys['topRampaLeft'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //topRampaRightSensor
    fixture = bodys['topRampaRight'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //heightmapRampaRight
    fixture = bodys['heightmapRampaRight'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = 0x0032;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //Shuttle
    fixture = bodys['lanzadera'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategoryLanzadera;
        fixture = fixture.getNext();
    }
    //ShuttleSensor
    fixture = bodys['lanzaderaSalida'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }
    //ShuttleSensor
    fixture = bodys['lanzaderaOnTheTop'].getFixtureList();
    while(fixture != null) {
        fixture.m_filterCategoryBits = filterCategorySensor;
        fixture.setSensor(true);
        fixture = fixture.getNext();
    }

    //RampLogicOnTheTop
    world.on('begin-contact', (contact, oldManifold) => {
        let bodyA = contact.getFixtureA().getBody();
        let bodyTopLeft = bodys['topRampaLeft'].getFixtureList().getBody();
        let bodyTopRight = bodys['topRampaRight'].getFixtureList().getBody();
        if(bodyA == bodyTopLeft || bodyA == bodyTopRight) {
            let velY = contact.getFixtureB().getBody().getLinearVelocity();
            if(velY.y > 0) onTheTop = true;
            else onTheTop = false;
        }
    });

    //RampsLogic
    world.on('end-contact', (contact, oldManifold) => {
        let bodyA = contact.getFixtureA().getBody();
        let bodyEntradaLeft = bodys['entradaRampaLeftSensor'].getFixtureList().getBody();
        let bodySalidaLeft = bodys['salidaRampaLeftSensor'].getFixtureList().getBody();
        let bodyEntradaRight = bodys['entradaRampaRightSensor'].getFixtureList().getBody();
        let bodySalidaRight = bodys['salidaRampaRightSensor'].getFixtureList().getBody();
        if(bodyA == bodyEntradaLeft || bodyA == bodySalidaLeft || bodyA == bodyEntradaRight || bodyA == bodySalidaRight) {
            let velY = contact.getFixtureB().getBody().getLinearVelocity();
            let actualBall = contact.getFixtureB();
            if(bodyA == bodyEntradaLeft || bodyA == bodyEntradaRight) {
                rampaLeftIsActive = bodyA == bodyEntradaLeft ? true : false;
                rampaRightIsActive = bodyA == bodyEntradaRight ? true : false;
                if(velY.y > 0) {
                    actualBall.m_filterMaskBits = filterCategoryBall | filterCategoryRamp | filterCategorySensor;
                } else {
                    [rampaLeftIsActive, rampaRightIsActive] = [false, false];
                    actualBall.m_filterMaskBits = filterCategoryBall | filterCategoryGround | filterCategorySensor;
                    onTheTop = false;
                }
            } else {
                [rampaLeftIsActive, rampaRightIsActive] = [false, false];
                actualBall.m_filterMaskBits = filterCategoryBall | filterCategoryGround | filterCategorySensor;
                onTheTop = false;
            }
            actualBall.refilter();
        }
    });

    //LanzaderaLogic
    world.on('end-contact', (contact, oldManifold) => {
        let bodyA = contact.getFixtureA().getBody();
        let bodySalidaLanzadera = bodys['lanzaderaSalida'].getFixtureList().getBody();
        if(bodyA == bodySalidaLanzadera) {
            let actualBall = contact.getFixtureB();
            actualBall.m_filterMaskBits = filterCategoryBall | filterCategoryGround | filterCategorySensor;
        }
    });
    world.on('end-contact', (contact, oldManifold) => {
        let bodyA = contact.getFixtureA().getBody();
        let bodySalidaLanzadera = bodys['lanzaderaOnTheTop'].getFixtureList().getBody();
        if(bodyA == bodySalidaLanzadera) {
            inShuttle = false;
        }
    });

    //CircleLogic
    let reboteMinimo = 8;
    let reboteMaximo = 15
    world.on('end-contact', (contact, oldManifold) => {
        let circle = contact.getFixtureA().getBody();
        if(circle == bodys['pelotas']) {
            let bodyBall = contact.getFixtureB().getBody();
            let v = bodyBall.getLinearVelocity();
            let impulse = v.mul(1.5);
            if(Math.abs(impulse.x) < reboteMinimo && Math.abs(impulse.y) < reboteMinimo) {
                let bigger = Math.abs(v.x) > Math.abs(v.y) ? v.x : v.y;
                let multiplicador = Math.abs(reboteMinimo / bigger);
                impulse = v.mul(multiplicador);
            }
            if(Math.abs(impulse.x) > reboteMaximo || Math.abs(impulse.y) > reboteMaximo) {
                let bigger = Math.abs(v.x) > Math.abs(v.y) ? v.x : v.y;
                let divisor = Math.abs(bigger / reboteMaximo);
                impulse = Vec2(v.x/divisor, v.y/divisor);
            }
            bodyBall.applyLinearImpulse(impulse, Vec2(0,0), true);
        }
    });

    var animate = function () {
        var ballPosition = ballBody.getPosition();
        camera.position.set(0, ballPosition.y - 100, 90);
        if(camera.position.y < -80) camera.position.y = -80;
        if(camera.position.y > 0) camera.position.y = 0;
        camera.lookAt(0, ball.position.y, ball.position.z);
        //console.log(camera.position.y);

        requestAnimationFrame(animate);
        updatePhysics();
        //controls.update();
        renderer.render(scene, camera);
    };

    flippers.left = flippers.right = false;

    document.body.addEventListener("keydown", evt => {
        if(evt.keyCode == 37 || evt.keyCode == 65) flippers.left = true;
        if(evt.keyCode == 39 || evt.keyCode == 80) flippers.right = true;
    });

    document.body.addEventListener("keyup", evt => {
        if(evt.keyCode == 37 || evt.keyCode == 65) flippers.left = false;
        if(evt.keyCode == 39 || evt.keyCode == 80) flippers.right = false;
    });

    //LanzderaImpulso
    document.body.addEventListener("keydown", evt => {
        if(evt.keyCode == 32) {
            if(!spacePressed && inShuttle) {
                document.getElementById("containerProgressBar").style.visibility = "visible";
                var visor = document.getElementById("progress");
                visor.className += " active";
                timeToForce = new Date().getTime();
                spacePressed = true;
            }
        }
    });

    document.body.addEventListener("keyup", evt => {
        if(evt.keyCode == 82) {
            ballBody.setLinearVelocity(Vec2(0, 0));
            ballBody.getFixtureList().m_filterMaskBits = filterCategoryBall | filterCategoryLanzadera | filterCategorySensor;
            ballBody.setPosition(Vec2(22, -46));
            inShuttle = true;
        }
        if(evt.keyCode == 32) {
            if(inShuttle) {
                var force = (new Date().getTime() - timeToForce) * 0.5;
                if(force > 144 && force < 163) {
                    force = 144;
                }
                var porcentaje = force * 100 / 300;
                ballBody.applyLinearImpulse(Vec2(0, force), Vec2(0,0), true);
                spacePressed = false;
                document.getElementById("containerProgressBar").style.visibility = "hidden";
                var visor = document.getElementById("progress");
                visor.className = "";
            }
        }
    });

    var updatePhysics = () => {
        var flippersAngle = updateFlippers(flippers);
        world.step(1 / 25);
        var ballPosition = ballBody.getPosition();
        ball.position.x = ballPosition.x;
        ball.position.y = ballPosition.y;
        let salir = false;
        if(rampaLeftIsActive || rampaRightIsActive) {
            let heightmap = rampaLeftIsActive ? heightmapRampaLeft : heightmapRampaRight;
            for(position of heightmap) {
                if(salir == false) {
                    if(!onTheTop) {
                        if(position.y1 < ball.position.y && position.y2 > ball.position.y) {
                            salir = true;
                            let distance = Math.abs(position.y2 - position.y1);
                            let distance2 = Math.abs(position.y1 - (ballPosition.y + 0.5));
                            let porcentaje = distance2 / distance;
                            let lol =  Math.abs(position.z1 - position.z2);
                            let z = position.z1 - (lol * porcentaje);
                            ball.position.z = -z + 1;
                            //console.log(ballPosition.y + ", " + position.y1 + ", " + position.y2 + "," + porcentaje + "," + z + "," + lol);
                        }
                    } else {
                        salir = true;
                        ball.position.z = theTop;
                    }
                }
            }
        } else if(inShuttle) {
            ball.position.z = theTopOfShuttle;
        } else {
            if(ball.position.z > 1) {
                ball.position.z -= 0.50;
            } else {
                ball.position.z = 1;
            }
        }
    }
    animate();

    window.addEventListener( 'resize', onWindowResize, false );

    function onWindowResize(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }
}

window.onload = function() {
    socket = io();
    init();
}
