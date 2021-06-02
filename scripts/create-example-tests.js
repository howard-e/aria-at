'use strict';
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const beautify = require('json-beautify');

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    b: 'build',
    v: 'verbose'
  },
});

if (args.help) {
  console.log(`Default use:
  No arguments:
    Generate tests and view report summary.
  Arguments:
    -h, --help
       Show this message.
    -b, --build
       Updates build folder with generated test files.
    -v, --verbose
       Generate tests and view a detailed report summary.
`);
  process.exit();
}

const BUILD_CHECK = !!args.build;
const VERBOSE_CHECK = !!args.verbose;

let suppressedMessageCount = 0;
let successRuns = 0;
let errorRuns = 0;

/**
 * @param {string} message - message to be logged
 * @param {boolean} severe=false - indicates whether the message should be viewed as an error or not
 * @param {boolean} force=false - indicates whether this message should be forced to be outputted regardless of verbosity level
 */
const logger = (message, severe = false, force = false) => {
  if (VERBOSE_CHECK || force) {
    if (severe) console.error(message)
    else console.log(message)
  } else {
    // Output no logs
    suppressedMessageCount += 1; // counter to indicate how many messages were hidden
  }
}

/**
 * @param {string} directory - path to directory of data to be used to generate test
 * @param {boolean} isLast=false - indicates whether or not this is the last test being generated. used for report summary generation
 */
const createExampleTests = function (directory, isLast) {
  const validModes = ['reading', 'interaction', 'item'];

  // TODO: provide support for changing of source directories
  // cwd; @param rootDirectory is dependent on this file not moving from the scripts folder
  const scriptsDirectory = path.dirname(__filename);
  const rootDirectory = scriptsDirectory.split('scripts')[0];

  const testsDirectory = path.join(rootDirectory, 'tests');
  const testPlanDirectory = path.join(rootDirectory, directory);

  const resourcesDirectory = path.join(testsDirectory, 'resources');
  const keysFilePath = path.join(resourcesDirectory, 'keys.mjs');
  const supportFilePath = path.join(testsDirectory, 'support.json');
  const testsFilePath = path.join(testPlanDirectory, 'data', 'tests.csv');
  const atCommandsFilePath = path.join(testPlanDirectory, 'data', 'commands.csv');
  const referencesFilePath = path.join(testPlanDirectory, 'data', 'references.csv');
  const javascriptDirectory = path.join(testPlanDirectory, 'data', 'js');

  // build output folders and file paths setup
  const buildDirectory = path.join(rootDirectory, 'build');
  const testsBuildDirectory = path.join(buildDirectory, 'tests');
  const testPlanBuildDirectory = path.join(buildDirectory, directory);

  const indexFileOutputPath = path.join(testPlanDirectory, 'index.html');
  const indexFileBuildOutputPath = path.join(testPlanBuildDirectory, 'index.html');

  const resourcesBuildDirectory = path.join(testsBuildDirectory, 'resources');
  const supportFileBuildPath = path.join(testsBuildDirectory, 'support.json');

  if (BUILD_CHECK) {
    // create build directories if not exists
    fs.existsSync(buildDirectory) || fs.mkdirSync(buildDirectory);
    fs.existsSync(testsBuildDirectory) || fs.mkdirSync(testsBuildDirectory);
    fs.existsSync(testPlanBuildDirectory) || fs.mkdirSync(testPlanBuildDirectory);

    // need to ensure the build folder has the references it needs
    fse.copySync(resourcesDirectory, resourcesBuildDirectory, {overwrite: true})
    fse.copySync(supportFilePath, supportFileBuildPath, {overwrite: true})
  }

  const keyDefs = {};

  const support = JSON.parse(fse.readFileSync(supportFilePath));
  let allATKeys = [];
  let allATNames = [];
  support.ats.forEach(at => {
    allATKeys.push(at.key);
    allATNames.push(at.name);
  });

  const validAppliesTo = ['Screen Readers', 'Desktop Screen Readers'].concat(allATKeys);

  try {
    fse.statSync(testPlanDirectory);
  } catch (err) {
    logger(`The test directory '${testPlanDirectory}' does not exist. Check the path to tests.`, true, true);
    process.exit();
  }

  try {
    fse.statSync(testsFilePath);
  } catch (err) {
    logger(`The tests.csv file does not exist. Please create '${testsFilePath}' file.`, true, true);
    process.exit();
  }

  try {
    fse.statSync(atCommandsFilePath);
  } catch (err) {
    logger(`The at-commands.csv file does not exist. Please create '${atCommandsFilePath}' file.`, true, true);
    process.exit();
  }

  try {
    fse.statSync(referencesFilePath);
  } catch (err) {
    logger(`The references.csv file does not exist. Please create '${referencesFilePath}' file.`, true, true);
    process.exit();
  }

  // get Keys that are defined

  try {
    // read contents of the file
    const keys = fs.readFileSync(keysFilePath, 'UTF-8');

    // split the contents by new line
    const lines = keys.split(/\r?\n/);

    // print all lines
    lines.forEach((line) => {
      let parts1 = line.split(' ');
      let parts2 = line.split('"');

      if (parts1.length > 3) {
        let code = parts1[2].trim();
        keyDefs[code] = parts2[1].trim();
      }

    });
  } catch (err) {
    logger(err, true, true);
  }

  // delete test files

  var deleteFilesFromDirectory = function (dirPath) {
    try {
      var files = fs.readdirSync(dirPath);
    } catch (e) {
      return;
    }
    if (files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        var filePath = dirPath + '/' + files[i];
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    }
  };

  function cleanTask(task) {
    return task.replace(/'/g, '').replace(/;/g, '').trim().toLowerCase()
  }

  // Create AT commands file

  function createATCommandFile(cmds) {
    const fname = path.join(testPlanDirectory, 'commands.json');
    const fnameBuild = path.join(testPlanBuildDirectory, 'commands.json');
    let data = {};

    function addCommand(task, mode, at, key) {

      task = cleanTask(task);
      mode = mode.trim().toLowerCase();
      at = at.trim().toLowerCase();


      if (typeof key !== 'string' || key.length === 0) {
        return;
      }

      if (typeof data[task] !== 'object') {
        data[task] = {};
      }

      if (typeof data[task][mode] !== 'object') {
        data[task][mode] = {};
      }

      if (typeof data[task][mode][at] !== 'object') {
        data[task][mode][at] = [];
      }

      let items = key.split('(');

      items[0] = items[0].trim();

      if (typeof keyDefs[items[0]] !== 'string') {
        addCommandError(task, items[0]);
      }

      if (items.length === 2) {
        items[1] = '(' + items[1].trim();
      }

      data[task][mode][at].push(items);
    }

    cmds.forEach(function (cmd) {

      addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandA);
      addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandB);
      addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandC);
      addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandD);
      addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandE);
      addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandF);

    });

    fs.writeFileSync(fname, beautify(data, null, 2, 40));
    if (BUILD_CHECK) fs.writeFileSync(fnameBuild, beautify(data, null, 2, 40));

    return data;

  }

  // Create Test File

  function createTestFile(test, refs, commands) {
    let scripts = [];


    function getModeValue(value) {
      let v = value.trim().toLowerCase();
      if (!validModes.includes(v)) {
        addTestError(test.testId, '"' + value + '" is not valid value for "mode" property.')
      }
      return v;
    }

    function getTask(t) {
      let task = cleanTask(t);

      if (typeof commands[task] !== 'object') {
        addTestError(test.testId, '"' + task + '" does not exist in commands.csv file.')
      }

      return task;
    }

    function getAppliesToValues(values) {

      function checkValue(value) {
        let v1 = value.trim().toLowerCase();
        for (let i = 0; i < validAppliesTo.length; i++) {
          let v2 = validAppliesTo[i];
          if (v1 === v2.toLowerCase()) {
            return v2;
          }
        }
        return false;
      }

      // check for individual assistive technologies
      let items = values.split(',');
      let newValues = [];
      items.filter(item => {
        let value = checkValue(item);
        if (!value) {
          addTestError(test.testId, '"' + item + '" is not valid value for "appliesTo" property.')
        }

        newValues.push(value);
      });

      return newValues;
    }

    function addAssertion(a) {
      let level = '1';
      let str = a;
      a = a.trim();

      let parts = a.split(':');

      if (parts.length === 2) {
        level = parts[0];
        str = parts[1].substring(0);
        if ((level != '1') && (level != '2')) {
          addTestError(test.testId, "Level value must be 1 or 2, value found was '" + level + "' for assertion '" + str + "' (NOTE: level 2 defined for this assertion).");
          level = '2';
        }
      }

      if (a.length) {
        assertions.push([level, str]);
      }
    }

    function getReferences(example, testRefs) {
      let links = '';

      if (typeof example === 'string' && example.length) {
        links += `<link rel="help" href="${refs.example}">\n`;
      }

      let items = test.refs.split(' ');
      items.forEach(function (item) {
        item = item.trim();

        if (item.length) {
          if (typeof refs[item] === 'string') {
            links += `<link rel="help" href="${refs[item]}">\n`;
          } else {
            addTestError(test.testId, "Reference does not exist: " + item);
          }
        }
      });

      return links;
    }

    function addSetupScript(scriptName, fname) {

      let script = '';
      if (fname.length) {

        try {
          fse.statSync(fname);
        } catch (err) {
          addTestError(test.testId, "Setup script does not exist: " + fname);
          return '';
        }

        try {
          const data = fs.readFileSync(fname, 'UTF-8');
          const lines = data.split(/\r?\n/);
          lines.forEach((line) => {
            if (line.trim().length)
              script += '\t\t\t' + line.trim() + '\n';
          });
        } catch (err) {
          logger(err, true, true);
        }

        scripts.push(`\t\t${scriptName}: function(testPageDocument){\n${script}\t\t}`);
      }

      return script;
    }

    function getSetupScriptDescription(desc) {
      let str = '';
      if (typeof desc === 'string') {
        let d = desc.trim();
        if (d.length) {
          str = d;
        }
      }

      return str;
    }

    function getScripts() {
      let js = 'var scripts = {\n';
      js += scripts.join(',\n');
      js += '\n\t};';
      return js;
    }

    let task = getTask(test.task);
    let appliesTo = getAppliesToValues(test.appliesTo);
    let mode = getModeValue(test.mode);

    appliesTo.forEach(at => {
      if (commands[task]) {
        if (!commands[task][mode][at.toLowerCase()]) {
          addTestError(test.testId, 'command is missing for the combination of task: "' + task + '", mode: "' + mode + '", and AT: "' + at.toLowerCase() + '" ');
        }
      }
    });

    let assertions = [];
    let setupFileName = '';
    let id = test.testId;
    if (parseInt(test.testId) < 10) {
      id = '0' + id;
    }
    let testFileName = 'test-' + id + '-' + cleanTask(test.task).replace(/\s+/g, '-') + '-' + test.mode.trim()
      .toLowerCase() + '.html';
    let testJSONFileName = 'test-' + id + '-' + cleanTask(test.task).replace(/\s+/g, '-') + '-' + test.mode.trim()
      .toLowerCase() + '.json';

    let testPlanHtmlFilePath = path.join(testPlanDirectory, testFileName);
    let testPlanJsonFilePath = path.join(testPlanDirectory, testJSONFileName);
    let testPlanHtmlFileBuildPath = path.join(testPlanBuildDirectory, testFileName);
    let testPlanJsonFileBuildPath = path.join(testPlanBuildDirectory, testJSONFileName);

    if (typeof test.setupScript === 'string') {
      let setupScript = test.setupScript.trim();
      if (setupScript.length) {
        setupFileName = path.join(javascriptDirectory, test.setupScript + '.js');
      }
    }

    let references = getReferences(refs.example, test.refs);
    addSetupScript(test.setupScript, setupFileName);

    for (let i = 1; i < 31; i++) {
      if (!test["assertion" + i]) {
        continue;
      }
      addAssertion(test["assertion" + i]);
    }

    let testData = {
      setup_script_description: getSetupScriptDescription(test.setupScriptDescription),
      setupTestPage: test.setupScript,
      applies_to: appliesTo,
      mode: mode,
      task: task,
      specific_user_instruction: test.instructions,
      output_assertions: assertions
    };

    fse.writeFileSync(testPlanJsonFilePath, JSON.stringify(testData, null, 2), 'utf8');
    if (BUILD_CHECK) fse.writeFileSync(testPlanJsonFileBuildPath, JSON.stringify(testData, null, 2), 'utf8');

    function getTestJson() {
      return JSON.stringify(testData, null, 2);
    }

    function getCommandsJson() {
      return beautify({[task]: commands[task]}, null, 2, 40);
    }

    let testHTML = `
<!DOCTYPE html>
<meta charset="utf-8">
<title>${test.title}</title>
${references}
<script>
  ${getScripts()}
</script>
<script type="module">
  import { initialize, verifyATBehavior, displayTestPageAndInstructions } from "../resources/aria-at-harness.mjs";

  new Promise((resolve) => {
    fetch('../support.json')
      .then(response => resolve(response.json()))
    })
  .then(supportJson => {
    const testJson = ${getTestJson()};
    const commandJson = ${getCommandsJson()};
    initialize(supportJson, commandJson);
    verifyATBehavior(testJson);
    displayTestPageAndInstructions("${refs.reference}");
  });
</script>
  `;

    fse.writeFileSync(testPlanHtmlFilePath, testHTML, 'utf8');
    if (BUILD_CHECK) fse.writeFileSync(testPlanHtmlFileBuildPath, testHTML, 'utf8');

    const applies_to_at = [];

    allATKeys.forEach(at => applies_to_at.push(testData.applies_to.indexOf(at) >= 0));

    return [testFileName, applies_to_at];
  }

  // Create an index file for a local server

  function createIndexFile(tasks) {

    let rows = '';
    let all_ats = '';

    allATNames.forEach(at => all_ats += '<th>' + at + '</th>\n');

    tasks.forEach(function (task) {
      rows += `<tr><td>${task.id}</td>`;
      rows += `<td scope="row">${task.title}</td>`;
      for (let i = 0; i < allATKeys.length; i++) {
        if (task.applies_to_at[i]) {
          rows += `<td class="test"><a href="${task.href}?at=${allATKeys[i]}" aria-label="${allATNames[i]} test for task ${task.id}">${allATNames[i]}</a></td>`;
        } else {
          rows += `<td class="test none">not included</td>`;
        }
      }
      rows += `<td>${task.script}</td></tr>\n`
    });

    let indexHTML = `
<!DOCTYPE html>
<meta charset="utf-8">
<head>
  <title>Index of Assistive Technology Test Files</title>
  <style>
    table {
      display: table;
      border-collapse: collapse;
      border-spacing: 2px;
      border-color: gray;
    }

    thead {
      display: table-row-group;
      vertical-align: middle;
      border-bottom: black solid 2px;
    }

    tbody {
      display: table-row-group;
      vertical-align: middle;
      border-color: gray;
    }

    tr:nth-child(even) {background: #DDD}
    tr:nth-child(odd) {background: #FFF}

    tr {
      display: table-row;
      vertical-align: inherit;
      border-color: gray;
    }

    td {
      padding: 3px;
      display: table-cell;
    }

    td.test {
      text-align: center;
    }

    td.none {
      color: #333;
    }

    th {
      padding: 3px;
      font-weight: bold;
      display: table-cell;
    }
  </style>
</head>
<body>
 <main>
  <h1>Index of Assistive Technology Test Files</h1>
  <p>This is useful for viewing the local files on a local web server and provides links that will work when the local version of the
  test runner is being executed, using <code>npm run start</code> from the root directory: <code>${rootDirectory}</code>.</p>
  <table>
    <thead>
      <tr>
        <th>Task ID</th>
        <th>Testing Task</th>
        ${all_ats}
        <th>Setup Script Reference</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
  </main>
</body>
`;

    fse.writeFileSync(indexFileOutputPath, indexHTML, 'utf8');
    if (BUILD_CHECK) fse.writeFileSync(indexFileBuildOutputPath, indexHTML, 'utf8');
  }

  // Process CSV files

  var refs = {};
  var atCommands = [];
  var tests = [];
  var errorCount = 0;
  var errors = '';
  var indexOfURLs = [];

  function addTestError(id, error) {
    errorCount += 1;
    errors += '[Test ' + id + ']: ' + error + '\n';
  }

  function addCommandError(task, key) {
    errorCount += 1;
    errors += '[Command]: The key reference "' + key + '" is invalid for the "' + task + '" task.\n';
  }

  fs.createReadStream(referencesFilePath)
    .pipe(csv())
    .on('data', (row) => {
      refs[row.refId] = row.value.trim();
    })
    .on('end', () => {
      logger(`References CSV file successfully processed: ${referencesFilePath}`);

      fs.createReadStream(atCommandsFilePath)
        .pipe(csv())
        .on('data', (row) => {
          atCommands.push(row);
        })
        .on('end', () => {
          logger(`Commands CSV file successfully processed: ${atCommandsFilePath}`);

          fs.createReadStream(testsFilePath)
            .pipe(csv())
            .on('data', (row) => {
              tests.push(row);
            })
            .on('end', () => {
              logger(`Test CSV file successfully processed: ${testsFilePath}`);

              logger('Deleting current test files...')
              deleteFilesFromDirectory(testPlanDirectory);

              atCommands = createATCommandFile(atCommands);

              logger('Creating the following test files: ')
              tests.forEach(function (test) {
                try {
                  let [url, applies_to_at] = createTestFile(test, refs, atCommands);
                  indexOfURLs.push({
                    id: test.testId,
                    title: test.title,
                    href: url,
                    script: test.setupScript,
                    applies_to_at: applies_to_at
                  });
                  logger('[Test ' + test.testId + ']: ' + url);
                } catch (err) {
                  logger(err, true, true);
                }
              });

              createIndexFile(indexOfURLs);

              if (errorCount) {
                logger(`*** ${errorCount} Errors in tests and/or commands in file [${testsFilePath}] ***`, true, true);
                logger(errors, true, true);
                errorRuns += 1;
              } else {
                logger('No validation errors detected\n');
                successRuns += 1;
              }
            })
            .on('finish', () => {
              if (!VERBOSE_CHECK && isLast) {
                logger(`(${successRuns}) out of (${successRuns + errorRuns}) Test Plans successfully processed and generated without any validation errors.\n`, false, true)
                logger(`NOTE: ${suppressedMessageCount} messages suppressed. Run 'npm run create-all-tests -- --help' or 'node ./scripts/create-all-tests.js --help' to learn more.`, false, true)
              }
            });
        })
    })
}

exports.createExampleTests = createExampleTests
