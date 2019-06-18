# VR Data Visualisation
**OUTDATED - NEEDS UPDATING**

Quick overview of the implementation of the VR Data Visualisation Tool in [AFRAME](https://aframe.io).


## Functionalities:
You start out in the center of an octagonal room. On each of these walls, data can be displayed using the buttons visible on each of them.
 - **Switch control mode:** The *switch* button on the walls between the plot walls allow the switch between control modes. The default mode is gaze control in which clickable objects can be interacted with by hovering with the cursor over them for at least 1500 ms. By changing the control mode to touch control allows the interaction with clickable objects by a touch anywhere on the screen, e.g. with the trigger button on a Google Cardboard VR headset. 
 - **Load Data:** The *load* button on the plot wall loads the data and pre-generates the data point objects invisibly. A circular progress indicator informs about the loading progress.
 - **Clear Data:** The *clear* button clears the data from the current plot area and resets it to the two dimensional plot space.
 - **Inspect Plot Area:** The *inspect* button casts the plot area to the center of the virtual room to be inspected from all sides.
 - **Variable Selection:** By use of the *up* and *down* arrows above and below the selection wheel, the active variable can be changed.
 - **Axis Selection:** By clicking on an *axis* button the plot arrow moves to the selected *axis* button to indicate the selection.
 - **Plotting:** The *plot* triangle button plots the active variable to the selected axis in the plot area. Plotting a variable to the z-axis changes the plot area into a cube and adds color to the data points. This color is mapped to the value of the variable mapped to the z-axis to enhance visual distinction.
 - **Help:** The *help* button triggers help messages to assist navigating the controls.
 - **Movement:** Movement in the virtual room is possible via a teleporting function. Looking at the floor highlights a tile and triggering a click teleports the user to the highlighted tile.