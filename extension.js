const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand(
			'better-line-comments.toggle', async function () {
		const editor = vscode.window.activeTextEditor;

		if(!editor)
			return;

		const documentLanguageId = editor.document.languageId;

		if(documentLanguageId != 'c' && documentLanguageId != 'cpp') {
			await vscode.commands.executeCommand("editor.action.commentLine");
			return;
		}

		function commentOffset(text) {
			for(let i = 0; i < text.length; ++i) {
				let ch = text[i];

				if(ch == '/') {
					if(i < text.length - 1 && text[i + 1] == '/')
						return i;

					break;
				}

				if((ch != ' ') && (ch != '\t'))
					break;
			}

			return -1;
		}

		const document = editor.document;
		let selection  = editor.selection;
		let firstLine  = document.lineAt(selection.start).lineNumber;
		let lastLine   = document.lineAt(selection.end).lineNumber;

		if(selection.start.compareTo(selection.end) != 0) {
			let pos = selection.end;

			if(pos.character == 0)
				lastLine = pos.line - 1;
		}
		else {
			await vscode.commands.executeCommand(
					'cursorMove', { to: 'down', by: 'line', value: 1, select: false });
		}

		var offsets = [];
		var diff    = 0;

		for(let index = firstLine; index <= lastLine; ++index) {
			let line   = editor.document.lineAt(index);
			let offset = commentOffset(line.text);
			offsets.push(offset);

			if(offset < 0) {
				diff++;
			}
			else {
				diff--;
			}
		}

		editor.edit(editBuilder => {
			if(diff >= 0) {
				for(let index = firstLine; index <= lastLine; ++index) {
					let line = editor.document.lineAt(index);
					let pos  = line.range.start;
					editBuilder.insert(pos, '//');
				}
			}
			else {
				for(let lineIndex = firstLine; lineIndex <= lastLine; ++lineIndex) {
					let line  = editor.document.lineAt(lineIndex);
					let index = line.lineNumber - firstLine;

					if(offsets[index] >= 0) {
						let pos    = line.range.start.translate(0, offsets[index]);
						let endPos = pos.translate(0, 2);
						editBuilder.delete(new vscode.Range(pos, endPos));
					}
				}
			}
		})
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
