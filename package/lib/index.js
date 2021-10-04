#!/usr/bin/env node
// import inquirer from "inquirer";
import findConfig from "find-config";
import * as fs from "fs";
import cheerio from "cheerio";
// import { dirname } from "path";
// import { fileURLToPath } from "url";
const CURR_DIR = process.cwd();
const projectRootDirPath = findConfig("wtr.config.json").replace(/\/wtr.config.json/g, "");
console.log(projectRootDirPath);
const readConfigFile = () => {
    const configFileString = fs.readFileSync(`${projectRootDirPath}/wtr.config.json`, "utf8");
    const configFileJson = JSON.parse(configFileString);
    const output = configFileJson;
    return output;
};
const componentName = /(?!(.*\/))\w+/g.exec(CURR_DIR)[0];
const divNameInHtmlToConvertToReactComponent = componentName;
const webflowHtml = (() => {
    const webflowFolderLocation = readConfigFile().webflowFolder;
    const locationOfWebflowPath = `${projectRootDirPath}/${webflowFolderLocation}/webflow/index.html`;
    return fs.readFileSync(locationOfWebflowPath, "utf8");
})();
const interfaceForTheNewReactComponentToBeCreated = (() => {
    const interfacePath = `${CURR_DIR}/${componentName}.interface.ts`;
    return fs.readFileSync(interfacePath, "utf8");
})();
const transformComponent = (divNameInHtmlToConvertToReactComponent, interfaceForTheNewReactComponentToBeCreated, webflowHtml) => {
    const htmlFile = webflowHtml;
    let arrayProps = interfaceForTheNewReactComponentToBeCreated
        .replace(/\?/gm, "")
        .match(/(?=[a-z]).+(?=\:)/gm);
    const existingPropsInReactComponent = [];
    arrayProps.map((prop) => {
        const param = `af-sock="${prop}"`;
        if (htmlFile.includes(param)) {
            console.log("exists");
            existingPropsInReactComponent.push(prop);
        }
        else {
            console.log("does not exists");
        }
    });
    const $ = cheerio.load(webflowHtml);
    let grabWebflowHtmlDivToBeConvertedToReactComponent = $(`div[af-el="${divNameInHtmlToConvertToReactComponent}"]`).html();
    // const match =
    //   grabWebflowHtmlDivToBeConvertedToReactComponent!.match(/(\d+)/gm);
    let convertHtmlSyntaxToReactComponentSyntax = grabWebflowHtmlDivToBeConvertedToReactComponent
        .replace(/(<img("[^"]*"|[^\/">])*)>/gi, "$1/>")
        .replace(/(<input("[^"]*"|[^\/">])*)>/gi, "$1/>")
        .replace(/for=/gim, "htmlFor=")
        .replace(/class/gim, "className");
    // .replace(/maxlength="(\d+)"/gim, `maxLength={${match![0]}}`)
    let arr = [convertHtmlSyntaxToReactComponentSyntax];
    for (let i = 0; i < existingPropsInReactComponent.length; i++) {
        const element = existingPropsInReactComponent[i];
        const newString = `af-sock={${element}}`;
        const oldString = `af-sock="${element}"`;
        const oldStringRegex = new RegExp(`${oldString}`, "gim");
        const toReplace = arr[0].replace(oldStringRegex, newString);
        arr[0] = toReplace;
    }
    const reactComponentString = arr[0];
    const nameOfNewReactComponent = divNameInHtmlToConvertToReactComponent;
    const nameOfNewReactComponentController = `${nameOfNewReactComponent}Controller`;
    const folderWhereNewReactComponentWillBePlaced = `${CURR_DIR}`;
    const reactComponentFile = `${folderWhereNewReactComponentWillBePlaced}/${nameOfNewReactComponent}.tsx`;
    const reactComponentControllerFile = `${folderWhereNewReactComponentWillBePlaced}/index.tsx`;
    let componentPropsArray = [];
    for (let i = 0; i < arrayProps.length; i++) {
        const element = arrayProps[i];
        const prop = `${element}={${element}}`;
        componentPropsArray.push(prop);
    }
    const componentPropsString = componentPropsArray
        .toString()
        .replace(/,/gm, " ");
    fs.writeFileSync(reactComponentFile, createReactComponent(nameOfNewReactComponent, reactComponentString, arrayProps));
    if (!fs.existsSync(reactComponentControllerFile)) {
        fs.writeFileSync(reactComponentControllerFile, createReactComponentController(nameOfNewReactComponent, nameOfNewReactComponentController, componentPropsString, arrayProps));
    }
};
const createReactComponent = (nameOfNewReactComponent, reactComponentString, props) => `
// THIS IS A GENERATED FILE, do not modify.

import { FunctionComponent } from 'react';
import I${nameOfNewReactComponent} from './${nameOfNewReactComponent}.interface';

const ${nameOfNewReactComponent}: FunctionComponent<I${nameOfNewReactComponent}> = (props) => {
  const {${props}} = props;
  const {children} = props;

  return (
    <>
      ${reactComponentString}
    </>
  )
}

export default ${nameOfNewReactComponent};
`;
const createReactComponentController = (nameOfNewReactComponent, nameOfNewReactComponentController, componentPropsString, props) => `
import ${nameOfNewReactComponent} from "./${nameOfNewReactComponent}";
import I${nameOfNewReactComponent} from "./${nameOfNewReactComponent}.interface";

const ${nameOfNewReactComponentController} = (props: I${nameOfNewReactComponent}) => {
  const {${props}} = props;

  return <${nameOfNewReactComponent} ${componentPropsString} />;
};

export default ${nameOfNewReactComponentController};
`;
transformComponent(divNameInHtmlToConvertToReactComponent, interfaceForTheNewReactComponentToBeCreated, webflowHtml);
//# sourceMappingURL=index.js.map