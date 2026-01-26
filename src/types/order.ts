export type ShirtSize = "S" | "M" | "L" | "XL" | "XXL";

export type OrderMember = {
  name: string;
  size: ShirtSize;
};

export type OrderPayload = {
  shirtLink?: string;
  members: OrderMember[];
};
