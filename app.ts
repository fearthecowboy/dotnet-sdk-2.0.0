#!/usr/bin/env node

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { fork } from 'child_process';

/**
 * helper functions
 */

async function install(targetFolder: string, packageName: string): Promise<void> {
  const npmPath = require.resolve("yarn/package.json");
  const mainPath = require("yarn/package.json").bin.yarn;

  await new Promise(res => require("mkdirp")(targetFolder, () => res()));
  const cp = fork(path.join(npmPath, "..", mainPath), ["add", packageName], { cwd: targetFolder });
  return new Promise<void>(res => cp.once("exit", res));
}

const fileExists = (path: string | Buffer): Promise<boolean> => new Promise<boolean>((r, j) => fs.stat(path, err => err ? r(false) : r(true)));

function detectArchitecture(): string {
  switch (os.platform()) {
    case 'darwin':
      return 'osx';
    case 'win32':
      switch (os.arch()) {
        case 'x64':
          return 'win';
        case 'x86':
          return 'win-x86';
      }
      break;
    case 'linux':
      return `linux`;
  }
  throw new Error(`Unsupported Platform: ${os.platform()}`);
}

/**
 * app
 */

const dotnetVersion = "2.0.0";
const pathOption = process.env.DOTNET_SHARED_HOME || path.normalize(`${os.homedir()}/.net/${dotnetVersion}`);
const archOption = process.env.DOTNET_SHARED_ARCH || detectArchitecture();
const packageName = `dotnet-sdk-${dotnetVersion}-${archOption}`;

async function main() {
  const force = process.argv.indexOf("--force") !== -1;
  // derive paths
  const packagePath = path.join(pathOption, `node_modules/${packageName}/`);
  const packageFilePath = packagePath + "package.json";
  try {
    // force? => remove folder first
    if (force) {
      await new Promise<void>((res, rej) => require("rimraf")(pathOption, (err: any) => err ? rej(err) : res()));
    }
    // install
    if (!await fileExists(packageFilePath)) {
      await install(pathOption, packageName);
    }
    // validate
    if (!await fileExists(packageFilePath)) {
      throw new Error("Installation failed.");
    }
    fs.writeFileSync(path.join(__dirname, "package-path.json"), JSON.stringify(packagePath));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

main();