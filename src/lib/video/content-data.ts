// Content databases for new engines

// ==========================================
// RIDDLES DATABASE
// ==========================================
export interface RiddleData {
  question: string;
  answer: string;
  hints: string[];
  difficulty: "easy" | "medium" | "hard";
  category: "wordplay" | "logic" | "lateral" | "classic" | "math";
}

export const RIDDLES: RiddleData[] = [
  // Easy Riddles
  { question: "What has keys but can't open locks?", answer: "A piano", hints: ["Musical instrument", "Black and white"], difficulty: "easy", category: "wordplay" },
  { question: "What gets wet while drying?", answer: "A towel", hints: ["Bathroom item", "Absorbs water"], difficulty: "easy", category: "wordplay" },
  { question: "What has hands but can't clap?", answer: "A clock", hints: ["Tells time", "Has a face"], difficulty: "easy", category: "wordplay" },
  { question: "What has a head and a tail but no body?", answer: "A coin", hints: ["Metal", "Currency"], difficulty: "easy", category: "wordplay" },
  { question: "What goes up but never comes down?", answer: "Your age", hints: ["Time-related", "Everyone has it"], difficulty: "easy", category: "classic" },
  { question: "The more you take, the more you leave behind. What am I?", answer: "Footsteps", hints: ["Walking", "On the ground"], difficulty: "easy", category: "classic" },
  { question: "What has many teeth but can't bite?", answer: "A comb", hints: ["Hair care", "Grooming tool"], difficulty: "easy", category: "wordplay" },
  { question: "What can travel around the world while staying in a corner?", answer: "A stamp", hints: ["Postal service", "On envelopes"], difficulty: "easy", category: "lateral" },
  { question: "What has one eye but can't see?", answer: "A needle", hints: ["Sewing", "Thread goes through it"], difficulty: "easy", category: "wordplay" },
  { question: "What begins with T, ends with T, and has T in it?", answer: "A teapot", hints: ["Kitchen item", "Hot beverage"], difficulty: "easy", category: "wordplay" },
  
  // Medium Riddles
  { question: "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?", answer: "An echo", hints: ["Sound-related", "Bounces back"], difficulty: "medium", category: "classic" },
  { question: "The person who makes it doesn't need it. The person who buys it doesn't use it. The person who uses it doesn't know it. What is it?", answer: "A coffin", hints: ["Funeral", "Final resting"], difficulty: "medium", category: "logic" },
  { question: "What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?", answer: "A river", hints: ["Nature", "Water"], difficulty: "medium", category: "classic" },
  { question: "A man is pushing his car. He stops in front of a hotel and immediately knows he's bankrupt. Why?", answer: "He's playing Monopoly", hints: ["Board game", "Property"], difficulty: "medium", category: "lateral" },
  { question: "What is seen in the middle of March and April but can't be seen at the beginning or end of either month?", answer: "The letter R", hints: ["Alphabet", "Look closely"], difficulty: "medium", category: "wordplay" },
  { question: "A woman shoots her husband, then holds him under water for five minutes. Next, she hangs him. Right after, they enjoy a lovely dinner. How?", answer: "She's a photographer", hints: ["Developing photos", "Darkroom"], difficulty: "medium", category: "lateral" },
  { question: "What disappears as soon as you say its name?", answer: "Silence", hints: ["Absence of sound", "Peaceful"], difficulty: "medium", category: "classic" },
  { question: "I have cities but no houses, forests but no trees, and rivers but no water. What am I?", answer: "A map", hints: ["Navigation", "Geography"], difficulty: "medium", category: "classic" },
  { question: "What word in the English language does the following: The first two letters signify a male, the first three letters signify a female, the first four letters signify a great man, while the entire word signifies a great woman?", answer: "Heroine", hints: ["Hero...", "Female protagonist"], difficulty: "medium", category: "wordplay" },
  { question: "A man dies of old age on his 25th birthday. How is this possible?", answer: "He was born on February 29th", hints: ["Leap year", "Calendar"], difficulty: "medium", category: "logic" },
  
  // Hard Riddles
  { question: "You see a boat filled with people. It has not sunk, but when you look again you don't see a single person on the boat. Why?", answer: "They're all married (not single)", hints: ["Word trick", "Relationship status"], difficulty: "hard", category: "lateral" },
  { question: "What is so fragile that saying its name breaks it?", answer: "Silence", hints: ["Can't be touched", "Sound-related"], difficulty: "hard", category: "classic" },
  { question: "A girl has as many brothers as sisters, but each brother has only half as many brothers as sisters. How many brothers and sisters are there in the family?", answer: "Four sisters and three brothers", hints: ["Math problem", "Count carefully"], difficulty: "hard", category: "math" },
  { question: "I am not alive, but I can grow. I don't have lungs, but I need air. I don't have a mouth, but water kills me. What am I?", answer: "Fire", hints: ["Element", "Hot"], difficulty: "hard", category: "classic" },
  { question: "The more of this there is, the less you see. What is it?", answer: "Darkness", hints: ["Absence of light", "Night"], difficulty: "hard", category: "classic" },
  { question: "A murderer is condemned to death. He has to choose between three rooms: The first is full of raging fires, the second is full of assassins with loaded guns, and the third is full of lions that haven't eaten in 3 years. Which room is safest?", answer: "The third room (the lions are dead)", hints: ["Animals", "Starvation"], difficulty: "hard", category: "logic" },
  { question: "What English word has three consecutive double letters?", answer: "Bookkeeper", hints: ["Occupation", "Accounting"], difficulty: "hard", category: "wordplay" },
  { question: "A man walks into a bar and asks for a glass of water. The bartender pulls out a gun and points it at him. The man says 'Thank you' and walks out. Why?", answer: "He had hiccups", hints: ["Medical cure", "Surprise"], difficulty: "hard", category: "lateral" },
];

// ==========================================
// TRIVIA DATABASE
// ==========================================
export interface TriviaData {
  question: string;
  options: string[];
  answer: number; // index of correct answer
  difficulty: "easy" | "medium" | "hard";
  category: "history" | "science" | "geography" | "pop_culture" | "sports" | "general";
}

export const TRIVIA: TriviaData[] = [
  // Easy Questions
  { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Rome"], answer: 2, difficulty: "easy", category: "geography" },
  { question: "How many continents are there?", options: ["5", "6", "7", "8"], answer: 2, difficulty: "easy", category: "geography" },
  { question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], answer: 1, difficulty: "easy", category: "science" },
  { question: "Who painted the Mona Lisa?", options: ["Van Gogh", "Picasso", "Da Vinci", "Monet"], answer: 2, difficulty: "easy", category: "general" },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Pacific", "Indian", "Arctic"], answer: 1, difficulty: "easy", category: "geography" },
  { question: "How many legs does a spider have?", options: ["6", "8", "10", "12"], answer: 1, difficulty: "easy", category: "science" },
  { question: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Leopard", "Tiger"], answer: 1, difficulty: "easy", category: "general" },
  { question: "What year did World War II end?", options: ["1943", "1944", "1945", "1946"], answer: 2, difficulty: "easy", category: "history" },
  { question: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "Malta", "Liechtenstein"], answer: 1, difficulty: "easy", category: "geography" },
  { question: "How many colors are in a rainbow?", options: ["5", "6", "7", "8"], answer: 2, difficulty: "easy", category: "science" },
  
  // Medium Questions
  { question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Brisbane"], answer: 2, difficulty: "medium", category: "geography" },
  { question: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Shakespeare", "Austen", "Hemingway"], answer: 1, difficulty: "medium", category: "general" },
  { question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], answer: 2, difficulty: "medium", category: "science" },
  { question: "In what year did the Titanic sink?", options: ["1910", "1912", "1914", "1916"], answer: 1, difficulty: "medium", category: "history" },
  { question: "What is the largest organ in the human body?", options: ["Heart", "Liver", "Skin", "Brain"], answer: 2, difficulty: "medium", category: "science" },
  { question: "How many bones are in the adult human body?", options: ["186", "206", "226", "246"], answer: 1, difficulty: "medium", category: "science" },
  { question: "What is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], answer: 1, difficulty: "medium", category: "geography" },
  { question: "Who invented the telephone?", options: ["Edison", "Tesla", "Bell", "Morse"], answer: 2, difficulty: "medium", category: "history" },
  { question: "What is the speed of light?", options: ["299,792 km/s", "199,792 km/s", "399,792 km/s", "99,792 km/s"], answer: 0, difficulty: "medium", category: "science" },
  { question: "What country has the most natural lakes?", options: ["Russia", "USA", "Brazil", "Canada"], answer: 3, difficulty: "medium", category: "geography" },
  
  // Hard Questions
  { question: "What is the smallest prime number?", options: ["0", "1", "2", "3"], answer: 2, difficulty: "hard", category: "general" },
  { question: "In which year did the Berlin Wall fall?", options: ["1987", "1988", "1989", "1990"], answer: 2, difficulty: "hard", category: "history" },
  { question: "What is the rarest blood type?", options: ["AB-", "AB+", "O-", "B-"], answer: 0, difficulty: "hard", category: "science" },
  { question: "What element has the atomic number 1?", options: ["Helium", "Hydrogen", "Lithium", "Carbon"], answer: 1, difficulty: "hard", category: "science" },
  { question: "Who was the first person to walk on the moon?", options: ["Buzz Aldrin", "Neil Armstrong", "John Glenn", "Alan Shepard"], answer: 1, difficulty: "hard", category: "history" },
  { question: "What is the capital of Mongolia?", options: ["Ulaanbaatar", "Astana", "Tashkent", "Bishkek"], answer: 0, difficulty: "hard", category: "geography" },
  { question: "How many time zones does Russia have?", options: ["9", "10", "11", "12"], answer: 2, difficulty: "hard", category: "geography" },
  { question: "What year was the United Nations founded?", options: ["1943", "1944", "1945", "1946"], answer: 2, difficulty: "hard", category: "history" },
  { question: "What is the hardest natural substance on Earth?", options: ["Diamond", "Graphene", "Tungsten", "Titanium"], answer: 0, difficulty: "hard", category: "science" },
  { question: "How many keys does a standard piano have?", options: ["76", "80", "88", "92"], answer: 2, difficulty: "hard", category: "general" },
];


// ==========================================
// MEMORY CHALLENGES DATABASE - SIMON SAYS STYLE
// ==========================================
export interface MemoryData {
  type: "sequence";
  difficulty: "easy" | "medium" | "hard";
  data: { length: number };
}

export const MEMORY_CHALLENGES: MemoryData[] = [
  { type: "sequence", difficulty: "easy", data: { length: 4 } },
  { type: "sequence", difficulty: "easy", data: { length: 5 } },
  { type: "sequence", difficulty: "medium", data: { length: 6 } },
  { type: "sequence", difficulty: "medium", data: { length: 7 } },
  { type: "sequence", difficulty: "hard", data: { length: 8 } },
  { type: "sequence", difficulty: "hard", data: { length: 9 } },
];

// ==========================================
// WOULD YOU RATHER DATABASE
// ==========================================
export interface WouldYouRatherData {
  question: string;
  optionA: string;
  optionB: string;
  category: "fun" | "deep" | "silly" | "tough";
  funFact?: string;
}

export const WOULD_YOU_RATHER: WouldYouRatherData[] = [
  { question: "Would you rather...", optionA: "Have the ability to fly", optionB: "Have the ability to be invisible", category: "fun", funFact: "Most people choose flying!" },
  { question: "Would you rather...", optionA: "Live without music", optionB: "Live without movies", category: "tough" },
  { question: "Would you rather...", optionA: "Always be 10 minutes late", optionB: "Always be 20 minutes early", category: "fun" },
  { question: "Would you rather...", optionA: "Have unlimited money", optionB: "Have unlimited time", category: "deep" },
  { question: "Would you rather...", optionA: "Never use social media again", optionB: "Never watch TV/movies again", category: "tough" },
  { question: "Would you rather...", optionA: "Be able to talk to animals", optionB: "Be able to speak all languages", category: "fun" },
  { question: "Would you rather...", optionA: "Live in the past", optionB: "Live in the future", category: "deep" },
  { question: "Would you rather...", optionA: "Always have to sing instead of speak", optionB: "Always have to dance everywhere you go", category: "silly" },
  { question: "Would you rather...", optionA: "Be famous when you're alive and forgotten when you die", optionB: "Be unknown when alive but famous after death", category: "deep" },
  { question: "Would you rather...", optionA: "Have a rewind button for life", optionB: "Have a pause button for life", category: "deep" },
  { question: "Would you rather...", optionA: "Read minds but can't turn it off", optionB: "Be invisible but naked while invisible", category: "tough" },
  { question: "Would you rather...", optionA: "Fight one horse-sized duck", optionB: "Fight 100 duck-sized horses", category: "silly" },
  { question: "Would you rather...", optionA: "Have no internet", optionB: "Have no phone", category: "tough" },
  { question: "Would you rather...", optionA: "Always know when someone is lying", optionB: "Always get away with lying", category: "deep" },
  { question: "Would you rather...", optionA: "Have free Wi-Fi wherever you go", optionB: "Have free coffee wherever you go", category: "fun" },
  { question: "Would you rather...", optionA: "Be stuck on a broken ski lift", optionB: "Be stuck in a broken elevator", category: "tough" },
  { question: "Would you rather...", optionA: "Have to wear clown shoes every day", optionB: "Have to wear a clown nose every day", category: "silly" },
  { question: "Would you rather...", optionA: "Live forever at your current age", optionB: "Live to 100 but age normally", category: "deep" },
  { question: "Would you rather...", optionA: "Have dinner with anyone from history", optionB: "Have dinner with anyone alive today", category: "fun" },
  { question: "Would you rather...", optionA: "Lose all your old memories", optionB: "Never be able to make new memories", category: "deep" },
];

// ==========================================
// MYTH BUSTERS DATABASE
// ==========================================
export interface MythData {
  myth: string;
  isTrue: boolean;
  explanation: string;
  category: "science" | "history" | "food" | "animals" | "health";
}

export const MYTHS: MythData[] = [
  { myth: "Lightning never strikes the same place twice", isTrue: false, explanation: "Lightning can and does strike the same place multiple times. The Empire State Building gets hit about 20-25 times per year.", category: "science" },
  { myth: "You only use 10% of your brain", isTrue: false, explanation: "Brain imaging shows all parts of the brain are active throughout the day, even during sleep.", category: "science" },
  { myth: "Goldfish have a 3-second memory", isTrue: false, explanation: "Goldfish can remember things for months and can be trained to recognize patterns.", category: "animals" },
  { myth: "Eating carrots improves your eyesight", isTrue: false, explanation: "While carrots contain vitamin A which is good for eyes, they won't give you super vision. This myth started as British WWII propaganda.", category: "health" },
  { myth: "The Great Wall of China is visible from space", isTrue: false, explanation: "You can't see it with the naked eye from space. This is a common misconception.", category: "history" },
  { myth: "Cracking your knuckles causes arthritis", isTrue: false, explanation: "Studies have found no connection between knuckle cracking and arthritis.", category: "health" },
  { myth: "Sugar makes kids hyper", isTrue: false, explanation: "Multiple studies show no link between sugar and hyperactivity. It's usually the exciting environment (like birthday parties).", category: "health" },
  { myth: "Bats are blind", isTrue: false, explanation: "All bats can see. Many species have excellent vision, especially for seeing in low light.", category: "animals" },
  { myth: "Dropping a penny from a tall building could kill someone", isTrue: false, explanation: "A penny's terminal velocity isn't fast enough to kill. It would just sting a bit.", category: "science" },
  { myth: "Chameleons change color to blend with their surroundings", isTrue: false, explanation: "They change color based on mood, temperature, and light - not to camouflage.", category: "animals" },
  { myth: "You lose most body heat through your head", isTrue: false, explanation: "You lose heat from any exposed skin equally. This myth came from a flawed military study.", category: "science" },
  { myth: "Vikings wore horned helmets", isTrue: false, explanation: "No evidence exists of Vikings wearing horned helmets. This image came from 19th-century opera costumes.", category: "history" },
  { myth: "Eating before swimming causes cramps", isTrue: false, explanation: "There's no scientific evidence that eating before swimming is dangerous.", category: "health" },
  { myth: "Bulls are enraged by the color red", isTrue: false, explanation: "Bulls are colorblind to red. They charge at the movement of the cape, not its color.", category: "animals" },
  { myth: "Hair and nails keep growing after death", isTrue: false, explanation: "The skin recedes as it dehydrates, making hair and nails appear longer.", category: "science" },
  { myth: "Mount Everest is the tallest mountain on Earth", isTrue: false, explanation: "Measured from base to peak, Mauna Kea in Hawaii is taller (though most is underwater).", category: "science" },
  { myth: "Shaving makes hair grow back thicker", isTrue: false, explanation: "Hair looks thicker because you're cutting the tapered end, leaving a blunt tip.", category: "health" },
  { myth: "You can't fold a paper more than 7 times", isTrue: false, explanation: "In 2002, Britney Gallivan folded paper 12 times using a long sheet of toilet paper.", category: "science" },
  { myth: "Napoleon was short", isTrue: false, explanation: "Napoleon was 5'7\", which was average height for his time. British propaganda portrayed him as short.", category: "history" },
  { myth: "We evolved from monkeys", isTrue: false, explanation: "Humans and monkeys evolved from a common ancestor millions of years ago. We didn't evolve FROM monkeys.", category: "science" },
];

// ==========================================
// QUICK POLLS DATABASE
// ==========================================
export interface PollData {
  question: string;
  options: string[];
  category: "fun" | "food" | "life" | "random";
  funFact?: string;
}

export const POLLS: PollData[] = [
  { question: "What's the best pizza topping?", options: ["Pepperoni", "Pineapple", "Mushrooms", "Plain Cheese"], category: "food", funFact: "Pineapple on pizza was invented in Canada!" },
  { question: "How do you eat Oreos?", options: ["Twist and lick", "Dunk in milk", "Eat whole", "Just eat the cream"], category: "food" },
  { question: "Morning person or night owl?", options: ["Morning Person", "Night Owl", "Both", "Neither"], category: "life" },
  { question: "Cats or dogs?", options: ["Cats", "Dogs", "Both", "Neither"], category: "fun", funFact: "There are more pet dogs than cats worldwide!" },
  { question: "How do you pronounce GIF?", options: ["JIF (soft G)", "GIF (hard G)", "I don't care", "What's a GIF?"], category: "random" },
  { question: "Toilet paper: over or under?", options: ["Over", "Under", "Doesn't matter", "I use bidets"], category: "random", funFact: "The patent shows 'over' as correct!" },
  { question: "Best superpower?", options: ["Flight", "Invisibility", "Super Strength", "Time Travel"], category: "fun" },
  { question: "Hot dog: sandwich or not?", options: ["It's a sandwich", "Not a sandwich", "It's a taco", "Who cares?"], category: "food" },
  { question: "Best season?", options: ["Spring", "Summer", "Fall", "Winter"], category: "life" },
  { question: "Pineapple on pizza?", options: ["Love it", "Hate it", "It's okay", "Never tried it"], category: "food" },
  { question: "How do you butter toast?", options: ["Edge to edge", "Leave crust dry", "One side only", "No butter"], category: "food" },
  { question: "Socks to bed?", options: ["Always", "Never", "Sometimes", "Only in winter"], category: "life" },
  { question: "Best streaming service?", options: ["Netflix", "Disney+", "YouTube", "Other"], category: "random" },
  { question: "Coffee or tea?", options: ["Coffee", "Tea", "Both", "Neither"], category: "food" },
  { question: "Beach or mountains?", options: ["Beach", "Mountains", "Both", "Neither"], category: "life" },
  { question: "Books or movies?", options: ["Books", "Movies", "Both", "Neither"], category: "fun" },
  { question: "Early bird or procrastinator?", options: ["Early bird", "Procrastinator", "Depends", "Balanced"], category: "life" },
  { question: "Ketchup on eggs?", options: ["Yes, always", "Never", "Sometimes", "That's gross"], category: "food" },
  { question: "Text or call?", options: ["Text", "Call", "Video call", "In person only"], category: "random" },
  { question: "Pancakes or waffles?", options: ["Pancakes", "Waffles", "French toast", "All of them"], category: "food" },
];

// ==========================================
// LANGUAGE PUZZLES DATABASE
// ==========================================
export interface LanguageData {
  word: string;
  scrambled?: string;
  hint?: string;
  difficulty: "easy" | "medium" | "hard";
  type: "scramble" | "anagram" | "missing";
}

export const LANGUAGE_PUZZLES: LanguageData[] = [
  // Easy (5-6 letters)
  { word: "PLANET", difficulty: "easy", type: "scramble", hint: "In space" },
  { word: "GARDEN", difficulty: "easy", type: "scramble", hint: "Plants grow here" },
  { word: "CASTLE", difficulty: "easy", type: "scramble", hint: "Medieval building" },
  { word: "BRIDGE", difficulty: "easy", type: "scramble", hint: "Crosses water" },
  { word: "FOREST", difficulty: "easy", type: "scramble", hint: "Many trees" },
  { word: "WINDOW", difficulty: "easy", type: "scramble", hint: "See through it" },
  { word: "PENCIL", difficulty: "easy", type: "scramble", hint: "Writing tool" },
  { word: "CANDLE", difficulty: "easy", type: "scramble", hint: "Makes light" },
  { word: "MIRROR", difficulty: "easy", type: "scramble", hint: "Reflects you" },
  { word: "PUZZLE", difficulty: "easy", type: "scramble", hint: "Brain game" },
  
  // Medium (7-8 letters)
  { word: "MOUNTAIN", difficulty: "medium", type: "scramble", hint: "Very tall" },
  { word: "UMBRELLA", difficulty: "medium", type: "scramble", hint: "For rain" },
  { word: "COMPUTER", difficulty: "medium", type: "scramble", hint: "You're using one" },
  { word: "ELEPHANT", difficulty: "medium", type: "scramble", hint: "Large animal" },
  { word: "TRIANGLE", difficulty: "medium", type: "scramble", hint: "3 sides" },
  { word: "CALENDAR", difficulty: "medium", type: "scramble", hint: "Shows dates" },
  { word: "KEYBOARD", difficulty: "medium", type: "scramble", hint: "For typing" },
  { word: "FOUNTAIN", difficulty: "medium", type: "scramble", hint: "Water feature" },
  { word: "HOSPITAL", difficulty: "medium", type: "scramble", hint: "Medical care" },
  { word: "SANDWICH", difficulty: "medium", type: "scramble", hint: "Food item" },
  
  // Hard (9+ letters)
  { word: "BUTTERFLY", difficulty: "hard", type: "scramble", hint: "Insect with wings" },
  { word: "CHOCOLATE", difficulty: "hard", type: "scramble", hint: "Sweet treat" },
  { word: "TELEPHONE", difficulty: "hard", type: "scramble", hint: "For calling" },
  { word: "ADVENTURE", difficulty: "hard", type: "scramble", hint: "Exciting journey" },
  { word: "NEWSPAPER", difficulty: "hard", type: "scramble", hint: "Daily publication" },
  { word: "LIGHTNING", difficulty: "hard", type: "scramble", hint: "In a storm" },
  { word: "CROCODILE", difficulty: "hard", type: "scramble", hint: "Reptile" },
  { word: "SUBMARINE", difficulty: "hard", type: "scramble", hint: "Underwater vessel" },
];

// ==========================================
// SCIENCE FACTS DATABASE
// ==========================================
export interface ScienceData {
  fact: string;
  explanation: string;
  category: "physics" | "chemistry" | "biology" | "astronomy" | "earth";
  visualType: "diagram" | "animation" | "comparison";
}

export const SCIENCE_FACTS: ScienceData[] = [
  { fact: "Light travels at 299,792 kilometers per second", explanation: "That's fast enough to circle Earth 7.5 times in one second", category: "physics", visualType: "animation" },
  { fact: "Water expands when it freezes", explanation: "Most substances contract when frozen, but water expands by about 9%", category: "chemistry", visualType: "diagram" },
  { fact: "Your heart beats 100,000 times per day", explanation: "That's about 3 billion beats in an average lifetime", category: "biology", visualType: "animation" },
  { fact: "Jupiter is more than twice as massive as all other planets combined", explanation: "It could fit 1,300 Earths inside it", category: "astronomy", visualType: "comparison" },
  { fact: "Honey never spoils", explanation: "Archaeologists have found 3,000-year-old honey in Egyptian tombs that's still edible", category: "biology", visualType: "diagram" },
  { fact: "Sound travels 4 times faster in water than in air", explanation: "In air: 343 m/s, in water: 1,480 m/s", category: "physics", visualType: "comparison" },
  { fact: "Bananas are radioactive", explanation: "They contain potassium-40, a naturally occurring radioactive isotope", category: "chemistry", visualType: "diagram" },
  { fact: "Your brain uses 20% of your body's energy", explanation: "Despite being only 2% of your body weight", category: "biology", visualType: "diagram" },
  { fact: "A day on Venus is longer than its year", explanation: "Venus takes 243 Earth days to rotate, but only 225 to orbit the Sun", category: "astronomy", visualType: "comparison" },
  { fact: "Octopuses have three hearts", explanation: "Two pump blood to the gills, one pumps to the rest of the body", category: "biology", visualType: "diagram" },
  { fact: "Lightning is 5 times hotter than the Sun's surface", explanation: "Lightning: 30,000°C, Sun's surface: 5,500°C", category: "physics", visualType: "comparison" },
  { fact: "DNA is 2 meters long but fits in a cell nucleus", explanation: "It's coiled and folded extremely tightly", category: "biology", visualType: "diagram" },
  { fact: "Diamonds can be made from peanut butter", explanation: "Under extreme pressure and temperature, the carbon in peanut butter can crystallize", category: "chemistry", visualType: "animation" },
  { fact: "Neutron stars are incredibly dense", explanation: "A teaspoon of neutron star material weighs 6 billion tons", category: "astronomy", visualType: "comparison" },
  { fact: "Water can boil and freeze at the same time", explanation: "At the triple point (0.01°C and 611.657 Pa), water exists as solid, liquid, and gas", category: "physics", visualType: "diagram" },
  { fact: "You lose about 50-100 hairs per day", explanation: "But you have about 100,000 hair follicles, so it's perfectly normal", category: "biology", visualType: "animation" },
  { fact: "The Moon is slowly drifting away from Earth", explanation: "At a rate of about 3.8 centimeters per year", category: "astronomy", visualType: "animation" },
  { fact: "Hot water freezes faster than cold water", explanation: "Known as the Mpemba effect, though scientists still debate why", category: "physics", visualType: "diagram" },
  { fact: "Stomach acid is strong enough to dissolve metal", explanation: "Your stomach produces hydrochloric acid with a pH of 1-2", category: "biology", visualType: "animation" },
  { fact: "There are more stars than grains of sand on Earth", explanation: "Estimated 100-400 billion billion stars vs 7.5 quintillion grains of sand", category: "astronomy", visualType: "comparison" },
];

// ==========================================
// HISTORY MYSTERIES DATABASE
// ==========================================
export interface HistoryData {
  title: string;
  event: string;
  year: string | number;
  mystery: string;
  category: "ancient" | "medieval" | "modern" | "mystery";
  visualType: "timeline" | "map" | "portrait" | "artifact";
}

export const HISTORY_MYSTERIES: HistoryData[] = [
  { title: "The Library of Alexandria", event: "One of the largest libraries of the ancient world mysteriously burned down", year: "48 BC", mystery: "Was it Caesar's fire, religious zealots, or gradual decline?", category: "ancient", visualType: "artifact" },
  { title: "Cleopatra's Death", event: "The last pharaoh of Egypt died mysteriously at age 39", year: "30 BC", mystery: "Snake bite, poison, or assisted suicide?", category: "ancient", visualType: "portrait" },
  { title: "The Nazca Lines", event: "Massive geoglyphs drawn in the Peruvian desert", year: "500 AD", mystery: "Who made them and why? Only visible from the sky", category: "ancient", visualType: "map" },
  { title: "The Lost Colony of Roanoke", event: "117 English settlers vanished without a trace", year: "1590", mystery: "Only the word 'CROATOAN' carved on a post remained", category: "mystery", visualType: "map" },
  { title: "Shakespeare's Identity", event: "Questions about whether William Shakespeare wrote his plays", year: "1564-1616", mystery: "Was he one person or multiple authors?", category: "mystery", visualType: "portrait" },
  { title: "The Voynich Manuscript", event: "A 600-year-old book written in an unknown language", year: "1400s", mystery: "No one has ever deciphered it", category: "medieval", visualType: "artifact" },
  { title: "Tutankhamun's Curse", event: "Several people died after opening King Tut's tomb", year: "1922", mystery: "Curse, coincidence, or ancient bacteria?", category: "ancient", visualType: "artifact" },
  { title: "Amelia Earhart's Disappearance", event: "Famous aviator vanished over the Pacific Ocean", year: "1937", mystery: "Crashed at sea, captured, or landed on a remote island?", category: "modern", visualType: "portrait" },
  { title: "The Dyatlov Pass Incident", event: "Nine Russian hikers died mysteriously in the mountains", year: "1959", mystery: "Their tent was cut from the inside, bodies showed strange injuries", category: "mystery", visualType: "map" },
  { title: "Stonehenge's Purpose", event: "Massive stone circle in England", year: "3000 BC", mystery: "Calendar, healing temple, or astronomical observatory?", category: "ancient", visualType: "artifact" },
  { title: "The Bermuda Triangle", event: "Ships and planes mysteriously disappear in this area", year: "1900s-present", mystery: "Natural phenomena or something supernatural?", category: "mystery", visualType: "map" },
  { title: "The Terracotta Army", event: "8,000 life-sized soldiers buried with China's first emperor", year: "210 BC", mystery: "Why were they made? What else is buried there?", category: "ancient", visualType: "artifact" },
  { title: "The Dancing Plague of 1518", event: "Hundreds of people danced uncontrollably for days", year: "1518", mystery: "Mass hysteria, ergot poisoning, or something else?", category: "medieval", visualType: "timeline" },
  { title: "Oak Island Money Pit", event: "A mysterious pit believed to contain treasure", year: "1795-present", mystery: "Pirates, Templars, or natural sinkhole?", category: "mystery", visualType: "map" },
  { title: "The Antikythera Mechanism", event: "Ancient Greek analog computer found in a shipwreck", year: "100 BC", mystery: "How did they build such advanced technology?", category: "ancient", visualType: "artifact" },
  { title: "The Shroud of Turin", event: "Cloth bearing the image of a man", year: "1300s", mystery: "Is it the burial cloth of Jesus or a medieval forgery?", category: "medieval", visualType: "artifact" },
  { title: "D.B. Cooper's Hijacking", event: "Man hijacked a plane, got ransom, and parachuted away", year: "1971", mystery: "Never found despite massive manhunt", category: "modern", visualType: "portrait" },
  { title: "The Mary Celeste", event: "Ship found abandoned with cargo intact", year: "1872", mystery: "Why did the crew abandon a seaworthy vessel?", category: "mystery", visualType: "artifact" },
  { title: "The Lost City of Atlantis", event: "Advanced civilization described by Plato", year: "Ancient", mystery: "Real place or philosophical allegory?", category: "ancient", visualType: "map" },
  { title: "The Princes in the Tower", event: "Two young English princes disappeared from the Tower of London", year: "1483", mystery: "Murdered by their uncle? Bodies found but never confirmed", category: "medieval", visualType: "portrait" },
];
