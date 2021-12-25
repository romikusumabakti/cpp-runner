// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { exec, spawnSync } from 'child_process';
import { basename, dirname, extname } from 'path';
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('C Runner is now active!');
	const outputChannel = vscode.window.createOutputChannel('C Runner');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('c-runner.run', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		await vscode.window.activeTextEditor?.document.save();
		const fileName = vscode.window.activeTextEditor?.document.fileName || '';
		const fileBaseName = basename(fileName);
		const fileBaseNameWithoutExt = basename(fileName, extname(fileName));
		const fileDirectory = dirname(fileName);
		const process = spawnSync(`gcc ${fileBaseName} -o ${fileBaseNameWithoutExt}.exe`, { cwd: fileDirectory, shell: true, encoding: "utf-8" });
		if (process.output.length > 0) {
            outputChannel.appendLine(process.output.toLocaleString());
        }
		if (process.status === 0) {
			vscode.window.showInformationMessage(`${fileBaseName} compiled successfully.`);
			vscode.commands.executeCommand("setContext", "c-runner.running", true);
			exec(`start cmd /c "${fileBaseNameWithoutExt} & pause>nul"`, { cwd: fileDirectory }, () => {
				vscode.commands.executeCommand("setContext", "c-runner.running", false);
			});
			vscode.window.showInformationMessage(`${fileBaseNameWithoutExt}.exe executed successfully.`);
		} else {
			outputChannel.show();
			vscode.window.showErrorMessage('Compilation failed.');
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
