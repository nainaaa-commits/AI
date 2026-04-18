// Wait for the DOM to be fully loaded before doing anything
document.addEventListener("DOMContentLoaded", async () => {
  const analyzeBtn = document.getElementById("analyze-btn");
  const statusMsg = document.getElementById("status-msg");
  const tabsContainer = document.getElementById("tabs-container");

  const existing = await chrome.storage.local.get("analysisResult");
  if (existing.analysisResult) {
    displayResult(existing.analysisResult);
  }

  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "analysisComplete") {
      // Read the actual data from storage
      const result = await chrome.storage.local.get("analysisResult");
      if (result.analysisResult) {
        displayResult(result.analysisResult);
      }
    }
  });

  analyzeBtn.addEventListener("click", async () => {
    statusMsg.textContent = "Analyzing your tabs...";
    analyzeBtn.disabled = true;
    tabsContainer.innerHTML = "";

    // Clear old result from storage
    await chrome.storage.local.remove("analysisResult");

    chrome.runtime.sendMessage({ action: "analyzeTabs" });

    // Poll storage as fallback in case message is missed
    pollForResult();
  });

  function pollForResult() {
    const interval = setInterval(async () => {
      const result = await chrome.storage.local.get("analysisResult");
      if (result.analysisResult) {
        clearInterval(interval);
        displayResult(result.analysisResult);
      }
    }, 500); // check every 500ms

    // Stop polling after 30 seconds regardless
    setTimeout(() => clearInterval(interval), 30000);
  }

  function displayResult(result) {
    analyzeBtn.disabled = false;

    if (result.success) {
      statusMsg.textContent = `Found ${result.totalCount} tabs in ${
        Object.keys(result.groups).length
      } groups`;
      renderGroups(result.groups);
    } else {
      statusMsg.textContent = "Something went wrong. Try again.";
      console.error(result.error);
    }
  }

  function renderGroups(groups) {
    // Clear anything previously rendered
    tabsContainer.innerHTML = "";

    for (const [groupName, tabs] of Object.entries(groups)) {
      // Create section for each group
      const groupEl = document.createElement("div");
      groupEl.className = "group";

      // Group header
      const groupHeader = document.createElement("h2");
      groupHeader.className = "group-title";
      groupHeader.textContent = `${groupName} (${tabs.length})`;
      groupEl.appendChild(groupHeader);

      // Render each tab inside the group
      tabs.forEach((tab) => {
        const tabEl = document.createElement("div");
        tabEl.className = "tab-item";

        tabEl.innerHTML = `
                <img class="tab-favicon" src="${
                  tab.favIconUrl || ""
                }" onError="this.style.display='none'" />
                <span class="tab-title">${tab.title}</span>
                <button class="close-btn" data-tab-id="${tab.id}">x</button>
                `;

        groupEl.appendChild(tabEl);
      });

      tabsContainer.appendChild(groupEl);
    }

    // Add clcik handlers for close buttons
    document.querySelectorAll(".close-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const tabId = parseInt(e.target.dataset.tabId);
        await chrome.tabs.remove(tabId);

        // Remove the tab element from without re-analyzing
        e.target.closest(".tab-item").remove();
      });
    });
  }
});
