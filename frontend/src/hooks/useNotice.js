import { useCallback, useReducer } from "react";

/**
 * Stato di notifica (messaggio + tipo) raggruppato in un solo reducer.
 * Sostituisce la coppia ricorrente useState(message) + useState(messageType),
 * così le due transizioni correlate avvengono insieme in un unico aggiornamento.
 */
const initialNotice = { message: "", type: "" };

function noticeReducer(state, action) {
  switch (action.type) {
    case "show":
      return { message: action.message, type: action.noticeType || "" };
    case "clear":
      return initialNotice;
    default:
      return state;
  }
}

export function useNotice() {
  const [notice, dispatch] = useReducer(noticeReducer, initialNotice);
  const notify = useCallback(
    (message, noticeType = "") => dispatch({ type: "show", message, noticeType }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  return { notice, notify, clear };
}
