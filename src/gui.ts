import { GUI } from "dat.gui";

const gui = new GUI();
let guis: GUI[] = [];


export function createGUI() {
  gui.domElement.style.marginTop = "100px";
  gui.domElement.id = "datGUI";
}

const folders: any = {
  folderOptions: {},
};

/**
 * function to create a folder with options and their sliders
 * @param  {string} name name of the folder
 * @param  {{}} options the parametres which are passed
 * @param  {number} min min-value (start)
 * @param  {number} max max-value (end)
 * @param  {(value:number)=>void=()} onValueChanged callback-function for the changed value
 */
export function createFolder(
  name: string,
  options: {},
  min: number,
  max: number,
  onValueChanged: (value: number) => void = () => {}
) {
  var folder = gui.addFolder(name);
  for (const key of Object.keys(options)) {
    folder.add(options, key, min, max).onChange((value) => {
      onValueChanged(value);
    });
  }
  folder.close();
  guis.push(folder);
  console.log(guis);
}

/**
 * creates a group of radio buttons
 * @param  {string} folderName
 * @param  {{}} folderOptions
 * @param  {(filter:string)=>void} onSelectedFilter called as soon as the filter changed
 */
export function createRadioGroup(
  folderName: string,
  folderOptions: {},
  onSelectedFilter: (filter: string, value: boolean) => void
) {
  var folder = gui.addFolder(folderName);
  for (const optionName of Object.keys(folderOptions)) {
    folder
      .add(folderOptions, optionName)
      .listen()
      .onChange(value => {
        setChecked(optionName, value);
      });
  }

  /**
   * checks the option where the name is optionName
   * multiple checks possible
   * @param  {string} optionName
   */
  function setChecked(optionName: string, value: boolean) {
    for (let checkbox in folderOptions) {
      folders.folderOptions[checkbox] = false;
    }
    folders.folderOptions[optionName] = true;
    onSelectedFilter(optionName, value);
  }
}
