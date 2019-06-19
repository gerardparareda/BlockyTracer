function iluminateScene(){
    //if(num == 0){
    //For all non light blocks
    for(var nLBlock = 0; nLBlock < noLightBlocks.length; nLBlock++){ //nLBlock: non Light Block
        
        var sB = noLightBlocks[nLBlock]; //sb: solid Block
        var geomSB = sB.geometry; //geomSB: geometry Solid Block

        //For all his solid faces, always 6
        for(var nonLightF = 0; nonLightF < 6; nonLightF++){ //faceNL: face Non Light
            
            //Sum of all distances from the lights to this face
            tmpIl = 0;

            if(nonLightF == 1){
                console.log("left");
            }

            //Ignore faces that are adjacent to others
            if(sB.adjacents[nonLightF] == 1){
                continue;
            }

            //For all light blocks
            for(var L = 0; L < lightBlocks.length; L++){ //L: Light
                
                var lB = lightBlocks[L]; //lB: light Block
                var geomLB = lB.geometry; //geomLB: geometry Light Block 
                var tmpIl2 = 0;

                //For all his light faces, always 6
                for(var lightF = 0; lightF < 6; lightF++){

                    //If the face of the block we're iluminating is facing backwards to the light
                    //if(isOppositeSide(nonLightF, lightF)){
                    if(nonLightF == lightF){
                        //console.log("here for: " + nonLightF + "," + lightF );
                        //tmpIl = 0;
                        continue;
                    }

                    //rOrigin: ray Origin
                    var rOrigin = new THREE.Vector3(
                        lB.position.x + (geomLB.faces[lightF*2].normal.x) * 3, 
                        lB.position.y + (geomLB.faces[lightF*2].normal.y) * 3, 
                        lB.position.z + (geomLB.faces[lightF*2].normal.z) * 3
                    );
                    
                    //rDestination: ray Destination
                    var rDestination = new THREE.Vector3(
                        sB.position.x + (geomSB.faces[nonLightF*2].normal.x) * 3,
                        sB.position.y + (geomSB.faces[nonLightF*2].normal.y) * 3,
                        sB.position.z + (geomSB.faces[nonLightF*2].normal.z) * 3
                    );

                    if(nonLightF == 0 && lightF == 2){
                        console.log("here");
                        //createLine(rOrigin, rDestination);
                    }
                    

                    //If there is no colision then light up based on distance
                    if(notIntersectLightRay(rOrigin, rDestination)){
                        
                        if( tmpIl2 + normalizeLightDistance(rOrigin.distanceTo(rDestination)) > 2.5){
                            tmpIl2 = 2.5;
                        }else {
                            tmpIl2 = Math.max(normalizeLightDistance(rOrigin.distanceTo(rDestination))*2, tmpIl);
                        }
                        //console.log(normalizeLightDistance(rOrigin.distanceTo(rDestination)));
                    }

                } 

                tmpIl = Math.min(2.5, tmpIl + tmpIl2);
            }
            
            if( sB.lightShades[nonLightF] != tmpIl ){                
                sB.lightShades[nonLightF] = Math.min(2.5, tmpIl);
                console.log(nonLightF + " " + sB.lightShades[nonLightF]);
                //console.log("Different");
                iluminateFace(sB, nonLightF);
            }

        }
    }
}