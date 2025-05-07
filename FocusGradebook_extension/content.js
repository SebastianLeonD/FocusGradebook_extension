// Focus Extension Content Script - With improved class switching detection
let hypotheticals = [];
let hypotheticalCount = 1;
let nextRowColor = "#dfefff";
let originalRowsByClass = {};
let mode = "unweighted"; // Default mode
let currentClassId = null;
let classObserver = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === "getCategories") {
    try {
      const categories = extractCategories();
      sendResponse({ categories: categories });
    } catch (error) {
      sendResponse({ error: error.message, categories: [] });
    }
    return true; // Required for async sendResponse
  }
  
  // Handle adding assignments
  else if (request.type === "addAssignment") {
    try {
      // Store class key with assignment data
      const data = {
        ...request.data,
        classKey: getCurrentClassKey()
      };
      
      // Add to hypotheticals array for tracking
      hypotheticals.push(data);
      
      // Render the new row
      addStyledRow(data);
      
      // Recalculate grade
      recalculate();
      
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
    return true;
  }
  
  // Handle resetting assignments
  else if (request.type === "resetAssignments") {
    try {
      clearAllInjected();
      sendResponse({ success: true });
    } catch (error) {
      sendResponse({ error: error.message });
    }
    return true;
  }
  
  // Handle setting mode
  else if (request.type === "setMode") {
    mode = request.mode;
    sendResponse({ success: true });
    return true;
  }
});

// Save original rows before adding hypotheticals
function saveOriginalRows() {
  const classKey = getCurrentClassKey();
  if (!originalRowsByClass[classKey]) {
    const tableRows = document.querySelectorAll('.grades-grid.dataTable tbody tr');
    if (tableRows.length > 0) {
      originalRowsByClass[classKey] = [...tableRows].map(row => row.cloneNode(true));
    }
  }
}

// Function to extract categories from the page
function extractCategories() {
  const categories = [];
  
  // Try multiple different selectors to find the categories
  // First try with the exact structure provided in the example
  let categoryElements = document.querySelectorAll('.student-gb-grades-weighted-grades-header td.student-gb-grades-weighted-grades-cell[data-assignment-type-id]');
  
  // If first method fails, try a more general approach
  if (categoryElements.length === 0) {
    categoryElements = document.querySelectorAll('.student-gb-grades-weighted-grades-header td:not(:first-child):not(:last-child)');
  }
  
  // If still no results, try an even more general approach
  if (categoryElements.length === 0) {
    // Look for table cells that might contain category names
    const allCells = document.querySelectorAll('td');
    const potentialCategories = [];
    const categoryKeywords = ['Test', 'Quiz', 'Lab', 'Project', 'Homework', 'Classwork', 'Exam', 'Assignment'];
    
    allCells.forEach(cell => {
      const text = cell.textContent.trim();
      if (text && categoryKeywords.some(keyword => text.includes(keyword))) {
        potentialCategories.push(text);
      }
    });
    
    if (potentialCategories.length > 0) {
      return potentialCategories;
    }
  }
  
  // Process the found elements
  if (categoryElements.length > 0) {
    categoryElements.forEach(element => {
      const text = element.textContent.trim();
      if (text && text !== "Weighted Grade" && text !== "") {
        categories.push(text);
      }
    });
  }
  
  // If no categories found, return default set
  if (categories.length === 0) {
    return ["Tests", "Labs & Projects", "Quizzes", "Classwork & Homework"];
  }
  
  return categories;
}

// Execute this code when the script loads
function init() {
  try {
    const initialCategories = extractCategories();
    // Store these categories in case popup requests them immediately
    chrome.storage.local.set({cachedCategories: initialCategories});
  } catch (error) {
    // Silently handle errors during initialization
  }
}

// Run initialization
init()

// Function to ensure we're tracking the current class correctly
function ensureCurrentClass() {
  const select = document.querySelector("select.student-gb-grades-course");
  if (select) {
    currentClassId = select.value;
  } else {
    // Try alternative ways to get class ID if dropdown not found
    const urlParams = new URLSearchParams(window.location.search);
    currentClassId = urlParams.get('course_period_id') || getCurrentClassKey();
  }
  
  // Save original rows when ensuring class
  saveOriginalRows();
}

function clearAllInjected() {
  const classKey = getCurrentClassKey();
  
  // Filter hypotheticals to remove only those from current class
  hypotheticals = hypotheticals.filter(h => h.classKey !== classKey);
  hypotheticalCount = 1;
  nextRowColor = getInitialRowColor();

  document.querySelectorAll('.hypothetical').forEach(e => e.remove());
  document.getElementById('hypothetical-grade')?.remove();
  document.querySelectorAll(".injected-hypo-grade").forEach(e => e.remove());
  document.querySelectorAll(".injected-hypo-weighted").forEach(e => e.remove());
  document.getElementById("floating-hypo-box")?.remove();

  restoreOriginalRows();
}

function restoreOriginalRows() {
  const table = document.querySelector('.grades-grid.dataTable tbody');
  const classKey = getCurrentClassKey();
  const originalRows = originalRowsByClass[classKey];
  
  if (!table || !originalRows) {
    return;
  }
  
  table.innerHTML = "";
  originalRows.forEach(row => table.appendChild(row.cloneNode(true)));
}

function getInitialRowColor() {
  const rows = [...document.querySelectorAll('.grades-grid.dataTable tbody tr')];
  const lastReal = rows.find(r => !r.classList.contains('hypothetical'));
  const lastColor = lastReal?.style.backgroundColor?.trim().toLowerCase();
  return (lastColor === "rgb(245, 245, 245)") ? "#dfefff" : "#f5f5f5";
}

function addStyledRow(data) {
  // Save original rows first if we haven't already
  saveOriginalRows();
  
  const table = document.querySelector('.grades-grid.dataTable tbody');
  const baseRow = table?.querySelector('tr');
  if (!table || !baseRow) return;

  const clone = baseRow.cloneNode(true);
  clone.classList.add(`hypothetical`);
  // Add data attribute to track which class this belongs to
  clone.setAttribute('data-class-id', currentClassId);

  const earned = parseFloat(data.earned);
  const total = parseFloat(data.total);
  const percent = (total === 0 && earned > 0) ? 100 : Math.round((earned / total) * 100);
  const letter = getLetterGrade(percent);
  const modified = getFormattedDateTime();

  const tds = clone.querySelectorAll('td');
  if (tds.length >= 11) {
    tds[1].textContent = `Hypothetical ${hypotheticalCount++}`;
    tds[9].textContent = data.category || "";
    tds[2].textContent = `${earned} / ${total}`;
    tds[3].textContent = `${percent}%`;
    tds[4].textContent = letter;
    tds[5].textContent = "";
    tds[8].textContent = modified;
  }

  clone.style.backgroundColor = nextRowColor;
  nextRowColor = nextRowColor === "#f5f5f5" ? "#dfefff" : "#f5f5f5";

  table.insertBefore(clone, table.firstChild);
}

function getFormattedDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60));
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short' });
  const day = now.getDate().toString().padStart(2, '0');
  const month = now.toLocaleDateString('en-US', { month: 'short' });
  const year = now.getFullYear();
  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  }).toLowerCase();
  return `${weekday}, ${day} ${month} ${year} ${time}`;
}

function getLetterGrade(percent) {
  if (percent >= 90) return "A";
  if (percent >= 80) return "B";
  if (percent >= 70) return "C";
  if (percent >= 60) return "D";
  return "F";
}

function isValidAssignment(earnedRaw, totalRaw) {
  const earned = (earnedRaw ?? '').trim().toLowerCase();
  const total = (totalRaw ?? '').trim().toLowerCase();
  return (earned !== 'ng' && total !== 'ng');
}


function recalculate() {
  if (mode === 'weighted') {
    recalculateWeighted();
  } else {
    recalculateUnweighted();
  }
}

function recalculateUnweighted() {
  const rows = [...document.querySelectorAll('.grades-grid.dataTable tbody tr')];
  let totalEarned = 0;
  let totalPossible = 0;

  rows.forEach(row => {
    // Skip rows from different classes
    if (row.classList.contains('hypothetical') && 
        row.getAttribute('data-class-id') !== currentClassId) {
      return;
    }
    
    const tds = row.querySelectorAll('td');
    if (tds.length < 11) return;

    const raw = (tds[2]?.innerText || "").split("/").map(s => s.trim());
    if (!isValidAssignment(raw[0], raw[1])) return;

    const earned = (raw[0].toUpperCase() === 'Z') ? 0 : parseFloat(raw[0]);
    const total = parseFloat(raw[1]);

    if (!isNaN(earned)) {
      if (!isNaN(total) && total > 0) {
        // Standard assignment
        totalEarned += earned;
        totalPossible += total;
      } else if (total === 0 && earned > 0) {
        // Extra credit — only increase earned
        totalEarned += earned;
        // do NOT add to totalPossible
      }
    }
  });

  const finalPercent = totalPossible ? Math.round((totalEarned / totalPossible) * 100) : 100;
  const gradeLetter = getLetterGrade(finalPercent);
  injectHypoGrade(finalPercent, gradeLetter);
}

function injectHypoGrade(finalPercent, gradeLetter) {
  document.getElementById('hypothetical-grade')?.remove();
  document.querySelectorAll(".injected-hypo-grade").forEach(e => e.remove());

  const container = document.querySelector(".gradebook-grid-title") ||
                    document.querySelector(".student-gb-grade-summary") ||
                    document.querySelector(".gradebook-grid-title-container");

  if (container) {
    const span = document.createElement("span");
    span.id = "hypothetical-grade";
    span.className = "injected-hypo-grade";
    span.style.color = "red";
    span.style.fontWeight = "bold";
    span.style.marginLeft = "10px";
    span.innerText = `(Hypothetical: ${finalPercent}% ${gradeLetter})`;
    span.setAttribute('data-class-id', currentClassId);
    container.appendChild(span);
  }
}

function calculateDynamicWeightedGrade(weightsRow, scoresRow) {
  let totalWeighted = 0;
  let sumWeights = 0;

  for (let i = 0; i < weightsRow.length; i++) {
    const weight = parseFloat(weightsRow[i].replace('%', '').trim());
    if (isNaN(weight) || weight <= 0) continue;

    const [earnedRaw, totalRaw] = scoresRow[i].split('/').map(s => s.trim().toUpperCase());

    if (earnedRaw === 'NG' || totalRaw === 'NG') continue;

    const earned = (earnedRaw === 'Z') ? 0 : parseFloat(earnedRaw);
    const total = parseFloat(totalRaw);


    if (isNaN(earned)) continue;

    const adjustedTotal = (total === 0 && earned > 0) ? earned : total;
    if (isNaN(adjustedTotal) || adjustedTotal === 0) continue;

    const score = earned / adjustedTotal;
    totalWeighted += score * weight;
    sumWeights += weight;
  }

  if (sumWeights === 0) return null;
  return Math.round((totalWeighted / sumWeights) * 100);
}

function recalculateWeighted() {
  const categoryMap = {};
  const percentRow = document.querySelectorAll('.student-gb-grades-weighted-grades tr')[1]?.querySelectorAll('td');
  const labelRow = document.querySelectorAll('.student-gb-grades-weighted-grades tr')[0]?.querySelectorAll('td');

  if (!percentRow || !labelRow) return;

  for (let i = 1; i < percentRow.length - 1; i++) {
    const label = labelRow[i]?.innerText?.trim();
    const percentText = percentRow[i]?.innerText?.replace('%', '').trim();
    const weight = parseFloat(percentText);
    if (label && !isNaN(weight)) {
      categoryMap[label.toLowerCase()] = { weight, earned: 0, total: 0 };
    }
  }

  const rows = [...document.querySelectorAll('.grades-grid.dataTable tbody tr')];
  rows.forEach(row => {
    // Skip rows from different classes
    if (row.classList.contains('hypothetical') && 
        row.getAttribute('data-class-id') !== currentClassId) {
      return;
    }
    
    const tds = row.querySelectorAll('td');
    if (tds.length < 11) return;
    const category = tds[9]?.innerText?.trim().toLowerCase();
    const raw = (tds[2]?.innerText || "").split("/").map(s => s.trim());
    const earnedRaw = raw[0];
    const totalRaw = raw[1];
    const earned = (earnedRaw.toUpperCase() === 'Z') ? 0 : parseFloat(earnedRaw);
    const total = parseFloat(totalRaw);


    if (!isNaN(earned)) {
      if (!isNaN(total) && total !== 0) {
        if (categoryMap[category]) {
          categoryMap[category].earned += earned;
          categoryMap[category].total += total;
        }
      } else {
        if (categoryMap[category]) {
          categoryMap[category].earned += earned;
        }
      }
    }
  });

  let final = 0;
  let usedWeightSum = 0;

  for (const cat in categoryMap) {
    const { earned, total, weight } = categoryMap[cat];
    if (total > 0 || earned > 0) { // Only if there are any real assignments
      const weightDecimal = weight / 100;
      let avg = 0;
      if (total > 0) {
        avg = earned / total;
      } else if (earned > 0) {
        avg = 1; // extra credit
      }
      final += avg * weightDecimal;
      usedWeightSum += weight;
    }
  }

  // Normalize
  const finalPercent = usedWeightSum > 0 ? Math.round((final / (usedWeightSum / 100)) * 100) : 100;

  const gradeLetter = getLetterGrade(finalPercent);
  injectWeightedHypoGrade(finalPercent, gradeLetter);
}

function injectWeightedHypoGrade(finalPercent, gradeLetter, retry = 0) {
  const table = document.querySelector('.student-gb-grades-weighted-grades');
  const rows = table?.querySelectorAll('tr');
  if (!table || rows.length < 3) {
    if (retry < 20) {
      return setTimeout(() => injectWeightedHypoGrade(finalPercent, gradeLetter, retry + 1), 250);
    } else {
      return;
    }
  }

  // Remove only grade displays for current class
  document.querySelectorAll('.injected-hypo-weighted').forEach(e => {
    if (e.getAttribute('data-class-id') === currentClassId || !e.hasAttribute('data-class-id')) {
      e.remove();
    }
  });

  let headerRow, percentRow, scoreRow;
  for (const row of rows) {
    const text = row.innerText.trim().toLowerCase();
    if (text.includes("percent of grade")) percentRow = row;
    else if (text.includes("score")) scoreRow = row;
    else if (!headerRow) headerRow = row;
  }

  const injectCell = (row, content, isScore = false) => {
    const cell = document.createElement("td");
    cell.className = isScore
      ? "student-gb-grades-weighted-grades-score-cell injected-hypo-weighted"
      : "student-gb-grades-weighted-grades-cell injected-hypo-weighted";
    cell.innerText = content;
    cell.style.backgroundColor = "#2f4f6f";
    cell.style.color = "white";
    cell.style.fontWeight = "bold";
    cell.style.textAlign = "left";
    cell.setAttribute('data-class-id', currentClassId);
    
    row.appendChild(cell);
  };

  injectCell(headerRow, "Hypothetical Grade");
  injectCell(percentRow, "");
  injectCell(scoreRow, `${finalPercent}% ${gradeLetter}`, true);
}

// Enhanced class key detection function
function getCurrentClassKey() {
  // Try multiple ways to identify the current class
  const classLabel = document.querySelector(".gb-title")?.innerText || "";
  if (classLabel.trim()) {
    return classLabel.trim().toLowerCase();
  }
  
  // Try to get from select element
  const select = document.querySelector("select.student-gb-grades-course");
  const selectedOption = select?.options[select.selectedIndex];
  if (selectedOption) {
    return selectedOption.textContent.trim().toLowerCase();
  }
  
  // Try to extract from URL
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('course_period_id');
  if (courseId) {
    return `course_${courseId}`;
  }
  
  // Fallback to a timestamp (not ideal but prevents conflicts)
  return `unknown_class_${Date.now()}`;
}

// Enhanced class switching detection with multiple approaches
function setupClassChangeDetection() {
  // 1. Watch dropdown change
  const selectEl = document.querySelector("select.student-gb-grades-course");
  if (selectEl) {
    currentClassId = selectEl.value;
    
    selectEl.addEventListener("change", () => {
      const newClassId = selectEl.value;
      if (newClassId !== currentClassId) {
        currentClassId = newClassId;
        
        // Wait for DOM to update after class change
        setTimeout(() => {
          // Clear only hypothetical items for previous class
          clearHypotheticalItems();
          clearAllInjected();
          // Reset for new class view
          setupForCurrentClass();
        }, 1000);
      }
    });
  }
  
  // 2. Watch for URL changes
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      clearAllInjected()
      ensureCurrentClass();
      setupForCurrentClass();
    }
  }).observe(document, {subtree: true, childList: true});
  
  // 3. Watch for DOM changes that might indicate class changes
  clearAllInjected()
  setupDomObserver();
}

function setupDomObserver() {
  // Stop existing observer if any
  if (classObserver) {
    classObserver.disconnect();
  }
  
  // Create a new observer
  classObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Look for significant DOM changes that might indicate class switching
      if (mutation.addedNodes.length > 0) {
        const added = Array.from(mutation.addedNodes);
        const significantChange = added.some(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return false;
          
          // Check if a table or grade display was added
          return node.matches('.grades-grid') || 
                 node.matches('.gradebook-grid-title') ||
                 node.matches('.student-gb-grade-summary');
        });
        
        if (significantChange) {
          const newClassKey = getCurrentClassKey();
          if (newClassKey !== currentClassId) {
            currentClassId = newClassKey;
            setupForCurrentClass();
          }
        }
      }
    }
  });
  
  // Start observing
  classObserver.observe(document.body, { 
    childList: true, 
    subtree: true
  });
}

function clearHypotheticalItems() {
  // Remove hypothetical UI elements but keep data in memory
  document.querySelectorAll('.hypothetical').forEach(e => e.remove());
  document.getElementById('hypothetical-grade')?.remove();
  document.querySelectorAll(".injected-hypo-grade").forEach(e => e.remove());
  document.querySelectorAll(".injected-hypo-weighted").forEach(e => e.remove());
}

function setupForCurrentClass() {
  clearHypotheticalItems();
  
  // Reset hypothetical counter for clean UI
  hypotheticalCount = 1;
  nextRowColor = getInitialRowColor();
  
  // Re-add hypothetical assignments for current class if any exist
  const classKey = getCurrentClassKey();
  const classHypotheticals = hypotheticals.filter(h => h.classKey === classKey);
  
  if (classHypotheticals.length > 0) {
    classHypotheticals.forEach(data => {
      addStyledRow(data);
    });
    recalculate();
  }
}

// Initialize everything on load
window.addEventListener('load', () => {
  ensureCurrentClass();
  setupClassChangeDetection();
});

// Also run setup when DOM is ready in case the load event already fired
if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(() => {
    ensureCurrentClass();
    setupClassChangeDetection();
  }, 1000);
}