import {
  MessageAction,
  MessageResponse,
  TabId,
  TabStatus,
  UrlQueryParam,
  DefaultUrl,
} from "./types/messaging";
import { withDefault } from "./types/utils";
import { isValidTabId } from "./types/guards";

const ports = new Map<TabId, chrome.runtime.Port>();
const messageQueue = new Map<TabId, MessageResponse[]>();

// Listen for connections from content scripts
chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => {
  const tabId: TabId = port.sender?.tab?.id;

  if (!isValidTabId(tabId)) {
    return;
  }

  ports.set(tabId, port);

  // Listen for messages from content scripts
  port.onMessage.addListener((request: MessageResponse) => {
    if (request.messageAction === MessageAction.STORE_ELEMENTS) {
      const { url, elements } = request.payload;
      const safeUrl = withDefault(url, DefaultUrl.NONE);

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
 * Extract the reverse parameter from a URL
 *
 * @param url - The URL to check
 * @returns boolean - True if reverse is "true"; otherwise, false
 */
const getReverseParam = (url: string): boolean => {
  const urlObj = new URL(url);
  return urlObj.searchParams.get(UrlQueryParam.REVERSE) === "true";
};

/**
 * Send or queue a message to toggle highlight in the content script
 *
 * @param tabId - The ID of the tab
 * @param message - The message to be sent or queued
 * @returns void
 */
const sendHighlightToggleMessage = (
  tabId: TabId,
  message: MessageResponse
): void => {
  const port = ports.get(tabId);
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

/**
 * Check the URL for the reverse parameter and toggle the highlight
 *
 * @param tabId - The ID of the tab
 * @param url - The URL of the tab
 * @returns void
 */
const checkAndToggleHighlight = (tabId: TabId, url: string): void => {
  if (!isValidTabId(tabId)) {
    return;
  }

  const reverse = getReverseParam(url);
  const message: MessageResponse = {
    messageAction: MessageAction.TOGGLE_HIGHLIGHT,
    payload: { reverse },
  };

  sendHighlightToggleMessage(tabId, message);
};

// Monitor tab updates to check for the reverse parameter
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === TabStatus.LOADED && tab.url) {
    checkAndToggleHighlight(tabId, tab.url);
  }
});
