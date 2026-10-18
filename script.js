const resumeInput = document.querySelector("#resume-text");
const jobInput = document.querySelector("#job-text");
const analyzeButton = document.querySelector("#analyze-button");
const sampleButton = document.querySelector("#sample-button");
const clearButton = document.querySelector("#clear-button");
const resumeCount = document.querySelector("#resume-count");
const jobCount = document.querySelector("#job-count");
const formMessage = document.querySelector("#form-message");
const resultState = document.querySelector("#result-state");
const resultsContent = document.querySelector("#results-content");

const ignoredWords = new Set(`
  a an the and or but if then else when at by for from in into of on onto to up with about
  as is are was were be been being have has had do does did will would should could can may
  might must this that these those it its we you your our their they them he she his her i
  who what which where why how not no yes all any each every both few more most other some
  such only own same so than too very also just role work working team company position
  candidate candidates applicant applicants job description responsibility responsibilities
  requirement requirements required preferred plus including include ability strong excellent
  good great proven ideal responsible experience year years using use used within across
  support help ensure maintain provide develop create make build
`.trim().split(/\s+/));

const shortTechnicalTerms = new Set(["ai", "ar", "bi", "c", "c#", "c++", "go", "hr", "qa", "r", "sql", "ui", "ux", "vr"]);

const sampleResume = `Maya Patel\nProduct Marketing Manager\n\nProduct marketing leader with 5 years of experience bringing SaaS products to market. Led go-to-market strategy and product launches, translating customer research into positioning, messaging, and sales enablement.\n\nExperience\nSenior Product Marketing Manager | Northstar Software\n- Built product positioning and messaging for a B2B analytics platform.\n- Partnered with product, sales, and customer success teams on launches and demand generation.\n- Used market research, competitive analysis, and customer interviews to shape roadmap priorities.\n- Created sales enablement materials and tracked campaign performance with CRM analytics.\n\nSkills: Product marketing, go-to-market strategy, SaaS, market research, product launches, messaging, sales enablement, analytics, stakeholder management.`;

const sampleJob = `Product Marketing Manager\n\nWe are looking for a product marketing manager to shape how customers understand and adopt our B2B SaaS platform. You will own go-to-market strategy, product positioning, messaging, and launches in partnership with product, sales, and customer success.\n\nWhat you will do\n- Lead product launches and build clear positioning for new features.\n- Conduct market research, customer interviews, and competitive analysis.\n- Develop sales enablement and demand generation campaigns.\n- Partner with cross-functional stakeholders and use data analytics to measure impact.\n\nWhat you bring\n- 3+ years in product marketing for a SaaS company.\n- Strong writing, communication, and project management skills.\n- Experience with CRM tools and campaign performance reporting.`;

function getWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function updateWordCounts() {
  resumeCount.textContent = `${getWords(resumeInput.value)} words`;
  jobCount.textContent = `${getWords(jobInput.value)} words`;
}

function tokenize(text) {
  const tokens = text.toLowerCase().match(/\.net|c\+\+|c#|[a-z0-9]+(?:[.-][a-z0-9]+)*/g) || [];
  return tokens.map((token) => token.replace(/^[.-]+|[.-]+$/g, ""));
}

function extractKeywords(jobText) {
  const frequencies = new Map();

  for (const word of tokenize(jobText)) {
    if (word.length < 3 && !shortTechnicalTerms.has(word)) continue;
    if (ignoredWords.has(word) || /^\d+$/.test(word)) continue;
    frequencies.set(word, (frequencies.get(word) || 0) + 1);
  }

  return [...frequencies.keys()]
    .sort((first, second) => frequencies.get(second) - frequencies.get(first) || first.localeCompare(second))
    .slice(0, 30);
}

function renderResults(matched, missing, percentage) {
  const matchedMarkup = matched.length
    ? matched.map((word) => `<span class="keyword-chip">${escapeHtml(word)}</span>`).join("")
    : '<span class="no-keywords">No matching keywords found yet.</span>';
  const missingMarkup = missing.length
    ? missing.map((word) => `<span class="keyword-chip">${escapeHtml(word)}</span>`).join("")
    : '<span class="no-keywords">You covered every keyword we found.</span>';

  resultsContent.innerHTML = `
    <div class="analysis-grid">
      <div class="score-block">
        <div class="score-ring" style="--score: ${percentage}%" role="img" aria-label="${percentage}% keyword match">
          <span class="score-number">${percentage}%</span>
        </div>
        <p class="score-caption">keyword match</p>
      </div>
      <div class="keyword-column">
        <h3 class="keyword-heading"><span class="heading-dot"></span>Matched <span>(${matched.length})</span></h3>
        <div class="keyword-list">${matchedMarkup}</div>
      </div>
      <div class="keyword-column missing-column">
        <h3 class="keyword-heading"><span class="heading-dot"></span>Missing <span>(${missing.length})</span></h3>
        <div class="keyword-list">${missingMarkup}</div>
      </div>
    </div>`;
  resultState.textContent = `${matched.length} OF ${matched.length + missing.length} KEYWORDS MATCHED`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function analyze() {
  const resumeText = resumeInput.value.trim();
  const jobText = jobInput.value.trim();
  formMessage.classList.remove("is-error");

  if (!resumeText || !jobText) {
    formMessage.textContent = "Add both your resume and the job description to analyze a match.";
    formMessage.classList.add("is-error");
    (!resumeText ? resumeInput : jobInput).focus();
    return;
  }

  const resumeWords = new Set(tokenize(resumeText));
  const keywords = extractKeywords(jobText);
  const matched = keywords.filter((word) => resumeWords.has(word));
  const missing = keywords.filter((word) => !resumeWords.has(word));
  const percentage = keywords.length ? Math.round((matched.length / keywords.length) * 100) : 0;

  if (!keywords.length) {
    formMessage.textContent = "We couldn't find enough meaningful keywords in that job description. Try adding more detail.";
    formMessage.classList.add("is-error");
  } else {
    formMessage.textContent = "Done. Your text was analyzed on this device and was not uploaded.";
  }

  renderResults(matched, missing, percentage);
}

function clearForm() {
  resumeInput.value = "";
  jobInput.value = "";
  updateWordCounts();
  formMessage.textContent = "Your text stays on this device. Nothing is uploaded.";
  formMessage.classList.remove("is-error");
  resultState.textContent = "READY WHEN YOU ARE";
  resultsContent.innerHTML = `
    <div class="empty-result">
      <div class="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none"><circle cx="21" cy="21" r="12" stroke="currentColor" stroke-width="2"/><path d="m30 30 9 9M15 21h12m-6-6v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div>
        <h3>Your results will appear here</h3>
        <p>Add both texts above, then select <strong>Analyze match</strong> to see your keyword overlap.</p>
      </div>
    </div>`;
}

resumeInput.addEventListener("input", updateWordCounts);
jobInput.addEventListener("input", updateWordCounts);
analyzeButton.addEventListener("click", analyze);
clearButton.addEventListener("click", clearForm);
sampleButton.addEventListener("click", () => {
  resumeInput.value = sampleResume;
  jobInput.value = sampleJob;
  updateWordCounts();
  formMessage.textContent = "Sample text added. Select Analyze match to see the example results.";
  formMessage.classList.remove("is-error");
  resumeInput.focus();
});