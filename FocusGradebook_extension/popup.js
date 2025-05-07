// Wait for DOM to be fully loaded before adding event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Get all the DOM elements
  const modeSelection = document.getElementById("mode-selection");
  const calculatorForm = document.getElementById("calculator-form");
  const categoryInput = document.getElementById("category-input"); // Text input for unweighted
  const categoryDropdown = document.getElementById("category-dropdown"); // Dropdown for weighted
  const addBtn = document.getElementById("add");
  const resetBtn = document.getElementById("reset");
  const backBtn = document.getElementById("back");
  const mainTitle = document.getElementById("main-title");
  const calculatorTitle = document.getElementById("calculator-title");

  // Debug logging to make sure elements are found
  console.log("Mode Selection:", modeSelection);
  console.log("Calculator Form:", calculatorForm);
  console.log("Back Button:", backBtn);

  // Set up event listeners for calculator mode buttons
  document.getElementById("mode-unweighted").addEventListener("click", function() {
    console.log("Unweighted button clicked");
    launchCalculator("unweighted");
    resizePopup(true, "unweighted"); // Expand popup to 375px
  });

  document.getElementById("mode-weighted").addEventListener("click", function() {
    console.log("Weighted button clicked");
    launchCalculator("weighted");
    resizePopup(true, "weighted"); // Expand popup to 405px
    // Fetch categories when weighted mode is selected
    fetchCategories();
  });

  // Back button event listener
  backBtn.addEventListener("click", function() {
    console.log("Back button clicked");
    calculatorForm.style.display = "none";
    modeSelection.style.display = "flex";
    mainTitle.style.display = "block";
    calculatorTitle.style.display = "none";
    resizePopup(false, null); // Contract popup
  });

  // Function to resize the popup
  function resizePopup(expand, mode) {
    // Get the html and body elements
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    if (expand) {
      // Add smooth transition
      htmlElement.style.transition = 'height 0.3s ease';
      bodyElement.style.transition = 'height 0.3s ease';
      
      if (mode === "unweighted") {
        // Expand to 375px height for unweighted
        htmlElement.style.height = '375px';
        bodyElement.style.height = '375px';
      } else {
        // Expand to 405px height for weighted (reduced from 475px since we removed weight input)
        htmlElement.style.height = '375px';
        bodyElement.style.height = '375px';
      }
    } else {
      // Contract to 205px height
      htmlElement.style.height = '205px';
      bodyElement.style.height = '205px';
    }
  }

  // Function to fetch categories from the current page
  function fetchCategories() {
    console.log("Fetching categories from page");
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        console.log("Sending getCategories message to tab:", tabs[0].id);
        
        // Directly add some fallback categories in case of failure
        const fallbackCategories = ["Tests", "Quizzes", "Homework", "Labs", "Projects", "Exams"];
        
        chrome.tabs.sendMessage(tabs[0].id, { type: "getCategories" }, function(response) {
          console.log("Categories response received:", response);
          
          if (chrome.runtime.lastError) {
            console.error("Chrome runtime error:", chrome.runtime.lastError);
            populateCategoryDropdown(fallbackCategories);
            return;
          }
          
          if (response && response.categories && response.categories.length > 0) {
            console.log("Successfully got categories from page:", response.categories);
            populateCategoryDropdown(response.categories);
          } else if (response && response.error) {
            console.error("Error from content script:", response.error);
            populateCategoryDropdown(fallbackCategories);
          } else {
            console.error("Invalid or empty response");
            populateCategoryDropdown(fallbackCategories);
          }
        });
      } else {
        console.error("No active tab found");
        // Use fallback categories
        populateCategoryDropdown(["Tests", "Quizzes", "Homework", "Labs", "Projects", "Exams"]);
      }
    });
  }

  // Function to populate the category dropdown
  function populateCategoryDropdown(categories) {
    console.log("Populating dropdown with categories:", categories);
    const categoryDropdown = document.getElementById("category-dropdown");
    
    if (!categoryDropdown) {
      console.error("Category dropdown element not found!");
      return;
    }
    
    // Clear existing options except the first one
    while (categoryDropdown.options.length > 1) {
      categoryDropdown.remove(1);
    }
    
    // Add categories to dropdown
    categories.forEach(category => {
      console.log(`Adding category to dropdown: ${category}`);
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryDropdown.appendChild(option);
    });
    
    console.log("Category dropdown populated. Final options count:", categoryDropdown.options.length);
  }

  // Function to launch the calculator in specified mode
  function launchCalculator(mode) {
    console.log(`Launching calculator in ${mode} mode`);
    modeSelection.style.display = "none";
    calculatorForm.style.display = "flex";
    mainTitle.style.display = "none";
    calculatorTitle.style.display = "block";

    document.body.setAttribute("data-weighted", mode === "weighted");
    
    // Show/hide appropriate category input based on mode
    if (mode === "weighted") {
      categoryInput.style.display = "none";
      document.querySelector(".category-container").style.display = "flex";
    } else {
      categoryInput.style.display = "block";
      categoryInput.placeholder = "Category (optional)";
      document.querySelector(".category-container").style.display = "none";
    }

    // Send message to content script to set mode
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "setMode", mode }, function(response) {
          console.log("Mode set response:", response);
        });
      } else {
        console.error("No active tab found");
      }
    });
  }

  // Add button event listener
  addBtn.addEventListener("click", function() {
    console.log("Add button clicked");
    const earned = document.getElementById("earned").value;
    const total = document.getElementById("total").value;
    const isWeighted = document.body.getAttribute("data-weighted") === "true";
    
    // Get category from appropriate input based on mode
    let category = isWeighted ? 
      categoryDropdown.options[categoryDropdown.selectedIndex]?.value : 
      categoryInput.value.trim();
    
    // For unweighted mode, category is optional
    if (!earned || !total || (isWeighted && !category)) {
      alert("Please fill out all required fields.");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "addAssignment",
          data: {
            earned,
            total,
            category,
            // No weight parameter needed since we removed it
          },
        }, function(response) {
          console.log("Add assignment response:", response);
          // Clear inputs after successful addition
          document.getElementById("earned").value = "";
          document.getElementById("total").value = "";
          if (!isWeighted) {
            categoryInput.value = "";
          }
        });
      } else {
        console.error("No active tab found");
      }
    });
  });

  // Reset button event listener
  resetBtn.addEventListener("click", function() {
    console.log("Reset button clicked");
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "resetAssignments" }, function(response) {
          console.log("Reset response:", response);
        });
      } else {
        console.error("No active tab found");
      }
    });
  });
  // Help modal functionality
  const helpButton = document.getElementById("help-button");
  const helpModal = document.getElementById("help-modal");
  const closeBtn = document.querySelector(".close-btn");

  // Open modal when help button is clicked
  helpButton.addEventListener("click", function() {
    helpModal.style.display = "block";
    
    // Adjust popup size to fit the modal
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    // Store original size to restore later
    if (!helpModal.hasAttribute("data-original-height")) {
      helpModal.setAttribute("data-original-height", htmlElement.style.height);
    }
    
    // Make popup larger to accommodate help content
    htmlElement.style.height = "500px";
    bodyElement.style.height = "500px";
  });

  // Close modal when X is clicked
  closeBtn.addEventListener("click", function() {
    helpModal.style.display = "none";
    
    // Restore original popup size
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const originalHeight = helpModal.getAttribute("data-original-height");
    
    if (originalHeight) {
      htmlElement.style.height = originalHeight;
      bodyElement.style.height = originalHeight;
    } else {
      // Default size if original not stored
      const isCalculatorOpen = calculatorForm.style.display === "flex";
      if (isCalculatorOpen) {
        // Expanded for calculator view
        htmlElement.style.height = '375px';
        bodyElement.style.height = '375px';
      } else {
        // Contracted for mode selection
        htmlElement.style.height = '205px';
        bodyElement.style.height = '205px';
      }
    }
  });

  // Also close modal when clicking outside the modal content
  window.addEventListener("click", function(event) {
    if (event.target === helpModal) {
      closeBtn.click(); // Use the existing close button handler
    }
  });
});