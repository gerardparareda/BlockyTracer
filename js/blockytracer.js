var camera, scene, renderer, controls;
var objects = [];
var raycasterBottom;
var raycasterForward;
var raycasterMouse;
var raycasterLight;
var raycasterTest;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var canJump = false;
var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var vertex = new THREE.Vector3();
var color = new THREE.Color();
var debug;
var blocks = [];
var lightBlocks = [];
var noLightBlocks = [];
var lastIntersect;
var types = ['solid', 'glass', 'light'];
var type = "solid";
var audios = {};
var playingAudios = [];
var currentSelected = 0;
var sinVal;
var stats = new Stats();
var tmpIl;
var lightKey = 3;
var lightKey2 = 45;
var refreshScreen = false;
var iterNoLightBlock = 0;
var iterLightBlock = 0;
var iterNoLightFace = 0;
var iterLightFace = 0;
var sB;
var lB;
var geomSB;
var geomLB;
var lightFaceColor;
var iluminationEnded;
var waitFirstFrame = true;
var solidColor;
var glassColor;
var lightColor;
var renderType = 1;
var pickingColor = false;
var stopPickingColor;
var uiPickingColor;
var crosshair;
var redoIlumination = false;

init();

animate();

function init() {
    debug = document.getElementById("debug");
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 1000 );
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

    ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    collisionsRay = new THREE.Raycaster();

    controls = new THREE.PointerLockControls( camera );

    audios.placeBlock = new Audio("sfx/jumpland.mp3");
    audios.deleteBlock = new Audio("sfx/stepwood_2.mp3");
    audios.walk = new Audio("sfx/walking.ogg");
    audios.switchInventory = new Audio("sfx/click4.ogg");

    var blocker = document.getElementById( 'blocker' );

    stats.showPanel( 0 );
    document.body.appendChild( stats.dom );
    stopPickingColor = document.getElementById("stopPickingColor");
    uiPickingColor = document.getElementById("pickerUI");
    crosshair = document.getElementById("crosshair");
    stopPickingColor.style.display = "none";
    document.getElementById("pickerUI").style.visibility = "hidden";


    instructions.addEventListener( 'click', function () {
        controls.lock();
    }, false );

    document.addEventListener('click', function() {
        if(controls.isLocked){
            mouseClick(event.button);
        } else{
            if(pickingColor){
                document.getElementById("pickerUI").style.visibility = "";
                //document.getElementById('colorPicker').jscolor.show();
                stopPickingColor.style.display = "";

            }
        }
    });

    uiPickingColor.addEventListener('click', function (){
        console.log("this");
        pickingColor = true;
        document.getElementById('colorPicker').jscolor.show();
    });

    stopPickingColor.addEventListener('click', function (){
        pickingColor = false;
        controls.lock();
        document.getElementById("pickerUI").style.visibility = "hidden";
        stopPickingColor.style.display = "none";
        crosshair.style.display = "";
        console.log("this2");
    });

    document.addEventListener("wheel", event => {
        if(controls.isLocked){
            const delta = Math.sign(event.deltaY);

            scrollInventory(delta);
        }
    });

    controls.addEventListener( 'lock', function () {
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    } );

    controls.addEventListener( 'unlock', function () {
        if(pickingColor){
            document.getElementById("pickerUI").style.visibility = "";
            stopPickingColor.style.display = "";
        } else{
            blocker.style.display = 'block';
            instructions.style.display = '';
        }
    } );

    scene.add( controls.getObject() );

    var onKeyDown = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                moveForward = true;
                break;
            case 37: // left
            case 65: // a
                moveLeft = true;
                break;
            case 40: // down
            case 83: // s
                moveBackward = true;
                break;
            case 39: // right
            case 68: // d
                moveRight = true;
                break;
            case 32: // space
                if ( canJump === true ) velocity.y += 350;
                canJump = false;
                break;
            case 49:
                changeSelected(0);
                break;
            case 50:
                changeSelected(1);
                break;
            case 51:
                changeSelected(2);
                break;
            case 79:
                lightKey++;
                //console.log(lightKey);
                break;
            case 76:
                lightKey--;
                //console.log(lightKey);
                break;
            case 73:
                lightKey2 += 5;
                //console.log(lightKey2);
                break;
            case 75:
                lightKey2 -= 5;
                //console.log(lightKey2);
                break;
            case 69:
                checkRayCast();
                break;
            case 81:
                if(controls.isLocked) pickColor();
                break;
            case 85:
                renderType = Math.min(2, ++renderType);
                restartIlumination();
                console.log("Change render type");
                break;
            case 74:
                renderType = Math.max(0, --renderType);
                if(renderType == 1){
                    redoIlumination = true;
                }
                restartIlumination();
                console.log("Change render type");
                break;
        }
    };
    var onKeyUp = function ( event ) {
        switch ( event.keyCode ) {
            case 38: // up
            case 87: // w
                moveForward = false;
                break;
            case 37: // left
            case 65: // a
                moveLeft = false;
                break;
            case 40: // down
            case 83: // s
                moveBackward = false;
                break;
            case 39: // right
            case 68: // d
                moveRight = false;
                break;
        }
    };

    document.addEventListener( 'keydown', onKeyDown, false );
    document.addEventListener( 'keyup', onKeyUp, false );

    raycasterBottom = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 2.5 );
    raycasterMouse = new THREE.Raycaster();
    raycasterLight = new THREE.Raycaster();
    raycasterForward = new THREE.Raycaster();

    // floor
    var floorGeometry = new THREE.PlaneBufferGeometry( 2000, 2000, 100, 100 );
    floorGeometry.rotateX( - Math.PI / 2 );    
    var floorMaterial = new THREE.MeshLambertMaterial({ color: "gray" });
    var floor = new THREE.Mesh( floorGeometry, floorMaterial );
    floor.typeObject = "floor";
    //floor.receiveShadow = true;
    scene.add( floor );

    //Change colors
    changeColor("solid", 0xf4c542);
    changeColor("glass", 0x0099ff);
    changeColor("light", 0xffcc00);

    updateUIColors("f4c542");
    //Generate terrain
    createStructure();

    //Spawn player above floor
    controls.getObject().position.y = 10;

    //
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    //
    window.addEventListener( 'resize', onWindowResize, false );
}

function createMaterial(){
    if(type == "light"){
        var material = new THREE.MeshPhongMaterial({
            color: lightColor,
            vertexColors: THREE.VertexColors,
            emissive: lightColor
        });
    }else if(type == "glass"){
        var material = new THREE.MeshPhongMaterial({
            transparent: true,
            opacity: 0.5,
            color: glassColor, //0x0099ff
            visible: true,
            vertexColors: THREE.VertexColors
        });
    }else{
        var material = new THREE.MeshLambertMaterial({ color: solidColor, shading: THREE.FlatShading, vertexColors: THREE.VertexColors });
    }

    return material;
}

function pickColor(){
    if(!pickingColor){
        pickingColor = true;
        controls.unlock();
        document.getElementById("pickerUI").style.visibility = "";
        stopPickingColor.style.visibility = "";
        document.getElementById('colorPicker').jscolor.show();
        crosshair.style.display = "none";
    }
}

function updateUIColors(jscolor){
    if(type == "solid"){
        document.getElementById('Solid').style.fill = '#' + jscolor; 
    }
    if(type == "glass"){
        document.getElementById('Glass').style.fill = '#' + jscolor; 
    }
    if(type == "light"){
        document.getElementById('Light').style.fill = '#' + jscolor; 
    }
}

function updateGameColor(jscolor){
    console.log('#' + jscolor);
    changeColor(type, '#' + jscolor);
    console.log(solidColor.getHexString());
}

function changeColor(type, color){
    switch(type){
        case "solid":
            solidColor = new THREE.Color(color);
            break;
        case "glass":
            glassColor = new THREE.Color(color);
            break;
        case "light":
            lightColor = new THREE.Color(color);
            break;
    }

}

function changeFaceColor(block, face){

    var newIntensity = block.lightShades[face];
    var newColor = new THREE.Color(block.shadeColor[face].r, block.shadeColor[face].g, block.shadeColor[face].b);

    if(renderType == 2){
        newColor = new THREE.Color(block.material.color.r, block.material.color.g, block.material.color.b);
    } else {
        newColor = new THREE.Color((block.material.color.r + newColor.r) * newIntensity, (block.material.color.r + newColor.g) * newIntensity, (block.material.color.r + newColor.b) * newIntensity);

    }

    var geometry = block.geometry;
    switch(face){
        case 0:
            geometry.faces[0].color.set(newColor); //Right 1
            geometry.faces[1].color.set(newColor); //Right 2
            break;
        case 1:
            geometry.faces[2].color.set(newColor); //Left 1
            geometry.faces[3].color.set(newColor); //Left 2
            break;
        case 2:
            geometry.faces[4].color.set(newColor); //Top 1
            geometry.faces[5].color.set(newColor); //Top 2
            break;
        case 3:
            geometry.faces[6].color.set(newColor); //Bottom 1
            geometry.faces[7].color.set(newColor); //Bottom 2
            break;
        case 4:
            geometry.faces[8].color.set(newColor); //Front 1
            geometry.faces[9].color.set(newColor); //Front 2
            break;
        case 5:
            geometry.faces[10].color.set(newColor);//Rear 1
            geometry.faces[11].color.set(newColor);//Rear 2
            break;
    }
    geometry.elementsNeedUpdate = true;
}

function iluminateBlock(block){
    changeFaceColor(block, 0);
    changeFaceColor(block, 1);
    changeFaceColor(block, 2);
    changeFaceColor(block, 3);
    changeFaceColor(block, 4);
    changeFaceColor(block, 5);
}

function iluminateFace(block, face){
    changeFaceColor(block, face);
}

function restartIlumination(){
    iluminationEnded = false;
    iterNoLightBlock = noLightBlocks.length - 1;
    iterNoLightFace = 0;
    iterLightBlock = lightBlocks.length - 1;
    iterLightFace = 0;
    lightFaceColor = new THREE.Color(0,0,0);
    tmpIl = 0;
    tmpIl2 = 0;

    if(noLightBlocks.length > 0){
        sB = noLightBlocks[iterNoLightBlock];
        geomSB = sB.geometry; //geomSB: geometry Solid Block

    }

    if(lightBlocks.length > 0){
        lB = lightBlocks[iterLightBlock];
        geomLB = lB.geometry;  
    }
}

function iluminateScene(){

    if(lightBlocks.length == 0 && noLightBlocks.length == 0){
        iluminationEnded = true;
    }

    if( !iluminationEnded && typeof sB !== 'undefined' && typeof lB !== 'undefined' && lightBlocks.length > 0){
        if(sB.adjacents[iterNoLightFace] != 1 && ((Math.abs(sB.coord.x - lB.coord.x) < 10) || (Math.abs(sB.coord.y - lB.coord.y) < 10) || (Math.abs(sB.coord.z - lB.coord.z) < 10))){ //iterLightFace != iterNoLightFace && 
            tmpIl2 = 0;
            for(var iterLightFace = 0; iterLightFace < 6 && lightBlocks.length != 0; iterLightFace++){
                //console.log("No light block: " + iterNoLightBlock);
                //console.log("No light block face: " + iterNoLightFace);
                //console.log("Light block: " + iterLightBlock);
                //console.log("Light block face: " + iterLightFace);
                //console.log("-------------------");

                if(iterLightFace == iterNoLightFace){
                    continue;
                }

                if(typeof geomLB.faces[iterLightFace*2] == 'undefined'){
                    //console.log("here");
                }

                var rOrigin = new THREE.Vector3(
                    lB.position.x + (geomLB.faces[iterLightFace*2].normal.x) * 3, 
                    lB.position.y + (geomLB.faces[iterLightFace*2].normal.y) * 3, 
                    lB.position.z + (geomLB.faces[iterLightFace*2].normal.z) * 3
                );
                
                //rDestination: ray Destination
                var rDestination = new THREE.Vector3(
                    sB.position.x + (geomSB.faces[iterNoLightFace*2].normal.x) * 3,
                    sB.position.y + (geomSB.faces[iterNoLightFace*2].normal.y) * 3,
                    sB.position.z + (geomSB.faces[iterNoLightFace*2].normal.z) * 3
                );

                if(notIntersectLightRay(rOrigin, rDestination)){
                            
                    tmpIl2 = Math.max(normalizeLightDistance(rOrigin.distanceTo(rDestination))*2, tmpIl2);

                }
            }
        }
    }

        if(typeof tmpIl2 !== 'undefined'){
            tmpIl = Math.min(2.5, tmpIl + tmpIl2);
            tmpIl2 = 0;
        }

        if(tmpIl > 0){
            var ncolor = new THREE.Color(lightBlocks[iterLightBlock].material.color.r, lightBlocks[iterLightBlock].material.color.g, lightBlocks[iterLightBlock].material.color.b);
            ncolor = new THREE.Color(ncolor.r * tmpIl, ncolor.g * tmpIl, ncolor.b * tmpIl);
            lightFaceColor.add(ncolor);
        }
        
        iterLightBlock--;

        if(iterLightBlock >= 0){
            lB = lightBlocks[iterLightBlock]; //lB: light Block
            geomLB = lB.geometry;    
        }

        //Final tots els blocs de llum
        if(iterLightBlock == -1 || lightBlocks.length == 0){
            //iterLightFace = 0;
            iterLightBlock = lightBlocks.length - 1;
            
            if(typeof sB !== 'undefined'){
                //sB.lightShades[iterNoLightFace] != tmpIl  || 
                if( redoIlumination ||  !(sB.shadeColor[iterNoLightFace].r == lightFaceColor.r && sB.shadeColor[iterNoLightFace].g == lightFaceColor.g && sB.shadeColor[iterNoLightFace].b == lightFaceColor.b)){                
                    sB.lightShades[iterNoLightFace] = tmpIl;
                    sB.shadeColor[iterNoLightFace] = new THREE.Color(lightFaceColor.r, lightFaceColor.g, lightFaceColor.b);
                    //console.log(iterNoLightFace + " " + sB.lightShades[iterNoLightFace] + ", c: " + lightFaceColor.getHexString());
        
                    iluminateFace(sB, iterNoLightFace);
                }
            }

            if(typeof lightFaceColor !== 'undefined'){
                lightFaceColor.set(0,0,0);
            }

            if(iterLightBlock >= 0){
                lB = lightBlocks[iterLightBlock]; //lB: light Block
                geomLB = lB.geometry;    
            }

            iterNoLightFace++;
            tmpIl = 0;
            
            //Final totes cares no llum
            if(iterNoLightFace == 6){
                iterLightFace = 0;
                iterLightBlock = lightBlocks.length - 1;
                iterNoLightFace = 0;
                iterNoLightBlock--;

                if(iterNoLightBlock >= 0){
                    sB = noLightBlocks[iterNoLightBlock]; //sb: solid Block
                    geomSB = sB.geometry; //geomSB: geometry Solid Block
                }

                //Canvi de bloc no llum
                if(iterNoLightBlock <= -1){
                    iluminationEnded = true;
                    redoIlumination = false;
                }
            }
        }
    //}
}

function iluminateScene2(){

    if(lightBlocks.length == 0 && noLightBlocks.length == 0){
        iluminationEnded = true;
    }

    if( !iluminationEnded && typeof sB !== 'undefined' && lB !== 'undefined' && lightBlocks.length > 0){
        if(sB.adjacents[iterNoLightFace] != 1 && ((Math.abs(sB.coord.x - lB.coord.x) < 10) || (Math.abs(sB.coord.y - lB.coord.y) < 10) || (Math.abs(sB.coord.z - lB.coord.z) < 10))){ //iterLightFace != iterNoLightFace && 
            //console.log("No light block: " + iterNoLightBlock);
            //console.log("No light block face: " + iterNoLightFace);
            //console.log("Light block: " + iterLightBlock);
            //console.log("Light block face: " + iterLightFace);
            //console.log("-------------------");

            var rOrigin = new THREE.Vector3(
                lB.position.x + (geomLB.faces[iterLightFace*2].normal.x) * 3, 
                lB.position.y + (geomLB.faces[iterLightFace*2].normal.y) * 3, 
                lB.position.z + (geomLB.faces[iterLightFace*2].normal.z) * 3
            );
            
            //rDestination: ray Destination
            var rDestination = new THREE.Vector3(
                sB.position.x + (geomSB.faces[iterNoLightFace*2].normal.x) * 3,
                sB.position.y + (geomSB.faces[iterNoLightFace*2].normal.y) * 3,
                sB.position.z + (geomSB.faces[iterNoLightFace*2].normal.z) * 3
            );

            if(notIntersectLightRay(rOrigin, rDestination)){
                        
                tmpIl2 = Math.max(normalizeLightDistance(rOrigin.distanceTo(rDestination))*2, tmpIl2);

            }
        }
    }

    iterLightFace++;

    //Final totes cares llum
    if(iterLightFace == 6 || lightBlocks.length == 0){
        iterLightFace = 0;


        tmpIl = Math.min(2.5, tmpIl + tmpIl2);
        tmpIl2 = 0;

        if(tmpIl > 0){
            var ncolor = new THREE.Color(lightBlocks[iterLightBlock].material.color.r, lightBlocks[iterLightBlock].material.color.g, lightBlocks[iterLightBlock].material.color.b);
            ncolor = new THREE.Color(ncolor.r * tmpIl, ncolor.g * tmpIl, ncolor.b * tmpIl);
            lightFaceColor.add(ncolor);
        }
        
        iterLightBlock--;

        if(iterLightBlock >= 0){
            lB = lightBlocks[iterLightBlock]; //lB: light Block
            geomLB = lB.geometry;    
        }

        //Final tots els blocs de llum
        if(iterLightBlock == -1 || lightBlocks.length == 0){
            iterLightFace = 0;
            iterLightBlock = lightBlocks.length - 1;
            
            if( redoIlumination || sB.lightShades[iterNoLightFace] != tmpIl  || !(sB.shadeColor[iterNoLightFace].r == lightFaceColor.r && sB.shadeColor[iterNoLightFace].g == lightFaceColor.g && sB.shadeColor[iterNoLightFace].b == lightFaceColor.b)){                
                sB.lightShades[iterNoLightFace] = tmpIl;
                sB.shadeColor[iterNoLightFace] = new THREE.Color(lightFaceColor.r, lightFaceColor.g, lightFaceColor.b);
                console.log(iterNoLightFace + " " + sB.lightShades[iterNoLightFace] + ", c: " + lightFaceColor.getHexString());
    
                iluminateFace(sB, iterNoLightFace);
            }

            lightFaceColor.set(0,0,0);

            if(iterLightBlock >= 0){
                lB = lightBlocks[iterLightBlock]; //lB: light Block
                geomLB = lB.geometry;    
            }

            iterNoLightFace++;
            tmpIl = 0;
            
            //Final totes cares no llum
            if(iterNoLightFace == 6){
                iterLightFace = 0;
                iterLightBlock = lightBlocks.length - 1;
                iterNoLightFace = 0;
                iterNoLightBlock--;

                if(iterNoLightBlock >= 0){
                    sB = noLightBlocks[iterNoLightBlock]; //sb: solid Block
                    geomSB = sB.geometry; //geomSB: geometry Solid Block
                }

                //Canvi de bloc no llum
                if(iterNoLightBlock <= -1){
                    iluminationEnded = true;
                    redoIlumination = false;
                }
            }
        }
    }
}

function iluminateScene3(){
    for(var b = 0; b < blocks.length; b++){
        iluminateBlock(blocks[b]);
    }
    
    iluminationEnded = true;
    
}

function normalizeLightDistance(distance){
    return (1 - distance / (lightKey2))/lightKey;
}

function changeSelected(num){
    document.getElementById("ui").children[currentSelected].classList.remove("itemSelected");
    currentSelected = num;
    document.getElementById("ui").children[currentSelected].classList.add("itemSelected");
    type = types[currentSelected];
    playAudio("switchInventory");

    showItemText();

}

function showItemText(){
    var string;
    switch(currentSelected){
        case 0:
            string = "Solid";
            break;
        case 1:
            string = "Glass";
            break;
        case 2:
            string = "Light";
            break;
    }
    document.getElementById('textdiv').childNodes[0].innerText = string;
    var elm = document.getElementById('textdiv');
    var newone = elm.cloneNode(true);
    elm.parentNode.replaceChild(newone, elm);
}

function scrollInventory(ammount){
    document.getElementById("ui").children[currentSelected].classList.remove("itemSelected");
    if(currentSelected + ammount > 2){
        currentSelected = 0;
    } else if(currentSelected + ammount < 0){
        currentSelected = 2;
    } else{
        currentSelected += ammount;
    }
    document.getElementById("ui").children[currentSelected].classList.add("itemSelected");
    type = types[currentSelected];
    playAudio("switchInventory");

    showItemText();
}

function checkAdjacents(block){
    for(var idx = 0; idx < blocks.length; idx++){
        //If block is not adjacent in any possible way
        if(!((Math.abs(block.coord.x - blocks[idx].coord.x) + Math.abs(block.coord.y - blocks[idx].coord.y) + Math.abs(block.coord.z - blocks[idx].coord.z) < 3 ))){
            continue;
        }

        if(block.coord.x - blocks[idx].coord.x == 1 && block.coord.y == blocks[idx].coord.y && block.coord.z == blocks[idx].coord.z){
            block.adjacents[1] = 1;
            blocks[idx].adjacents[0] = 1;
        }
        if(block.coord.x - blocks[idx].coord.x == -1 && block.coord.y == blocks[idx].coord.y && block.coord.z == blocks[idx].coord.z){
            block.adjacents[0] = 1;
            blocks[idx].adjacents[1] = 1;
        }
        if(block.coord.y - blocks[idx].coord.y == 1 && block.coord.x == blocks[idx].coord.x && block.coord.z == blocks[idx].coord.z){
            block.adjacents[3] = 1;
            blocks[idx].adjacents[2] = 1;
        }
        if(block.coord.y - blocks[idx].coord.y == -1 && block.coord.x == blocks[idx].coord.x && block.coord.z == blocks[idx].coord.z){
            block.adjacents[2] = 1;
            blocks[idx].adjacents[3] = 1;
        }
        if(block.coord.z - blocks[idx].coord.z == 1 && block.coord.y == blocks[idx].coord.y && block.coord.x == blocks[idx].coord.x){
            block.adjacents[5] = 1;
            blocks[idx].adjacents[4] = 1;
        }
        if(block.coord.z - blocks[idx].coord.z == -1 && block.coord.y == blocks[idx].coord.y && block.coord.x == blocks[idx].coord.x){
            block.adjacents[4] = 1;
            blocks[idx].adjacents[5] = 1;
        }
    }
}

function removeAdjacents(block){
    for(var idx = 0; idx < blocks.length; idx++){
        //If block is not adjacent in any possible way
        if(!((Math.abs(block.coord.x - blocks[idx].coord.x) + Math.abs(block.coord.y - blocks[idx].coord.y) + Math.abs(block.coord.z - blocks[idx].coord.z) < 3 ))){
            continue;
        }

        if(block.coord.x - blocks[idx].coord.x == 1 && block.coord.y == blocks[idx].coord.y && block.coord.z == blocks[idx].coord.z){
            block.adjacents[1] = 0;
            blocks[idx].adjacents[0] = 0;
        }
        if(block.coord.x - blocks[idx].coord.x == -1 && block.coord.y == blocks[idx].coord.y && block.coord.z == blocks[idx].coord.z){
            block.adjacents[0] = 0;
            blocks[idx].adjacents[1] = 0;
        }
        if(block.coord.y - blocks[idx].coord.y == 1 && block.coord.x == blocks[idx].coord.x && block.coord.z == blocks[idx].coord.z){
            block.adjacents[3] = 0;
            blocks[idx].adjacents[2] = 0;
        }
        if(block.coord.y - blocks[idx].coord.y == -1 && block.coord.x == blocks[idx].coord.x && block.coord.z == blocks[idx].coord.z){
            block.adjacents[2] = 0;
            blocks[idx].adjacents[3] = 0;
        }
        if(block.coord.z - blocks[idx].coord.z == 1 && block.coord.y == blocks[idx].coord.y && block.coord.x == blocks[idx].coord.x){
            block.adjacents[5] = 0;
            blocks[idx].adjacents[4] = 0;
        }
        if(block.coord.z - blocks[idx].coord.z == -1 && block.coord.y == blocks[idx].coord.y && block.coord.x == blocks[idx].coord.x){
            block.adjacents[4] = 0;
            blocks[idx].adjacents[5] = 0;
        }
    }
}

function createBlock(x, y, z, sound){
    var boxGeometry = new THREE.BoxGeometry(5,5,5);
    var boxMaterial = createMaterial();
    var box = new THREE.Mesh(boxGeometry, boxMaterial);
    if(type == "light"){
        box.lightShades = [1, 1, 1, 1, 1, 1];    //Right, Left, Top, Bottom, Front, Rear
    } else {
        box.lightShades = [0, 0, 0, 0, 0, 0];
    }
    box.adjacents = [0, 0, 0, 0, 0, 0]; //Right, Left, Top, Bottom, Front, Rear
    box.shadeColor = [new THREE.Color(0,0,0), new THREE.Color(0,0,0), new THREE.Color(0,0,0), new THREE.Color(0,0,0), new THREE.Color(0,0,0), new THREE.Color(0,0,0)]; //Right, Left, Top, Bottom, Front, Rear
    box.position.set(x*5,y*5 + 2.5,z*5);
    box.typeObject = "block";
    box.materialType = type;
    box.coord = {x, y, z};
    //console.log(x + " " + z + " " + y);
    checkAdjacents(box);
    iluminateBlock(box);
    blocks.push(box);
    if(type == "light"){
        lightBlocks.push(box);
    }else{
        noLightBlocks.push(box);
    }
    scene.add(box);
    if(sound){
        playAudio("placeBlock");
    }
}

function checkCollisions(centerVertex){

    var outerVertices = [
        {x:centerVertex.x + 2, y:centerVertex.y + 2.5, z:centerVertex.z + 2},
        {x:centerVertex.x + 2, y:centerVertex.y + 2.5, z:centerVertex.z - 2},
        {x:centerVertex.x - 2, y:centerVertex.y + 2.5, z:centerVertex.z + 2},
        {x:centerVertex.x - 2, y:centerVertex.y + 2.5, z:centerVertex.z - 2},
        {x:centerVertex.x + 2, y:centerVertex.y - 5, z:centerVertex.z + 2},
        {x:centerVertex.x + 2, y:centerVertex.y - 5, z:centerVertex.z - 2},
        {x:centerVertex.x - 2, y:centerVertex.y - 5, z:centerVertex.z + 2},
        {x:centerVertex.x - 2, y:centerVertex.y - 5, z:centerVertex.z - 2}
    ];
    
    for (var vertexIndex = 0; vertexIndex < outerVertices.length; vertexIndex++)
    {       
        var outerVertex = new THREE.Vector3(outerVertices[vertexIndex].x, outerVertices[vertexIndex].y, outerVertices[vertexIndex].z);
        var directionVector = new THREE.Vector3();
        directionVector.subVectors(outerVertex, controls.getObject().position);

        var normalizedDirection = new THREE.Vector3();
        normalizedDirection.copy(directionVector);
        normalizedDirection.normalize();

        collisionsRay.set(controls.getObject().position, normalizedDirection);
        var collisionResults = collisionsRay.intersectObjects(scene.children);



        if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
            // a collision occurred... do something...
            //console.log("lmao");
            return vertexIndex;
        }
    }


}

function checkCollisions2(newPosition){

    var dir = new THREE.Vector3();
    dir.subVectors(newPosition, controls.getObject().position);
    //console.log(dir);
    normDir = new THREE.Vector3();
    normDir.copy(dir);
    normDir.normalize()
    normDir.y = 0;

    var origin = new THREE.Vector3();
    origin.copy(controls.getObject().position);
    origin.y -= 5;

    collisionsRay.set(origin, normDir);
    var results = collisionsRay.intersectObjects(scene.children);

    if (results.length > 0 && results[0].distance < 2.5) {
        return results[0].face.normal;
    }
}

function createLine(vec1, vec2){
    var material = new THREE.LineBasicMaterial({
        color: 0x0000ff
    });
    
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        vec1, vec2
    );
    
    var line = new THREE.Line( geometry, material );
    line.typeObject = "line";
    scene.add( line );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function checkRayCast(){
    var origin = new THREE.Vector3(10,5.5,-15);
    var dest = new THREE.Vector3(3,2.5,-15);
    var dir = new THREE.Vector3();
    dir.subVectors(dest, origin);

    raycasterTest = new THREE.Raycaster(origin, dir.normalize());
    var ints = raycasterTest.intersectObjects(scene.children); 
    console.log(ints);
}

function notIntersectLightRay(origin, destination){
    raycasterLight.ray.origin.copy(origin);
    var dir = new THREE.Vector3();
    dir.subVectors(destination, origin);
    
    raycasterLight.ray.direction.copy(dir.normalize());
    //console.log(scene.children);
    var intersection = raycasterLight.intersectObjects(scene.children);
    if(intersection.length > 0 && intersection[0].object.typeObject == "block" && intersection[0].distance < destination.distanceTo(origin)){
        return false;
        
    }else{
        return true;
    }
}

function playAudio(audioName){
    playingAudios.push(audios[audioName].cloneNode());
    playingAudios[playingAudios.length-1].addEventListener("ended", function(){
        if(audioName == "walk"){
            //playingAudios[playingAudios.length-1].currentTime = 0;
            //playingAudios.splice(playingAudios[playingAudios.length-1],1);
        } else {
             //playingAudios[playingAudios.length-1].currentTime = 0;
            playingAudios.splice(playingAudios[playingAudios.length-1],1);
        }
       
    });
    playingAudios[playingAudios.length-1].play();
}

function deleteBlock(block){
    removeAdjacents(block.object);
    scene.remove(block.object);
    block.object.material.dispose();
    block.object.geometry.dispose();
    var blocksIndex = blocks.findIndex(obj => obj.uuid == block.object.uuid);
    blocks.splice(blocksIndex, 1);
    if(block.object.materialType == "light"){
        var lightIndex = lightBlocks.findIndex(obj => obj.uuid == block.object.uuid);
        lightBlocks.splice(lightIndex, 1);
    }else{
        var noLightIndex = noLightBlocks.findIndex(obj => obj.uuid == block.object.uuid);
        noLightBlocks.splice(noLightIndex, 1);
    }
    block = undefined;
    playAudio("deleteBlock");
}

function mouseClick(button){
    //console.log("raycast");
    raycasterMouse.ray.origin.copy(camera.getWorldPosition(new THREE.Vector3()));
    var dir = camera.getWorldDirection(new THREE.Vector3());
    raycasterMouse.ray.direction.copy(dir);
    var intersec2 = raycasterMouse.intersectObjects(scene.children);
    if(intersec2.length > 0 && intersec2[0].object.typeObject == "block"){
        var elm = intersec2[0];
        if(button == 0){
            createBlock(elm.object.coord.x + elm.face.normal.x, elm.object.coord.y + elm.face.normal.y, elm.object.coord.z + elm.face.normal.z, true);
            restartIlumination();

        } else if(button == 2){
            deleteBlock(elm);
            restartIlumination();
        }
    } else if(intersec2.length > 0 && intersec2[0].object.typeObject == "floor"){
        if(button == 0){
            var posX = Math.round(intersec2[0].point.x/5);
            var posz = Math.round(intersec2[0].point.z/5);
            createBlock(posX, 0, posz, true);
            restartIlumination();
        }
    }
    lastIntersect = intersec2[0];
}

//Update & draw function
function animate() {
    //console.log("frame: " + numFrame);
    requestAnimationFrame( animate );
    //Calulate time
    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;

    stats.begin();

    //If we've captured the mouse
    if ( controls.isLocked === true ) {
        //Send a ray from the player to under our feet
        raycasterBottom.ray.origin.copy( controls.getObject().position );
        raycasterBottom.ray.origin.y -= 5;
        var intersections = raycasterBottom.intersectObjects( scene.children );

        //Send a ray forward from the player
        raycasterForward.ray.origin.copy( controls.getObject().position );
        raycasterForward.ray.origin.y -= 5;
        raycasterForward.ray.direction.copy(direction);
        raycasterForward.ray.direction;
        raycasterForward.ray.far = 0.005;
        var intersectionsForward = raycasterForward.intersectObjects( scene.children );

        if ( intersectionsForward.length > 0 ){
            //console.log("Next to block");
        }
        
        //If anything intersected then we're on an object
        var onObject = intersections.length > 0;


        //Calulate direction and velocity
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        if(controls.getObject().position.y > 7.5){
            velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
        }
        //if(velocity.y < 0.005) velocity.y = 0;
        //console.log(velocity.y);
        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveLeft ) - Number( moveRight );
        direction.normalize(); // this ensures consistent movements in all directions
        if ( moveForward || moveBackward ) velocity.z -= direction.z * 200.0 * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * 200.0 * delta;
        if ( onObject === true ) {
            //console.log("On Object");
            velocity.y = Math.max( 0, velocity.y );
            canJump = true;
        } else {
            if(controls.getObject().position.y == 7.5){
                canJump = true;
            }else{
                canJump = false;
            }
            
        }


        //Obtain the new position
        var newObject = new THREE.Object3D();
        newObject.copy(controls.getObject());
        newObject.translateX( velocity.x * delta );
        newObject.position.y += ( velocity.y * delta * 0.2 );
        newObject.translateZ( velocity.z * delta );

        var oldPos = new THREE.Vector3(controls.getObject().position.x, controls.getObject().position.y, controls.getObject().position.z);
        var newPos = new THREE.Vector3(newObject.position.x, controls.getObject().position.y, newObject.position.z);

        var normal;

        //Collision check, uncomment to activate collisions
        //normal = checkCollisions2(newObject.position);

        //If on the ground, don't go further below
        if ( controls.getObject().position.y < 7.5 ) {
            velocity.y = 0;
            controls.getObject().position.y = 7.5;
            canJump = true;
        }
       
        //Check the nearest block normal collided
        if(normal != null){       
            //Calculate direction of movement
            var movDir = new THREE.Vector3();
            movDir.subVectors(newPos, oldPos);
            movDir.y = 0;

            //Calculate projection of normal with direction of movement to slide across the block
            var projected = new THREE.Vector3();
            projected = normal * movDir.dot(normal);
            movDir.sub(projected);

            // var invNormal = new THREE.Vector3();
            // invNormal.copy(normal);
            // invNormal.negate();
            // invNormal = invNormal * (movDir).length();
            // var wallDir = new THREE.Vector3();
            // wallDir.subVectors(movDir, invNormal);
            //movDir.addVectors(movDir, normal);

            newPos = oldPos + movDir;

            //Update position
            controls.getObject().position.x = newPos.x;
            controls.getObject().position.y = oldPos.y;
            controls.getObject().position.z = newPos.z;
            

        } else {

            //If player didn't collide, move it normally
            controls.getObject().position.x = newPos.x;
            controls.getObject().position.z = newPos.z;
            //Gravity
            controls.getObject().position.y += ( velocity.y * delta * 0.2 );
        }

        //Iluminate scene
        if(!iluminationEnded){
            if(renderType == 1 ){
                iluminateScene();
            } else if(renderType == 0){
                iluminateScene2();
            } else if(renderType == 2){
                iluminateScene3();
            }
            
        }

        if(waitFirstFrame){
            restartIlumination();
            waitFirstFrame = false;
        }
        
        
    }
    
    //Reset time
    prevTime = time;

    stats.end();

    //Render scene
    renderer.render( scene, camera );


    //Debug stuff
    debug.innerHTML = "PositionX: " + controls.getObject().position.x + "<br>PositionY: " + controls.getObject().position.y + 
        "<br>PositionZ: " + controls.getObject().position.z +  "<br>RotationX: " + controls.getObject().rotation.x + 
        "<br>RotationY: " + controls.getObject().rotation.y + "<br>RotationZ: " + controls.getObject().rotation.z + "<br>DirecitonX: " + direction.x + 
        "<br>DirectionY: " + direction.y + "<br>DirecitonZ: " + direction.z +  
        "<br>VelocityX: " + velocity.x + " <br>VelocityY: " + velocity.y + "<br>VelocityZ: " + velocity.z +
        "<br>Type: " + type + "<br>Renderer: " + renderType + "<br>On Object: " + onObject + "<br>Can Jump: " + canJump;
    debug.style.visibility = "visible";
    
}

function createStructure(){

    type = "light";
    
    //createBlock(-4,1,1,false);
    createBlock(1,1,-3,false);

    type = "solid";
    /*for(var y = -5; y < 6; y++){
        for(var x = -5; x < 6; x++){
            createBlock(x,0,y,false);
        }
    }

    for(var y = 1; y < 6; y++){
        for(var x = -5; x < 6; x++){
            createBlock(x,y,5,false);
        }
    }*/

    for(var y = 0; y < 6; y++){
        for(var x = -5; x < 6; x++){
            createBlock(5,y,x,false);
        }
    }

    type = "glass";

    for(var y = 1; y < 3; y++){
        for(var x = 0; x < 4; x++){
            createBlock(x,y,1,false);
            createBlock(x,y,2,false);
        }
    }

    type = "solid";

}