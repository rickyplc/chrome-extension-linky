import { MessageAction, MessageResponse } from "./types/messaging";
import { withDefault } from "./types/utils";

const ports = new Map<number, chrome.runtime.Port>();
const messageQueue = new Map<number, MessageResponse[]>();

// Listen for connections from content scripts
chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
  const tabId = port.sender?.tab?.id;

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

const checkAndToggleHighlight = (tabId: number, url: string): void => {
  const urlObj = new URL(url);
  const reverse = urlObj.searchParams.get("reverse") === "true";
  const port = ports.get(tabId);

  const message = {
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
