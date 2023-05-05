/*---------------------------------------------------------------------------------------------
 * Copyright (c) .NET Foundation and Contributors.
 * Portions Copyright (c) Microsoft Corporation.  All rights reserved.
 * See LICENSE file in the project root for full license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from "path";
import { Executor } from "./executor";
import * as crypto from "crypto";
import * as fs from "fs";

export class NfProject {
    /**
     * Creates an sln file in the given path
     * @param fileUri the path to create the sln file
     * @param toolPath the path to the dotnet tool and templates
     */
    public static CreateSolution(fileUri: string, toolPath: String) {
        Executor.runInTerminal("dotnet new sln -o " + fileUri);
    }

    /**
     * Add a project to an existing solution.
     * @param fileUri The solution file
     * @param projectName The project name
     * @param projectType The project type
     * @param toolPath The tool path
     */
    public static async AddProject(fileUri: string, projectName: string, projectType: string, toolPath: string) {
        var solutionPath = path.dirname(fileUri);

        switch (projectType) {
            default:
            case "Blank Application":
                try {
                    const templateDir = path.join(toolPath, 'CS.BlankApplication-vs2022');
                    const nfprojTemplatePath = path.join(templateDir, 'NFApp.nfproj');
                    const programCsTemplatePath = path.join(templateDir, 'Program.cs');
                    const assemblyInfoCsTemplatePath = path.join(templateDir, 'AssemblyInfo.cs');
                
                    // First open the nfproj template file
                    await NfProject.CreateProject(solutionPath, nfprojTemplatePath, projectName, toolPath);
                    
                    // Second open the Program.cs file
                    await NfProject.CreateMainFile(solutionPath, programCsTemplatePath, projectName, 'Program.cs');
                    
                    // Finally remove the year and organization from the AssemblyInfo.cs file
                    await NfProject.CreateAssemblyInfo(solutionPath, assemblyInfoCsTemplatePath, projectName);
                    
                    await NfProject.AddCreatedProjectToSln(solutionPath, fileUri, projectName, '11A8DD76-328B-46DF-9F39-F559912D0360');
                } catch (err) {
                    console.log(err);
                }
                break;

            case "Class Library":
                // First open the nfproj template file
                var filePath = path.join(toolPath, 'CS.ClassLibrary-vs2022', 'NFClassLibrary.nfproj');
                await NfProject.CreateProject(solutionPath, filePath, projectName, toolPath).then(async function (err: any) {
                    if (err) {
                        return console.log(err);
                    }

                    // Second open the Class1.cs file
                    var filePath = path.join(toolPath, 'CS.ClassLibrary-vs2022', 'Class1.cs');
                    await NfProject.CreateMainFile(solutionPath, filePath, projectName, 'Class1.cs').then(async function (err: any) {
                        if (err) {
                            return console.log(err);
                        }

                        // Finally remove the year and organization from the AssemblyInfo.cs file
                        var filePath = path.join(toolPath, 'CS.ClassLibrary-vs2022', 'AssemblyInfo.cs');
                        await NfProject.CreateAssemblyInfo(solutionPath, filePath, projectName).then(async function (err: any) {
                            if (err) {
                                return console.log(err);
                            }

                            await NfProject.AddCreatedProjectToSln(solutionPath, fileUri, projectName, '11A8DD76-328B-46DF-9F39-F559912D0360').then(function (err: any) {
                                if (err) {
                                    return console.log(err);
                                }
                            });
                        });
                    });
                });
                break;
            case "Unit Test":
                // First open the nfproj template file
                var filePath = path.join(toolPath, 'CS.TestApplication-vs2022', 'NFUnitTest.nfproj');
                await NfProject.CreateProject(solutionPath, filePath, projectName, toolPath).then(async function (err: any) {
                    if (err) {
                        return console.log(err);
                    }

                    // Second open the UnitTest1.cs file
                    var filePath = path.join(toolPath, 'CS.TestApplication-vs2022', 'UnitTest1.cs');
                    await NfProject.CreateMainFile(solutionPath, filePath, projectName, 'UnitTest1.cs').then(async function (err: any) {
                        if (err) {
                            return console.log(err);
                        }

                        // Finally remove the year and organization from the AssemblyInfo.cs file
                        var filePath = path.join(toolPath, 'CS.TestApplication-vs2022', 'AssemblyInfo.cs');
                        await NfProject.CreateAssemblyInfo(solutionPath, filePath, projectName).then(async function (err: any) {
                            if (err) {
                                return console.log(err);
                            }

                            await NfProject.AddCreatedProjectToSln(solutionPath, fileUri, projectName, '11A8DD76-328B-46DF-9F39-F559912D0360').then(async function (err: any) {
                                if (err) {
                                    return console.log(err);
                                }
                            });
                        });
                    });
                });
                break;
        }
    }


    private static async CreateProject(solutionPath: string, filePath: string, projectName: string, toolPath: string) {
        try {
            const data = await fs.promises.readFile(filePath, 'utf8');
    
            // Replace the tokens
            // First one is the project name $safeprojectname$
            let result = data.replace(/\$safeprojectname\$/g, projectName);
    
            // Second one is the project guid $guid1$
            const id = crypto.randomUUID();
            result = result.replace(/\$guid1\$/g, id);
    
            const nfprojPath = path.join(solutionPath, projectName, `${projectName}.nfproj`);
            await fs.promises.mkdir(path.dirname(nfprojPath), { recursive: true });
    
            await fs.promises.writeFile(nfprojPath, result, 'utf8');
    
            await NfProject.AddCoreLib(nfprojPath, toolPath);
        } catch (err) {
            console.error(err);
        }
    }

    private static async CreateMainFile(solutionPath: string, filePath: string, projectName: string, fileName: string) {
        try {
          const data = await fs.promises.readFile(filePath, 'utf8');
          const result = data.replace(/\$safeprojectname\$/g, projectName);
      
          const directoryPath = path.join(solutionPath, projectName);
          await fs.promises.mkdir(directoryPath, { recursive: true });
      
          const mainFilePath = path.join(directoryPath, fileName);
          await fs.promises.writeFile(mainFilePath, result, 'utf8');
        } catch (error) {
          console.error(error);
        }
      }

    private static async CreateAssemblyInfo(solutionPath: string, filePath: string, projectName: string) {
        try {
          const data = await fs.promises.readFile(filePath, 'utf8');
          const result = data.replace(/\$registeredorganization\$/g, '').replace(/\$year\$/g, '');
      
          const directoryPath = path.join(solutionPath, projectName, 'Properties');
          await fs.promises.mkdir(directoryPath, { recursive: true });
      
          const assemblyInfoPath = path.join(directoryPath, 'AssemblyInfo.cs');
          await fs.promises.writeFile(assemblyInfoPath, result, 'utf8');
        } catch (error) {
          console.error(error);
        }
      }

    private static async AddCoreLib(fileUri: string, toolPath: string) {
        try {
          const reference = `    <Reference Include="mscorlib">
               <HintPath>..\\packages\\nanoFramework.CoreLibrary.$version$\\lib\\mscorlib.dll</HintPath>
           </Reference>
           <None Include="packages.config" />`;
      
          // Get the version of the core library from the template
          const vstemplatePath = path.join(toolPath, 'CS.BlankApplication-vs2022', 'CS.BlankApplication-vs2022.vstemplate');
          const vstemplateData = await fs.promises.readFile(vstemplatePath, 'utf8');

          // Get the version of the core library
          const versionRegExp = new RegExp('(id=\"nanoFramework.CoreLibrary\" version=\"(.*)\")', 'g');
          const match = versionRegExp.exec(vstemplateData);
          if (!match) {
            throw new Error(`Error: Unable to find the version of the core library in the template file ${vstemplatePath}`);
          }
          const version = match[2];
      
          const nfproj = await fs.promises.readFile(fileUri, 'utf8');

          // Replace tokens and add reference
          const result = nfproj.replace(/<ItemGroup>/g, `<ItemGroup>\r\n${reference.replace(/\$version\$/g, version)}`);

          // Write back the nfproj file
          await fs.promises.writeFile(fileUri, result, 'utf8');
      
          // Add the packages.config file
          const packagesConfig = await fs.promises.readFile(path.join(toolPath, 'packages.config'), 'utf8');
          const packagesResult = packagesConfig.replace(/\$version\$/g, version);
          await fs.promises.writeFile(path.join(path.dirname(fileUri), 'packages.config'), packagesResult, 'utf8');
        } catch (error) {
          console.error(error);
        }
    }

    private static async AddCreatedProjectToSln(solutionPath: string, fileUri: string, projectName: string, guid: string) {
        // Finally add the project to the solution
        Executor.runInTerminal("dotnet sln " + fileUri + " add " + path.join(solutionPath, projectName, projectName + '.nfproj'));
        // Wait for 5 seconds to have the command executed
        setTimeout(() => {
            // And open the sln project, replace the GUID of the added project with the one in the nfproj file
            fs.readFile(fileUri, 'utf8', function (err: any, data: any) {
                if (err) {
                    return console.log(err);
                }

                // Replace the guid by te nanoframework one
                let stringToReplace = RegExp('(?<=Project\\("{)[^"]+(?=}"\\) = \"' + projectName + '\")', 'g');
                var result = data.replace(stringToReplace, guid);
                fs.writeFile(fileUri, result, 'utf8', function (err: any) {
                    if (err) {
                        return console.log(err);
                    }
                });
            });
        }, 5000);
    }
}