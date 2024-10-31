import { TabId } from "./messaging";

/**
 * Type guard to check if a tabId is valid (not undefined).
 *
 * @param tabId - The tabId to check
 * @returns True if tabId is a valid number, otherwise false
 * @category Type Guard
 */
export const isValidTabId = (tabId: TabId): tabId is number => {
  return tabId !== undefined;
};
