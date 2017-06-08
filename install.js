var path = require('path'),
	fs = require('fs'),
	os = require('os'),
	Q = null,
	shelljs = null,
	utils = null,
	inquirer = null;

const OPTIONS_OVERWIRTE = 0,
	OPTIONS_RENAME = 1;

module.exports.run = function run(cli, targetPath, projectData) {
	var task = new InstallTask(cli, targetPath, projectData);

	return task.run();
};

class InstallTask {

	constructor(cli, targetPath, projectData) {
		this.cli = cli;
		this.projectDir = targetPath;
		this.projectData = projectData;

		Q = cli.require('q');
		shelljs = cli.require('shelljs');
		inquirer = cli.require('inquirer');
		utils = cli.utils;
	}

	run() {
		var self = this;

		return Q()
			.then(function() {
				return self.checkForExistingFiles();
			})
			.then(function(action) {
				var promise = null;

				if (action === OPTIONS_RENAME) {
					promise = self.renameSources();
				}
				else {
					promise = self.cleanSources();
				}
				if (promise !== null) {
					return promise;
				}
			})
			.then(function() {
				return self.runCordova();
			})
			.then(function() {
				return self.copySources();
			});
			// .then(function() {
			// 	var restoreTask = require('./restore');

			// 	return restoreTask.run(self.cli, self.projectDir, self.projectData);
			// });
	}

	cleanSources() {
		var srcPath = path.join(this.projectDir, 'platforms', 'ios');

		if (fs.existsSync(srcPath)) {
			shelljs.rm("-rf", srcPath);
		}

		return Q();
	}

	copySources() {
		// TODO
	}

	checkForExistingFiles() {
		var deferred = Q.defer(),
			targetPath = path.join(this.projectDir, 'platforms', 'ios');

		if (fs.existsSync(targetPath)) {
			inquirer.prompt([{
				type: 'list',
				name: 'action',
				message: ['The directory'.error.bold, targetPath, 'already exists.\n'.error.bold].join(' '),
				choices: [
					{
						name: 'Clean',
						value: OPTIONS_OVERWIRTE, //'overwrite',
						short: '\nCleaning folder and files...'
					},
					{
						name: 'Rename',
						value: OPTIONS_RENAME,// 'rename',
						short: '\nRenaming the existing directory and copying the new files...'
					},
					new inquirer.Separator(' ')
				],
				default: OPTIONS_RENAME	//'rename'
			}]).then(function(answers) {
				deferred.resolve(answers.action);
			});
		}
		else {
			deferred.resolve({});
		}

		return deferred.promise;
	}

	renameSources() {
		var srcPath = path.join(this.projectDir, 'platforms', 'ios'),
			targetPath = path.join(this.projectDir, 'platforms', 'ios.old');

		if (fs.existsSync(targetPath)) {
			var count = 1;
			while (fs.existsSync(targetPath + '.' + count)) {
				count++;
			}

			targetPath += '.' + count;
		}

		shelljs.mv(srcPath, targetPath);

		return Q();
	}

	runCordova() {
		if (shelljs.exec("cordova platform add ios").code != 0) {
			shelljs.rm('-rf', path.join(_this.projectDir, "platforms", "ios"));
			throw new Error("Make sure cordova is installed (npm install -g cordova).");
		}

		return Q();
	}
}
