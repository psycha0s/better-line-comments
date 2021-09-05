const vscode = require('vscode');
const fs     = require('fs');
const path   = require('path');

exports.get = function(langId, config) {
	if(config.includes('.'))
		config = config.split('.');

	let result = null;

	if(langId === "jsonc")
		return "//";

	var langConfigFilepath = null;

	for(const _ext of vscode.extensions.all) {
		// All vscode default extensions ids starts with "vscode."
		if(_ext.id.startsWith("vscode.") && _ext.packageJSON.contributes  &&
				_ext.packageJSON.contributes.languages) {
			// Find language data from "packageJSON.contributes.languages" for the
			// current file's languageId (or just use them all and don't filter here
			const packageLangData = _ext.packageJSON.contributes.languages.find(
				_packageLangData => (_packageLangData.id === langId)
			);

			// If found, get the absolute config file path
			if(!!packageLangData) {
				langConfigFilepath = path.join(_ext.extensionPath, packageLangData.configuration);
				break;
			}
		}
	}

	// Validate config file existence
	if(!!langConfigFilepath && fs.existsSync(langConfigFilepath))
		result = JSON.parse(fs.readFileSync(langConfigFilepath).toString())[`${config[0]}`][`${config[1]}`];

	return result;
}