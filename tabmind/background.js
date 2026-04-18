importScripts("config.js");

// Listen for message from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "analyzeTabs") {
    handleAnalyzeTabs();
    sendResponse({ received: true });
  }
});

async function handleAnalyzeTabs() {
  try {
    const tabs = await chrome.tabs.query({});

    const tabsForAI = tabs.map((tab, index) => ({
      index,
      title: tab.title || "untitled",
      url: tab.url || "",
    }));

    const groups = await groupTabsWithAI(tabsForAI);

    const groupsWithTabData = {};

    for (const [groupName, indexes] of Object.entries(groups)) {
      groupsWithTabData[groupName] = indexes.map((index) => ({
        id: tabs[index].id,
        title: tabs[index].title,
        url: tabs[index].url,
        favIconUrl: tabs[index].favIconUrl,
      }));
    }

    await chrome.storage.local.set({
      analysisResult: {
        success: true,
        groups: groupsWithTabData,
        totalCount: tabs.length,
        timestamp: Date.now(),
      },
    });

    // Now notify popup — this is just a nudge, not carrying data
    chrome.runtime.sendMessage({ action: "analysisComplete" }).catch(() => {
      // Popup might be closed, that's fine — result is in storage
    });
  } catch (error) {
    console.error("Error analyzing tabs:", error);

    await chrome.storage.local.set({
      analysisResult: {
        success: false,
        error: error.message,
        timestamp: Date.now(),
      },
    });

    chrome.runtime.sendMessage({ action: "analysisComplete" }).catch(() => {});
  }
}

async function groupTabsWithAI(tabs) {
  // Clean and limit tabs before sending to AI
  const cleanedTabs = tabs
    .slice(0, 50) // max 50 tabs
    .map((t) => {
      // Extract just the domain from URL instead of full URL
      let domain = "";
      try {
        domain = new URL(t.url).hostname;
      } catch {
        domain = t.url;
      }

      // Truncate title to 60 chars max
      const title = t.title.slice(0, 60);

      return `${t.index}: "${title}" (${domain})`;
    });

  const tabList = cleanedTabs.join("\n");

  const prompt = `You are a tab organizer. Group the following browser tabs into logical categories.
  
  Here are the open tabs:
  ${tabList}
  
  Rules:
  - Create meaningful group names like "Work", "Research", "Social Media", "Entertainment", "Shopping", "Development" etc
  - Every tab must belong to exactly one group
  - Return ONLY a valid JSON object, no explanation, no markdown, no backticks
  - Format: { "GroupName": [0, 3, 5], "AnotherGroup": [1, 2, 4] }
  - Use the tab index numbers as values`;

  const response = await fetch(CONFIG.GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CONFIG.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json();
    console.log("Groq error details:", errorBody);
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();

  const text = data.choices[0].message.content.trim();

  console.log("AI response:", text);

  const groups = JSON.parse(text);

  return groups;
}
