// Find the latest version by visiting https://cdn.skypack.dev/three.
import * as THREE from 'https://cdn.skypack.dev/three@0.131.3';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.131.3/examples/jsm/controls/OrbitControls.js';

import State from './state/state.js'
import createBoard from './engine/board.js';

let state

let container;
let camera, scene, raycaster, renderer, controls;
let fieldMeshes, pieceMeshes

let HOVERED_ELEMENT;
let SELECTED_PIECE, legalMoves = [];

const pointer = new THREE.Vector2();

init()
animate();









function init() {

  container = document.createElement('div');
  document.body.appendChild(container);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 10;
  camera.position.x = 3.5;
  camera.position.y = 3.5;

  /* const camera = new THREE.OrthographicCamera( window.innerWidth / - 2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / - 2, 0.1, 1000 );
  camera.position.z = 10;
  camera.position.x = 3.5;
  camera.position.y = 3.5; */


  scene = new THREE.Scene();
  scene.background = new THREE.Color('beige');

  const mainLight = new THREE.DirectionalLight( 0xffffff, 0.6);
  mainLight.castShadow = true;

  mainLight.position.set( 15, 22, 1 );
  mainLight.target.position.set( 0, 0, 0 );
  scene.add(mainLight, mainLight.target);

  const secondaryLight = new THREE.DirectionalLight( 0xffffff, 0.2);
  secondaryLight.position.set(3, 3, 10);
  secondaryLight.target.position.set(8, 8, 0);
  scene.add(secondaryLight, secondaryLight.target);

  const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5);
  scene.add(ambientLight); 

  const atmosphericLight = new THREE.SpotLight( 0xffffff, 0.3);
  atmosphericLight.castShadow = true; 
  atmosphericLight.position.set(0, 0, 10);
  atmosphericLight.target.position.set(3, 3, 0);
  scene.add(atmosphericLight, atmosphericLight.target);


  raycaster = new THREE.Raycaster();

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);


  controls = new OrbitControls(camera, renderer.domElement);
  controls.target = new THREE.Vector3(3.5, 3.5, 0);
  controls.update();
  controls.saveState();
  controls.enabled = false;


  addInterfaceEvents()


  
  state = new State();
  state.init();
  
  [ fieldMeshes, pieceMeshes ] = createBoard(scene, state)


}



function animate() {

  requestAnimationFrame(animate);
  render();

}



function render() {

  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera( pointer, camera );

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects( SELECTED_PIECE ? fieldMeshes : pieceMeshes );


  // Colour selected items
  if ( intersects.length > 0 ) {

    if ( HOVERED_ELEMENT != intersects[ 0 ].object ) {

      if ( HOVERED_ELEMENT ) 
        HOVERED_ELEMENT.material.emissive.setHex( HOVERED_ELEMENT.currentHex );

      HOVERED_ELEMENT = intersects[ 0 ].object;
      HOVERED_ELEMENT.currentHex = HOVERED_ELEMENT.material.emissive.getHex();
      HOVERED_ELEMENT.material.emissive.setHex( 0xff0000 );

    }

  } else {


    if ( HOVERED_ELEMENT && fieldMeshes.includes( HOVERED_ELEMENT )) {

      HOVERED_ELEMENT.material.emissive.setHex( HOVERED_ELEMENT.originalHex );

    } else if ( HOVERED_ELEMENT ) {

      HOVERED_ELEMENT.material.emissive.setHex( HOVERED_ELEMENT.currentHex );
    }


    HOVERED_ELEMENT = null;

  }

  renderer.render(scene, camera);

};



function addInterfaceEvents() {

  document.addEventListener('mousemove', onPointerMove);

  //

  window.addEventListener('resize', onWindowResize);

  //

  document.addEventListener("click", onMouseClick)

  //


  // UI Events

  //

  const rotateButton = document.querySelector(".rotate");
  const rotateInfo = document.querySelector(".rotateInfo");

  rotateButton.addEventListener("click", () => {
    controls.enabled = !controls.enabled;
    
    rotateButton.classList.toggle("active");
    rotateInfo.classList.toggle("visible");
  });

  //

  document.querySelector(".top").addEventListener("click", () => {
    controls.reset();
  });


  /* const sideViewButton = document.querySelector(".side");
  sideViewButton.addEventListener("click", () => {
    camera.position.z = 10;
    camera.position.x = 3.5;
    camera.position.y = 3.5;
  }); */

}



function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}



function onPointerMove(event) {

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

}



function onMouseClick(event) {

  if (HOVERED_ELEMENT) {
    
    if (!SELECTED_PIECE) {
      
      // Handle selection of the figure

      SELECTED_PIECE = HOVERED_ELEMENT;


      // Paint fields which figure can be moved to

      legalMoves = state.getLegalMoves( SELECTED_PIECE.state ).map( field => field.mesh );

      legalMoves.map( field => {

        field.originalHex = field.material.emissive.getHex();
        field.material.emissive.setHex( 0xff00ff );

      })

    } else {
      
      // Handle moving the figure

      moveFigure( SELECTED_PIECE, HOVERED_ELEMENT )

      
      legalMoves.map( field => field.material.emissive.setHex( field.originalHex ) )

      legalMoves = []
      SELECTED_PIECE = null;

    }
  }

}



function moveFigure(pieceMesh, fieldMesh) {

  if (pieceMesh.state.field.mesh === fieldMesh) {

        // If the target fieldMesh is the one that the figure is already standing on, do nothing
        return

  } else if ( legalMoves.includes(fieldMesh) ) {

    state.move(pieceMesh.state, fieldMesh.state);

    pieceMesh.translateX( fieldMesh.position.x - pieceMesh.position.x )
    pieceMesh.translateY( fieldMesh.position.y - pieceMesh.position.y )

  }
}

