#!/usr/bin/env node
import inquirer from "inquirer";
import * as fs from "fs";
import cheerio from "cheerio";
import { dirname } from "path";
import { fileURLToPath } from "url";

const CURR_DIR = process.cwd();

const __dirname = dirname(fileURLToPath(import.meta.url));

interface IQUESTIONS {
  [k: string]: any;
}

const QUESTIONS: IQUESTIONS[] = [
  {
    name: "webflow-folder-path",
    type: "input",
    message: "where is your webflow folder located:",
    validate: function (input: string) {
      if (/^([A-Za-z\-\/..\_\d])+$/.test(input)) return true;
      else
        return "Project name may only include letters, numbers, underscores and hashes.";
    },
  },
  {
    name: "select-component-from-html",
    type: "input",
    message: "given name to component from html to convert:",
    validate: function (input: string) {
      if (/^([A-Za-z\-\\_\d])+$/.test(input)) return true;
      else
        return "Project name may only include letters, numbers, underscores and hashes.";
    },
  },
  {
    name: "component-interface",
    type: "input",
    message: "Point the file where is the interface for your component:",
    validate: function (input: string) {
      if (/^([A-Za-z\-\/..\_\d])+$/.test(input)) return true;
      else
        return "Project name may only include letters, numbers, underscores and hashes.";
    },
  },
];

inquirer.prompt(QUESTIONS).then((answers) => {
  const divNameInHtmlToConvertToReactComponent =
    answers["select-component-from-html"];

  const givenWebflowFolderPath = answers["webflow-folder-path"];
  const webflowFolderPath = `${CURR_DIR}/${givenWebflowFolderPath}webflow/index.html`;

  const givenComponentInterface = answers["component-interface"];
  const componentInterface = `${CURR_DIR}/${givenComponentInterface}`;

  const webflowHtml = fs.readFileSync(webflowFolderPath, "utf8");
  const interfaceForTheNewReactComponentToBeCreated = fs.readFileSync(
    componentInterface,
    "utf8"
  );

  transformComponent(
    divNameInHtmlToConvertToReactComponent,
    interfaceForTheNewReactComponentToBeCreated,
    webflowHtml
  );
});

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

  const nameOfNewReactComponentName = divNameInHtmlToConvertToReactComponent;

  const folderWhereNewReactComponentWillBePlaced = `${CURR_DIR}/${divNameInHtmlToConvertToReactComponent}`;
  const reactComponentFile = `${folderWhereNewReactComponentWillBePlaced}/index.tsx`;

  if (!fs.existsSync(folderWhereNewReactComponentWillBePlaced)) {
    fs.mkdirSync(folderWhereNewReactComponentWillBePlaced);
  }

  fs.writeFileSync(
    reactComponentFile,
    createReactComponent(
      nameOfNewReactComponentName,
      reactComponentString,
      arrayProps
    )
  );
};

const createReactComponent = (
  nameOfNewReactComponentName: string,
  reactComponentString: string,
  props: string[]
) => `
// THIS IS A GENERATED FILE, do not modify.

import { FunctionComponent } from 'react';
import IProps from '../interfaces/${nameOfNewReactComponentName}';

const ${nameOfNewReactComponentName}: FunctionComponent<IProps> = (props) => {
  const {${props}} = props;
  const {children} = props;

  return (
    <>
      ${reactComponentString}
    </>
  )
}

export default ${nameOfNewReactComponentName};
`;
