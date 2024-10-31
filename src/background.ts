import { MessageAction, MessageResponse, TabId } from "./types/messaging";
import { withDefault } from "./types/utils";

const ports = new Map<TabId, chrome.runtime.Port>();
const messageQueue = new Map<TabId, MessageResponse[]>();

// Listen for connections from content scripts
chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
  const tabId: TabId = port.sender?.tab?.id;

  if (tabId === undefined) {
    return;
  }

  ports.set(tabId, port);

  // Listen for messages from content scripts
  port.onMessage.addListener((request: MessageResponse) => {
    if (request.messageAction === MessageAction.STORE_ELEMENTS) {
      const { url, elements } = request.payload;
      const safeUrl = withDefault(url, "no_url");

      // Store elements data in Chrome local storage
      chrome.storage.local.set({ [safeUrl]: elements });
    }
  });

  // Handle port disconnection
  port.onDisconnect.addListener(() => {
    ports.delete(tabId);
  });

  // Send any queued messages
  const queuedMessages = messageQueue.get(tabId);

  if (queuedMessages && queuedMessages.length > 0) {
    queuedMessages.forEach((message) => {
      port.postMessage(message);
    });
    messageQueue.delete(tabId);
  }

  // Check the URL for the reverse
  if (port.sender?.tab?.url) {
    checkAndToggleHighlight(tabId, port.sender.tab.url);
  }
});

/**
 * Check the URL for the reverse parameter and send a message to the content
 * script to toggle the highlight
 *
 * @param tabId The ID of the tab
 * @param url The URL of the tab
 * @returns void
 */
const checkAndToggleHighlight = (tabId: TabId, url: string): void => {
  if (tabId === undefined) {
    return;
  }

  const urlObj = new URL(url);
  const reverse = urlObj.searchParams.get("reverse") === "true";
  const port = ports.get(tabId);

  const message: MessageResponse = {
    messageAction: MessageAction.TOGGLE_HIGHLIGHT,
    payload: { reverse },
  };

  if (port) {
    port.postMessage(message);
  } else {
    // Queue the message
    if (!messageQueue.has(tabId)) {
      messageQueue.set(tabId, []);
    }

    messageQueue.get(tabId)!.push(message);
  }
};

// Monitor tab updates to check for the reverse parameter
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    checkAndToggleHighlight(tabId, tab.url);
  }
});
