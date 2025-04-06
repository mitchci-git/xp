const history = document.getElementById('history');
const input = document.getElementById('input');
const ps1 = document.getElementById('ps1');
const caret = document.getElementById('caret');
const body = document.querySelector('body');

body.classList.add('dos');

let buffer = "";
var command = "";
var driveLetter = "C";
var blinkTimer = null;
var commandHistory = new Array();
var path = new Array();
var tmpCommand = "";
var historyPos = 0;

function processCommand(text) {
    if (text.indexOf(" ") != -1) {
        var actualCommand = text.substring(0, text.indexOf(" "));
        var parameters = text.substring(text.indexOf(" ") + 1, text.length).split(" ");
    } else {
        var actualCommand = text;
        var parameters = new Array();
    }
    try {
        if ((actualCommand.indexOf(":") == 1) && (actualCommand.length == 2)) {
            driveLetter = actualCommand.charAt(0).toUpperCase();
            return "";
        }
        switch (actualCommand.toLowerCase()) {
            case "":
                return "";
            case "defrag":
                return defrag();
            case "scandisk":
                return scandisk();
            case "ver":
                return "JSDOS v0.1.442024\n\n";
            case "win":
                return "Windows not invented yet\n\n";
            case "set":
            case "eval":
                return eval(parameters.join(" ")) + "\n";
            case "clear":
            case "cls":
                history.innerHTML = "";
            case "cd":
                return processDirectoryChange(parameters[0]);
            case "cd\\":
                return processDirectoryChange("\\");
            case "ls":
            case "dir":
                return processDir(parameters[0]);
            case "echo":
                return parameters.join(" ") + "\n";
            case "date":
                return Date() + "\n";
            case "help":
                return printHelp();
            case "exit":
                return init();
        }
        try {
            var output = eval(text);

            // check command returned some output
            // (if it failed we move to the catch block, so this is only
            // for valid javascript that doesn't return anything)

            if (output != undefined)
                return output + "<br>";
            else
                // If eval returns undefined, treat as unrecognized
                return `'${text}' is not recognized as an internal or external command,<br>operable program or batch file.<br>`;
        } catch (err) {
            // If eval fails, it's an unrecognized command
            return `'${text}' is not recognized as an internal or external command,<br>operable program or batch file.<br>`;
        }
    } catch (err) {
        return "Command caused an error [" + err + "]<br>";
    }
    // Default fallback for unrecognized commands
    return `'${text}' is not recognized as an internal or external command,<br>operable program or batch file.<br>`;
}

function processDirectoryChange(dirs) {
    if (dirs == undefined)
        return "";
    else if (dirs.charAt(1) == ":") {
        driveLetter = dirs.charAt(0);
        path = dirs.substring(3, dirs.length).split("\\");
        return "";
    }
    dirs = dirs.replace(/\//g, "\\");
    dirArray = dirs.split("\\");
    for (var dir in dirArray) {
        changeDirectory(dirArray[dir]);
    }
    return "";
}

function changeDirectory(dir) {
    if ((dir == ".") || (dir == ""))
        return;
    else if (dir == "..")
        path.pop();
    else if (dir == "\\")
        path = new Array();
    else
        path.push(dir);
    return "";
}

function processDir(dir) {
    if (dir == undefined)
        dir = driveLetter + ":\\" + path.join("\\");
    var output = "";
    output += " Volume in drive " + driveLetter + " has no label.<br />";
    output += " Volume Serial Number is 98B1-B33F\n";
    output += "\n";
    output += " Directory of " + dir + "\n";
    output += "\n";
    output += " 01/01/2009&#9;01:00 AM&#9;&lt;DIR&gt;&#9;&#9;.\n";
    output += " 01/01/2009&#9;01:00 AM&#9;&lt;DIR&gt;&#9;&#9;..\n";
    output += "               0 File(s)              0 bytes\n";
    output += "               2 Dir(s)   98,061,203,456 bytes free\n\n";

    return output;
}

function printHelp() {
    var output = "";
    output += "Supported commands are:\n";
    output += " help\n";
    output += " ver\n";
    output += " defrag\n";
    output += " scandisk\n";
    output += " echo [text]\n";
    output += " cls\n";
    output += " dir\n";
    output += " cd [directory]\n";
    output += " eval [javascript code]\n\n";

    return output;
}

function println(text) {
  const line = document.createElement('div');
  //let output = text.replace(/\n/g, "<br />");
  line.innerHTML = `${text}`;

  history.appendChild(line);
}

function init() {
    println("Microsoft Windows XP [Version 5.1.2600]<br>(C) Copyright 1985-2001 Microsoft Corp.");
    // println("(C) Copyright 1985-2001 Microsoft Corp."); // Combined into one call
}


function focusAndMoveCursorToTheEnd(e) {  
  input.focus();
  
  const range = document.createRange();
  const selection = window.getSelection();
  const { childNodes } = input;
  const lastChildNode = childNodes && childNodes.length - 1;
  
  range.selectNodeContents(lastChildNode === -1 ? input : childNodes[lastChildNode]);
  range.collapse(false);

  selection.removeAllRanges();
  selection.addRange(range);
}

// Every time the selection changes, add or remove the .noCursor
// class to show or hide, respectively, the bug square cursor.
// Note this function could also be used to enforce showing always
// a big square cursor by always selecting 1 chracter from the current
// cursor position, unless it's already at the end, in which case the
// #cursor element should be displayed instead.
document.addEventListener('selectionchange', () => {
  if (document.activeElement.id !== 'input') return;
  
  const range = window.getSelection().getRangeAt(0);
  const start = range.startOffset;
  const end = range.endOffset;
  const length = input.textContent.length;
  
  if (end < length) {
    input.classList.add('noCaret');
  } else {
    input.classList.remove('noCaret');
  }
});

input.addEventListener('input', () => {    
  // If we paste HTML, format it as plain text and break it up
  // input individual lines/commands:
  if (input.childElementCount > 0) {
    const lines = input.innerText.replace(/\n$/, '').split('\n');
    const lastLine = lines[lines.length - 1];
    
    for (let i = 0; i <= lines.length - 2; ++i) {
      // handleCommand(lines[i]);
    }
  
    input.textContent = lastLine;
    
    focusAndMoveCursorToTheEnd();
  }
  
  // If we delete everything, display the square caret again:
  if (input.innerText.length === 0) {
    input.classList.remove('noCaret');
  }  
});

document.addEventListener('keydown', (e) => {   
  // If some key is pressed outside the input, focus it and move the cursor
  // to the end:
  if (e.target !== input) focusAndMoveCursorToTheEnd();
});

input.addEventListener('keydown', (e) => {    
  if (e.key === 'Enter') {
    e.preventDefault();
    const commandText = input.textContent;
    const outputText = processCommand(commandText);
    const currentPrompt = ps1.textContent; // Get prompt from #ps1 span
    
    // Combine prompt, echo (with space), and output into one println call
    println(`${currentPrompt} ${commandText}<br>${outputText}`);    
    
    input.textContent = '';
  }
});

// Set the focus to the input so that you can start typing straight away:
input.focus();

init();

//
// Defrag
//////////////////////////

function defrag() {

    // Constants
    const TOTAL_BLOCKS = 1300;
    const TOTALCLUSTERS = 12600 + ~~(Math.random() * 4250);
    const CLUSTERSPERBLOCK = ~~(TOTALCLUSTERS / TOTAL_BLOCKS);

    // DOM
    const modals = document.querySelectorAll('#defrag.testing.dialog, #defrag.reading.dialog, #defrag.analyzing.dialog, #defrag.finished.dialog');
    const screens = document.querySelectorAll('#defrag.surface, #defrag.info');
    const surface = document.querySelector('#defrag.surface');
    const currentCluster = document.querySelector('#defrag.currentcluster');
    const percent = document.querySelector('#defrag.percent');
    const fill = document.querySelector('#defrag.fill');
    const elapsedTime = document.querySelector('#defrag.elapsedtime');
    const screen = document.querySelector('#defrag');
    const history = document.getElementById('history');
    const input = document.getElementById('input');
    const ps1 = document.getElementById('ps1');
    const caret = document.getElementById('caret');
    const body = document.querySelector('body');
    
    history.hidden = true;
    caret.classList.add('off');
    input.hidden = true;
    ps1.hidden = true;
    body.setAttribute("class", "defrag");
    screen.hidden = false;

    // Block generator
    const genBlock = () => {
      const num = ~~(Math.random() * 500);

      if (num < 1)
      return 'bad';
      if (num < 2)
      return 'unmovable';
      if (num < 175)
      return 'used frag';else

      return 'unused';
    };

    // Generate surface
    for (let i = 0; i < TOTAL_BLOCKS; i++) {
      const span = document.createElement('span');
      span.className = `block ${genBlock()}`;
      surface.appendChild(span);
    }

    document.querySelector('.clustersperblock').textContent = CLUSTERSPERBLOCK.toLocaleString('en');

    // Time Counter
    let time = 0;
    const updateTime = () => {
      elapsedTime.textContent = new Date(time * 1000).toISOString().substr(11, 8);
      time++;
    };

    // Ending phase
    const endDefrag = () => {
      modals[3].hidden = false;
      clearInterval(timer);
    };

    // Reading phase
    const readBlock = () => {
      currentCluster.textContent = CLUSTERSPERBLOCK * currentBlock;
      if (blocks[currentBlock].classList.contains('frag')) {
        console.log(currentBlock, 'fragment detected');
        blocks[currentBlock].classList.remove('frag');
      } else
      if (blocks[currentBlock].classList.contains('unused')) {
        const fragments = document.querySelectorAll('.used.frag');
        const p = ~~(currentBlock * 100 / totalBlocks);
        percent.textContent = p;
        fill.style.setProperty('width', `${p}%`);
        if (fragments.length == 0) {
          endDefrag();
          return;
        }
        const num = ~~(Math.random() * fragments.length);
        fragments[num].classList.remove('used', 'frag');
        fragments[num].classList.add('unused', 'reading');
        setTimeout(() => fragments[num].classList.remove('reading'), 200 + ~~(Math.random() * 800));
        blocks[currentBlock].classList.remove('unused');
        blocks[currentBlock].classList.add('used');
      } else

      currentBlock++;

      setTimeout(readBlock, 50 + ~~(Math.random() * 50) + [0, 0, 0, 50, 200][~~(Math.random() * 5)]);
    };

    let currentBlock = 0;
    const totalBlocks = document.querySelectorAll('.used.frag').length;
    const blocks = document.querySelectorAll('.block');
    const folders = document.querySelector('.folders');

    const startDefrag = () => {
      timer = setInterval(updateTime, 1000);
      setTimeout(readBlock, 500);
    };

    const TAGS = ['GAMES', 'DOS', 'WINDOWS', 'AUTODESK', 'EMM386', 'PCSHELL',
    'ZIP', 'RAR', 'PORN', 'COREL', 'WOLF3D', 'TRACKERS', 'WORM',
    'NORTON', 'DOSHELL', 'INDY', 'MONKEY', 'SIMON', 'WORKS', '2DISK'];

    const startDialogs = () => {
      setTimeout(() => {
        modals[0].hidden = true;
        modals[1].hidden = false;
      }, 3000);

      setTimeout(() => {
        modals[1].hidden = true;
        modals[2].hidden = false;
        extractTags(TAGS);
      }, 5000);

      setTimeout(() => {
        modals[2].hidden = true;
        screens[0].classList.remove('off');
        screens[1].classList.remove('off');
        startDefrag();
      }, 7000);
    };

    const extractTags = tags => {
      if (tags.length > 0)
      setTimeout(() => {
        folders.textContent = tags.shift();
        extractTags(tags);
      }, 100);
    };

    startDialogs();
    
    document.getElementById('exitDefrag').addEventListener('click', function () {
        const screen = document.querySelector('#defrag.screen');
        const history = document.getElementById('history');
        const input = document.getElementById('input');
        const ps1 = document.getElementById('ps1');
        const body = document.querySelector('body');
        const caret = document.getElementById('caret');

        history.hidden = false;
        caret.classList.remove('off');
        input.hidden = false;
        ps1.hidden = false;
        screen.hidden = true;
        body.setAttribute("class", "dos");
    });

    document.addEventListener('keydown', function (e) {
      const help = document.querySelector(".help.dialog");
      if (e.altKey || e.code == 'F10') {
          //help.hidden = false;
      }
      if (e.code == 'F1') {
          e.preventDefault();
          help.hidden = false;
      }
      if (e.code == 'Escape') {
          e.preventDefault();
          help.hidden = true;
      }
    });

}

//
// ScanDisk
///////////////

function scandisk() {

    const stages = document.querySelectorAll('.list span[data-status]');
    const progressbar = document.querySelector('.fillbar');
    const statusbar = document.querySelector('span[data-count]');
    const screen = document.querySelector('#scandisk');
    const history = document.getElementById('history');
    const input = document.getElementById('input');
    const ps1 = document.getElementById('ps1');
    const caret = document.getElementById('caret');
    const body = document.querySelector('body');
    
    history.hidden = true;
    caret.classList.add('off');
    input.hidden = true;
    ps1.hidden = true;
    body.setAttribute("class", "scandisk");
    screen.hidden = false;

    const NUM_BLOCKS = 518;
    let currentStage = 0;

    // *** First screen (check disk)
    const random = (min = 1, max = 6) => min + ~~(Math.random() * max);

    // Every stage of first screen
    const nextStage = () => {
        if (currentStage > 0) {
            const randomFail = random(1, 6);
            stages[currentStage - 1].dataset.status = randomFail == 4 ? 'fixed' : 'correct';
        }

        if (currentStage < stages.length) {
            stages[currentStage++].dataset.status = 'current';
            incProgress();
            setTimeout(nextStage, random(500, 2000));
        } else

            setTimeout(finishStage, random(500, 2000));
    };

    // last Stage from first screen
    const finishStage = () => {
        const screen = document.querySelectorAll('.screen-1, .screen-2');
        screen[0].classList.add('off');
        screen[1].classList.remove('off');
        setProgress(0);
        blocks = document.querySelectorAll('.surface-scan .block');
        readBlock();
    };

    // Progress bar update
    const setProgress = value => {
        statusbar.dataset.count = value;
        progressbar.style.width = `${value}%`;
    };

    const incProgress = (step = 15) => {
        const value = Math.min(100, parseInt(statusbar.dataset.count) + step);
        setProgress(value);
    };

    // *** Second screen (surface disk)
    const surface = document.querySelector('.surface-scan');
    const totalClusters = document.querySelector('.data .total span');
    const readClusters = document.querySelector('.data .examined span');
    const badClusters = document.querySelector('.data .badc span');
    const clustersPerBlock = document.querySelector('.legend var');
    const clusters = ~~(Math.random() * 100000) + 500000;
    const cpb = ~~(clusters / NUM_BLOCKS);

    let badclusters = 0;
    let currentBlock = 0;
    let blocks;

    const genSurface = () => {
        totalClusters.textContent = clusters.toLocaleString();
        clustersPerBlock.textContent = cpb.toLocaleString();
        for (let i = 0; i < NUM_BLOCKS; i++) {
            const span = document.createElement('span');
            const type = ['unused', 'unused', 'unused', 'used', 'full'][~~(Math.random() * 5)];
            span.className = `block ${type}`;
            surface.appendChild(span);
        }
    };

    const readBlock = () => {
        let time = 0;
        if (blocks[currentBlock].classList.contains('unused'))
            time += random(0, 150);
        if (blocks[currentBlock].classList.contains('used'))
            time += random(50, 500);
        if (blocks[currentBlock].classList.contains('full'))
            time += random(50, 1000);
        time += possibleBadBlock();
        if (currentBlock < NUM_BLOCKS)
            setTimeout(readBlock, time);else

                finishReadBlock();
        setProgress(~~(currentBlock / NUM_BLOCKS * 100));
        readClusters.textContent = (currentBlock * cpb).toLocaleString();
    };

    const finishReadBlock = () => {
        readClusters.textContent = clusters.toLocaleString();
        document.querySelector('.screen-2').classList.add('off');
        document.querySelector('.screen-3').classList.remove('off');
    };

    const possibleBadBlock = () => {
        if (random(1, 150) == 1) {
            blocks[currentBlock++].classList.add('bad');
            badClusters.textContent = ++badclusters;
            return random(2000, 4000);
        } else

            blocks[currentBlock++].classList.add('read');

        return 0;
    };

    genSurface();
    nextStage();

    document.getElementById('exitScandisk').addEventListener('click', function () {
        const screen = document.querySelector('#scandisk.screen');
        const history = document.getElementById('history');
        const input = document.getElementById('input');
        const ps1 = document.getElementById('ps1');
        const body = document.querySelector('body');
        const caret = document.getElementById('caret');

        history.hidden = false;
        caret.classList.remove('off');
        input.hidden = false;
        ps1.hidden = false;
        screen.hidden = true;
        body.setAttribute("class", "dos");
    });
    
}