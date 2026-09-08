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
