const vscode = require('vscode');

const commentById = {
	'bat': 'REM',
	'c': '//',
	'clojure': ';;',
	'cmake': '#',
	'coffeescript': '#',
	'cpp': '//',
	'csharp': '//',
	'd': '//',
	'fsharp': '//',
	'go': '//',
	'groovy': '//',
	'ini': ';',
	'java': '//',
	'javascript': '//',
	'json': '//',
	'jsonc': '//',
	'lua': '--',
	'makefile': '#',
	'objective-c': '//',
	'objective-cpp': '//',
	'perl ': '#',
	'perl6': '#',
	'php': '//',
	'powershell': '#',
	'python': '#',
	'r': '#',
	'ruby': '#',
	'rust': '//',
	'shellscript': '#',
	'sql': '--',
	'swift': '//',
	'typescript': '//',
	'vb': '\'',
	'yaml': '#'
};


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('better-line-comments.toggle', async function () {
		let config = vscode.workspace.getConfiguration('better-line-comments');
		const moveCaretDown = config.get('moveCaretDown');

		const editor     = vscode.window.activeTextEditor;
		const document   = editor.document;
		const languageId = document.languageId;

		if(!editor)
			return;

		console.log(languageId);
		const commentString = commentById[languageId];

		if(!commentString) {
			await vscode.commands.executeCommand("editor.action.commentLine");
			const selections = editor.selections;

			if(selections.length == 1 && selections[0].isEmpty && moveCaretDown) {
				await vscode.commands.executeCommand('cursorMove',
						{ to: 'down', by: 'line', value: 1, select: false });
			}
			return;
		}

		const commentLength = commentString.length;

		function commentOffset(text) {
			let i = 0;

			while(i < text.length && text[i] == ' ' || text[i] == '\t')
				++i;

			if(i == text.length || i > text.length - commentLength)
				return -1;

			if(commentString != text.substring(i, i + commentLength))
				return -1;

			return i;
		}

		for(const selection of editor.selections) {
			let firstLine = document.lineAt(selection.start).lineNumber;
			let lastLine  = document.lineAt(selection.end).lineNumber;

			if(!selection.isEmpty) {
				let pos = selection.end;

				if(pos.character == 0)
					lastLine = pos.line - 1;
			}
			else {
				if(editor.selections.length == 1 && moveCaretDown) {
					await vscode.commands.executeCommand('cursorMove',
							{ to: 'down', by: 'line', value: 1, select: false });
				}
			}

			var offsets = [];
			var diff    = 0;

			for(let index = firstLine; index <= lastLine; ++index) {
				let line   = editor.document.lineAt(index);
				let offset = commentOffset(line.text);
				offsets.push(offset);

				if(offset >= 0) {
					diff++;
				}
				else {
					diff--;
				}
			}

			await editor.edit(editBuilder => {
				if(diff == offsets.length) {
					for(let lineIndex = firstLine; lineIndex <= lastLine; ++lineIndex) {
						let line  = editor.document.lineAt(lineIndex);
						let index = line.lineNumber - firstLine;

						if(offsets[index] >= 0) {
							let pos = line.range.start.translate(0, offsets[index]);
							let end = pos.translate(0, commentLength);
							editBuilder.delete(new vscode.Range(pos, end));
						}
					}
				}
				else {
					for(let index = firstLine; index <= lastLine; ++index) {
						let line = editor.document.lineAt(index);
						let pos  = line.range.start;
						editBuilder.insert(pos, commentString);
					}
				}
			})
		}
	});

	context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
