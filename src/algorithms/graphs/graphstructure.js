
/**
 * Graph Structure Visualizer
 * Visualizes Adjacency Matrix vs Adjacency List in real-time.
 */

// --- Configuration ---
const NODE_RADIUS = 20;

// --- State ---
let nodes = []; 
let edges = []; 
let mode = 'node'; 
let selectedNode = null; 

// --- DOM ---
const canvas = document.getElementById('canvas-container');
const nodeLayer = document.getElementById('node-layer');
const edgeSvg = document.getElementById('edge-svg');
const matrixTable = document.getElementById('matrix-table');
const listContainer = document.getElementById('list-container');
const btnNode = document.getElementById('btn-node');
const btnEdge = document.getElementById('btn-edge');

// --- Interaction Logic ---
function setMode(newMode) {
    mode = newMode;
    selectedNode = null; 
    redrawGraph(); 
    
    // Toggle UI Button Styles
    const activeClass = "flex-1 bg-slate-800 text-white py-2 rounded-lg text-sm font-medium shadow-sm ring-2 ring-slate-400 transition-all";
    const inactiveClass = "flex-1 bg-white text-slate-600 border border-slate-200 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all";

    if (mode === 'node') {
        btnNode.className = activeClass;
        btnEdge.className = inactiveClass;
    } else {
        btnEdge.className = activeClass;
        btnNode.className = inactiveClass;
    }
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clickedNodeId = getClickedNodeId(x, y);

    if (mode === 'node') {
        if (clickedNodeId === null) addNode(x, y);
    } else if (mode === 'edge') {
        if (clickedNodeId !== null) handleEdgeSelection(clickedNodeId);
        else {
            selectedNode = null;
            redrawGraph();
        }
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
    updateDataStructures(); // Update UI
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
    // Check if edge exists (undirected)
    const exists = edges.some(e => (e.from === u && e.to === v) || (e.from === v && e.to === u));
    if (exists) return;

    edges.push({ from: u, to: v });
    updateDataStructures(); // Update UI
    redrawGraph();
}

// --- Data Structure Visualization Logic ---

function updateDataStructures() {
    updateMatrix();
    updateList();
}

function updateMatrix() {
    matrixTable.innerHTML = '';
    
    if (nodes.length === 0) {
        matrixTable.innerHTML = '<tr><td class="text-slate-400 italic p-4">Add nodes to see matrix</td></tr>';
        return;
    }

    // 1. Header Row (0, 1, 2...)
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = '<th></th>'; // Corner empty cell
    nodes.forEach(n => {
        const th = document.createElement('th');
        th.className = "p-2 text-slate-500 border-b border-slate-200";
        th.innerText = n.id;
        headerRow.appendChild(th);
    });
    matrixTable.appendChild(headerRow);

    // 2. Data Rows
    nodes.forEach(rowNode => {
        const tr = document.createElement('tr');
        
        // Row Label
        const rowHeader = document.createElement('th');
        rowHeader.className = "p-2 text-slate-500 border-r border-slate-200";
        rowHeader.innerText = rowNode.id;
        tr.appendChild(rowHeader);

        // Cells
        nodes.forEach(colNode => {
            const td = document.createElement('td');
            
            // Check connection
            const isConnected = edges.some(e => 
                (e.from === rowNode.id && e.to === colNode.id) || 
                (e.from === colNode.id && e.to === rowNode.id)
            );

            if (isConnected) {
                td.className = "p-2 font-bold text-slate-800 bg-slate-200 border border-slate-100 transition-all duration-500";
                td.innerText = "1";
            } else {
                td.className = "p-2 text-slate-300 border border-slate-100";
                td.innerText = "0";
            }
            
            tr.appendChild(td);
        });
        matrixTable.appendChild(tr);
    });
}

function updateList() {
    listContainer.innerHTML = '';

    if (nodes.length === 0) {
        listContainer.innerHTML = '<div class="text-center text-slate-400 text-xs italic py-4">Graph is empty</div>';
        return;
    }

    nodes.forEach(node => {
        // Find neighbors
        const neighbors = [];
        edges.forEach(e => {
            if (e.from === node.id) neighbors.push(e.to);
            if (e.to === node.id) neighbors.push(e.from);
        });
        neighbors.sort((a,b) => a - b);

        // Build UI Row
        const row = document.createElement('div');
        row.className = "flex items-center gap-3 p-2 hover:bg-slate-50 rounded transition";
        
        // Head Node
        const headHtml = `<div class="w-8 h-8 bg-slate-800 text-white font-bold rounded flex items-center justify-center shrink-0 shadow-sm">${node.id}</div>`;
        
        // Arrow
        const arrowHtml = `<div class="text-slate-400">→</div>`;
        
        // Neighbors
        let neighborsHtml = '';
        if (neighbors.length === 0) {
            neighborsHtml = `<span class="text-xs text-slate-400 italic">null</span>`;
        } else {
            neighborsHtml = `<div class="flex flex-wrap gap-2">`;
            neighbors.forEach(n => {
                neighborsHtml += `<div class="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-600 shadow-sm">${n}</div>`;
            });
            neighborsHtml += `</div>`;
        }

        row.innerHTML = headHtml + arrowHtml + neighborsHtml;
        listContainer.appendChild(row);
    });
}

// --- Drawing Logic (Standard Graph) ---

function redrawGraph() {
    edgeSvg.innerHTML = '';
    nodeLayer.innerHTML = '';

    // Draw Edges
    edges.forEach(edge => {
        const u = nodes[edge.from];
        const v = nodes[edge.to];
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', u.x); line.setAttribute('y1', u.y);
        line.setAttribute('x2', v.x); line.setAttribute('y2', v.y);
        line.setAttribute('stroke', '#64748b'); // Slate-500
        line.setAttribute('stroke-width', '2');
        edgeSvg.appendChild(line);
    });

    // Draw Nodes
    nodes.forEach(node => {
        const el = document.createElement('div');
        let classes = "absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-2 flex items-center justify-center font-bold text-sm shadow-sm transition-all duration-200 cursor-pointer ";
        
        if (node.id === selectedNode) {
            classes += "bg-blue-100 border-blue-500 text-blue-700 ring-4 ring-blue-100 scale-110 z-20";
        } else {
            classes += "bg-white border-slate-500 text-slate-700 hover:border-slate-800 hover:scale-105 z-10";
        }

        el.className = classes;
        el.style.left = `${node.x}px`;
        el.style.top = `${node.y}px`;
        el.innerText = node.id;
        nodeLayer.appendChild(el);
    });
}

function clearGraph() {
    nodes = [];
    edges = [];
    selectedNode = null;
    updateDataStructures();
    redrawGraph();
}

// Init
redrawGraph();
updateDataStructures();