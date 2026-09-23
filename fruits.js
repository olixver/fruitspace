// The fruit list for fruit plate.
// IMPORTANT: only ever ADD new fruits to the END of this list.
// Orders store each fruit by its position in this list, so reordering
// or deleting fruits would scramble the plates of past orders.
// (Renaming a fruit's spelling is fine.)

const FRUITS = [
  "watermelon",
  "pear",
  "lemon",
  "dragonfruit",
  "pineapple",
  "papaya",
  "mango",
  "banana",
  "maraschino cherry",
  "apple",
  "grape",
  "prickly pear",
  "tomato",
  "nectarine",
  "strawberry",
  "plum",
  "blackberry",
  "mandarin",
  "kiwi",
  "fig",
  "peach",
  "blueberry",
  "lychee",
  "pomegranate",
  "cantaloupe",
  "persimmon"
];

// shared by the site (browser) and the order email (server)
if (typeof window !== "undefined") window.FRUITS = FRUITS;
if (typeof module !== "undefined") module.exports = FRUITS;
