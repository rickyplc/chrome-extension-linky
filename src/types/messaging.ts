import { TagLinks } from "./links";

export enum MessageAction {
  CONTENT_SCRIPT_LOADED = "content_script_loaded",
  STORE_ELEMENTS = "store_elements",
  TOGGLE_HIGHLIGHT = "toggle_highlight",
}

export interface MessagePayload {
  elements?: TagLinks;
  reverse?: boolean;
  url?: string;
}

export interface MessageResponse {
  messageAction: MessageAction;
  payload: MessagePayload;
}
