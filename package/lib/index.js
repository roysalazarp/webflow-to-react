#!/usr/bin/env node
import findConfig from "find-config";
import * as fs from "fs";
import cheerio from "cheerio";
const CURR_DIR = process.cwd();
const projectRootDirPath = findConfig("wtr.config.json").replace(/\/wtr.config.json/g, "");
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
const $ = cheerio.load(webflowHtml);
let allComponents;
const htmlDiv = $(`div[data-component="${divNameInHtmlToConvertToReactComponent}"]`).attr("data-component");
let root = $.root();
let currentParent = root;
let componentsArr = [];
const components = () => {
    if (currentParent.children().length != 0) {
        const children = currentParent;
        const childrenName = currentParent
            .children()
            .get()
            .map((item) => {
            const doesItemHaveChildren = item.children.length === 0 ? false : true;
            if (doesItemHaveChildren === true) {
                const dataComponent = item.attribs["data-component"];
                if (dataComponent) {
                    let component = $(`div[data-component="${dataComponent}"]`);
                    const noMoreChildrenWithAttributeDataComponent = component
                        .children()
                        .attr("data-component");
                    if (noMoreChildrenWithAttributeDataComponent === undefined) {
                        let key = dataComponent;
                        let obj = {};
                        obj[key] = component.toString();
                        componentsArr.push(obj);
                    }
                    const thereIsMoreChildrenWithAttributeDataComponent = component.attr("data-component") === undefined ? false : true;
                    if (thereIsMoreChildrenWithAttributeDataComponent === true) {
                        const subComponentName = component
                            .children()
                            .attr("data-component");
                        const subComponentHtml = $(`div[data-component="${subComponentName}"]`).toString();
                        let allSubComponents = [];
                        const siblings = $(`div[data-component="${subComponentName}"]`)
                            .siblings()
                            .attr("data-component");
                        if (siblings != undefined) {
                            const foundSibling = $(`div[data-component="${siblings}"]`).toString();
                            let key1 = subComponentName;
                            let obj1 = {};
                            obj1[key1] = subComponentHtml;
                            let key2 = siblings;
                            let obj2 = {};
                            obj2[key2] = foundSibling;
                            allSubComponents.push(obj1, obj2);
                        }
                        else {
                            let key1 = subComponentName;
                            let obj1 = {};
                            if (key1 === undefined) {
                                return;
                            }
                            else {
                                obj1[key1] = subComponentHtml;
                                allSubComponents.push(obj1);
                            }
                        }
                        allSubComponents.map((item) => {
                            const htmlToRemove = Object.values(item).toString();
                            // console.log(component.toString());
                            // console.log(
                            //   "_______________________________________________________"
                            // );
                            // console.log(htmlToRemove);
                            // console.log(
                            //   "_______________________________________________________"
                            // );
                            const componentWithReactChildren = component
                                .toString()
                                .replace(htmlToRemove, "{children}");
                            let key = dataComponent;
                            let obj = {};
                            obj[key] = componentWithReactChildren;
                            const exists = componentsArr.find((x) => Object.keys(x)[0] === key);
                            if (exists != undefined) {
                                const a = Object.values(exists)[0];
                                const b = Object.keys(exists)[0];
                                const $ = cheerio.load(a);
                                const toDelete = $(`div[data-component="${siblings}"]`).toString();
                                const componentWithReactChildren = a
                                    .toString()
                                    .replace(toDelete, "");
                                let key = dataComponent;
                                let obj = {};
                                obj[key] = componentWithReactChildren;
                                const index = componentsArr.findIndex((x) => Object.keys(x)[0] === b);
                                componentsArr[index] = obj;
                                componentsArr.find((x) => Object.keys(x)[0] === b);
                            }
                            else {
                                componentsArr.push(obj);
                            }
                        });
                    }
                }
            }
        });
        currentParent = children.children();
    }
    else {
        return;
    }
    components();
};
components();
console.log(componentsArr);
// const transformComponent = (
//   divNameInHtmlToConvertToReactComponent: string,
//   interfaceForTheNewReactComponentToBeCreated: string,
//   webflowHtml: string
// ) => {
//   const htmlFile = webflowHtml;
//   let arrayProps = interfaceForTheNewReactComponentToBeCreated
//     .replace(/\?/gm, "")
//     .match(/(?=[a-z]).+(?=\:)/gm)!;
//   const existingPropsInReactComponent: string[] = [];
//   arrayProps.map((prop) => {
//     const param = `data-prop="${prop}"`;
//     if (htmlFile.includes(param)) {
//       console.log("exists");
//       existingPropsInReactComponent.push(prop);
//     } else {
//       console.log("does not exists");
//     }
//   });
//   const webflowHtmlString = cheerio.load(webflowHtml);
//   // let grabWebflowHtmlDivToBeConvertedToReactComponent = $(
//   //   `div[data-component="${divNameInHtmlToConvertToReactComponent}"]`
//   // )
//   //   .children()
//   //   .html();
//   let getParent = () => {
//     const parent = webflowHtmlString(
//       `div[data-component="${divNameInHtmlToConvertToReactComponent}"]`
//     ).toString();
//     const children = webflowHtmlString(
//       `div[data-component="${divNameInHtmlToConvertToReactComponent}"]`
//     ).html();
//     const div = parent.replace(children!, "{children}");
//     console.log(div);
//     return div;
//   };
//   const grabWebflowHtmlDivToBeConvertedToReactComponent = getParent();
//   // const match =
//   //   grabWebflowHtmlDivToBeConvertedToReactComponent!.match(/(\d+)/gm);
//   let convertHtmlSyntaxToReactComponentSyntax =
//     grabWebflowHtmlDivToBeConvertedToReactComponent!
//       .replace(/(<img("[^"]*"|[^\/">])*)>/gi, "$1/>")
//       .replace(/(<input("[^"]*"|[^\/">])*)>/gi, "$1/>")
//       .replace(/for=/gim, "htmlFor=")
//       .replace(/class/gim, "className");
//   // .replace(/maxlength="(\d+)"/gim, `maxLength={${match![0]}}`)
//   let arr: string[] = [convertHtmlSyntaxToReactComponentSyntax];
//   for (let i = 0; i < existingPropsInReactComponent.length; i++) {
//     const element = existingPropsInReactComponent[i];
//     const newString = `data-prop={${element}}`;
//     const oldString = `data-prop="${element}"`;
//     const oldStringRegex = new RegExp(`${oldString}`, "gim");
//     const toReplace = arr[0].replace(oldStringRegex, newString);
//     arr[0] = toReplace;
//   }
//   const reactComponentString = arr[0];
//   const nameOfNewReactComponent = divNameInHtmlToConvertToReactComponent;
//   const nameOfNewReactComponentController = `${nameOfNewReactComponent}Controller`;
//   const folderWhereNewReactComponentWillBePlaced = `${CURR_DIR}`;
//   const reactComponentFile = `${folderWhereNewReactComponentWillBePlaced}/${nameOfNewReactComponent}.tsx`;
//   const reactComponentControllerFile = `${folderWhereNewReactComponentWillBePlaced}/index.tsx`;
//   let componentPropsArray: string[] = [];
//   for (let i = 0; i < arrayProps.length; i++) {
//     const element = arrayProps[i];
//     const prop = `${element}={${element}}`;
//     componentPropsArray.push(prop);
//   }
//   const componentPropsString = componentPropsArray
//     .toString()
//     .replace(/,/gm, " ");
//   fs.writeFileSync(
//     reactComponentFile,
//     createReactComponent(
//       nameOfNewReactComponent,
//       reactComponentString,
//       arrayProps
//     )
//   );
//   if (!fs.existsSync(reactComponentControllerFile)) {
//     fs.writeFileSync(
//       reactComponentControllerFile,
//       createReactComponentController(
//         nameOfNewReactComponent,
//         nameOfNewReactComponentController,
//         componentPropsString,
//         arrayProps
//       )
//     );
//   }
// };
// const createReactComponent = (
//   nameOfNewReactComponent: string,
//   reactComponentString: string,
//   props: string[]
// ) => `
// // THIS IS A GENERATED FILE, do not modify.
// import { FunctionComponent } from 'react';
// import I${nameOfNewReactComponent} from './${nameOfNewReactComponent}.interface';
// const ${nameOfNewReactComponent}: FunctionComponent<I${nameOfNewReactComponent}> = (props) => {
//   const {${props}} = props;
//   const {children} = props;
//   return (
//     <>
//       ${reactComponentString}
//     </>
//   )
// }
// export default ${nameOfNewReactComponent};
// `;
// const createReactComponentController = (
//   nameOfNewReactComponent: string,
//   nameOfNewReactComponentController: string,
//   componentPropsString: string,
//   props: string[]
// ) => `
// import ${nameOfNewReactComponent} from "./${nameOfNewReactComponent}";
// import I${nameOfNewReactComponent} from "./${nameOfNewReactComponent}.interface";
// const ${nameOfNewReactComponentController} = (props: I${nameOfNewReactComponent}) => {
//   const {${props}} = props;
//   return <${nameOfNewReactComponent} ${componentPropsString} />;
// };
// export default ${nameOfNewReactComponentController};
// `;
// transformComponent(
//   divNameInHtmlToConvertToReactComponent,
//   interfaceForTheNewReactComponentToBeCreated,
//   webflowHtml
// );
//# sourceMappingURL=index.js.map