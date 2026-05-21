import { Prize } from "./types";

export const MOCK_PRIZES: Prize[] = [
  {
    id: "1",
    title: "Winner",
    amount: "₹ 5,000",
    description: "Cash Prize",
    image: "trophy.svg",
    tags: ["Appreciation Certificate"],
    icon: "trophy",
  },
  {
    id: "2",
    title: "1st Runner Up",
    amount: "₹ 5,000",
    description: "Cash Prize",
    image: "coin.svg",
    tags: ["Appreciation Certificate"],
    icon: "coin",
  },
  {
    id: "3",
    title: "2nd Runner Up",
    amount: "Neckband + Swags",
    description: "Goodies",
    image: "gift.svg",
    tags: ["Appreciation Certificate"],
    icon: "gift",
  },
  {
    id: "4",
    title: "Participation",
    amount: "Goodies",
    description: "For all participants",
    image: "star.svg",
    tags: ["Participation Certificate"],
    icon: "star",
  },
];
