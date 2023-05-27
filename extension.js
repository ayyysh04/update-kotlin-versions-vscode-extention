const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE_NAME = 'update-versions.json';

function getExtensionDataPath() {
  const extensionId = 'YourPublisherName.update-versions'; // Update with your extension's publisher and name
  const extension = vscode.extensions.getExtension(extensionId);
  if (extension) {
    return extension.extensionPath;
  }
  throw new Error(`Extension with ID '${extensionId}' is not installed.`);
}

async function updateVersions() {
  // Get the root path of the currently opened folder in VS Code
  const rootPath = vscode.workspace.rootPath;

  //extension data path
  const extensionDataPath = getExtensionDataPath();
  const configFilePath = path.join(extensionDataPath, CONFIG_FILE_NAME);

  // Check if a folder is open in VS Code
  if (rootPath) {
    // Define the paths to your build.gradle and gradle-wrapper.properties files
    const buildGradlePath = path.join(rootPath, 'android', 'build.gradle');
    const gradleWrapperPropertiesPath = path.join(rootPath, 'android', 'gradle', 'wrapper', 'gradle-wrapper.properties');

    let config = {};
    //extention path
    if (fs.existsSync(configFilePath)) {
      const configFileContent = fs.readFileSync(configFilePath, 'utf8');
      config = await JSON.parse(configFileContent);
    }

    // Get the desired versions from user input or use the saved versions
    const desiredKotlinVersion = config.desiredKotlinVersion || await vscode.window.showInputBox({ prompt: 'Enter desired Kotlin version' });
    const desiredGradleVersion = config.desiredGradleVersion || await vscode.window.showInputBox({ prompt: 'Enter desired Gradle version' });
    const desiredGradleDistributionUrl = config.desiredGradleDistributionUrl || await vscode.window.showInputBox({ prompt: 'Enter desired Gradle distribution URL' });

    // Update the values in the build.gradle file
    if (fs.existsSync(buildGradlePath)) {
      const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
      const updatedBuildGradleContent = buildGradleContent
        .replace(/ext\.kotlin_version = .+/, `ext.kotlin_version = "${desiredKotlinVersion}"`)
        .replace(/classpath 'com.android.tools.build:gradle:.+/, `classpath 'com.android.tools.build:gradle:${desiredGradleVersion}'`);
      fs.writeFileSync(buildGradlePath, updatedBuildGradleContent);
    }

    // Update the values in the gradle-wrapper.properties file
    if (fs.existsSync(gradleWrapperPropertiesPath)) {
      const gradleWrapperContent = fs.readFileSync(gradleWrapperPropertiesPath, 'utf8');
      const updatedGradleWrapperContent = gradleWrapperContent.replace(/distributionUrl=.+/, `distributionUrl=${desiredGradleDistributionUrl}`);
      fs.writeFileSync(gradleWrapperPropertiesPath, updatedGradleWrapperContent);
    }

    // Save the desired versions in the configuration file
    const updatedConfig = {
      desiredKotlinVersion,
      desiredGradleVersion,
      desiredGradleDistributionUrl,
    };
    fs.writeFileSync(configFilePath, JSON.stringify(updatedConfig, null, 2));

    vscode.window.showInformationMessage('Version update completed.');
  } else {
    vscode.window.showErrorMessage('No folder is opened in VS Code.');
  }
}

function activate(context) {
  let disposable = vscode.commands.registerCommand('extension.updateVersions', updateVersions);

  context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() { }
exports.deactivate = deactivate;
