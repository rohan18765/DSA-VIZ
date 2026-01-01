/**
 * BFS Graph Visualizer
 */

// --- Configuration ---
// UPDATED: Increased from 1000 to 1800 for slower animation
const ANIMATION_MS = 1800; 
const NODE_RADIUS = 22;

// --- State ---
let nodes = []; 
let edges = []; 
let adjacencyList = {};
let mode = 'node'; 
let selectedNode = null; 
let isRunning = false;

// ... (Rest of the code remains exactly the same)

// --- DOM ---
const canvas = document.getElementById('canvas-container');
const nodeLayer = document.getElementById('node-layer');
const edgeSvg = document.getElementById('edge-svg');
const logContainer = document.getElementById('log-container');
const queueDisplay = document.getElementById('queue-display');
const traversalOutput = document.getElementById('traversal-output');
const btnNode = document.getElementById('btn-node');
const btnEdge = document.getElementById('btn-edge');

// --- Helpers ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function log(message, type = 'info') {
    const entry = document.createElement('div');
    const colorClass = type === 'error' ? 'border-rose-500 text-rose-600' : 
                       type === 'success' ? 'border-green-500 text-green-600' : 
                       'border-pink-400 text-slate-600';
    
    entry.className = `p-2 border-l-4 ${colorClass} bg-white shadow-sm rounded text-xs animate-fade-in`;
    entry.innerText = `> ${message}`;
    logContainer.prepend(entry);
}

// --- NEW: Helper to update Traversal Path UI ---
function addToTraversalOutput(id) {
    // Clear placeholder
    if (traversalOutput.innerText.includes('Ready...')) {
        traversalOutput.innerHTML = '';
    }

    // Add arrow if not first item
    if (traversalOutput.children.length > 0) {
        const arrow = document.createElement('span');
        arrow.className = "text-pink-300";
        arrow.innerHTML = "→";
        traversalOutput.appendChild(arrow);
    }

    // Create the node badge
    const badge = document.createElement('div');
    badge.className = "w-8 h-8 bg-pink-600 text-white font-bold rounded-full flex items-center justify-center shadow-sm animate-pop-in";
    badge.innerText = id;
    traversalOutput.appendChild(badge);
}


// --- Interaction Logic (Same as before) ---
function setMode(newMode) {
    mode = newMode;
    selectedNode = null; 
    redrawGraph(); 
    
    if (mode === 'node') {
        btnNode.className = "flex-1 bg-pink-100 text-pink-700 border border-pink-200 py-2 rounded-lg text-sm font-medium shadow-sm ring-2 ring-pink-400 transition-all";
        btnEdge.className = "flex-1 bg-white text-slate-600 border border-slate-200 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all";
    } else {
        btnEdge.className = "flex-1 bg-pink-100 text-pink-700 border border-pink-200 py-2 rounded-lg text-sm font-medium shadow-sm ring-2 ring-pink-400 transition-all";
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

function redrawGraph(activeSet = new Set(), current = null, queue = []) {
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
        // Increased size slightly
        let classes = "absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-[3px] flex items-center justify-center font-bold text-lg shadow-sm transition-all duration-300 pointer-events-auto cursor-pointer ";
        
        if (node.id === current) {
            // PROCESSING NOW (Red/Rose)
            classes += "bg-rose-500 border-rose-600 text-white scale-125 z-30 shadow-xl ring-4 ring-rose-200/50";
        } else if (activeSet.has(node.id)) {
            // VISITED FINISHED (Solid Pink)
            classes += "bg-pink-500 border-pink-600 text-white z-10 shadow-md";
        } else if (queue.includes(node.id)) {
             // IN QUEUE (Light Pink)
            classes += "bg-pink-100 border-pink-400 text-pink-700 z-20 animate-pulse";
        } else if (node.id === selectedNode) {
            // SELECTING Edge (Blue)
            classes += "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-200 scale-105 z-20";
        } else {
            // Default (White)
            classes += "bg-white border-slate-300 text-slate-600 hover:border-pink-400 hover:shadow-md";
        }

        el.className = classes;
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
        el.innerText = node.id;
        nodeLayer.appendChild(el);
    });

    updateQueueUI(queue);
}

// --- UPDATED: Enhanced Queue Visualization ---
function updateQueueUI(queue) {
    queueDisplay.innerHTML = '';
    if (queue.length === 0) {
        queueDisplay.innerHTML = '<span class="text-xs text-slate-400 italic absolute left-1/2 -translate-x-1/2">Queue Empty</span>';
        return;
    }
    
    queue.forEach((val, index) => {
        // Add connector arrow if not first item
        if (index > 0) {
             const arrow = document.createElement('span');
             arrow.className = "text-slate-300 -mx-1";
             arrow.innerHTML = "→";
             queueDisplay.appendChild(arrow);
        }

        // Larger, clearer queue item
        const item = document.createElement('div');
        item.className = "w-10 h-10 bg-white border-2 border-pink-400 rounded-lg text-pink-700 flex items-center justify-center font-bold shadow-sm animate-pop-in z-10";
        item.innerText = val;
        queueDisplay.appendChild(item);
    });
}

// --- BFS Algorithm ---

async function startBFS() {
    if (nodes.length === 0) return log("Graph is empty!", "error");
    if (isRunning) return;

    const startInput = document.getElementById('start-node').value;
    const startId = parseInt(startInput === '' ? 0 : startInput);
    
    if (!nodes[startId]) return log("Invalid Start Node ID", "error");

    isRunning = true;
    traversalOutput.innerHTML = '<span class="text-pink-300 italic">Starting...</span>';
    log(`Starting BFS from Node ${startId}...`, "success");

    let queue = [startId];
    let visited = new Set();
    
    // Mark start as visited immediately in BFS
    visited.add(startId);
    
    redrawGraph(visited, null, queue);
    await sleep(ANIMATION_MS);

    while (queue.length > 0) {
        // 1. Dequeue Current
        const current = queue.shift();
        log(`Dequeued Node ${current}. Processing neighbors...`);
        
        // 2. VISUALIZE: Update Traversal Path & Highlight Current Red
        addToTraversalOutput(current); 
        redrawGraph(visited, current, queue);
        await sleep(ANIMATION_MS);

        // 3. Check Neighbors
        const neighbors = adjacencyList[current] || [];
        // Sort neighbors for consistent visual behavior (optional but good)
        neighbors.sort((a,b) => a - b);

        for (let neighbor of neighbors) {
            if (!visited.has(neighbor)) {
                log(`Found unvisited neighbor ${neighbor} -> Enqueueing`);
                visited.add(neighbor);
                queue.push(neighbor);
                
                // VISUALIZE: Show neighbor being added to queue (it will pulse pink)
                redrawGraph(visited, current, queue);
                await sleep(ANIMATION_MS / 2);
            }
        }
    }

    log(`BFS Complete.`, "success");
    redrawGraph(visited, null, []); // Final state: all visited are solid pink
    isRunning = false;
}

function clearGraph() {
    nodes = [];
    edges = [];
    adjacencyList = {};
    isRunning = false;
    selectedNode = null;
    traversalOutput.innerHTML = '<span class="text-pink-300 italic">Ready...</span>';
    log("Graph Cleared");
    redrawGraph();
}

// Init
// Add pop-in animation style
const style = document.createElement('style');
style.innerHTML = `
    @keyframes popIn {
        0% { transform: scale(0.5); opacity: 0; }
        80% { transform: scale(1.1); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
    }
    .animate-pop-in { animation: popIn 0.3s ease-out forwards; }
`;
document.head.appendChild(style);

redrawGraph();