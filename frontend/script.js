/**
 * ============================================================================
 * Decode2Solve — Frontend JavaScript
 * Understand the problem before you solve it.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. Configuration & API Settings
// ----------------------------------------------------------------------------
// Keep the API base URL in ONE place so it can easily be changed later.
const API_BASE_URL = "http://127.0.0.1:8000";
const EXPLAIN_ENDPOINT = `${API_BASE_URL}/api/explain`;

// ----------------------------------------------------------------------------
// 2. DOM Elements Cache
// ----------------------------------------------------------------------------
const elements = {
  // Form & Inputs
  form: document.getElementById("problemForm"),
  problemInput: document.getElementById("problemInput"),
  charCount: document.getElementById("charCount"),
  clearInputBtn: document.getElementById("clearInputBtn"),
  explainBtn: document.getElementById("explainBtn"),
  btnText: document.getElementById("btnText"),
  btnSpinner: document.getElementById("btnSpinner"),
  languageRadios: document.querySelectorAll('input[name="language"]'),

  // Alerts
  errorAlert: document.getElementById("errorAlert"),
  errorMessage: document.getElementById("errorMessage"),

  // Output States
  emptyState: document.getElementById("emptyState"),
  loadingState: document.getElementById("loadingState"),
  explanationContent: document.getElementById("explanationContent"),

  // Explanation Fields
  resultLanguageBadge: document.getElementById("resultLanguageBadge"),
  whatAskingText: document.getElementById("whatAskingText"),
  inputText: document.getElementById("inputText"),
  outputText: document.getElementById("outputText"),
  sampleInputText: document.getElementById("sampleInputText"),
  sampleOutputText: document.getElementById("sampleOutputText"),
  importantPointsList: document.getElementById("importantPointsList"),
  beforeYouCodeList: document.getElementById("beforeYouCodeList"),

  // Reset Actions
  resetBtn: document.getElementById("resetBtn"),
  footerResetBtn: document.getElementById("footerResetBtn"),
};

// Application State
let isSubmitting = false;

// ----------------------------------------------------------------------------
// 3. Helper Functions: State & UI Management
// ----------------------------------------------------------------------------

/**
 * Update character counter for problem textarea
 */
function updateCharCount() {
  const count = elements.problemInput.value.length;
  elements.charCount.textContent = `${count} ${count === 1 ? "char" : "chars"}`;
}

/**
 * Show inline error alert with specific message
 * @param {string} message - User friendly error message
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorAlert.classList.remove("hidden");
}

/**
 * Clear and hide error alert
 */
function hideError() {
  elements.errorAlert.classList.add("hidden");
  elements.errorMessage.textContent = "";
}

/**
 * Get currently selected explanation language
 * @returns {string} - "english" | "tamil" | "tanglish"
 */
function getSelectedLanguage() {
  const selectedRadio = document.querySelector('input[name="language"]:checked');
  return selectedRadio ? selectedRadio.value.toLowerCase() : "english";
}

/**
 * Set UI loading state
 * @param {boolean} isLoading
 */
function setLoading(isLoading) {
  isSubmitting = isLoading;

  // Toggle input controls
  elements.problemInput.disabled = isLoading;
  elements.languageRadios.forEach((radio) => {
    radio.disabled = isLoading;
  });
  elements.explainBtn.disabled = isLoading;

  if (isLoading) {
    elements.btnText.textContent = "Understanding your problem...";
    elements.btnSpinner.classList.remove("hidden");

    // Switch right panel to loading state
    elements.emptyState.classList.add("hidden");
    elements.explanationContent.classList.add("hidden");
    elements.loadingState.classList.remove("hidden");
    elements.loadingState.setAttribute("aria-hidden", "false");
  } else {
    elements.btnText.textContent = "Explain Problem";
    elements.btnSpinner.classList.add("hidden");
    elements.loadingState.classList.add("hidden");
    elements.loadingState.setAttribute("aria-hidden", "true");
  }
}

/**
 * Reset UI to initial empty state
 */
function resetToInitialState() {
  // Clear inputs
  elements.problemInput.value = "";
  elements.problemInput.disabled = false;
  updateCharCount();

  // Reset language to default English
  const defaultLangRadio = document.getElementById("langEnglish");
  if (defaultLangRadio) {
    defaultLangRadio.checked = true;
  }
  elements.languageRadios.forEach((radio) => {
    radio.disabled = false;
  });

  // Re-enable button
  elements.explainBtn.disabled = false;
  elements.btnText.textContent = "Explain Problem";
  elements.btnSpinner.classList.add("hidden");
  isSubmitting = false;

  // Clear errors
  hideError();

  // Show empty state, hide others
  elements.explanationContent.classList.add("hidden");
  elements.loadingState.classList.add("hidden");
  elements.emptyState.classList.remove("hidden");

  // Focus textarea for immediate next use
  elements.problemInput.focus();
}

/**
 * Safely format text or fallback
 * @param {*} value
 * @returns {string}
 */
function formatText(value) {
  if (value === null || value === undefined) return "Not specified";
  const str = String(value).trim();
  return str.length > 0 ? str : "Not specified";
}

/**
 * Render items into a list element (supports arrays or newline-separated strings)
 * @param {HTMLElement} listElement
 * @param {Array|string} items
 * @param {string} type - 'bullet' | 'checklist'
 */
function renderList(listElement, items, type = "bullet") {
  listElement.innerHTML = "";

  let listArray = [];
  if (Array.isArray(items)) {
    listArray = items;
  } else if (typeof items === "string" && items.trim().length > 0) {
    // Split lines if returned as single multiline string
    listArray = items
      .split("\n")
      .map((line) => line.replace(/^[-*•\d.]+\s*/, "").trim())
      .filter((line) => line.length > 0);
  }

  if (listArray.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.textContent = "None specified.";
    listElement.appendChild(emptyLi);
    return;
  }

  listArray.forEach((itemText) => {
    const cleanText = String(itemText).trim();
    if (!cleanText) return;

    const li = document.createElement("li");

    if (type === "checklist") {
      // SVG Checkmark icon for checklist
      const checkIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      checkIcon.setAttribute("class", "checklist-check-icon");
      checkIcon.setAttribute("width", "16");
      checkIcon.setAttribute("height", "16");
      checkIcon.setAttribute("viewBox", "0 0 24 24");
      checkIcon.setAttribute("fill", "none");
      checkIcon.setAttribute("stroke", "currentColor");
      checkIcon.setAttribute("stroke-width", "2");
      checkIcon.setAttribute("stroke-linecap", "round");
      checkIcon.setAttribute("stroke-linejoin", "round");

      const checkPath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
      checkPath.setAttribute("points", "20 6 9 17 4 12");
      checkIcon.appendChild(checkPath);

      const textSpan = document.createElement("span");
      textSpan.className = "checklist-text";
      textSpan.textContent = cleanText;

      li.appendChild(checkIcon);
      li.appendChild(textSpan);
    } else {
      li.textContent = cleanText;
    }

    listElement.appendChild(li);
  });
}

/**
 * Render explanation data into UI
 * @param {Object} explanation
 * @param {string} language
 */
function renderExplanation(explanation, language) {
  if (!explanation || typeof explanation !== "object") {
    showError("We couldn't generate the explanation. Please try again.");
    elements.emptyState.classList.remove("hidden");
    return;
  }

  // Update Language Badge
  const langDisplayMap = {
    english: "English",
    tamil: "Tamil (தமிழ்)",
    tanglish: "Tanglish",
  };
  elements.resultLanguageBadge.textContent = langDisplayMap[language] || language;

  // If Tamil, apply Tamil class for enhanced font support
  const isTamil = language === "tamil";
  if (isTamil) {
    elements.explanationContent.classList.add("tamil-text");
    elements.explanationContent.setAttribute("lang", "ta");
  } else {
    elements.explanationContent.classList.remove("tamil-text");
    elements.explanationContent.removeAttribute("lang");
  }

  // Populate sections
  elements.whatAskingText.textContent = formatText(explanation.what_is_asking);
  elements.inputText.textContent = formatText(explanation.input);
  elements.outputText.textContent = formatText(explanation.output);
  elements.sampleInputText.textContent = formatText(explanation.sample_input_explained);
  elements.sampleOutputText.textContent = formatText(explanation.sample_output_explained);

  // Render lists
  renderList(elements.importantPointsList, explanation.important_points, "bullet");
  renderList(elements.beforeYouCodeList, explanation.before_you_code, "checklist");

  // Switch views
  elements.emptyState.classList.add("hidden");
  elements.loadingState.classList.add("hidden");
  elements.explanationContent.classList.remove("hidden");

  // Scroll smoothly to explanation on mobile/small screens
  if (window.innerWidth <= 1024) {
    elements.explanationContent.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ----------------------------------------------------------------------------
// 4. API Request Handler
// ----------------------------------------------------------------------------

/**
 * Send problem explanation request to backend
 * @param {string} problem
 * @param {string} language
 */
async function explainProblem(problem, language) {
  hideError();
  setLoading(true);

  try {
    const response = await fetch(EXPLAIN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        problem: problem,
        language: language,
      }),
    });

    // Check HTTP status
    if (!response.ok) {
      let serverErrorMsg = "";
      try {
        const errorData = await response.json();
        if (errorData && (errorData.message || errorData.detail)) {
          serverErrorMsg = String(errorData.message || errorData.detail);
        }
      } catch (e) {
        // Response body wasn't JSON
      }

      // Display friendly error message without stack trace
      showError(serverErrorMsg || "We couldn't generate the explanation. Please try again.");
      elements.emptyState.classList.remove("hidden");
      return;
    }

    // Parse JSON Response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      showError("We couldn't generate the explanation. Please try again.");
      elements.emptyState.classList.remove("hidden");
      return;
    }

    // Validate expected payload structure
    if (data && (data.success === true || data.explanation)) {
      const explanationPayload = data.explanation || data;
      renderExplanation(explanationPayload, language);
    } else if (data && data.success === false) {
      const msg = data.message || data.error || "We couldn't generate the explanation. Please try again.";
      showError(msg);
      elements.emptyState.classList.remove("hidden");
    } else {
      showError("We couldn't generate the explanation. Please try again.");
      elements.emptyState.classList.remove("hidden");
    }
  } catch (networkError) {
    // Network error / backend offline / CORS failure
    showError("We couldn't connect to the explanation service. Please make sure the backend is running.");
    elements.emptyState.classList.remove("hidden");
  } finally {
    setLoading(false);
  }
}

// ----------------------------------------------------------------------------
// 5. Event Listeners & Initialization
// ----------------------------------------------------------------------------

// Form Submission
elements.form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (isSubmitting) return;

  const problemText = elements.problemInput.value.trim();

  // Validate problem is not empty
  if (!problemText) {
    showError("Please paste a problem statement first.");
    elements.problemInput.focus();
    return;
  }

  const selectedLanguage = getSelectedLanguage();
  explainProblem(problemText, selectedLanguage);
});

// Character Count & Auto-hide error on typing
elements.problemInput.addEventListener("input", () => {
  updateCharCount();
  if (elements.errorAlert && !elements.errorAlert.classList.contains("hidden")) {
    hideError();
  }
});

// Keyboard Shortcut: Ctrl+Enter or Cmd+Enter to submit
elements.problemInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    elements.form.dispatchEvent(new Event("submit", { cancelable: true }));
  }
});

// Clear Problem Input button
elements.clearInputBtn.addEventListener("click", () => {
  elements.problemInput.value = "";
  updateCharCount();
  hideError();
  elements.problemInput.focus();
});

// Reset / Explain Another Problem Buttons
elements.resetBtn.addEventListener("click", resetToInitialState);
elements.footerResetBtn.addEventListener("click", resetToInitialState);

// Initialize character count on load
updateCharCount();
