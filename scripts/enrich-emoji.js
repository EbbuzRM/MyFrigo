const fs = require('fs');
const path = require('path');

// Emoji data from EmojiHub API
const emojiHubData = [
    { "name": "grapes", "unicode": ["U+1F347"] },
    { "name": "melon", "unicode": ["U+1F348"] },
    { "name": "watermelon", "unicode": ["U+1F349"] },
    { "name": "tangerine", "unicode": ["U+1F34A"] },
    { "name": "lemon", "unicode": ["U+1F34B"] },
    { "name": "banana", "unicode": ["U+1F34C"] },
    { "name": "pineapple", "unicode": ["U+1F34D"] },
    { "name": "red apple", "unicode": ["U+1F34E"] },
    { "name": "green apple", "unicode": ["U+1F34F"] },
    { "name": "pear", "unicode": ["U+1F350"] },
    { "name": "peach", "unicode": ["U+1F351"] },
    { "name": "cherries", "unicode": ["U+1F352"] },
    { "name": "strawberry", "unicode": ["U+1F353"] },
    { "name": "kiwifruit", "unicode": ["U+1F95D"] },
    { "name": "kiwi", "unicode": ["U+1F95D"] },
    { "name": "tomato", "unicode": ["U+1F345"] },
    { "name": "avocado", "unicode": ["U+1F951"] },
    { "name": "eggplant", "unicode": ["U+1F346"] },
    { "name": "aubergine", "unicode": ["U+1F346"] },
    { "name": "potato", "unicode": ["U+1F954"] },
    { "name": "carrot", "unicode": ["U+1F955"] },
    { "name": "corn", "unicode": ["U+1F33D"] },
    { "name": "maize", "unicode": ["U+1F33D"] },
    { "name": "hot pepper", "unicode": ["U+1F336"] },
    { "name": "pepper", "unicode": ["U+1F336"] },
    { "name": "cucumber", "unicode": ["U+1F952"] },
    { "name": "mushroom", "unicode": ["U+1F344"] },
    { "name": "peanuts", "unicode": ["U+1F95C"] },
    { "name": "peanut", "unicode": ["U+1F95C"] },
    { "name": "chestnut", "unicode": ["U+1F330"] },
    { "name": "chestnuts", "unicode": ["U+1F330"] },
    { "name": "bread", "unicode": ["U+1F35E"] },
    { "name": "croissant", "unicode": ["U+1F950"] },
    { "name": "baguette", "unicode": ["U+1F956"] },
    { "name": "pancakes", "unicode": ["U+1F95E"] },
    { "name": "pancake", "unicode": ["U+1F95E"] },
    { "name": "cheese", "unicode": ["U+1F9C0"] },
    { "name": "meat", "unicode": ["U+1F356"] },
    { "name": "chicken", "unicode": ["U+1F357"] },
    { "name": "poultry", "unicode": ["U+1F357"] },
    { "name": "bacon", "unicode": ["U+1F953"] },
    { "name": "hamburger", "unicode": ["U+1F354"] },
    { "name": "burger", "unicode": ["U+1F354"] },
    { "name": "fries", "unicode": ["U+1F35F"] },
    { "name": "french fries", "unicode": ["U+1F35F"] },
    { "name": "pizza", "unicode": ["U+1F355"] },
    { "name": "hot dog", "unicode": ["U+1F32D"] },
    { "name": "hotdog", "unicode": ["U+1F32D"] },
    { "name": "taco", "unicode": ["U+1F32E"] },
    { "name": "burrito", "unicode": ["U+1F32F"] },
    { "name": "flatbread", "unicode": ["U+1F959"] },
    { "name": "pita", "unicode": ["U+1F959"] },
    { "name": "egg", "unicode": ["U+1F95A"] },
    { "name": "eggs", "unicode": ["U+1F95A"] },
    { "name": "cooking", "unicode": ["U+1F373"] },
    { "name": "fried egg", "unicode": ["U+1F373"] },
    { "name": "pan", "unicode": ["U+1F958"] },
    { "name": "paella", "unicode": ["U+1F958"] },
    { "name": "pot", "unicode": ["U+1F372"] },
    { "name": "stew", "unicode": ["U+1F372"] },
    { "name": "salad", "unicode": ["U+1F957"] },
    { "name": "green salad", "unicode": ["U+1F957"] },
    { "name": "popcorn", "unicode": ["U+1F37F"] },
    { "name": "bento", "unicode": ["U+1F371"] },
    { "name": "bento box", "unicode": ["U+1F371"] },
    { "name": "rice cracker", "unicode": ["U+1F358"] },
    { "name": "rice ball", "unicode": ["U+1F359"] },
    { "name": "onigiri", "unicode": ["U+1F359"] },
    { "name": "rice", "unicode": ["U+1F35A"] },
    { "name": "curry", "unicode": ["U+1F35B"] },
    { "name": "curry rice", "unicode": ["U+1F35B"] },
    { "name": "bowl", "unicode": ["U+1F35C"] },
    { "name": "ramen", "unicode": ["U+1F35C"] },
    { "name": "noodles", "unicode": ["U+1F35C"] },
    { "name": "pasta", "unicode": ["U+1F35D"] },
    { "name": "spaghetti", "unicode": ["U+1F35D"] },
    { "name": "sweet potato", "unicode": ["U+1F360"] },
    { "name": "oden", "unicode": ["U+1F362"] },
    { "name": "sushi", "unicode": ["U+1F363"] },
    { "name": "shrimp", "unicode": ["U+1F364"] },
    { "name": "prawn", "unicode": ["U+1F364"] },
    { "name": "fish cake", "unicode": ["U+1F365"] },
    { "name": "dango", "unicode": ["U+1F361"] },
    { "name": "ice cream soft", "unicode": ["U+1F366"] },
    { "name": "soft ice cream", "unicode": ["U+1F366"] },
    { "name": "shaved ice", "unicode": ["U+1F367"] },
    { "name": "ice cream", "unicode": ["U+1F368"] },
    { "name": "gelato", "unicode": ["U+1F368"] },
    { "name": "doughnut", "unicode": ["U+1F369"] },
    { "name": "donut", "unicode": ["U+1F369"] },
    { "name": "cookie", "unicode": ["U+1F36A"] },
    { "name": "cookies", "unicode": ["U+1F36A"] },
    { "name": "biscuit", "unicode": ["U+1F36A"] },
    { "name": "birthday cake", "unicode": ["U+1F382"] },
    { "name": "cake", "unicode": ["U+1F370"] },
    { "name": "shortcake", "unicode": ["U+1F370"] },
    { "name": "chocolate", "unicode": ["U+1F36B"] },
    { "name": "chocolate bar", "unicode": ["U+1F36B"] },
    { "name": "candy", "unicode": ["U+1F36C"] },
    { "name": "lollipop", "unicode": ["U+1F36D"] },
    { "name": "lolly", "unicode": ["U+1F36D"] },
    { "name": "custard", "unicode": ["U+1F36E"] },
    { "name": "pudding", "unicode": ["U+1F36E"] },
    { "name": "honey", "unicode": ["U+1F36F"] },
    { "name": "honey pot", "unicode": ["U+1F36F"] },
    { "name": "baby bottle", "unicode": ["U+1F37C"] },
    { "name": "bottle", "unicode": ["U+1F37C"] },
    { "name": "milk", "unicode": ["U+1F95B"] },
    { "name": "glass of milk", "unicode": ["U+1F95B"] },
    { "name": "coffee", "unicode": ["U+2615"] },
    { "name": "hot beverage", "unicode": ["U+2615"] },
    { "name": "tea", "unicode": ["U+1F375"] },
    { "name": "teacup", "unicode": ["U+1F375"] },
    { "name": "sake", "unicode": ["U+1F376"] },
    { "name": "champagne", "unicode": ["U+1F37E"] },
    { "name": "sparkling", "unicode": ["U+1F37E"] },
    { "name": "wine", "unicode": ["U+1F377"] },
    { "name": "wine glass", "unicode": ["U+1F377"] },
    { "name": "cocktail", "unicode": ["U+1F378"] },
    { "name": "martini", "unicode": ["U+1F378"] },
    { "name": "tropical drink", "unicode": ["U+1F379"] },
    { "name": "tropical", "unicode": ["U+1F379"] },
    { "name": "beer", "unicode": ["U+1F37A"] },
    { "name": "beer mug", "unicode": ["U+1F37A"] },
    { "name": "clinking beer", "unicode": ["U+1F37B"] },
    { "name": "beers", "unicode": ["U+1F37B"] },
    { "name": "clinking glasses", "unicode": ["U+1F942"] },
    { "name": "cheers", "unicode": ["U+1F942"] },
    { "name": "tumbler", "unicode": ["U+1F943"] },
    { "name": "whiskey", "unicode": ["U+1F943"] },
    { "name": "glass", "unicode": ["U+1F943"] },
    { "name": "plate", "unicode": ["U+1F37D"] },
    { "name": "fork knife", "unicode": ["U+1F374"] },
    { "name": "cutlery", "unicode": ["U+1F374"] },
    { "name": "spoon", "unicode": ["U+1F944"] },
    { "name": "knife", "unicode": ["U+1F52A"] },
    { "name": "kitchen knife", "unicode": ["U+1F52A"] },
    { "name": "amphora", "unicode": ["U+1F3FA"] },
    { "name": "jar", "unicode": ["U+1F3FA"] },
    // Additional food emojis that might be useful
    { "name": "olive", "unicode": ["U+1FAD2"] }, // 🫒 olive emoji
    { "name": "olives", "unicode": ["U+1FAD2"] },
    { "name": "garlic", "unicode": ["U+1F9C4"] }, // 🧄
    { "name": "onion", "unicode": ["U+1F9C5"] }, // 🧅
    { "name": "bell pepper", "unicode": ["U+1FAD1"] }, // 🫑
    { "name": "broccoli", "unicode": ["U+1F966"] }, // 🥦
    { "name": "leafy green", "unicode": ["U+1F96C"] }, // 🥬
    { "name": "blueberries", "unicode": ["U+1FAD0"] }, // 🫐
    { "name": "coconut", "unicode": ["U+1F965"] }, // 🥥
    { "name": "mango", "unicode": ["U+1F96D"] }, // 🥭
    { "name": "bagel", "unicode": ["U+1F96F"] }, // 🥯
    { "name": "pretzel", "unicode": ["U+1F968"] }, // 🥨
    { "name": "waffle", "unicode": ["U+1F9C7"] }, // 🧇
    { "name": "butter", "unicode": ["U+1F9C8"] }, // 🧈
    { "name": "salt", "unicode": ["U+1F9C2"] }, // 🧂
    { "name": "canned food", "unicode": ["U+1F96B"] }, // 🥫
    { "name": "can", "unicode": ["U+1F96B"] },
    { "name": "sandwich", "unicode": ["U+1F96A"] }, // 🥪
    { "name": "falafel", "unicode": ["U+1F9C6"] }, // 🧆
    { "name": "oyster", "unicode": ["U+1F9AA"] }, // 🦪
    { "name": "lobster", "unicode": ["U+1F99E"] }, // 🦞
    { "name": "crab", "unicode": ["U+1F980"] }, // 🦀
    { "name": "squid", "unicode": ["U+1F991"] }, // 🦑
    { "name": "mate", "unicode": ["U+1F9C9"] }, // 🧉
    { "name": "juice", "unicode": ["U+1F9C3"] }, // 🧃
    { "name": "bubble tea", "unicode": ["U+1F9CB"] }, // 🧋
    { "name": "boba", "unicode": ["U+1F9CB"] },
    { "name": "cupcake", "unicode": ["U+1F9C1"] }, // 🧁
    { "name": "pie", "unicode": ["U+1F967"] }, // 🥧
    { "name": "moon cake", "unicode": ["U+1F96E"] }, // 🥮
    { "name": "fortune cookie", "unicode": ["U+1F960"] }, // 🥠
    { "name": "takeout", "unicode": ["U+1F961"] }, // 🥡
    { "name": "chopsticks", "unicode": ["U+1F962"] }, // 🥢
    { "name": "dumpling", "unicode": ["U+1F95F"] }, // 🥟
    { "name": "fish", "unicode": ["U+1F41F"] }, // 🐟
    { "name": "crocodile", "unicode": ["U+1F40A"] }, // 🐊 (for exotic meats)
];

// Load current openmoji.json
const openmojiPath = path.join(__dirname, '..', 'assets', 'data', 'openmoji.json');
const currentData = JSON.parse(fs.readFileSync(openmojiPath, 'utf8'));

// Create a map with hexcode as key to avoid duplicates
const emojiMap = new Map();

// Add existing emojis
currentData.forEach(emoji => {
    emojiMap.set(emoji.hexcode, emoji);
});

// Add new emojis from EmojiHub
emojiHubData.forEach(emoji => {
    const hexcode = emoji.unicode[0].replace('U+', '');

    // Only add if not already present
    if (!emojiMap.has(hexcode)) {
        emojiMap.set(hexcode, {
            hexcode: hexcode,
            annotation: emoji.name,
            svg: `https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@latest/color/svg/${hexcode}.svg`
        });
    }
});

// Convert map back to array and save
const enrichedData = Array.from(emojiMap.values());

// Sort by hexcode for consistency
enrichedData.sort((a, b) => a.hexcode.localeCompare(b.hexcode));

fs.writeFileSync(openmojiPath, JSON.stringify(enrichedData, null, 2));

console.log(`✅ Enriched openmoji.json: ${currentData.length} → ${enrichedData.length} emojis`);
console.log(`✅ Added ${enrichedData.length - currentData.length} new food emojis`);
