
/**
 * DFS Graph Visualizer (Fuchsia Theme)
 */

// --- Configuration ---
const NODE_RADIUS = 22;

// --- State ---
let nodes = []; 
let edges = []; 
let adjacencyList = {};
let mode = 'node'; 
let selectedNode = null; 
let isRunning = false;

// --- DOM ---
const canvas = document.getElementById('canvas-container');
const nodeLayer = document.getElementById('node-layer');
const edgeSvg = document.getElementById('edge-svg');
const logContainer = document.getElementById('log-container');
const stackDisplay = document.getElementById('stack-display'); // Vertical Stack
const traversalOutput = document.getElementById('traversal-output');
const btnNode = document.getElementById('btn-node');
const btnEdge = document.getElementById('btn-edge');
const speedSlider = document.getElementById('speed-slider');

// --- Helpers ---
const getSleepTime = () => {
    const val = speedSlider ? parseInt(speedSlider.value) : 3;
    // 1=Slow(2000ms), 5=Fast(300ms)
    return 2000 - (val - 1) * 400; 
};
const sleep = () => new Promise(resolve => setTimeout(resolve, getSleepTime()));

function log(message, type = 'info') {
    const entry = document.createElement('div');
    const colorClass = type === 'error' ? 'border-rose-500 text-rose-600' : 
                       type === 'success' ? 'border-green-500 text-green-600' : 
                       'border-fuchsia-400 text-slate-600';
    
    entry.className = `p-2 border-l-4 ${colorClass} bg-white shadow-sm rounded text-xs animate-fade-in`;
    entry.innerText = `> ${message}`;
    logContainer.prepend(entry);
}

function addToTraversalOutput(id) {
    if (traversalOutput.innerText.includes('Ready...')) traversalOutput.innerHTML = '';
    
    if (traversalOutput.children.length > 0) {
        const arrow = document.createElement('span');
        arrow.className = "text-fuchsia-300";
        arrow.innerHTML = "→";
        traversalOutput.appendChild(arrow);
    }
    const badge = document.createElement('div');
    badge.className = "w-8 h-8 bg-fuchsia-600 text-white font-bold rounded-full flex items-center justify-center shadow-sm animate-pop-in";
    badge.innerText = id;
    traversalOutput.appendChild(badge);
}

// --- Interaction Logic (Standard Graph Building) ---
function setMode(newMode) {
    mode = newMode;
    selectedNode = null; 
    redrawGraph(); 
    if (mode === 'node') {
        btnNode.className = "flex-1 bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 py-2 rounded-lg text-sm font-medium shadow-sm ring-2 ring-fuchsia-400 transition-all";
        btnEdge.className = "flex-1 bg-white text-slate-600 border border-slate-200 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all";
    } else {
        btnEdge.className = "flex-1 bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 py-2 rounded-lg text-sm font-medium shadow-sm ring-2 ring-fuchsia-400 transition-all";
        btnNode.className = "flex-1 bg-white text-slate-600 border border-slate-200 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all";
    }
}

function handleCanvasClick(e) {
    if (isRunning) return; 
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedNodeId = getClickedNodeId(x, y);

    if (mode === 'node') {
        if (clickedNodeId === null) addNode(x, y);
    } else if (mode === 'edge') {
        if (clickedNodeId !== null) handleEdgeSelection(clickedNodeId);
        else { selectedNode = null; redrawGraph(); }
    }
}

function getClickedNodeId(x, y) {
    for (let node of nodes) {
        const dx = node.x - x;
        const dy = node.y - y;
        if (Math.sqrt(dx*dx + dy*dy) <= NODE_RADIUS + 5) return node.id;
    }
    return null;
}

function addNode(x, y) {
    const id = nodes.length;
    nodes.push({ id, x, y });
    adjacencyList[id] = [];
    log(`Added Node ${id}`);
    redrawGraph();
}

function handleEdgeSelection(id) {
    if (selectedNode === null) {
        selectedNode = id;
        redrawGraph();
    } else {
        if (selectedNode === id) return; 
        addEdge(selectedNode, id);
        selectedNode = null;
        redrawGraph();
    }
}

function addEdge(u, v) {
    const exists = edges.some(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
    if (exists) return;
    edges.push({ from: u, to: v });
    adjacencyList[u].push(v);
    adjacencyList[v].push(u); 
    log(`Connected ${u} - ${v}`);
}

// --- Drawing Logic ---

function redrawGraph(activeSet = new Set(), current = null, stack = []) {
    edgeSvg.innerHTML = '';
    nodeLayer.innerHTML = '';

    // Draw Edges
    edges.forEach(edge => {
        const u = nodes[edge.from];
        const v = nodes[edge.to];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', u.x); line.setAttribute('y1', u.y);
        line.setAttribute('x2', v.x); line.setAttribute('y2', v.y);
        line.setAttribute('stroke', '#cbd5e1'); 
        line.setAttribute('stroke-width', '3');
        edgeSvg.appendChild(line);
    });

    // Draw Nodes
    nodes.forEach(node => {
        const el = document.createElement('div');
        let classes = "absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-[3px] flex items-center justify-center font-bold text-lg shadow-sm transition-all duration-300 pointer-events-auto cursor-pointer ";
        
        if (node.id === current) {
            // PROCESSING (Rose Red)
            classes += "bg-rose-500 border-rose-600 text-white scale-125 z-30 shadow-xl ring-4 ring-rose-200/50";
        } else if (activeSet.has(node.id)) {
            // VISITED (Fuchsia)
            classes += "bg-fuchsia-600 border-fuchsia-700 text-white z-10 shadow-md";
        } else if (stack.includes(node.id)) {
             // IN STACK (Purple Pulse)
            classes += "bg-purple-100 border-purple-400 text-purple-700 z-20 animate-pulse";
        } else if (node.id === selectedNode) {
            // SELECTING (Blue)
            classes += "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200 scale-105 z-20";
        } else {
            // Default (White)
            classes += "bg-white border-slate-300 text-slate-600 hover:border-fuchsia-400 hover:shadow-md";
        }

        el.className = classes;
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
        el.innerText = node.id;
        nodeLayer.appendChild(el);
    });

    updateStackUI(stack);
}

// --- Vertical Stack Monitor ---
function updateStackUI(stack) {
    stackDisplay.innerHTML = '';
    if (stack.length === 0) {
        stackDisplay.innerHTML = '<span class="text-xs text-slate-400 italic absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">Stack Empty</span>';
        return;
    }
    
    // We reverse the display logic visually in CSS (flex-col-reverse), 
    // but the array is [bottom, ..., top].
    // Let's render from top (end of array) to bottom (start of array) manually for control
    
    for (let i = stack.length - 1; i >= 0; i--) {
        const val = stack[i];
        const item = document.createElement('div');
        // Visual: Top item looks distinct
        if (i === stack.length - 1) {
             item.className = "w-full py-2 bg-purple-100 border-2 border-purple-400 rounded text-purple-700 font-bold text-center shadow-md animate-pop-in";
             item.innerHTML = `${val} <span class="text-[10px] uppercase ml-1 opacity-50">(Top)</span>`;
        } else {
             item.className = "w-full py-2 bg-white border border-slate-200 rounded text-slate-500 text-center shadow-sm";
             item.innerText = val;
        }
        stackDisplay.appendChild(item); // Appending to a flex-col container (top to bottom)
    }
}

// --- DFS Algorithm (Iterative) ---

async function startDFS() {
    if (nodes.length === 0) return log("Graph is empty!", "error");
    if (isRunning) return;

    const startInput = document.getElementById('start-node').value;
    const startId = parseInt(startInput === '' ? 0 : startInput);
    if (!nodes[startId]) return log("Invalid Start Node ID", "error");

    isRunning = true;
    traversalOutput.innerHTML = '<span class="text-fuchsia-300 italic">Starting...</span>';
    log(`Starting DFS from Node ${startId}...`, "success");

    let stack = [startId];
    let visited = new Set();
    
    // Unlike BFS, we usually mark visited when POPPING in iterative DFS 
    // or when pushing if we want to strictly follow "discovery".
    // Standard visualization: Mark when popped/processed.
    
    redrawGraph(visited, null, stack);
    await sleep();

    while (stack.length > 0) {
        // 1. Pop Current (LIFO)
        const current = stack.pop();
        
        if (!visited.has(current)) {
            // Process Node
            visited.add(current);
            addToTraversalOutput(current);
            log(`Visiting Node ${current}`);
            
            // Highlight Processing
            redrawGraph(visited, current, stack);
            await sleep();

            // 2. Push Neighbors
            // We reverse neighbors so that the 'first' neighbor (lowest ID) 
            // ends up at the TOP of the stack and gets visited next (standard convention).
            const neighbors = adjacencyList[current] || [];
            const sortedNeighbors = [...neighbors].sort((a,b) => b - a); // Descending sort

            for (let neighbor of sortedNeighbors) {
                if (!visited.has(neighbor)) {
                    log(`Pushing neighbor ${neighbor} to Stack`);
                    stack.push(neighbor);
                    
                    // Visualize Stack Growth
                    redrawGraph(visited, current, stack);
                    await sleep();
                }
            }
        }
    }

    log(`DFS Complete.`, "success");
    redrawGraph(visited, null, []); 
    isRunning = false;
}

function clearGraph() {
    nodes = [];
    edges = [];
    adjacencyList = {};
    isRunning = false;
    selectedNode = null;
    traversalOutput.innerHTML = '<span class="text-fuchsia-300 italic">Ready...</span>';
    log("Graph Cleared");
    redrawGraph();
}

// Init Animations
const style = document.createElement('style');
style.innerHTML = `
    @keyframes popIn {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
    }
    .animate-pop-in { animation: popIn 0.3s ease-out forwards; }
`;
document.head.appendChild(style);

redrawGraph();