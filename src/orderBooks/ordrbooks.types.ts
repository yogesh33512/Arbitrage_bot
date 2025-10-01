export type orderbookSide = Array<[number, number]>;

export interface ExchangeOrderbook {
  bids: orderbookSide;
  asks: orderbookSide;
}


