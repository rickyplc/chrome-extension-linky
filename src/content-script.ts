import { MessageAction, MessageResponse } from "./types/messaging";
import { TagLinks } from "./types/links";

const port = chrome.runtime.connect();

const styleElementOutline = (element: string, color: string): void => {
  document.querySelectorAll(element).forEach((el) => {
    (el as HTMLElement).style.outline = `1px solid ${color}`;
  });
};

// Function to highlight elements
const highlightElements = (reverse: boolean = false): void => {
  const linkColor = reverse ? "blue" : "orange";
  const buttonColor = reverse ? "orange" : "blue";

  styleElementOutline("a", linkColor);
  styleElementOutline("button", buttonColor);
};

// Function to collect elements data
const collectElementsData = (): TagLinks => {
  const elementsData: TagLinks = [];

  document.querySelectorAll("a").forEach((link) => {
    elementsData.push({
      tag: link.tagName,
      href: (link as HTMLAnchorElement).href,
    });
  });

  document.querySelectorAll("button").forEach((button) => {
    elementsData.push({ tag: button.tagName });
  });

  return elementsData;
};

const sendElementsData = (): void => {
  const elements = collectElementsData();

  port.postMessage({
    message: MessageAction.STORE_ELEMENTS,
    payload: {
      url: window.location.href,
      elements,
    },
  });
};

// Listen for messages from the background script via the port
port.onMessage.addListener((request: MessageResponse) => {
  if (request.messageAction === MessageAction.TOGGLE_HIGHLIGHT) {
    highlightElements(request.payload.reverse);
  }
});

// Initial execution
(() => {
  highlightElements();

  // Send elements data to the background script
  sendElementsData();
})();
