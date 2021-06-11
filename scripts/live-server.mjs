import fs from 'fs';
import path from 'path';
import {spawn, spawnSync, exec} from 'child_process';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2), {
    alias: {
        h: 'help',
        o: 'outputdir',
        p: 'port'
    },
});

if (args.help) {
    console.log(`Default use:
  No arguments:
    Start Live Server for temporarily generated tests and review files.
  Arguments:
    -h, --help
       Show this message.
    -o, --outputdir
       Define output directory generated files will be stored in. Default is '.test'.
    -p, --port
       Define PORT to be used. Default PORT is 5000.
`);
    process.exit();
}

const PORT = args.port || 5000;
const OUTPUT_DIR = args.outputdir || '.temp';

// cleanup .temp build folder if exists
const tempBuildDirectory = path.resolve('.', OUTPUT_DIR);
fs.rmdirSync(tempBuildDirectory, {recursive: true, force: true});

// set up commands to create temp build folder
const buildCreateTestsCommand = 'npm';
const buildCreateTestsCommandArguments = ['run', 'create-all-tests', '--', `--outputdir=${OUTPUT_DIR}`];

const buildReviewsCommand = 'npm';
const buildReviewsCommandArguments = ['run', 'review-tests', '--', `--outputdir=${OUTPUT_DIR}`];

console.info('Generating test and review pages ...');
spawnSync(buildCreateTestsCommand, buildCreateTestsCommandArguments);
spawnSync(buildReviewsCommand, buildReviewsCommandArguments);
console.info('Generation COMPLETE\n');

// start live hot-reloadable server using 'live-server' node module
const command = 'npx';
const commandArguments = ['live-server', `--port=${PORT}`, OUTPUT_DIR];
const child = spawn(command, commandArguments);

console.info(`Starting live server on PORT:${PORT} ...`);

child.stdout.pipe(process.stdout);
child.stdout.on('end', () => fs.rmdirSync(tempBuildDirectory, {recursive: true, force: true}));
child.stdout.on('exit', () => fs.rmdirSync(tempBuildDirectory, {recursive: true, force: true}));
child.stdout.on('close', () => fs.rmdirSync(tempBuildDirectory, {recursive: true, force: true}));
