import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { logBlue, logYellow } from './extendedLog';
import path = require('path');
import { randomUUID } from 'crypto';

/**
 * Mangle all the file names inside the ./temp folder.
 * @param round how many times should the file names be replaced 
 */
export async function mangleTempNames(round:number = 15)
{
    const isDirExist = async path => await fs.promises.access(path).then(()=>true).catch(()=>false);
    const tempFolderExist = await isDirExist("./temp/");
    if (!tempFolderExist)
    {
        logYellow(`Mangling filenames: Temp folder doesn't exist.`);
        return;
    }

    let count = 0;
    for (let i = 0; i < round; i++)
    {
        const allTempFiles = await fsp.readdir("./temp");
        for (let file of allTempFiles)
        {
            let oldFullPath = path.resolve(`./temp/${file}`);
            let newFullPath = path.resolve(`./temp/${await generateUnusedFileName("./temp")}`);
            await fsp.rename(oldFullPath, newFullPath);
            count++;
        }
    }

    const tempFilesCount = (await fsp.readdir("./temp")).length;
    logBlue(`Mangling filename: ${tempFilesCount} temp files are renamed in ${round} rounds (${count} total operations)!`);
}

export async function rewriteTempFiles(round:number = 3)
{
    const isDirExist = async path => await fs.promises.access(path).then(()=>true).catch(()=>false);
    const tempFolderExist = await isDirExist("./temp/");
    if (!tempFolderExist)
    {
        logYellow(`Mangling filenames: Temp folder doesn't exist.`);
        return;
    }

    let count = 0;
    const allTempFiles = await fsp.readdir("./temp");
    for (let i = 0; i < round; i++)
    {
        for (let file of allTempFiles)
        {
            let oldFullPath = path.resolve(`./temp/${file}`);
            let fileSize = (await fs.promises.stat(oldFullPath)).size;

            // Open the file in write mode
            const fd = fs.openSync(oldFullPath, 'w');

            // Generate file size of random data
            const bufferSize = fileSize;
            const buffer = Buffer.alloc(bufferSize, Math.random().toString(36).substring(2));

            // Write the random data to the file
            let bytesWritten = 0;
            while (bytesWritten < bufferSize) 
            {
                bytesWritten += fs.writeSync(fd, buffer, bytesWritten);
            }

            // Close the file
            fs.closeSync(fd);

            count++;
        }
    }
}

export async function generateUnusedFileName(directory:string)
{
    const allFiles = await fsp.readdir(directory);
    let potential = randomUUID();

    while (allFiles.includes(potential)) { potential = randomUUID(); }
    return potential;
}