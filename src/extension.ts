import { exec, spawn, spawnSync } from "child_process";
import { basename, dirname, extname } from "path";
import * as vscode from "vscode";

// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("C Runner is now active!");
  const outputChannel = vscode.window.createOutputChannel("C/C++ Runner");
  const compilerPath = 'C:\\mingw64\\bin';
  if (!process.env.path?.includes(compilerPath)) {
    process.env.path += compilerPath + ';';
  }

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const run = async () => {
    outputChannel.clear();
    let document;
    for (let textEditor of vscode.window.visibleTextEditors) {
      const fileName = textEditor.document?.fileName || "";
      if (extname(fileName) === '.c' || extname(fileName) === '.cpp') {
        document = textEditor.document;
      }
    }
    const fileName = document?.fileName || "";
    vscode.commands.executeCommand("setContext", "cpp-runner.running", true);
    await document?.save();
    const fileBaseName = basename(fileName);
    const fileBaseNameWithoutExt = basename(fileName, extname(fileName));
    const fileDirectory = dirname(fileName);
    let compiler;
    if (document?.languageId === 'c') {
      compiler = 'gcc';
    } else {
      compiler = 'g++';
    }
    const compileProcess = spawnSync(
      `${compiler} "${fileBaseName}" -o "${fileBaseNameWithoutExt}.exe"`,
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

      const runProcess = spawn('start cmd', [`/c ""${fileBaseNameWithoutExt}" & pause>nul"`],
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
          "cpp-runner.running",
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
      vscode.commands.executeCommand("setContext", "cpp-runner.running", false);
    }
  };

  const runDisposable = vscode.commands.registerCommand("cpp-runner.run", run);

  const stopDisposable = vscode.commands.registerCommand("cpp-runner.stop", () => {
    exec('taskkill /f /t /im cmd.exe');
  });

  const restartDisposable = vscode.commands.registerCommand("cpp-runner.restart", async () => {
    exec('taskkill /f /t /im cmd.exe', () => {
      run();
    });
  });

  context.subscriptions.push(runDisposable);
  context.subscriptions.push(stopDisposable);
  context.subscriptions.push(restartDisposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
