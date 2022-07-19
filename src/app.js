import * as THREE from 'three';
import { WEBGL } from './WebGL';
import * as Ammo from './builds/ammo';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

import {
  billboardTextures,
  boxTexture,
  inputText,
  URL,
  stoneTexture,
  woodTexture,
} from './resources/textures';

import {
  setupEventHandlers,
  moveDirection,
  isTouchscreenDevice,
  touchEvent,
  createJoystick,
} from './resources/eventHandlers';

import {
  preloadDivs,
  preloadOpacity,
  postloadDivs,
  startScreenDivs,
  startButton,
  noWebGL,
  fadeOutDivs,
} from './resources/preload';

import {
  clock,
  scene,
  camera,
  renderer,
  stats,
  manager,
  createWorld,
  lensFlareObject,
  createLensFlare,
  particleGroup,
  particleAttributes,
  particleSystemObject,
  glowingParticles,
  addParticles,
  moveParticles,
  generateGalaxy,
  galaxyMaterial,
  galaxyClock,
  galaxyPoints,
} from './resources/world';

import {
  simpleText,
  floatingLabel,
  allSkillsSection,
  createTextOnPlane,
} from './resources/surfaces';

import {
  pickPosition,
  launchClickPosition,
  getCanvasRelativePosition,
  rotateCamera,
  launchHover,
} from './resources/utils';

export let cursorHoverObjects = [];
// start Ammo Engine
Ammo().then((Ammo) => {
  //Ammo.js variable declaration
  let rigidBodies = [],
    physicsWorld;

  //Ammo Dynamic bodies for ball
  let ballObject = null;
  const STATE = { DISABLE_DEACTIVATION: 4 };

  //default transform object
  let tmpTrans = new Ammo.btTransform();

  // list of hyperlink objects
  var objectsWithLinks = [];
  //function to create a video element in existing webgl graphics
  function createVideo(videoId,xx,yy,zz){
	const geometry = new THREE.BoxGeometry( 30, 15, 0 );
	// invert the geometry on the x-axis so that all of the faces point inward
	//geometry.scale( 1, 1, 1 );
  	const video = document.getElementById( videoId );
	video.play();

	const texture = new THREE.VideoTexture( video );
	const material = new THREE.MeshBasicMaterial( { map: texture } );

	const mesh = new THREE.Mesh( geometry, material );
	mesh.position.setX(xx);
	mesh.position.setY(yy);
	mesh.position.setZ(zz);

	scene.add( mesh );
  }
  
  //function to create physics world with Ammo.js
  function createPhysicsWorld() {
    //algortihms for full (not broadphase) collision detection
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration), // dispatch calculations for overlapping pairs/ collisions.
      overlappingPairCache = new Ammo.btDbvtBroadphase(), //broadphase collision detection list of all possible colliding pairs
      constraintSolver = new Ammo.btSequentialImpulseConstraintSolver(); //causes the objects to interact properly, like gravity, game logic forces, collisions

    // see bullet physics docs for info
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(
      dispatcher,
      overlappingPairCache,
      constraintSolver,
      collisionConfiguration
    );

    // add gravity
    physicsWorld.setGravity(new Ammo.btVector3(0, -50, 0));
  }

  //create flat plane
  function createGridPlane() {
    // block properties
    let pos = { x: 0, y: -0.25, z: 0 };
    let scale = { x: 175+100, y: 0.5, z: 175+100 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    //create grid overlay on plane
    var grid = new THREE.GridHelper(175, 20, 0xffffff, 0xffffff);
    grid.material.opacity = 0.5;
    grid.material.transparent = true;
    grid.position.y = 0.005;
    scene.add(grid);

    //Create Threejs Plane
    let blockPlane = new THREE.Mesh(
      new THREE.BoxBufferGeometry(),
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.25,
      })
    );
    blockPlane.position.set(pos.x, pos.y, pos.z);
    blockPlane.scale.set(scale.x, scale.y, scale.z);
    blockPlane.receiveShadow = true;
    scene.add(blockPlane);

    //Ammo.js Physics
    let transform = new Ammo.btTransform();
    transform.setIdentity(); // sets safe default values
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    //setup collision box
    let colShape = new Ammo.btBoxShape(
      new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
    );
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    //  provides information to create a rigid body
    let rigidBodyStruct = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rigidBodyStruct);
    body.setFriction(10);
    body.setRollingFriction(10);

    // add to world
    physicsWorld.addRigidBody(body);
  }

  // create ball
  function createBall(xx,yy,zz) {
    //let pos = { x: 8.75, y: 0, z: 0 };
	let pos = { x: xx, y: yy, z: zz };
    let radius = 2;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 3;

    var marble_loader = new THREE.TextureLoader(manager);
    var marbleTexture = marble_loader.load('./src/jsm/earth.jpg');
    marbleTexture.wrapS = marbleTexture.wrapT = THREE.RepeatWrapping;
    marbleTexture.repeat.set(1, 1);
    marbleTexture.anisotropy = 1;
    marbleTexture.encoding = THREE.sRGBEncoding;

    //threeJS Section
    let ball = (ballObject = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32),
      new THREE.MeshLambertMaterial({ map: marbleTexture })
    ));

    ball.geometry.computeBoundingSphere();
    ball.geometry.computeBoundingBox();

    ball.position.set(pos.x, pos.y, pos.z);

    ball.castShadow = true;
    ball.receiveShadow = true;
	ball.name="ball";
	
    scene.add(ball);
	
    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);
    //body.setFriction(4);
    body.setRollingFriction(10);

    //set ball friction

    //once state is set to disable, dynamic interaction no longer calculated
    body.setActivationState(STATE.DISABLE_DEACTIVATION);

    physicsWorld.addRigidBody(
      body //collisionGroupRedBall, collisionGroupGreenBall | collisionGroupPlane
    );

    ball.userData.physicsBody = body;
    ballObject.userData.physicsBody = body;

    rigidBodies.push(ball);
    rigidBodies.push(ballObject);
  }

  //create beach ball Mesh
  function createBeachBall() {
    let pos = { x: 20, y: 30, z: 0 };
    let radius = 2;
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 20;

    //import beach ball texture
    var texture_loader = new THREE.TextureLoader(manager);
    var beachTexture = texture_loader.load('./src/jsm/BeachBallColor.jpg');
    beachTexture.wrapS = beachTexture.wrapT = THREE.RepeatWrapping;
    beachTexture.repeat.set(1, 1);
    beachTexture.anisotropy = 1;
    beachTexture.encoding = THREE.sRGBEncoding;

    //threeJS Section
    let ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 32, 32),
      new THREE.MeshLambertMaterial({ map: beachTexture })
    );

    ball.position.set(pos.x, pos.y, pos.z);
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);

    //Ammojs Section
    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    let motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = new Ammo.btSphereShape(radius);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);

    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);

    body.setRollingFriction(1);
    physicsWorld.addRigidBody(body);

    ball.userData.physicsBody = body;
    rigidBodies.push(ball);
  }

  //create link boxes
  function createBox(
    x,
    y,
    z,
    scaleX,
    scaleY,
    scaleZ,
    boxTexture,
    URLLink,
    color = 0x000000,
    transparent = true
  ) {
    const boxScale = { x: scaleX, y: scaleY, z: scaleZ };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    //load link logo
    const loader = new THREE.TextureLoader(manager);
    const texture = loader.load(boxTexture);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: transparent,
      color: 0xffffff,
    });

    var borderMaterial = new THREE.MeshBasicMaterial({
      color: color,
    });
    borderMaterial.color.convertSRGBToLinear();

    var materials = [
      borderMaterial, // Left side
      borderMaterial, // Right side
      borderMaterial, // Top side   ---> THIS IS THE FRONT
      borderMaterial, // Bottom side --> THIS IS THE BACK
      loadedTexture, // Front side
      borderMaterial, // Back side
    ];

    const linkBox = new THREE.Mesh(
      new THREE.BoxBufferGeometry(boxScale.x, boxScale.y, boxScale.z),
      materials
    );
    linkBox.position.set(x, y, z);
    linkBox.renderOrder = 1;
    linkBox.castShadow = true;
    linkBox.receiveShadow = true;
    linkBox.userData = { URL: URLLink, email: URLLink };
    scene.add(linkBox);
    objectsWithLinks.push(linkBox.uuid);

    addRigidPhysics(linkBox, boxScale);

    cursorHoverObjects.push(linkBox);
  }

  //create Ammo.js body to add solid mass to "Ryan Floyd Software Engineer"
  function ryanFloydWords(x, y, z) {
    const boxScale = { x: 46, y: 3, z: 2 };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0; //mass of zero = infinite mass

    const linkBox = new THREE.Mesh(
      new THREE.BoxBufferGeometry(boxScale.x, boxScale.y, boxScale.z),
      new THREE.MeshPhongMaterial({
        color: 0xff6600,
      })
    );

    linkBox.position.set(x, y, z);
    linkBox.castShadow = true;
    linkBox.receiveShadow = true;
    objectsWithLinks.push(linkBox.uuid);

    addRigidPhysics(linkBox, boxScale);
  }

  //loads text for Ryan Floyd Mesh
  function loadRyanText() {
    var text_loader = new THREE.FontLoader();

    text_loader.load('./src/jsm/Roboto_Regular.json', function (font) {
      var xMid, text;

      var color = 0xfffc00;

      var textMaterials = [
        new THREE.MeshBasicMaterial({ color: color }), // front
        new THREE.MeshPhongMaterial({ color: color }), // side
      ];

      var geometry = new THREE.TextGeometry('PRAKHAR GANDHI \nUDAIPUR,RAJ(INDIA)', {
        font: font,
        size: 3,
        height: 0.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.11,
        bevelOffset: 0,
        bevelSegments: 1,
      });

      geometry.computeBoundingBox();
      geometry.computeVertexNormals();

      xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

      geometry.translate(xMid, 0, 0);

      var textGeo = new THREE.BufferGeometry().fromGeometry(geometry);

      text = new THREE.Mesh(geometry, textMaterials);
      text.position.z = -20;
      text.position.y = 0.1;
      text.receiveShadow = true;
      text.castShadow = true;
      scene.add(text);
    });
  }

  //create "software engineer text"
  function loadEngineerText() {
    var text_loader = new THREE.FontLoader();

    text_loader.load('./src/jsm/Roboto_Regular.json', function (font) {
      var xMid, text;

      var color = 0x00ff08;

      var textMaterials = [
        new THREE.MeshBasicMaterial({ color: color }), // front
        new THREE.MeshPhongMaterial({ color: color }), // side
      ];

      var geometry = new THREE.TextGeometry('DATA ANALYST', {
        font: font,
        size: 1.5,
        height: 0.5,
        curveSegments: 20,
        bevelEnabled: true,
        bevelThickness: 0.25,
        bevelSize: 0.1,
      });

      geometry.computeBoundingBox();
      geometry.computeVertexNormals();

      xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

      geometry.translate(xMid, 0, 0);

      var textGeo = new THREE.BufferGeometry().fromGeometry(geometry);

      text = new THREE.Mesh(textGeo, textMaterials);
      text.position.z = -20;
      text.position.y = 0.1;
      text.position.x = 24;
      text.receiveShadow = true;
      text.castShadow = true;
      scene.add(text);
    });
  }
  //create "timeline text"
  function loadTimelineText() {
    var text_loader = new THREE.FontLoader();

    text_loader.load('./src/jsm/Roboto_Regular.json', function (font) {
      var xMid, text;

      var color = 0x00ff08;

      var textMaterials = [
        new THREE.MeshBasicMaterial({ color: color }), // front
        new THREE.MeshPhongMaterial({ color: color }), // side
      ];

      var geometry = new THREE.TextGeometry('TIMELINE', {
        font: font,
        size: 1.5,
        height: 0.5,
        curveSegments: 20,
        bevelEnabled: true,
        bevelThickness: 0.25,
        bevelSize: 0.1,
      });

      geometry.computeBoundingBox();
      geometry.computeVertexNormals();

      xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

      geometry.translate(xMid, 0, 0);

      var textGeo = new THREE.BufferGeometry().fromGeometry(geometry);

      text = new THREE.Mesh(textGeo, textMaterials);
      text.position.z = -20;
      text.position.y = 0.1;
      text.position.x = 24+15;
      text.receiveShadow = true;
      text.castShadow = true;
      scene.add(text);
    });
  }
   //createTextOnPlane(24+15,0.1,-20,inputText.timelinePicOne,20,40);
  //loads text for Ryan Floyd Mesh
  function loadPrakharEducationText(inputtext,inputy,inputz,inputfontsize) {
    var text_loader = new THREE.FontLoader();

    text_loader.load('./src/jsm/Roboto_Regular.json', function (font) {
      var xMid, text;

      var color = 0xfffc00;

      var textMaterials = [
        new THREE.MeshBasicMaterial({ color: color }), // front
        new THREE.MeshPhongMaterial({ color: color }), // side
      ];

      var geometry = new THREE.TextGeometry(inputtext, {
        font: font,
        size: inputfontsize,
        height: 0.5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.11,
        bevelOffset: 0,
        bevelSegments: 1,
      });

      geometry.computeBoundingBox();
      geometry.computeVertexNormals();

      xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);

      geometry.translate(xMid, 0, 0);

      var textGeo = new THREE.BufferGeometry().fromGeometry(geometry);

      text = new THREE.Mesh(geometry, textMaterials);
      text.position.z = inputz;
      text.position.y = inputy;
      text.receiveShadow = true;
      text.castShadow = true;
      scene.add(text);
    });
  }
  //function to create billboard
  function createBillboard(
    x,
    y,
    z,
    textureImage = billboardTextures.grassImage,
    urlLink,
    rotation = 0
  ) {
    const billboardPoleScale = { x: 1, y: 5, z: 1 };
    const billboardSignScale = { x: 30, y: 15, z: 1 };

    /* default texture loading */
    const loader = new THREE.TextureLoader(manager);

    const billboardPole = new THREE.Mesh(
      new THREE.BoxBufferGeometry(
        billboardPoleScale.x,
        billboardPoleScale.y,
        billboardPoleScale.z
      ),
      new THREE.MeshStandardMaterial({
        map: loader.load(woodTexture),
      })
    );

    const texture = loader.load(textureImage);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    var borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
    });

    var materials = [
      borderMaterial, // Left side
      borderMaterial, // Right side
      borderMaterial, // Top side   ---> THIS IS THE FRONT
      borderMaterial, // Bottom side --> THIS IS THE BACK
      loadedTexture, // Front side
      borderMaterial, // Back side
    ];
    // order to add materials: x+,x-,y+,y-,z+,z-
    const billboardSign = new THREE.Mesh(
      new THREE.BoxGeometry(
        billboardSignScale.x,
        billboardSignScale.y,
        billboardSignScale.z
      ),
      materials
    );

    billboardPole.position.x = x;
    billboardPole.position.y = y;
    billboardPole.position.z = z;

    billboardSign.position.x = x;
    billboardSign.position.y = y + 10;
    billboardSign.position.z = z;

    /* Rotate Billboard */
    billboardPole.rotation.y = rotation;
    billboardSign.rotation.y = rotation;

    billboardPole.castShadow = true;
    billboardPole.receiveShadow = true;

    billboardSign.castShadow = true;
    billboardSign.receiveShadow = true;

    billboardSign.userData = { URL: urlLink };

    scene.add(billboardPole);
    scene.add(billboardSign);
    addRigidPhysics(billboardPole, billboardPoleScale);

    cursorHoverObjects.push(billboardSign);
  }

  //create vertical billboard
  function createBillboardRotated(
    x,
    y,
    z,
    textureImage = billboardTextures.grassImage,
    urlLink,
    rotation = 0
  ) {
    const billboardPoleScale = { x: 1, y: 2.5, z: 1 };
    const billboardSignScale = { x: 15, y: 20, z: 1 };

    /* default texture loading */
    const loader = new THREE.TextureLoader(manager);
    const billboardPole = new THREE.Mesh(
      new THREE.BoxBufferGeometry(
        billboardPoleScale.x,
        billboardPoleScale.y,
        billboardPoleScale.z
      ),
      new THREE.MeshStandardMaterial({
        map: loader.load(woodTexture),
      })
    );
    const texture = loader.load(textureImage);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.encoding = THREE.sRGBEncoding;
    var borderMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
    });
    const loadedTexture = new THREE.MeshBasicMaterial({
      map: texture,
    });

    var materials = [
      borderMaterial, // Left side
      borderMaterial, // Right side
      borderMaterial, // Top side   ---> THIS IS THE FRONT
      borderMaterial, // Bottom side --> THIS IS THE BACK
      loadedTexture, // Front side
      borderMaterial, // Back side
    ];
    // order to add materials: x+,x-,y+,y-,z+,z-
    const billboardSign = new THREE.Mesh(
      new THREE.BoxGeometry(
        billboardSignScale.x,
        billboardSignScale.y,
        billboardSignScale.z
      ),
      materials
    );

    billboardPole.position.x = x;
    billboardPole.position.y = y;
    billboardPole.position.z = z;

    billboardSign.position.x = x;
    billboardSign.position.y = y + 11.25;
    billboardSign.position.z = z;

    /* Rotate Billboard */
    billboardPole.rotation.y = rotation;
    billboardSign.rotation.y = rotation;

    billboardPole.castShadow = true;
    billboardPole.receiveShadow = true;

    billboardSign.castShadow = true;
    billboardSign.receiveShadow = true;

    billboardSign.userData = { URL: urlLink };

    scene.add(billboardPole);
    scene.add(billboardSign);
    addRigidPhysics(billboardPole, billboardPoleScale);
    addRigidPhysics(billboardSign, billboardSignScale);

    cursorHoverObjects.push(billboardSign);
  }
  //function to create arrow signs
  function createBillboardWithArrows(){
	const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
	
    const onMouseDown = (event) => {
      // calculate pointer position in normalized device coordinates
      // (-1 to +1) for both components
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
	  let intersects = raycaster.intersectObjects(scene.children);
		
      // for (let i = 0; i < intersects.length; i++) {
      //   console.log(intersects);
      // }

      // change color of objects intersecting the raycaster
      // for (let i = 0; i < intersects.length; i++) {
      //   intersects[i].object.material.color.set(0xff0000);
      // }

      // change color of the closest object intersecting the raycaster
      if (intersects.length > 0) {
        //intersects[0].object.material.color.set(0xff0000);
		//var ball = scene.getObjectByName( "ball" ,true);
		//console.log("clicked on object");
		//console.log("intersects[0]",intersects[0]);
		//console.log("intersects[0].point",intersects[0].point);
		//console.log("intersects[0].point.x",intersects[0].point.x);
		var direction =  intersects[0].point;
		//console.log("direction=",direction);
		//ball.position.set(direction.x,direction.y,direction.z);
		//console.log("ball",ball);
		createBall(direction.x,direction.y,direction.z);
		//ball.position.x=intersects[0].point.x;
		//ball.position.x=intersects[0].point.y;
		//ball.position.x=intersects[0].point.z;
		//moveBall();
		//camera.lookAt(intersects[0].point);
		//renderer.render(scene,camera);
		//camera.getWorldDirection( direction );
		//var distance = -1;
		//camera.position.add( direction.multiplyScalar(distance) );
      }
	  
    };
	
    window.addEventListener('mousedown', onMouseDown);
	

  }

  //create X axis wall around entire plane
  function createWallX(x, y, z) {
    const wallScale = { x: 0.125, y: 4, z: 175 };

    const wall = new THREE.Mesh(
      new THREE.BoxBufferGeometry(wallScale.x, wallScale.y, wallScale.z),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        opacity: 0.75,
        transparent: true,
      })
    );

    wall.position.x = x;
    wall.position.y = y;
    wall.position.z = z;

    wall.receiveShadow = true;

    scene.add(wall);

    addRigidPhysics(wall, wallScale);
  }

  //create Z axis wall around entire plane
  function createWallZ(x, y, z) {
    const wallScale = { x: 175, y: 4, z: 0.125 };

    const wall = new THREE.Mesh(
      new THREE.BoxBufferGeometry(wallScale.x, wallScale.y, wallScale.z),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        opacity: 0.75,
        transparent: true,
      })
    );

    wall.position.x = x;
    wall.position.y = y;
    wall.position.z = z;

    wall.receiveShadow = true;

    scene.add(wall);

    addRigidPhysics(wall, wallScale);
  }

  //create brick wall
  function wallOfBricks() {
    const loader = new THREE.TextureLoader(manager);
    var pos = new THREE.Vector3();
    var quat = new THREE.Quaternion();
    var brickMass = 0.1;
    var brickLength = 3;
    var brickDepth = 3;
    var brickHeight = 1.5;
    var numberOfBricksAcross = 6;
    var numberOfRowsHigh = 6;

    pos.set(70, brickHeight * 0.5, -60);
    quat.set(0, 0, 0, 1);

    for (var j = 0; j < numberOfRowsHigh; j++) {
      var oddRow = j % 2 == 1;

      pos.x = 60;

      if (oddRow) {
        pos.x += 0.25 * brickLength;
      }

      var currentRow = oddRow ? numberOfBricksAcross + 1 : numberOfBricksAcross;
      for (let i = 0; i < currentRow; i++) {
        var brickLengthCurrent = brickLength;
        var brickMassCurrent = brickMass;
        if (oddRow && (i == 0 || i == currentRow - 1)) {
          //first or last brick
          brickLengthCurrent *= 0.5;
          brickMassCurrent *= 0.5;
        }
        var brick = createBrick(
          brickLengthCurrent,
          brickHeight,
          brickDepth,
          brickMassCurrent,
          pos,
          quat,
          new THREE.MeshStandardMaterial({
            map: loader.load(stoneTexture),
          })
        );
        brick.castShadow = true;
        brick.receiveShadow = true;

        if (oddRow && (i == 0 || i == currentRow - 2)) {
          //first or last brick
          pos.x += brickLength * 0.25;
        } else {
          pos.x += brickLength;
        }
        pos.z += 0.0001;
      }
      pos.y += brickHeight;
    }
  }

  //helper function to create individual brick mesh
  function createBrick(sx, sy, sz, mass, pos, quat, material) {
    var threeObject = new THREE.Mesh(
      new THREE.BoxBufferGeometry(sx, sy, sz, 1, 1, 1),
      material
    );
    var shape = new Ammo.btBoxShape(
      new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
    );
    shape.setMargin(0.05);

    createBrickBody(threeObject, shape, mass, pos, quat);

    return threeObject;
  }

  //add physics to brick body
  function createBrickBody(threeObject, physicsShape, mass, pos, quat) {
    threeObject.position.copy(pos);
    threeObject.quaternion.copy(quat);

    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );
    var motionState = new Ammo.btDefaultMotionState(transform);

    var localInertia = new Ammo.btVector3(0, 0, 0);
    physicsShape.calculateLocalInertia(mass, localInertia);

    var rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      physicsShape,
      localInertia
    );
    var body = new Ammo.btRigidBody(rbInfo);

    threeObject.userData.physicsBody = body;

    scene.add(threeObject);

    if (mass > 0) {
      rigidBodies.push(threeObject);

      // Disable deactivation
      body.setActivationState(4);
    }

    physicsWorld.addRigidBody(body);
  }

  function createTriangle(x, z) {
    var geom = new THREE.Geometry();
    var v1 = new THREE.Vector3(4, 0, 0);
    var v2 = new THREE.Vector3(5, 0, 0);
    var v3 = new THREE.Vector3(4.5, 1, 0);

    geom.vertices.push(v1);
    geom.vertices.push(v2);
    geom.vertices.push(v3);

    geom.faces.push(new THREE.Face3(0, 1, 2));
    geom.computeFaceNormals();

    var mesh = new THREE.Mesh(
      geom,
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    mesh.rotation.x = -Math.PI * 0.5;
    //mesh.rotation.z = -90;
    mesh.position.y = 0.01;
    mesh.position.x = x;
    mesh.position.z = z;
    scene.add(mesh);
  }

  //generic function to add physics to Mesh with scale
  function addRigidPhysics(item, itemScale) {
    let pos = { x: item.position.x, y: item.position.y, z: item.position.z };
    let scale = { x: itemScale.x, y: itemScale.y, z: itemScale.z };
    let quat = { x: 0, y: 0, z: 0, w: 1 };
    let mass = 0;
    var transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
    transform.setRotation(
      new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w)
    );

    var localInertia = new Ammo.btVector3(0, 0, 0);
    var motionState = new Ammo.btDefaultMotionState(transform);
    let colShape = new Ammo.btBoxShape(
      new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5)
    );
    colShape.setMargin(0.05);
    colShape.calculateLocalInertia(mass, localInertia);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(
      mass,
      motionState,
      colShape,
      localInertia
    );
    let body = new Ammo.btRigidBody(rbInfo);
    body.setActivationState(STATE.DISABLE_DEACTIVATION);
    body.setCollisionFlags(2);
    physicsWorld.addRigidBody(body);
  }

  function moveBall() {
    let scalingFactor = 20;
    let moveX = moveDirection.right - moveDirection.left;
    let moveZ = moveDirection.back - moveDirection.forward;
    let moveY = 0;

    if (ballObject.position.y < 2.01) {
      moveX = moveDirection.right - moveDirection.left;
      moveZ = moveDirection.back - moveDirection.forward;
      moveY = 0;
    } else {
      moveX = moveDirection.right - moveDirection.left;
      moveZ = moveDirection.back - moveDirection.forward;
      moveY = -0.25;
    }

    // no movement
    if (moveX == 0 && moveY == 0 && moveZ == 0) return;

    let resultantImpulse = new Ammo.btVector3(moveX, moveY, moveZ);
    resultantImpulse.op_mul(scalingFactor);
    let physicsBody = ballObject.userData.physicsBody;
    physicsBody.setLinearVelocity(resultantImpulse);
  }

  function renderFrame() {
    // FPS stats module
    stats.begin();

    const elapsedTime = galaxyClock.getElapsedTime() + 150;

    let deltaTime = clock.getDelta();
    if (!isTouchscreenDevice())
      if (document.hasFocus()) {
        moveBall();
      } else {
        moveDirection.forward = 0;
        moveDirection.back = 0;
        moveDirection.left = 0;
        moveDirection.right = 0;
      }
    else {
      moveBall();
    }

    updatePhysics(deltaTime);

    moveParticles();

    renderer.render(scene, camera);
    stats.end();

    galaxyMaterial.uniforms.uTime.value = elapsedTime * 5;
    //galaxyPoints.position.set(-50, -50, 0);

    // tells browser theres animation, update before the next repaint
    requestAnimationFrame(renderFrame);
  }

  //loading page section
  function startButtonEventListener() {
    for (let i = 0; i < fadeOutDivs.length; i++) {
      fadeOutDivs[i].classList.add('fade-out');
    }
    setTimeout(() => {
      document.getElementById('preload-overlay').style.display = 'none';
    }, 750);

    startButton.removeEventListener('click', startButtonEventListener);
    document.addEventListener('click', launchClickPosition);
    createBeachBall();

    setTimeout(() => {
      document.addEventListener('mousemove', launchHover);
    }, 1000);
  }

  function updatePhysics(deltaTime) {
    // Step world
    physicsWorld.stepSimulation(deltaTime, 10);

    // Update rigid bodies
    for (let i = 0; i < rigidBodies.length; i++) {
      let objThree = rigidBodies[i];
      let objAmmo = objThree.userData.physicsBody;
      let ms = objAmmo.getMotionState();
      if (ms) {
        ms.getWorldTransform(tmpTrans);
        let p = tmpTrans.getOrigin();
        let q = tmpTrans.getRotation();
        objThree.position.set(p.x(), p.y(), p.z());
        objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
      }
    }

    //check to see if ball escaped the plane
    if (ballObject.position.y < -50) {
      scene.remove(ballObject);
      createBall(8.75,0,0);
    }

    //check to see if ball is on text to rotate camera
    rotateCamera(ballObject);
  }

  //document loading
  manager.onStart = function (item, loaded, total) {
    //console.log("Loading started");
  };

  manager.onLoad = function () {
    var readyStateCheckInterval = setInterval(function () {
      if (document.readyState === 'complete') {
        clearInterval(readyStateCheckInterval);
        for (let i = 0; i < preloadDivs.length; i++) {
          preloadDivs[i].style.visibility = 'hidden'; // or
          preloadDivs[i].style.display = 'none';
        }
        for (let i = 0; i < postloadDivs.length; i++) {
          postloadDivs[i].style.visibility = 'visible'; // or
          postloadDivs[i].style.display = 'block';
        }
      }
    }, 1000);
    //console.log("Loading complete");
  };

  manager.onError = function (url) {
    //console.log("Error loading");
  };

	

  startButton.addEventListener('click', startButtonEventListener);

  if (isTouchscreenDevice()) {
    document.getElementById('appDirections').innerHTML =
      'Use the joystick in the bottom left to move the ball. Please use your device in portrait orientation!';
    createJoystick(document.getElementById('joystick-wrapper'));
    document.getElementById('joystick-wrapper').style.visibility = 'visible';
    document.getElementById('joystick').style.visibility = 'visible';
  }


  //initialize world and begin
  function start() {
	
    createWorld();
    createPhysicsWorld();

    createGridPlane();
    createBall(8.75,0,0);

    createWallX(87.5, 1.75, 0);
    createWallX(-87.5, 1.75, 0);
    createWallZ(0, 1.75, 87.5);
    createWallZ(0, 1.75, -87.5);

	
    createBillboard(
      -80,
      2.5,
      -70,
      billboardTextures.terpSolutionsTexture,
      URL.terpsolutions,
      Math.PI * 0.22
    );

    createBillboard(
      -45,
      2.5,
      -78,
      billboardTextures.bagHolderBetsTexture,
      URL.githubBagholder,
      Math.PI * 0.17
    );

    //createBillboardRotated(
    //  -17,
    //  1.25,
    //  -75,
    //  billboardTextures.homeSweetHomeTexture,
    //  URL.githubHomeSweetHome,
    //  Math.PI * 0.15
    //);

	const gltfLoader = new GLTFLoader();
	gltfLoader.load("/static/models/humanoid_robot/scene.gltf",(gltf)=>{
		//console.log("INSERTED ROBOT HERE",gltf);
		//for(let i=0;i<gltf.scene.children.length;i++){
		//	scene.add(gltf.scene.children[i]);
		//}
		const robot = gltf.scene;
		robot.scale.set(0.9,0.9,0.9);
		scene.add(robot);
		//const robot = gltf.scene.children[0];
		//robot.position.set(25.35,1.75,-19.29);
		//robot.scale.set(0.03,0.03,0.03);
		//scene.add(robot);
	},
	(progress)=>{
	//console.log(progress);
	},
	(error)=>{
	//console.log(error);
	});
	
    ryanFloydWords(11.2, 1, -20);
	loadPrakharEducationText('HACKATHON\n PROJECT',1.25,-75-10,2);
	
    createTextOnPlane(-70, 0.01, -48, inputText.terpSolutionsText, 20, 40);
	let terpSolutionsText = `Data Analyst(Python)
'Standard Chartered Bank - Global Business
Services, Private Limited
08/2020 - Present, Chennai,IN

Standard Chartered is a product based company 
which has recently started developing many AI 
tools in banking sector whose clients
include large corporations, governments, 
banks and investors headquartered, operating or 
investing in Asia, Africa and the Middle East.

ROLES AND DUTIES:-
-Extract the Client Request data from datasets 
and to perform automation of key extraction used 
regex matcher functions in python. 

-Usage of custom builded Machine Learning Models
to perform (NLP) synonym replacement, deletion of
past, present and future tense words from banking
dictionary words.

-Visualized the insights used HTML, CSS and mainly
in JS used combination of User Interface(React JS) 
and Application Programming Interface(Django and
Flask).

-Image duplicate prediction used mobilenet and
bounding box prediction used pretrained model of
pytorch Faster RCNN of resnet 50 with RPN(Region
Proposal Network)`;
    //simpleText(-70-5,0.01,-48-10,terpSolutionsText,0.7);
	createTextOnPlane(-42, 0.01, -53, inputText.bagholderBetsText, 20, 40);
	let bagholderBetsText = `Django REST API Creation - Company: - Standard
Chartered Bank GBS Standard Chartered Bank 
Global Business Services
Private Limited
Created apis that generates datapoints from
3 main ML Pipelines(ML,CV and NLP) and keep 
it into postgresql database. 
Created tables in database, optimized code
to put million rows of csv files into tables.
Made various apis for text features generation
like adverb count, noun count, adjective count,
profanity checks , etc from csv, excel,
text and pdf files. 
Made various apis for image features generation
like average brightness score, mean brightness 
score, average blurrness score, skewness check,
etc from single and multiple images  
Made functions for Upper Control Limit and
Lower Control Limit using Inter Quartile Range
for discrete data and X-bar and s control charts
values for continuous data. 
Send these calculations to frontend to show
in chart under Model Monitoring and Improvement 
Section. Daterange and classwise statistical 
accuracy and stability charts datapoints are sent
in UI to visualize the drift happening overall. 
Also created an api for payslips image to text 
conversion and generated both image and text 
features from the text. 
UNIT TESTING:- Used query params from postman 
app as input for testing purpose. Added Argument 
checklist for main functions as well.  
DEPLOYMENT:- Deployed all of the APIs in the 
linux virtual machine.`;
	//simpleText(-42,0.01,-48-10,bagholderBetsText,0.9);
    createTextOnPlane(-14, 0.01, -49, inputText.homeSweetHomeText, 20, 40);

    createBox(
      12,
      2,
      -70,
      4,
      4,
      1,
      boxTexture.Github,
      URL.gitHub,
      0x000000,
      true
    );

    // createBox(
    //   4,
    //   2,
    //   -70,
    //   4,
    //   4,
    //   1,
    //   boxTexture.twitter,
    //   URL.twitter,
    //   0xffffff,
    //   true
    // );

    createBox(
      19,
      2,
      -70,
      4,
      4,
      1,
      boxTexture.LinkedIn,
      URL.LinkedIn,
      0x0077b5,
      true
    );
    // createBox(
    //   35,
    //   2,
    //   -70,
    //   4,
    //   4,
    //   1,
    //   boxTexture.globe,
    //   URL.ryanfloyd,
    //   0xffffff,
    //   false
    // );

    createBox(
      27,
      2,
      -70,
      4,
      4,
      1,
      boxTexture.mail,
      'mailto:gprakhar0@gmail.com',
      0x000000,
      false
    );

    // createBox(
    //   44,
    //   2,
    //   -70,
    //   4,
    //   4,
    //   1,
    //   boxTexture.writing,
    //   URL.devTo,
    //   0x000000,
    //   false
    // );

    //createBox(
    //  35,
    //  2,
    //  -70,
    //  4,
    //  4,
    //  1,
    //  boxTexture.writing,
    //  URL.devTo,
    //  0x000000,
    //  false
    //);
	

    // floatingLabel(3.875, 4.5, -70, 'Twitter');
    floatingLabel(11.875, 4.5, -70, 'Github');
    floatingLabel(19.125, 4.5, -70, 'LinkedIn');
    floatingLabel(26.875, 4.5, -70, 'Email');
    // floatingLabel(35, 6.5, -70, '  Static \nWebsite');
    //floatingLabel(35, 6.5, -70, '   How I \nmade this');
    // floatingLabel(44, 6.5, -70, '   How I \nmade this');

    allSkillsSection(-50, 0.025, 20, 40, 40, boxTexture.allSkills);
	let allskillstext="Analytical Toolkit - Jupyter Notebook, Spyder, PostgreSQL\nServer, Mongo DB, Excel.\nDatabase - Cloud Firestore, Firebase, PostgreSQL\nDeep Learning Frameworks - Tensorflow, Keras.\n Machine Learning Frameworks - Scikitlearn, Huggingface, Numpy, Pandas. Natural Language Processing\nFrameworks - NLTK, Spacy, Gensim.\nVisualization Tools - Matplotlib, OpenCV.\nReporting Tools - Django, Flask, Streamlit, React JS(integration with REST APIs). "
	simpleText(-50,0.025,40,allskillstext,0.9);
	let journeytext= "ML/DL ALGORITHMS, TECHNIQUES\nLinear Regression | Logistic Regression | Support Vector Machines | Random\nForest | K-mean Clustering | Grid Search, Random search, Bayesian Search and\nK-folds | Dimensionality Reduction | NLTK | FasterRCNNs | Resnets |\nMobilenets.\n\nLessons Learnt\nIn the 1.6+ years of, passionate & diligent Data Science Journey. I have Learnt,\nSQL\nLearnt how to efficiently query the data from a database using PostgreSQL.\nClassification metrics computation\nImplemented Classification Algorithms and focused on getting metrics\n (metrics of confusion matrix) and other metrics (precision, recall, sensitivity\n, specificity and f1 score) and feeded different formulas of True Positive, True Negative\n, False Positive and False Negative.\nClean content Topic Modelling\nPerformed Topic Modeling similar to Clustering analysis in Python.\nDimensionality Reduction Performed to reduce the dimensions and find important features.\nBackward Elimination Automated to get the important features for columns of floats and ints\n while adding constant and removing afterwards using significance level comparison with p-value.\nK-Fold Split\nEnhance the model performances using Bayesian Search to reduce time spent on searching\n by using Grid Search and K-folds validation. Web scrapping\nDifferent city sites of justDial.com - there extracted data (phone number, kirana owner name\n and addresses) from html contents and builded a lxml parser.And\nextracting friends from mbasic site of facebook.com. Implemented an scraper\nthat takes username and password as input and gives extracted friends from\nfacebook as output.\nFace Detection of Avengers Cast\nDeployed on huggingface websites to detect faces of 5 different stars of avengers movie\n using a python api that generates encodings and labels of the dataset.\n";
	simpleText(81,-1,-24,journeytext,0.9);
    //allSkillsSection(61, 0.025, 13, 30, 60, inputText.activities);

    allSkillsSection(8.5, 0.025, 54, 7, 3.5, boxTexture.skrillex);
    //allSkillsSection(9, 0.01, 45, 15, 15, boxTexture.edmText);
	let edmtext = "SOFT SKILLS\nClassification-6 Algs Clustering-2 Algs\nDimensionality Reduction-2 Algs \nRegression-3 Algs\n\n\n";
	let edmtext2 = "ANALYTIC SKILL SET IN PYTHON\n(on a scale of 1-5)\nEDA(4) Model Building(5)\n Preprocessing(5)\nComputer Vision(5) Programming(5) \nData Visualization(5)"
    
	simpleText(9,0.01,45,edmtext,0.9);
	createTextOnPlane(9,0.01,45+20,inputText.analyticalSkills,20,20);
	createTextOnPlane(9-20-20-20,0.01,45+20,inputText.interests,40,20);
	
	
	//allSkillsSection(9, 0.01, 20, 21, 10.5, inputText.staticPortfolio);
	//create "software engineer text"
 
 
 	let staticPortfolio = "\n Electronics and Instrumentation \n\n04/2015 - 12/2020, 7.15GPA \nTechnical Courses - Neural Networks and Fuzzy Logics\n, Data Structures and Algorithms\n, Discrete Maths for Computer Programming\n, Digital Image Processing";
	simpleText(9, 0.01, 20, staticPortfolio, 1.2);
    //lensflare
    createLensFlare(50, -50, -800, 200, 200, boxTexture.lensFlareMain);
	
	loadPrakharEducationText('EDUCATION',0.01,20,3);
	loadPrakharEducationText('BITS Pilani Hyderabad Campus',0.01,24,1);
    loadRyanText();
    loadEngineerText();
	loadTimelineText();
    
    let touchText, instructionsText;
    if (isTouchscreenDevice()) {
      touchText = 'Touch boxes with your \nfinger to open links';
      instructionsText =
        '   Use the joystick in the bottom \nleft of the screen to move the ball.';
    } else {
      touchText = 'Click on boxes with \nthe mouse to open links';
      instructionsText =
        'Use the arrow keys on your \n keyboard to move the ball.';
    }

    simpleText(9, 0.01, 5, instructionsText, 1.25);

    simpleText(23, 0.01, -60, touchText, 1.5);
    simpleText(-50, 0.01, -5, 'PROGRAMMING SKILLS', 3);
    simpleText(-42+42+24+24, 0.01, -30-10-10, "BREAK THE CODE LEARNING WALL EVERY SINGLE DAY THROUGH HARD WORK AND DETERMINATION\nEXPERIENCE IN BELIEVING TO BECOME A BETTER VERSION OF MYSELVES AND OTHERS EVERY SINGLE DAY :) \n MY THINKING Creative and Innovative mould of thinking, consistency, aspiration and motivation are the important skills \nfor a being to strive towards an ideal to reach to the sun.\n Every idea was started in a basic container like garage. Any impossible can be reached is my motto and \n one's thirst for  knowledge and passion will help her/him to leave a significant mark in any field. \nThus, I am inclined to become a Data Scientist.", 0.9);
    simpleText(71, 0.01, -34, 'MY INCREDIBLE \n DATA SCIENCE \n JOURNEY!', 2);

	//simpleText(71, 0.01, 14+14+10, 'REFERENCES \n & OTHER\n PROJECTS!', 2);
	let otherProjects = "0.)Coursera Specializations\n\n1.) Neural Networks and Fuzzy Logics-Course Project on various Machine\nLearning Algorithms using matlab and python(keras)\n\n2.) Avengers Detector Deployed App on hugginface.io website using\npython (face detection api)\n\n3.) Internship Data Analysis Project mainly using python(Beautiful soup, firebase, firestore,also wrote function to keep data in mongodb)\n\nThousands of Barcode Generator GUI using Dynamic Programming in\nPython-Tkinter\n\n4.) Studied basics of Opencv Computer Vision Book using\npython(opencv)\n\n5.)Hand Gesture Recognition using React JS(Tensorflow.js)\n";
	createTextOnPlane(71, 0.02, 14+14+10+4+20, inputText.otherProjectReferences, 40, 40);
	createTextOnPlane(24+15,0.1,-20+20+10,inputText.timelinePicOne,20,40);
	createTextOnPlane(24+15,0.1,-20+20+20+20+20,inputText.timelinePicTwo,20,40);
	createBox(
      51,
      2,
      14+14+13,
      4,
      4,
      1,
      boxTexture.Github,
      "https://github.com/prakHr/Coursera-Specializations",
      0x000000,
      true
    );
	createBox(
      51+5,
      2,
      14+14+13,
      4,
      4,
      1,
      boxTexture.Github,
      "https://github.com/prakHr/NeuralNetworksAndFuzzyLogic",
      0x000000,
      true
    );
	createBox(
      51+5+5,
      2,
      14+14+13,
      4,
      4,
      1,
      boxTexture.Github,
      "https://github.com/prakHr/AvengersDetector",
      0x000000,
      true
    );
	createBox(
      51+5+5+5,
      2,
      14+14+13,
      4,
      4,
      1,
      boxTexture.Github,
      "https://github.com/prakHr/DataRepo",
      0x000000,
      true
    );
	createBox(
      51+5+5+5+5,
      2,
      14+14+13,
      4,
      4,
      1,
      boxTexture.Github,
      "https://github.com/prakHr/tkinter-barcode",
      0x000000,
      true
    );
	createBox(
      51+5+5+5+5+5,
      2,
      14+14+13,
      4,
      4,
      1,
      boxTexture.Github,
      "https://github.com/prakHr/opencv-computerVision",
      0x000000,
      true
    );
	createBox(
      51+5+5+5+5+5+5,
      2,
      14+14+13,
      4,
      4,
      1,
      boxTexture.Github,
      "https://github.com/prakHr/HandGestureRecognition",
      0x000000,
      true
    );
	//simpleText(71, 0.02, 14+14+10+4, otherProjects, 1.2);
	
    wallOfBricks();
    createTriangle(63, -55);
    createTriangle(63, -51);
    createTriangle(63, -47);
    createTriangle(63, -43);

    addParticles();
    glowingParticles();
    generateGalaxy();

    setupEventHandlers();
    // window.addEventListener('mousemove', onDocumentMouseMove, false);
    renderFrame();
	createBillboardWithArrows();
	createVideo('video',26.875+20,8.5,-80);
  }

  //check if user's browser has WebGL capabilities
  if (WEBGL.isWebGLAvailable()) {
    
    
	start();
	

  } else {
    noWebGL();
  }
});
