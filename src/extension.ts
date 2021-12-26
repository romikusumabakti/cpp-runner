// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ChildProcessWithoutNullStreams, spawn, spawnSync } from "child_process";
import { basename, dirname, extname } from "path";
import * as vscode from "vscode";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("C Runner is now active!");
  const outputChannel = vscode.window.createOutputChannel("C Runner");
  let runProcess: ChildProcessWithoutNullStreams;

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const run = async () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.commands.executeCommand("setContext", "c-runner.running", true);
    await vscode.window.activeTextEditor?.document.save();
    outputChannel.clear();
    const fileName = vscode.window.activeTextEditor?.document.fileName || "";
    const fileBaseName = basename(fileName);
    const fileBaseNameWithoutExt = basename(fileName, extname(fileName));
    const fileDirectory = dirname(fileName);
    const compileProcess = spawnSync(
      `gcc ${fileBaseName} -o ${fileBaseNameWithoutExt}.exe`,
      { cwd: fileDirectory, shell: true, encoding: "utf-8" }
    );
    for (let output of compileProcess.output) {
      if (output) {
        outputChannel.appendLine(output);
      }
    }
    if (compileProcess.status === 0) {
      vscode.window.showInformationMessage(
        `${fileBaseName} compiled successfully.`
      );

      const runProcess = spawn('start cmd', [`/c "${fileBaseNameWithoutExt} & pause>nul"`],
        { cwd: fileDirectory, shell: true }
      );

      runProcess.stdout.on('data', (data) => {
        console.log(data.toString());
      });

      runProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      runProcess.on('exit', (code) => {
        console.log(`Child exited with code ${code}`);
      });

      runProcess.on('close', () => {
        vscode.commands.executeCommand(
          "setContext",
          "c-runner.running",
          false
        );
      });

      runProcess.on('error', () => {
        console.log('Error.');
      });

      vscode.window.showInformationMessage(
        `${fileBaseNameWithoutExt}.exe executed successfully.`
      );
    } else {
      outputChannel.show();
      vscode.window.showErrorMessage("Compilation failed.");
      vscode.commands.executeCommand("setContext", "c-runner.running", false);
    }
  };

  const runDisposable = vscode.commands.registerCommand("c-runner.run", run);

  const stopDisposable = vscode.commands.registerCommand("c-runner.stop", () => {
    console.log(`taskkill /pid ${runProcess}`);
  });

  const restartDisposable = vscode.commands.registerCommand("c-runner.restart", () => {
    runProcess.kill(runProcess.pid);
    vscode.commands.executeCommand("setContext", "c-runner.running", false);
    run();
  });

  context.subscriptions.push(runDisposable);
  context.subscriptions.push(stopDisposable);
  context.subscriptions.push(restartDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
