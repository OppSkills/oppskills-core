import { Prize } from "./types";

export const MOCK_PRIZES: Prize[] = [
    {
        id: "1",
        title: "Winner",
        amount: "₹ 5,000",
        description: "Cash Prize",
        image: "trophy_gold.png",
        tags: ["Appreciation Certificate"],
        icon: "trophy"
    },
    {
        id: "2",
        title: "1st Runner Up",
        amount: "₹ 5,000",
        description: "Cash Prize",
        image: "coin_gold.png",
        tags: ["Appreciation Certificate"],
        icon: "medal"
    },
    {
        id: "3",
        title: "2nd Runner Up",
        amount: "Neckband + Swags",
        description: "Goodies",
        image: "gift_box.png",
        tags: ["Appreciation Certificate"],
        icon: "star"
    },
    {
        id: "4",
        title: "Participation",
        amount: "Goodies",
        description: "For all participants",
        image: "star_gold.png",
        tags: ["Participation Certificate"],
        icon: "star"
    }
];
