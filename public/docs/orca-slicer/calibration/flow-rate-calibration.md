# Flow Rate Calibration

The Flow Ratio determines how much filament is extruded and plays a key role in achieving high-quality prints. A properly calibrated flow ratio ensures consistent layer adhesion and accurate dimensions. If the flow ratio is too low, under-extrusion may occur, leading to gaps, weak layers, and poor structural integrity. On the other hand, a flow ratio that is too high can cause over-extrusion, resulting in excess material, rough surfaces, and dimensional inaccuracies.

## Important Notes

**Warning for Bambulab Printers:** Make sure you do not select the 'Flow calibration' option.
![flow-rate-Bambulab-uncheck](../images/flow-rate/flowrate-Bambulab-uncheck.png)

**Formula Differences:**
- PASS 1 and PASS 2 follow the older flow ratio formula: `FlowRatio_old*(100 + modifier)/100`
- YOLO (Recommended) and YOLO (perfectionist version) use a new system that is very simple: `FlowRatio_old±modifier`

![flow-calibration](../images/flow-rate/flow-calibration.gif)

## Calibration Process

Calibrating the flow rate involves a two-step process.

### Pass 1

1. Select the printer, filament, and process you would like to use for the test.

2. Select `Pass 1` in the `Calibration` menu.

3. A new project consisting of nine blocks will be created, each with a different flow rate modifier. Slice and print the project.

4. Examine the blocks and determine which one has the smoothest top surface.
   ![flowrate-pass1](../images/flow-rate/flowrate-pass1.jpg)
   ![flowrate-0-5](../images/flow-rate/flowrate-0-5.jpg)

5. Update the flow ratio in the filament settings using the following equation: `FlowRatio_old*(100 + modifier)/100`. 
   
   **Example:** If your previous flow ratio was `0.98` and you selected the block with a flow rate modifier of `+5`, the new value should be calculated as follows: `0.98x(100+5)/100 = 1.029`. 
   
   **Remember** to save the filament profile.

### Pass 2

6. Perform the `Pass 2` calibration. This process is similar to `Pass 1`, but a new project with ten blocks will be generated. The flow rate modifiers for this project will range from `-9 to 0`.

7. Repeat steps 4 and 5. 
   
   **Example:** If your previous flow ratio was 1.029 and you selected the block with a flow rate modifier of -6, the new value should be calculated as follows: `1.029x(100-6)/100 = 0.96726`. 
   
   **Remember** to save the filament profile.

![flowrate-pass2](../images/flow-rate/flowrate-pass2.jpg)
![flowrate-6](../images/flow-rate/flowrate-6.jpg)
![flowcalibration_update_flowrate](../images/flow-rate/flowcalibration_update_flowrate.png)

## Helpful Resources

**Tip:** @ItsDeidara has made a HTML calculator to help with the flow rate calculations. Check it out if those equations give you a headache [here](https://github.com/ItsDeidara/Orca-Slicer-Assistant).