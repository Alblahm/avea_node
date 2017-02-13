# Accesorios de ejemplo <a href="https://github.com/Alblahm/avea_node/blob/master/accessories/README.es.md"><img src="https://github.com/Alblahm/Voice-Controled-Acuarium/blob/master/img/Flag_of_Spain.png" align="right" hspace="0" vspace="0" width="35px"></a> <a href="https://github.com/Alblahm/avea_node/blob/master/accessories/README.md"><img src="https://github.com/Alblahm/Voice-Controled-Acuarium/blob/master/img/Flag_of_Union.png" align="right" hspace="0" vspace="0" width="35px"></a>

Esta carpeta contiene varios archivos de accesorios que hacen uso de la librería "avea_node" para controlar la luz de ElGato Avea.
Para ello se conecta mediante la tecnología bluetooth de baja energía. Para usar estos ejemplos, descarga este repositorio dentro
de la carpeta node_modules y copia el archivo del accesorio en el directorio HAP-Node/accessories de tu sistema.

 Por ejemplo en LINUX OSMC:
 * cp *Avea_EN_accessory.js /home/osmc/HAP-NodeJS/accessories


 Más info en la wiki https://github.com/Alblahm/avea_node/wiki


#### Nota: 

>  El archivo <a href="https://github.com/Alblahm/avea_node/blob/master/accessories/Sample_1Avea_ES_accessory.js"> "Sample_1Avea_ES_accessory.js"</a> es para usuarios que tengan tan solo una luz avea, y no precisa de ninguna configuración extra, tan solo copiar y pegar. (El sufijo ES o EN indica el idioma de la versión empleada, y el idioma de los comentarios almacenados en los archivos de log).

>  El archivo <a href="https://github.com/Alblahm/avea_node/blob/master/accessories/Sample_1Avea_EN_accessory.js"> "Sample_MultiAvea_EN_accessory.js"</a> es la versión en inglés para los usuarios que tengan más de una luz avea conectada al mismo sistema. Tras copiar y pegar el archivo es necesario editarlo y reemplazar la dirección MAC de cada una de las luces añadidas. Es preciso emplear un archivo por cada luz poniéndole nombres diferentes, recuerda que los nombres siempre deben terminar con el sufijo y la extensión "_accessory.js".
