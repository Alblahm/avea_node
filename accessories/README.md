# Sample accessories <a href="https://github.com/Alblahm/avea_node/blob/master/accessories/README.es.md"><img src="https://github.com/Alblahm/Voice-Controled-Acuarium/blob/master/img/Flag_of_Spain.png" align="right" hspace="0" vspace="0" width="35px"></a> <a href="https://github.com/Alblahm/avea_node/blob/master/accessories/README.md"><img src="https://github.com/Alblahm/Voice-Controled-Acuarium/blob/master/img/Flag_of_Union.png" align="right" hspace="0" vspace="0" width="35px"></a>
This folder contains some accessories that make use of the avea_node lib to control the Elgato Avea Light, through low energy bluetooth.
To use them with the Hap-node, download git repository and copy the samples to the accessories folder located under the HAP-node directory of your system.

 For instance in OSMC:
 * cp *Avea_EN_accessory.js /home/osmc/HAP-NodeJS/accessories


 Find more info in the wiki https://github.com/Alblahm/avea_node/wiki


#### Note: 

>  The file <a href="https://github.com/Alblahm/avea_node/blob/master/accessories/Sample_1Avea_EN_accessory.js"> "Sample_1Avea_EN_accessory.js"</a> is for users with only one avea light bulb, it does not need any extra configuration. Just copy and paste. (The ES or EN suffix is for the english or spanish version of the comments generated in the log output).

>  The file <a href="https://github.com/Alblahm/avea_node/blob/master/accessories/Sample_1Avea_EN_accessory.js"> "Sample_MultiAvea_EN_accessory.js"</a> is the english version for users with _more than one light_ bulb connected the same bridge. After copy and paste, you have to edit the file to replace the light address of each lamp with your light addresses. You need one copy of the file for each lamp, remember that the names always must finish with the "_accessory.js" suffix.
