#!/usr/bin/env node
import { packageJsonPath, installationPath, dotnetPackageName } from './common'
// don't go for global installed stuff.
process.env["DOTNET_MULTILEVEL_LOOKUP"] = "0";
// try local node_modules 
try { require(dotnetPackageName); } catch { 
  // run the dotnet package
  try { require(installationPath);  } catch {
    // inline install and try again
    require("child_process").fork(`${__dirname}/app.js`,["--force"]).on("exit",(code:number,signal:string)=> code == 0 ? require(installationPath):console.error("Unable to install/use dotnet framework."));
  }
}