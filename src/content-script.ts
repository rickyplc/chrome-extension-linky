import { MessageAction, MessageResponse } from "./types/messaging";
import { TagLinks } from "./types/links";

const port = chrome.runtime.connect();

/**
 * Style the outline of the elements
 *
 * @param element The element to style
 * @param color The color of the outline
 * @returns void
 */
const styleElementOutline = (element: string, color: string): void => {
  document.querySelectorAll(element).forEach((el) => {
    (el as HTMLElement).style.outline = `1px solid ${color}`;
  });
};

/**
 * Highlight the elements on the page
 *
 * @param shouldReverse Whether to reverse the highlight colors
 * @returns void
 */
const highlightPageElements = (shouldReverse: boolean = false): void => {
  const linkColor = shouldReverse ? "blue" : "orange";
  const buttonColor = shouldReverse ? "orange" : "blue";

  styleElementOutline("a", linkColor);
  styleElementOutline("button", buttonColor);
};

/**
 * Collect the elements data from the page
 *
 * @returns TagLinks The elements data collected from the page
 */
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

/**
 * Send the elements data to the background script
 *
 * @returns void
 */
const sendElementsData = (): void => {
  const elements = collectElementsData();
  const message: MessageResponse = {
    messageAction: MessageAction.STORE_ELEMENTS,
    payload: {
      url: window.location.href,
      elements,
    },
  };

  port.postMessage(message);
};

// Listen for messages from the background script via the port
port.onMessage.addListener((request: MessageResponse) => {
  if (request.messageAction === MessageAction.TOGGLE_HIGHLIGHT) {
    highlightPageElements(request.payload.reverse);
  }
});

// Initial execution
(() => {
  highlightPageElements();
  sendElementsData();
})();
