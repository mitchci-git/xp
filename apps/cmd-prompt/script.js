// Extracted repeated DOM manipulation logic into helper functions
function getElement(selector) {
    return document.querySelector(selector);
}

function createElement(tag, className = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    return element;
}

// Updated existing code to use helper functions
const history = getElement('#history');
const input = getElement('#input');
const ps1 = getElement('#ps1');
const caret = getElement('#caret');
const body = getElement('body');

body.classList.add('dos');

let command = "";
let driveLetter = "C";
const commandHistory = [];
let path = [];
let historyPos = 0;

// Added comments to clarify command processing logic
function processCommand(text) {
    let actualCommand;
    let parameters;
    
    if (text.indexOf(" ") !== -1) {
        actualCommand = text.substring(0, text.indexOf(" "));
        parameters = text.substring(text.indexOf(" ") + 1, text.length).split(" ");
    } else {
        actualCommand = text;
        parameters = [];
    }
    
    try {
        if ((actualCommand.indexOf(":") === 1) && (actualCommand.length === 2)) {
            driveLetter = actualCommand.charAt(0).toUpperCase();
            return "";
        }
        switch (actualCommand.toLowerCase()) {
            case "":
                return "";
            case "defrag":
                return defrag();
            case "scandisk":
                return "Command not found\n\n";
            case "ver":
                return "JSDOS v0.1.442024\n\n";
            case "win":
                return "Windows not invented yet\n\n";
            case "set":
            case "eval":
                return "Command disabled for security reasons\n";
            case "clear":
            case "cls":
                history.innerHTML = "";
                return "";
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
            default:
                // Command not recognized
                return `'${text}' is not recognized as an internal or external command,<br>operable program or batch file.<br>`;
        }
    } catch (err) {
        return "Command caused an error [" + err + "]<br>";
    }
}

function processDirectoryChange(dirs) {
    if (dirs === undefined) {
        return "";
    } else if (dirs.charAt(1) === ":") {
        driveLetter = dirs.charAt(0);
        path = dirs.substring(3, dirs.length).split("\\");
        return "";
    }
    dirs = dirs.replace(/\//g, "\\");
    const dirArray = dirs.split("\\");
    for (const dir in dirArray) {
        changeDirectory(dirArray[dir]);
    }
    return "";
}

function changeDirectory(dir) {
    if ((dir === ".") || (dir === "")) {
        return;
    } else if (dir === "..") {
        path.pop();
    } else if (dir === "\\") {
        path = [];
    } else {
        path.push(dir);
    }
    return "";
}

function processDir(dir) {
    if (dir === undefined) {
        dir = driveLetter + ":\\" + path.join("\\");
    }
    let output = "";
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
    let output = "";
    output += "Supported commands are:\n";
    output += " help\n";
    output += " ver\n";
    output += " defrag\n";
    output += " echo [text]\n";
    output += " cls\n";
    output += " dir\n";
    output += " cd [directory]\n\n";

    return output;
}

function println(text) {
  const line = createElement('div');
  line.innerHTML = `${text}`;

  history.appendChild(line);
}

function init() {
    println("Microsoft Windows XP [Version 5.1.2600]<br>(C) Copyright 1985-2001 Microsoft Corp.");
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

// Added comments to clarify the purpose of complex commands
function defrag() {
    // Simulates a defragmentation process with animations and DOM updates
    // Constants
    const TOTAL_BLOCKS = 1300;
    const TOTALCLUSTERS = 12600 + ~~(Math.random() * 4250);
    const CLUSTERSPERBLOCK = ~~(TOTALCLUSTERS / TOTAL_BLOCKS);

    // DOM
    const modals = document.querySelectorAll('#defrag-testing.dialog, #defrag-reading.dialog, #defrag-analyzing.dialog, #defrag-finished.dialog');
    const screens = document.querySelectorAll('#defrag-surface, #defrag-info');
    const surface = getElement('#defrag-surface');
    const currentCluster = getElement('#defrag-currentcluster');
    const percent = getElement('#defrag-percent');
    const fill = getElement('#defrag-fill');
    const elapsedTime = getElement('#defrag-elapsedtime');
    const screen = getElement('#defrag-container');
    const history = getElement('#history');
    const input = getElement('#input');
    const ps1 = getElement('#ps1');
    const caret = getElement('#caret');
    const body = getElement('body');
    
    // Initialize variables
    let currentBlock = 0;
    let timer;
    let blocks;
    let totalBlocks;
    
    history.hidden = true;
    caret.classList.add('off');
    input.hidden = true;
    ps1.hidden = true;
    body.setAttribute("class", "defrag");
    screen.hidden = false;

    // Block generator
    const genBlock = () => {
      const num = ~~(Math.random() * 500);

      if (num < 1) {
        return 'bad';
      }
      if (num < 2) {
        return 'unmovable';
      }
      if (num < 175) {
        return 'used frag';
      } else {
        return 'unused';
      }
    };

    // Generate surface
    for (let i = 0; i < TOTAL_BLOCKS; i++) {
      const span = createElement('span', `block ${genBlock()}`);
      surface.appendChild(span);
    }

    // After generating surface, initialize blocks and totalBlocks
    blocks = document.querySelectorAll('.block');
    totalBlocks = document.querySelectorAll('.used.frag').length;
    const folders = getElement('#defrag-folders');

    getElement('#defrag-clustersperblock').textContent = CLUSTERSPERBLOCK.toLocaleString('en');

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
        blocks[currentBlock].classList.remove('frag');
      } else if (blocks[currentBlock].classList.contains('unused')) {
        const fragments = document.querySelectorAll('.used.frag');
        const p = ~~(currentBlock * 100 / totalBlocks);
        percent.textContent = p;
        fill.style.setProperty('width', `${p}%`);
        if (fragments.length === 0) {
          endDefrag();
          return;
        }
        const num = ~~(Math.random() * fragments.length);
        fragments[num].classList.remove('used', 'frag');
        fragments[num].classList.add('unused', 'reading');
        setTimeout(() => fragments[num].classList.remove('reading'), 200 + ~~(Math.random() * 800));
        blocks[currentBlock].classList.remove('unused');
        blocks[currentBlock].classList.add('used');
      } 
      
      currentBlock++;
      
      setTimeout(readBlock, 50 + ~~(Math.random() * 50) + [0, 0, 0, 50, 200][~~(Math.random() * 5)]);
    };

    const startDefrag = () => {
      timer = setInterval(updateTime, 1000);
      setTimeout(readBlock, 500);
    };

    const TAGS = [
      'GAMES', 'DOS', 'WINDOWS', 'AUTODESK', 'EMM386', 'PCSHELL',
      'ZIP', 'RAR', 'PORN', 'COREL', 'WOLF3D', 'TRACKERS', 'WORM',
      'NORTON', 'DOSHELL', 'INDY', 'MONKEY', 'SIMON', 'WORKS', '2DISK'
    ];

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
      if (tags.length > 0) {
        setTimeout(() => {
          folders.textContent = tags.shift();
          extractTags(tags);
        }, 100);
      }
    };

    startDialogs();
    
    getElement('#exitDefrag').addEventListener('click', function () {
        screen.hidden = true;
        history.hidden = false;
        caret.classList.remove('off');
        input.hidden = false;
        ps1.hidden = false;
        body.setAttribute("class", "dos");
    });

    document.addEventListener('keydown', function (e) {
      const help = getElement("#defrag-help-dialog");
      if (e.code === 'F1') {
          e.preventDefault();
          help.hidden = false;
      }
      if (e.code === 'Escape') {
          e.preventDefault();
          help.hidden = true;
      }
    });

}