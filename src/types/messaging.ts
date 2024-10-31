import { TagLinks } from "./links";

export enum MessageAction {
  CONTENT_SCRIPT_LOADED = "content_script_loaded",
  STORE_ELEMENTS = "store_elements",
  TOGGLE_HIGHLIGHT = "toggle_highlight",
}

/**
 * Message payload to send to the background script or content script
 */
export interface MessagePayload {
  elements?: TagLinks;
  reverse?: boolean;
  url?: string;
}

/**
 * Message response from the background script to
 * the content script or vice versa
 */
export interface MessageResponse {
  messageAction: MessageAction;
  payload: MessagePayload;
}

export type TabId = number | undefined;
