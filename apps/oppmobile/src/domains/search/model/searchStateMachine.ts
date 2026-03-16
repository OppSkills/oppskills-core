export type SearchFlowState = 'idle' | 'typing' | 'submitted';

export type SearchFlowEvent =
  | { readonly type: 'OPEN_RECENT' }
  | { readonly type: 'OPEN_POPULAR' }
  | { readonly type: 'OPEN_TYPING' }
  | { readonly type: 'TYPE_QUERY'; readonly query: string }
  | { readonly type: 'SUBMIT_QUERY'; readonly query: string };

export function transitionSearchFlowState(current: SearchFlowState, event: SearchFlowEvent): SearchFlowState {
  switch (event.type) {
    case 'OPEN_RECENT':
    case 'OPEN_POPULAR':
      return 'idle';
    case 'OPEN_TYPING':
      return 'typing';
    case 'TYPE_QUERY':
      return event.query.trim().length > 0 ? 'typing' : 'idle';
    case 'SUBMIT_QUERY':
      return event.query.trim().length > 0 ? 'submitted' : current;
    default:
      return current;
  }
}
