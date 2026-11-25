const CARD_PARAM = "card";

function urlWithCard(cardId: string | null) {
  const url = new URL(window.location.href);
  if (cardId === null) {
    url.searchParams.delete(CARD_PARAM);
  } else {
    url.searchParams.set(CARD_PARAM, cardId);
  }
  return url;
}

export function pushCardUrl(cardId: string | null) {
  window.history.pushState(null, "", urlWithCard(cardId));
}

export function replaceCardUrl(cardId: string | null) {
  window.history.replaceState(null, "", urlWithCard(cardId));
}

export function readCardParam(params: URLSearchParams) {
  return params.get(CARD_PARAM);
}
