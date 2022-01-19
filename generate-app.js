#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require("os");
const readline = require('readline');

if (process.argv.length < 3) {
    console.log('You have to provide a name to your app.');
    console.log('For example :');
    console.log('    npx create-my-boilerplate my-app');
    process.exit(1);
}

const projectName = process.argv[2];
const currentPath = process.cwd();
const projectPath = path.join(currentPath, projectName);
const git_repo = 'https://github.com/anakorjakov/create-my-boilerplate-demo.git';
const packagePathsByName = {};
const envFilePath = path.resolve(projectPath, ".env");
const readEnvVars = () => fs.readFileSync(envFilePath, "utf-8").split(os.EOL);

try {
  fs.mkdirSync(projectPath);
} catch (err) {
  if (err.code === 'EEXIST') {
    console.log(`The file ${projectName} already exist in the current directory, please give it another name.`);
  } else {
    console.log(error);
  }
  process.exit(1);
}

/**
 * Finds the key in .env files and returns the corresponding value
 *
 * @param {string} key Key to find
 * @returns {string|null} Value of the key
 */
const getEnvValue = (key) => {
  // find the line that contains the key (exact match)
  const matchedLine = readEnvVars().find((line) => line.split("=")[0] === key);
  // split the line (delimiter is '=') and return the item at index 2
  return matchedLine !== undefined ? matchedLine.split("=")[1] : null;
};

/**
 * Updates value for existing key or creates a new key=value line
 *
 * This function is a modified version of https://stackoverflow.com/a/65001580/3153583
 *
 * @param {string} key Key to update/insert
 * @param {string} value Value to update/insert
 */
const setEnvValue = (key, value) => {
  const envVars = readEnvVars();
  const targetLine = envVars.find((line) => line.split("=")[0] === key);
  if (targetLine !== undefined) {
    // update existing line
    const targetLineIndex = envVars.indexOf(targetLine);
    // replace the key/value with the new value
    envVars.splice(targetLineIndex, 1, `${key}=${value}`);
  } else {
    // create new key value
    envVars.push(`${key}=${value}`);
  }
  // write everything back to the file system
  fs.writeFileSync(envFilePath, envVars.join(os.EOL));
};


const updatePackageJson = () => {
  const packageJson = path.join(projectPath, 'package.json');
  const json = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  json.name = projectName;
  fs.writeFileSync(packageJson, JSON.stringify(json, null, 2), 'utf8');
}

const askQuestion = (query) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }))
}

async function main() {
    try {
      const ans = await askQuestion("Are you sure you want to deploy to PRODUCTION? ");
	  if (ans === 'no') {
		  return;
	  }
	  console.log('Downloading files...');
      execSync(`git clone --depth 1 ${git_repo} ${projectPath}`);

      process.chdir(projectPath);
      updatePackageJson();
	  
      // read .env file & convert to array
	  console.log('Updating .ENV');
      console.log(getEnvValue('SUPER_SECRET'));
      setEnvValue('SUPER_SECRET', 'value 1')

      console.log('Installing dependencies...');
      execSync('npm install');

      console.log('Removing useless files');
      execSync('npx rimraf ./.git');
      fs.rmdirSync(path.join(projectPath, 'bin'), { recursive: true});

      console.log('The installation is done, this is ready to use !');

    } catch (error) {
      console.log(error);
    }
}
main();