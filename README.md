# BlockyTracer

This is a 3D browser voxel editor with a ray tracer capabilities implemented. Entirely made with pure Javascript and THREEJS.

## How to run
1. Install python 2.7
2. Execute the python script to start a local server with ```python python_HTTP_server.py``` from the command line and go to ```http://127.0.0.1:8000/```

Or

1. Open ```index.html``` directly from the browser

## How does it work?
It differenciates between what's a light block and what's not a light block. It then loops all the non light blocks (the solid blocks) to see those faces that are adjacent to other solid block's faces. Those faces that are not adjacent then throw rays to the light block's faces, if there's something in between it renders the face as black, otherwise add the color of the light and multiply if by a factor of distance.

With the ```rendertype``` 1 it computes one solid block's face each frame. So 60FPS mean that 60 faces are being colored accordingly.

With the ```rendertype``` 2 it computes one whole solid block each frame. Since it's in a for loop it can slow down.

With the ```rendertype``` 3 there's no raytracing, it paints everything it's own color. This one was programmed in because lightning was too slow sometimes.

## Todo
* Fix the player movement. Velocity depends on the angle the player is looking at (up or down) which should not be the case.
* Add player collisions.
* Add a save and load function to save worlds.
* Crunch and optimize some lightning bugs that can happen.
* Add indirectional lightning so light bounces off faces onto other faces.
* Delete inner faces to higher the frame rate and make glass more believable.
* Put the code into other files and redo some of it, so that it's not one huge file.

## Example video

<a href="http://www.youtube.com/watch?feature=player_embedded&v=M-IMUY6wN28
" target="_blank"><img src="http://img.youtube.com/vi/M-IMUY6wN28/0.jpg" 
alt="Example video" width="720"  /></a>