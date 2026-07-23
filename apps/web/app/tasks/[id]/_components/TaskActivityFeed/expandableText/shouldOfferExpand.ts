import {
  ACTIVITY_TEXT_CLAMP_LINES,
  ACTIVITY_TEXT_SHOW_MORE_THRESHOLD_CHARS,
} from './constants';

export const shouldOfferExpand = ({ text }: { text: string }): boolean => {
  const lineCount = text.split('\n').length;

  return lineCount > ACTIVITY_TEXT_CLAMP_LINES || text.length > ACTIVITY_TEXT_SHOW_MORE_THRESHOLD_CHARS;
};
