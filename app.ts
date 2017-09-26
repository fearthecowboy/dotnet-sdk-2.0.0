#!/usr/bin/env node
import {staticfs} from './staticfs'
import { basePath, fileExists, packageJsonPath, installationPath,dotnetPackageName } from './common'

const patchRequire = require("./fs-monkey/index.js").patchRequire;
const force = process.argv.indexOf("--force") !== -1;

async function main() {
  if( force || !fileExists(packageJsonPath)) {
    // load node_modules from our squish'd fs file.
    patchRequire(await staticfs(`${__dirname}/static.fs`),true);

    try {
      if (force) {
        // force => remove folder first
        await new Promise<void>((res, rej) => require(`rimraf`)(installationPath, (err: any) => err ? rej(err) : res()));
      }

      // yarn setup
      const yarnMain = `yarn/${require("yarn/package.json").bin.yarn}`;
      await new Promise(res => require("mkdirp")(basePath, () => res()));
      process.chdir(basePath);
      process.argv = [process.argv[0],yarnMain,'add',dotnetPackageName, "--force","--silent"]
    
      // setup our stuff for when it's done.
      process.on("exit", ()=> console.log(`Installed platform-specific runtime: ${installationPath}`));
    
      // run yarn!
      require(yarnMain);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }
}

main();