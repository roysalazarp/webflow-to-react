#!/usr/bin/env node
// import inquirer from "inquirer";
import findConfig from "find-config";
import * as fs from "fs";
import cheerio from "cheerio";
// import { dirname } from "path";
// import { fileURLToPath } from "url";

const CURR_DIR = process.cwd();

// const __dirname = dirname(fileURLToPath(import.meta.url));

// interface IQUESTIONS {
//   [k: string]: any;
// }

// const QUESTIONS: IQUESTIONS[] = [
//   {
//     name: "webflow-folder-path",
//     type: "input",
//     message: "where is your webflow folder located:",
//     validate: function (input: string) {
//       if (/^([A-Za-z\-\/..\_\d])+$/.test(input)) return true;
//       else
//         return "Project name may only include letters, numbers, underscores and hashes.";
//     },
//   },
//   {
//     name: "select-component-from-html",
//     type: "input",
//     message: "given name to component from html to convert:",
//     validate: function (input: string) {
//       if (/^([A-Za-z\-\\_\d])+$/.test(input)) return true;
//       else
//         return "Project name may only include letters, numbers, underscores and hashes.";
//     },
//   },
//   {
//     name: "component-interface",
//     type: "input",
//     message: "Point the file where is the interface for your component:",
//     validate: function (input: string) {
//       if (/^([A-Za-z\-\/..\_\d])+$/.test(input)) return true;
//       else
//         return "Project name may only include letters, numbers, underscores and hashes.";
//     },
//   },
// ];

// inquirer.prompt(QUESTIONS).then((answers) => {
//   const divNameInHtmlToConvertToReactComponent =
//     answers["select-component-from-html"];

//   const webflowFolderPath = readConfigFile();

//   const givenComponentInterface = answers["component-interface"];
//   const componentInterface = `${CURR_DIR}/${givenComponentInterface}`;

//   const webflowHtml = fs.readFileSync(webflowFolderPath, "utf8");
//   const interfaceForTheNewReactComponentToBeCreated = fs.readFileSync(
//     componentInterface,
//     "utf8"
//   );

//   transformComponent(
//     divNameInHtmlToConvertToReactComponent,
//     interfaceForTheNewReactComponentToBeCreated,
//     webflowHtml
//   );
// });

interface Config {
  webflowFolder: string;
}

const projectRootDirPath = findConfig("wtr.config.json")!.replace(
  /\/wtr.config.json/g,
  ""
);

console.log(projectRootDirPath);

const readConfigFile = (): Config => {
  const configFileString = fs.readFileSync(
    `${projectRootDirPath}/wtr.config.json`,
    "utf8"
  );
  const configFileJson: Config = JSON.parse(configFileString);
  const output = configFileJson;
  return output;
};

const componentName = /(?!(.*\/))\w+/g.exec(CURR_DIR)![0];

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

const transformComponent = (
  divNameInHtmlToConvertToReactComponent: string,
  interfaceForTheNewReactComponentToBeCreated: string,
  webflowHtml: string
) => {
  const htmlFile = webflowHtml;

  let arrayProps = interfaceForTheNewReactComponentToBeCreated
    .replace(/\?/gm, "")
    .match(/(?=[a-z]).+(?=\:)/gm)!;

  const existingPropsInReactComponent: string[] = [];

  arrayProps.map((prop) => {
    const param = `af-sock="${prop}"`;
    if (htmlFile.includes(param)) {
      console.log("exists");
      existingPropsInReactComponent.push(prop);
    } else {
      console.log("does not exists");
    }
  });

  const $ = cheerio.load(webflowHtml);

  let grabWebflowHtmlDivToBeConvertedToReactComponent = $(
    `div[af-el="${divNameInHtmlToConvertToReactComponent}"]`
  ).html();

  // const match =
  //   grabWebflowHtmlDivToBeConvertedToReactComponent!.match(/(\d+)/gm);

  let convertHtmlSyntaxToReactComponentSyntax =
    grabWebflowHtmlDivToBeConvertedToReactComponent!
      .replace(/(<img("[^"]*"|[^\/">])*)>/gi, "$1/>")
      .replace(/(<input("[^"]*"|[^\/">])*)>/gi, "$1/>")
      .replace(/for=/gim, "htmlFor=")
      .replace(/class/gim, "className");
  // .replace(/maxlength="(\d+)"/gim, `maxLength={${match![0]}}`)

  let arr: string[] = [convertHtmlSyntaxToReactComponentSyntax];

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

  let componentPropsArray: string[] = [];

  for (let i = 0; i < arrayProps.length; i++) {
    const element = arrayProps[i];
    const prop = `${element}={${element}}`;
    componentPropsArray.push(prop);
  }

  const componentPropsString = componentPropsArray
    .toString()
    .replace(/,/gm, " ");

  fs.writeFileSync(
    reactComponentFile,
    createReactComponent(
      nameOfNewReactComponent,
      reactComponentString,
      arrayProps
    )
  );

  if (!fs.existsSync(reactComponentControllerFile)) {
    fs.writeFileSync(
      reactComponentControllerFile,
      createReactComponentController(
        nameOfNewReactComponent,
        nameOfNewReactComponentController,
        componentPropsString,
        arrayProps
      )
    );
  }
};

const createReactComponent = (
  nameOfNewReactComponent: string,
  reactComponentString: string,
  props: string[]
) => `
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

const createReactComponentController = (
  nameOfNewReactComponent: string,
  nameOfNewReactComponentController: string,
  componentPropsString: string,
  props: string[]
) => `
import ${nameOfNewReactComponent} from "./${nameOfNewReactComponent}";
import I${nameOfNewReactComponent} from "./${nameOfNewReactComponent}.interface";

const ${nameOfNewReactComponentController} = (props: I${nameOfNewReactComponent}) => {
  const {${props}} = props;

  return <${nameOfNewReactComponent} ${componentPropsString} />;
};

export default ${nameOfNewReactComponentController};
`;

transformComponent(
  divNameInHtmlToConvertToReactComponent,
  interfaceForTheNewReactComponentToBeCreated,
  webflowHtml
);
