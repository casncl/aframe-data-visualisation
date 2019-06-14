# VR Data Visualisation
**OUTDATED - NEEDS UPDATING**

Quick overview of the implementation so far of the data visualisation in [AFRAME](https://aframe.io).



Functionalities:
You start out in the center of an octagonal room. On each of these walls, data can be displayed using the buttons visible on each of them.
 - **Show Button** (hover until click): show axis (x,y,z) buttons and the 2D plot area.
 - **Hide Button** (hover until click): hide all buttons except for **show** and **hide** (wip)
 - **x axis button** (hover until click): show variable buttons for data loaded in the scene for the x axis
 - **y axis button** (hover until click): show variable buttons for data loaded in the scene for the y axis
 - **z axis button** (hover until click): show variable buttons for data loaded in the scene for the z axis as well as the rotation for each axis and the center button to reverse any rotation. The plot area extends to a 3D plot area that can be rotated by the *<* and *>* buttons along the corresponding axes. 
 - **variable buttons** (hover until click): plots the data for this variable on the corresponding axis.
 - **< & >** (hover): these rotate the plot area along the corresponding axis in negative and positive direction, respectively.
 - **teleport**: change your position in the room by aiming at the floor where you want to stand, the corresponding tile will be highlighted.