
// ============================================================
// SECTION: Dark Mode Detection
// ============================================================
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    e.matches ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
});

// ============================================================
// SECTION: Configuration & Constants
// ============================================================
const STORAGE_KEY = 'osrs-ironman-tracker';

const CORS_PROXIES = [
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

const HISCORES_ENDPOINTS = {
    main: 'hiscore_oldschool',
    ironman: 'hiscore_oldschool_ironman',
    hardcore_ironman: 'hiscore_oldschool_hardcore_ironman',
    ultimate: 'hiscore_oldschool_ultimate',
    deadman: 'hiscore_oldschool_deadman'
};

// ============================================================
// SECTION: Skills Data (25 skills)
// ============================================================
const SKILLS = [
    { id: 'overall', name: 'Overall', icon: '\u{1F4CA}' },
    { id: 'attack', name: 'Attack', icon: '\u2694\uFE0F' },
    { id: 'defence', name: 'Defence', icon: '\u{1F6E1}\uFE0F' },
    { id: 'strength', name: 'Strength', icon: '\u{1F4AA}' },
    { id: 'hitpoints', name: 'Hitpoints', icon: '\u2764\uFE0F' },
    { id: 'ranged', name: 'Ranged', icon: '\u{1F3F9}' },
    { id: 'prayer', name: 'Prayer', icon: '\u2728' },
    { id: 'magic', name: 'Magic', icon: '\u{1F52E}' },
    { id: 'cooking', name: 'Cooking', icon: '\u{1F356}' },
    { id: 'woodcutting', name: 'Woodcutting', icon: '\u{1FA93}' },
    { id: 'fletching', name: 'Fletching', icon: '\u{1FAB6}' },
    { id: 'fishing', name: 'Fishing', icon: '\u{1F3A3}' },
    { id: 'firemaking', name: 'Firemaking', icon: '\u{1F525}' },
    { id: 'crafting', name: 'Crafting', icon: '\u2702\uFE0F' },
    { id: 'smithing', name: 'Smithing', icon: '\u{1F528}' },
    { id: 'mining', name: 'Mining', icon: '\u26CF\uFE0F' },
    { id: 'herblore', name: 'Herblore', icon: '\u{1F9EA}' },
    { id: 'agility', name: 'Agility', icon: '\u{1F3C3}' },
    { id: 'thieving', name: 'Thieving', icon: '\u{1F5DD}\uFE0F' },
    { id: 'slayer', name: 'Slayer', icon: '\u{1F480}' },
    { id: 'farming', name: 'Farming', icon: '\u{1F331}' },
    { id: 'runecraft', name: 'Runecraft', icon: '\u{1F535}' },
    { id: 'hunter', name: 'Hunter', icon: '\u{1F98C}' },
    { id: 'construction', name: 'Construction', icon: '\u{1F3E0}' },
    { id: 'sailing', name: 'Sailing', icon: '\u26F5' }
];

// Map skill names from JSON API to our IDs
const SKILL_NAME_MAP = {};
SKILLS.forEach(s => { SKILL_NAME_MAP[s.name.toLowerCase()] = s.id; });

// ============================================================
// SECTION: Bosses Data (69 bosses - updated 2025)
// ============================================================
const BOSSES = [
    'Abyssal Sire','Alchemical Hydra','Amoxliatl','Araxxor','Artio',
    'Barrows Chests','Bryophyta','Callisto',"Calvar'ion",'Cerberus',
    'Chambers of Xeric','Chambers of Xeric: Challenge Mode',
    'Chaos Elemental','Chaos Fanatic','Commander Zilyana',
    'Corporeal Beast','Crazy Archaeologist',
    'Dagannoth Prime','Dagannoth Rex','Dagannoth Supreme',
    'Deranged Archaeologist','Doom of Mokhaiotl','Duke Sucellus',
    'General Graardor','Giant Mole','Grotesque Guardians','Hespori',
    'Kalphite Queen','King Black Dragon','Kraken',
    "Kree'Arra","K'ril Tsutsaroth",'Lunar Chests','Mimic','Nex',
    'Nightmare',"Phosani's Nightmare",'Obor','Phantom Muspah',
    'Sarachnis','Scorpia','Scurrius','Shellbane Gryphon','Skotizo',
    'Sol Heredit','Spindel','Tempoross',
    'The Gauntlet','The Corrupted Gauntlet','The Hueycoatl',
    'The Leviathan','The Royal Titans','The Whisperer',
    'Theatre of Blood','Theatre of Blood: Hard Mode',
    'Thermonuclear Smoke Devil',
    'Tombs of Amascut','Tombs of Amascut: Expert Mode',
    'TzKal-Zuk','TzTok-Jad','Vardorvis','Venenatis',"Vet'ion",
    'Vorkath','Wintertodt','Yama','Zalcano','Zulrah'
];

const BOSS_NAME_SET = new Set(BOSSES.map(b => b.toLowerCase()));

// ============================================================
// SECTION: Item Mapping Cache (for images & IDs)
// ============================================================
const ITEM_MAPPING_CACHE_KEY = 'osrs-item-mapping';
const ITEM_MAPPING_EXPIRY = 24 * 60 * 60 * 1000;
let itemMapping = null;

async function loadItemMapping() {
    try {
        const cached = localStorage.getItem(ITEM_MAPPING_CACHE_KEY);
        if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < ITEM_MAPPING_EXPIRY) {
                itemMapping = parsed.items;
                return;
            }
        }
    } catch (e) {}
    try {
        const resp = await fetch('https://prices.runescape.wiki/api/v1/osrs/mapping');
        if (resp.ok) {
            const data = await resp.json();
            itemMapping = {};
            data.forEach(item => { itemMapping[item.name.toLowerCase()] = { id: item.id, name: item.name, icon: item.icon }; });
            try { localStorage.setItem(ITEM_MAPPING_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), items: itemMapping })); } catch (e) {}
        }
    } catch (e) { console.warn('Item mapping fetch failed:', e); }
}

function getItemImageUrl(itemName) {
    if (!itemMapping) return null;
    const entry = itemMapping[itemName.toLowerCase()];
    if (!entry) return null;
    return {
        primary: 'https://oldschool.runescape.wiki/images/' + encodeURIComponent(entry.icon.replace(/ /g, '_')) + '_detail.png',
        fallback: 'https://secure.runescape.com/m=itemdb_oldschool/obj_sprite.gif?id=' + entry.id
    };
}

function itemImgHTML(itemName, size) {
    size = size || 32;
    const urls = getItemImageUrl(itemName);
    if (!urls) return '<span style="font-size:' + (size * 0.6) + 'px">📦</span>';
    return '<img src="' + urls.primary + '" width="' + size + '" height="' + size + '" loading="lazy" alt="' + itemName + '" style="object-fit:contain" onerror="this.onerror=function(){this.outerHTML=\'<span style=font-size:' + (size * 0.6) + 'px>📦</span>\'};this.src=\'' + urls.fallback + '\'">';
}

// ============================================================
// SECTION: Item Upgrade Paths
// ============================================================
const ITEM_UPGRADE_PATHS = {
    'black mask': ['black mask (i)', 'slayer helmet', 'slayer helmet (i)'],
    'slayer helmet': ['slayer helmet (i)'],
    'dragon boots': ['primordial boots'],
    'ranger boots': ['pegasian boots'],
    'infinity boots': ['eternal boots'],
    'berserker ring': ['berserker ring (i)'],
    'archers ring': ['archers ring (i)'],
    'seers ring': ['seers ring (i)'],
    'dragon scimitar': ['abyssal whip'],
    'abyssal whip': ['blade of saeldor', "osmumten's fang", 'scythe of vitur'],
    'trident of the seas': ['trident of the swamp', 'sanguinesti staff'],
    'amulet of fury': ['amulet of torture', 'necklace of anguish', 'tormented bracelet'],
    'fire cape': ['infernal cape'],
    'saradomin cape': ['imbued saradomin cape'], 'zamorak cape': ['imbued zamorak cape'], 'guthix cape': ['imbued guthix cape'],
    "ava's accumulator": ["ava's assembler"], "ava's assembler": ["dizana's quiver"],
    'dragon defender': ['avernic defender'],
    'fighter torso': ['bandos chestplate', 'torva platebody'],
    'helm of neitiznot': ['neitiznot faceguard', 'torva full helm'],
    'rune crossbow': ['armadyl crossbow', 'dragon hunter crossbow', 'zaryte crossbow'],
    'dragon platelegs': ['bandos tassets', 'torva platelegs'],
    'magic shortbow': ['toxic blowpipe', 'bow of faerdhinen', 'twisted bow'],
};

function getAllUpgrades(itemName) {
    const n = itemName.toLowerCase();
    const direct = ITEM_UPGRADE_PATHS[n] || [];
    const all = [...direct];
    for (const u of direct) all.push(...getAllUpgrades(u));
    return [...new Set(all)];
}

// ============================================================
// SECTION: Skill Training Recommendations
// ============================================================
const SKILL_TRAINING_RECS = {
    attack: [{ target: 60, priority: 'high', reason: 'Dragon weapons' },{ target: 70, priority: 'high', reason: 'Whip requirement' },{ target: 75, priority: 'medium', reason: 'Godswords, Arclight' }],
    defence: [{ target: 40, priority: 'high', reason: 'Rune/god dhide armor' },{ target: 70, priority: 'high', reason: 'Barrows, GWD gear' }],
    strength: [{ target: 60, priority: 'high', reason: 'Better max hits' },{ target: 80, priority: 'medium', reason: 'Bossing DPS' },{ target: 99, priority: 'low', reason: 'Max melee hit' }],
    hitpoints: [{ target: 70, priority: 'medium', reason: 'Boss survivability' }],
    ranged: [{ target: 61, priority: 'high', reason: 'Rune crossbow' },{ target: 75, priority: 'high', reason: 'Blowpipe, broad bolts' },{ target: 80, priority: 'medium', reason: 'Armadyl crossbow' }],
    prayer: [{ target: 43, priority: 'high', reason: 'Protection prayers - essential PvM' },{ target: 70, priority: 'high', reason: 'Piety - huge melee DPS boost' },{ target: 77, priority: 'medium', reason: 'Rigour & Augury (need scrolls)' }],
    magic: [{ target: 55, priority: 'high', reason: 'High Alchemy for gold' },{ target: 75, priority: 'high', reason: 'Fire Wave, Trident use' },{ target: 94, priority: 'medium', reason: 'Ice Barrage for slayer & PvM' }],
    cooking: [{ target: 70, priority: 'medium', reason: 'Sharks, RFD requirement' }],
    woodcutting: [{ target: 60, priority: 'low', reason: 'Yew logs for fletching' }],
    fletching: [{ target: 55, priority: 'medium', reason: 'Broad bolts unlocked' },{ target: 77, priority: 'low', reason: 'Broad arrows' }],
    fishing: [{ target: 62, priority: 'medium', reason: 'Monkfish for food supply' },{ target: 82, priority: 'low', reason: 'Anglerfish for bossing' }],
    firemaking: [{ target: 50, priority: 'high', reason: 'Wintertodt (best done with low HP)' }],
    crafting: [{ target: 75, priority: 'high', reason: 'Slayer rings' },{ target: 89, priority: 'medium', reason: 'Zenyte jewelry crafting' }],
    smithing: [{ target: 40, priority: 'medium', reason: 'Gold jewelry, quest reqs' },{ target: 85, priority: 'low', reason: 'Rune items' }],
    mining: [{ target: 60, priority: 'medium', reason: 'Blast Mine efficiency' },{ target: 85, priority: 'low', reason: 'Runite ore' }],
    herblore: [{ target: 45, priority: 'high', reason: 'Super attack potions' },{ target: 78, priority: 'high', reason: 'Super combats, antivenoms' },{ target: 90, priority: 'medium', reason: 'Anti-venom+, divine potions' }],
    agility: [{ target: 51, priority: 'high', reason: 'Key shortcuts unlocked' },{ target: 70, priority: 'high', reason: 'GWD, Cerberus, farm run shortcuts' },{ target: 77, priority: 'medium', reason: 'Seers rooftop (best marks/hr)' }],
    thieving: [{ target: 38, priority: 'high', reason: 'Master Farmers for herb seeds' },{ target: 55, priority: 'medium', reason: 'Ardy Knights (efficient XP)' }],
    slayer: [{ target: 58, priority: 'high', reason: 'Cave Horrors - black mask' },{ target: 72, priority: 'high', reason: 'Wyverns, resources' },{ target: 85, priority: 'high', reason: 'Abyssal Demons - whip' },{ target: 87, priority: 'high', reason: 'Kraken - trident' },{ target: 91, priority: 'medium', reason: 'Cerberus - boot crystals' },{ target: 95, priority: 'medium', reason: 'Hydra - claw, leather, ring' }],
    farming: [{ target: 32, priority: 'high', reason: 'Ranarr for prayer pots' },{ target: 62, priority: 'medium', reason: 'Snapdragon for restores' }],
    runecraft: [{ target: 44, priority: 'medium', reason: 'Nature runes for alching' },{ target: 77, priority: 'low', reason: 'Blood runes' }],
    hunter: [{ target: 63, priority: 'medium', reason: 'Red chinchompas' },{ target: 73, priority: 'low', reason: 'Black chinchompas' }],
    construction: [{ target: 50, priority: 'high', reason: 'Portal chamber, mounted glory' },{ target: 83, priority: 'high', reason: 'Rejuvenation pool (with boosts)' },{ target: 90, priority: 'medium', reason: 'Ornate pool, max jewelry box' }],
    sailing: [],
};

function getSkillRec(skillId, level) {
    const recs = SKILL_TRAINING_RECS[skillId];
    if (!recs) return null;
    for (const r of recs) { if (level < r.target) return r; }
    return null;
}

// ============================================================
// SECTION: BIS Gear Data
// ============================================================
const BIS_GEAR = {
    melee: {
        name: 'Melee', icon: '\u2694\uFE0F',
        items: [
            { slot: 'Head', name: 'Torva Full Helm', aliases: ['torva full helm'] },
            { slot: 'Cape', name: 'Infernal Cape', aliases: ['infernal cape'] },
            { slot: 'Amulet', name: 'Amulet of Rancour', aliases: ['amulet of rancour'] },
            { slot: 'Body', name: 'Torva Platebody', aliases: ['torva platebody'] },
            { slot: 'Legs', name: 'Torva Platelegs', aliases: ['torva platelegs'] },
            { slot: 'Gloves', name: 'Ferocious Gloves', aliases: ['ferocious gloves'] },
            { slot: 'Boots', name: 'Primordial Boots', aliases: ['primordial boots'] },
            { slot: 'Ring', name: 'Ultor Ring', aliases: ['ultor ring'] },
            { slot: 'Weapon', name: 'Scythe of Vitur', aliases: ['scythe of vitur'] },
            { slot: 'Weapon', name: "Osmumten's Fang", aliases: ["osmumten's fang"] },
            { slot: 'Shield', name: 'Avernic Defender', aliases: ['avernic defender'] },
            { slot: 'Spec', name: 'Soulreaper Axe', aliases: ['soulreaper axe'] }
        ]
    },
    ranged: {
        name: 'Ranged', icon: '\u{1F3F9}',
        items: [
            { slot: 'Head', name: 'Masori Mask (f)', aliases: ['masori mask (f)', 'masori mask'] },
            { slot: 'Cape', name: "Dizana's Quiver", aliases: ["dizana's quiver"] },
            { slot: 'Amulet', name: 'Necklace of Anguish', aliases: ['necklace of anguish'] },
            { slot: 'Body', name: 'Masori Body (f)', aliases: ['masori body (f)', 'masori body'] },
            { slot: 'Legs', name: 'Masori Chaps (f)', aliases: ['masori chaps (f)', 'masori chaps'] },
            { slot: 'Gloves', name: 'Zaryte Vambraces', aliases: ['zaryte vambraces'] },
            { slot: 'Boots', name: 'Pegasian Boots', aliases: ['pegasian boots'] },
            { slot: 'Ring', name: 'Venator Ring', aliases: ['venator ring'] },
            { slot: 'Weapon', name: 'Twisted Bow', aliases: ['twisted bow'] },
            { slot: 'Weapon', name: 'Bow of Faerdhinen', aliases: ['bow of faerdhinen'] },
            { slot: 'Weapon', name: 'Toxic Blowpipe', aliases: ['toxic blowpipe'] },
            { slot: 'Ammo', name: 'Dragon Arrows', aliases: ['dragon arrow', 'dragon arrows'] }
        ]
    },
    magic: {
        name: 'Magic', icon: '\u{1F52E}',
        items: [
            { slot: 'Head', name: 'Ancestral Hat', aliases: ['ancestral hat'] },
            { slot: 'Cape', name: 'Imbued God Cape', aliases: ['imbued saradomin cape', 'imbued zamorak cape', 'imbued guthix cape'] },
            { slot: 'Amulet', name: 'Occult Necklace', aliases: ['occult necklace'] },
            { slot: 'Body', name: 'Ancestral Robe Top', aliases: ['ancestral robe top'] },
            { slot: 'Legs', name: 'Ancestral Robe Bottom', aliases: ['ancestral robe bottom'] },
            { slot: 'Gloves', name: 'Tormented Bracelet', aliases: ['tormented bracelet'] },
            { slot: 'Boots', name: 'Eternal Boots', aliases: ['eternal boots'] },
            { slot: 'Ring', name: 'Magus Ring', aliases: ['magus ring'] },
            { slot: 'Weapon', name: "Tumeken's Shadow", aliases: ["tumeken's shadow"] },
            { slot: 'Weapon', name: 'Sanguinesti Staff', aliases: ['sanguinesti staff'] },
            { slot: 'Shield', name: "Elidinis' Ward (f)", aliases: ["elidinis' ward (f)", "elidinis' ward"] },
            { slot: 'Weapon', name: 'Harmonised Nightmare Staff', aliases: ['harmonised nightmare staff'] }
        ]
    }
};

// ============================================================
// SECTION: Boss Metadata (all 69 bosses)
// ============================================================
const BOSS_METADATA = {
'Abyssal Sire':{cat:'should_chase',combat:85,slayer:85,desc:'Slayer boss - Bludgeon & Unsired',drops:['Abyssal bludgeon','Abyssal dagger'],priority:'medium'},
'Alchemical Hydra':{cat:'should_chase',combat:95,slayer:95,desc:'Top slayer boss - claw, leather, ring',drops:['Hydra claw','Hydra leather'],priority:'high'},
'Amoxliatl':{cat:'not_worth',combat:90,slayer:0,desc:'Newer boss - niche drops',drops:['Unique drops'],priority:'low'},
'Araxxor':{cat:'should_chase',combat:100,slayer:0,desc:'Spider boss - Noxious halberd',drops:['Noxious halberd'],priority:'medium'},
'Artio':{cat:'not_worth',combat:80,slayer:0,desc:'Wilderness bear - safer Callisto',drops:['Dragon pickaxe','Tyrannical ring'],priority:'low'},
'Barrows Chests':{cat:'should_chase',combat:70,slayer:0,desc:'Essential early-mid armor sets',drops:['Barrows armor sets'],priority:'high'},
'Bryophyta':{cat:'skip',combat:40,slayer:0,desc:'F2P boss - essence drop only',drops:["Bryophyta's essence"],priority:'skip'},
'Callisto':{cat:'not_worth',combat:85,slayer:0,desc:'Wildy boss - risky for ironman',drops:['Dragon pickaxe','Tyrannical ring'],priority:'low'},
"Calvar'ion":{cat:'not_worth',combat:85,slayer:0,desc:'Safer Vet\'ion - ring of the gods',drops:['Ring of the gods'],priority:'low'},
'Cerberus':{cat:'should_chase',combat:91,slayer:91,desc:'Boot crystals - BIS boots for all styles',drops:['Primordial crystal','Pegasian crystal','Eternal crystal'],priority:'high'},
'Chambers of Xeric':{cat:'should_chase',combat:100,slayer:0,desc:'Top raid - Tbow, prayers, Kodai',drops:['Twisted bow','Dragon claws','Kodai insignia','Dexterous prayer scroll'],priority:'high'},
'Chambers of Xeric: Challenge Mode':{cat:'not_worth',combat:115,slayer:0,desc:'CM CoX - cosmetics & dust',drops:['Metamorphic dust'],priority:'low'},
'Chaos Elemental':{cat:'skip',combat:80,slayer:0,desc:'Wildy boss - dragon pickaxe',drops:['Dragon pickaxe'],priority:'skip'},
'Chaos Fanatic':{cat:'skip',combat:70,slayer:0,desc:'Easy wildy boss - odium/malediction',drops:['Odium shard','Malediction shard'],priority:'skip'},
'Commander Zilyana':{cat:'should_chase',combat:90,slayer:0,desc:'Sara GWD - ACB, Sara sword, hilt',drops:['Armadyl crossbow','Saradomin hilt'],priority:'medium'},
'Corporeal Beast':{cat:'not_worth',combat:100,slayer:0,desc:'Extremely long grind for spectral/ely',drops:['Spectral spirit shield','Elysian spirit shield'],priority:'low'},
'Crazy Archaeologist':{cat:'skip',combat:60,slayer:0,desc:'Easy wildy boss - odium/malediction',drops:['Odium shard'],priority:'skip'},
'Dagannoth Prime':{cat:'should_chase',combat:85,slayer:0,desc:'DK - Seers ring, Archers ring',drops:['Seers ring'],priority:'medium'},
'Dagannoth Rex':{cat:'should_chase',combat:85,slayer:0,desc:'DK - Berserker ring, Warrior ring',drops:['Berserker ring','Dragon axe'],priority:'medium'},
'Dagannoth Supreme':{cat:'should_chase',combat:85,slayer:0,desc:'DK - Archers ring',drops:['Archers ring'],priority:'medium'},
'Deranged Archaeologist':{cat:'skip',combat:60,slayer:0,desc:'Fossil Island - not worth it',drops:['Nothing notable'],priority:'skip'},
'Doom of Mokhaiotl':{cat:'not_worth',combat:95,slayer:0,desc:'Newer boss',drops:['Unique drops'],priority:'low'},
'Duke Sucellus':{cat:'should_chase',combat:100,slayer:0,desc:'DT2 boss - Magus ring component',drops:['Magus vestige','Chromium ingot','Eye of the duke'],priority:'medium'},
'General Graardor':{cat:'should_chase',combat:90,slayer:0,desc:'Bandos GWD - BCP, Tassets',drops:['Bandos chestplate','Bandos tassets'],priority:'high'},
'Giant Mole':{cat:'not_worth',combat:70,slayer:0,desc:'Easy boss for bird nests/hides',drops:['Mole claw','Mole skin'],priority:'low'},
'Grotesque Guardians':{cat:'not_worth',combat:80,slayer:75,desc:'Gargoyle boss - granite items',drops:['Granite gloves','Black tourmaline core'],priority:'low'},
'Hespori':{cat:'should_chase',combat:60,slayer:0,desc:'Farming boss - bucket, seed table',drops:['Bottomless compost bucket','Iasor seed'],priority:'medium'},
'Kalphite Queen':{cat:'not_worth',combat:85,slayer:0,desc:'Desert boss - KQ head for diary',drops:['Dragon chainbody','KQ head'],priority:'low'},
'King Black Dragon':{cat:'not_worth',combat:80,slayer:0,desc:'Easy dragon boss - visage',drops:['Draconic visage','Dragon pickaxe'],priority:'low'},
'Kraken':{cat:'should_chase',combat:87,slayer:87,desc:'Slayer boss - trident & tentacle',drops:['Trident of the seas','Kraken tentacle'],priority:'high'},
"Kree'Arra":{cat:'should_chase',combat:90,slayer:0,desc:'Arma GWD - BIS ranged armor',drops:['Armadyl chestplate','Armadyl chainskirt','Armadyl helmet'],priority:'high'},
"K'ril Tsutsaroth":{cat:'should_chase',combat:90,slayer:0,desc:'Zammy GWD - staff, spear',drops:['Zamorakian spear','Staff of the dead'],priority:'medium'},
'Lunar Chests':{cat:'not_worth',combat:80,slayer:0,desc:'Newer content',drops:['Unique drops'],priority:'low'},
'Mimic':{cat:'skip',combat:80,slayer:0,desc:'Rare clue encounter - 3rd age',drops:['3rd age items'],priority:'skip'},
'Nex':{cat:'should_chase',combat:110,slayer:0,desc:'Torva armor - BIS melee',drops:['Torva full helm','Torva platebody','Torva platelegs','Zaryte vambraces'],priority:'high'},
'Nightmare':{cat:'not_worth',combat:100,slayer:0,desc:'Group boss - nightmare staves, orbs',drops:['Nightmare staff','Eldritch orb','Harmonised orb','Inquisitor armor'],priority:'low'},
"Phosani's Nightmare":{cat:'not_worth',combat:105,slayer:0,desc:'Solo Nightmare - same drops',drops:['Nightmare staff','Inquisitor armor'],priority:'low'},
'Obor':{cat:'skip',combat:30,slayer:0,desc:'F2P hill giant boss',drops:['Hill giant club'],priority:'skip'},
'Phantom Muspah':{cat:'should_chase',combat:90,slayer:0,desc:'DT2 quest boss - ancient essence',drops:['Ancient essence','Saturated heart','Venator shard'],priority:'medium'},
'Sarachnis':{cat:'not_worth',combat:75,slayer:0,desc:'Spider boss - cudgel',drops:['Sarachnis cudgel'],priority:'low'},
'Scorpia':{cat:'skip',combat:80,slayer:0,desc:'Wildy scorpion - odium/malediction',drops:['Odium shard'],priority:'skip'},
'Scurrius':{cat:'skip',combat:40,slayer:0,desc:'Beginner boss',drops:['Scurry'],priority:'skip'},
'Shellbane Gryphon':{cat:'not_worth',combat:90,slayer:0,desc:'Newer boss',drops:['Unique drops'],priority:'low'},
'Skotizo':{cat:'should_chase',combat:80,slayer:0,desc:'Uses totem - dark claw, shard',drops:['Dark claw','Uncut onyx'],priority:'medium'},
'Sol Heredit':{cat:'not_worth',combat:115,slayer:0,desc:'Colosseum final boss - dizana quiver',drops:["Dizana's quiver","Sunfire splinters"],priority:'medium'},
'Spindel':{cat:'not_worth',combat:80,slayer:0,desc:'Safer Venenatis - treasonous ring',drops:['Treasonous ring'],priority:'low'},
'Tempoross':{cat:'should_chase',combat:1,slayer:0,desc:'Fishing boss - dragon harpoon, supplies',drops:['Dragon harpoon','Fish barrel','Tackle box'],priority:'medium'},
'The Gauntlet':{cat:'should_chase',combat:85,slayer:0,desc:'Practice for Corrupted - crystal shards',drops:['Crystal armor seed','Crystal weapon seed'],priority:'medium'},
'The Corrupted Gauntlet':{cat:'should_chase',combat:90,slayer:0,desc:'Best mid-game grind - Bowfa!',drops:['Enhanced crystal weapon seed','Crystal armor seed'],priority:'high'},
'The Hueycoatl':{cat:'not_worth',combat:90,slayer:0,desc:'Newer boss',drops:['Unique drops'],priority:'low'},
'The Leviathan':{cat:'should_chase',combat:100,slayer:0,desc:'DT2 boss - Venator ring component',drops:['Venator vestige','Chromium ingot','Leviathan fang'],priority:'medium'},
'The Royal Titans':{cat:'not_worth',combat:95,slayer:0,desc:'Newer boss',drops:['Unique drops'],priority:'low'},
'The Whisperer':{cat:'should_chase',combat:100,slayer:0,desc:'DT2 boss - Bellator ring component',drops:['Bellator vestige','Chromium ingot','Silence piece'],priority:'medium'},
'Theatre of Blood':{cat:'should_chase',combat:105,slayer:0,desc:'Top raid - Scythe, Rapier, Sang',drops:['Scythe of vitur','Ghrazi rapier','Sanguinesti staff','Avernic defender hilt'],priority:'high'},
'Theatre of Blood: Hard Mode':{cat:'not_worth',combat:115,slayer:0,desc:'HM ToB - cosmetics only',drops:['Cosmetic items'],priority:'low'},
'Thermonuclear Smoke Devil':{cat:'should_chase',combat:93,slayer:93,desc:'Slayer boss - occult necklace',drops:['Occult necklace','Smoke battlestaff'],priority:'medium'},
'Tombs of Amascut':{cat:'should_chase',combat:100,slayer:0,desc:'Scalable raid - Fang, Shadow, Masori',drops:["Osmumten's fang","Tumeken's shadow",'Masori armor',"Elidinis' ward"],priority:'high'},
'Tombs of Amascut: Expert Mode':{cat:'not_worth',combat:115,slayer:0,desc:'Expert ToA - cosmetics',drops:['Cosmetic items'],priority:'low'},
'TzKal-Zuk':{cat:'not_worth',combat:115,slayer:0,desc:'The Inferno - Infernal cape',drops:['Infernal cape'],priority:'medium'},
'TzTok-Jad':{cat:'should_chase',combat:75,slayer:0,desc:'Fight Caves - Fire cape essential',drops:['Fire cape'],priority:'high'},
'Vardorvis':{cat:'should_chase',combat:100,slayer:0,desc:'DT2 boss - Ultor ring component',drops:['Ultor vestige','Chromium ingot','Executioner axe head'],priority:'medium'},
'Venenatis':{cat:'not_worth',combat:85,slayer:0,desc:'Wildy boss - treasonous ring',drops:['Treasonous ring','Dragon pickaxe'],priority:'low'},
"Vet'ion":{cat:'not_worth',combat:85,slayer:0,desc:'Wildy boss - ring of the gods',drops:['Ring of the gods','Dragon pickaxe'],priority:'low'},
'Vorkath':{cat:'should_chase',combat:90,slayer:0,desc:'Post-DS2 - assembler, money maker',drops:["Vorkath's head","Ava's assembler",'Dragonbone necklace'],priority:'high'},
'Wintertodt':{cat:'should_chase',combat:1,slayer:0,desc:'Firemaking boss - best done early',drops:['Tome of fire','Warm gloves','Pyromancer outfit'],priority:'high'},
'Yama':{cat:'not_worth',combat:90,slayer:0,desc:'Newer boss',drops:['Unique drops'],priority:'low'},
'Zalcano':{cat:'should_chase',combat:80,slayer:0,desc:'Mining/RC boss - crystal tool seed',drops:['Crystal tool seed','Zalcano shard'],priority:'medium'},
'Zulrah':{cat:'should_chase',combat:85,slayer:0,desc:'Essential - blowpipe, magic fang, serp',drops:['Toxic blowpipe','Magic fang','Serpentine visage','Tanzanite fang'],priority:'high'},
};

function getBossStatus(bossName) {
    const meta = BOSS_METADATA[bossName];
    if (!meta) return { status: 'unknown', label: '?', cssClass: '' };
    const skills = state.currentPlayer?.data?.skills || {};
    const combat = calculateCombat(skills);
    const slayerLvl = skills.slayer?.level || 1;
    if (meta.slayer > 0 && slayerLvl < meta.slayer) return { status: 'not_ready', label: 'Need ' + meta.slayer + ' Slay', cssClass: 'not-worth' };
    if (combat < meta.combat - 15) return { status: 'not_ready', label: 'Low Combat', cssClass: 'not-worth' };
    if (meta.cat === 'skip') return { status: 'skip', label: 'Skip', cssClass: 'skip' };
    if (meta.cat === 'not_worth') return { status: 'not_worth', label: 'Low Priority', cssClass: 'not-worth' };
    if (meta.cat === 'should_chase') return { status: 'should_chase', label: 'Chase', cssClass: 'should-chase' };
    return { status: 'ready', label: 'Ready', cssClass: 'ready' };
}

// ============================================================
// SECTION: Item Difficulty Ratings
// ============================================================
const ITEM_DIFFICULTY = {
'torva full helm':{d:'endgame',s:'Nex'},'infernal cape':{d:'endgame',s:'The Inferno'},'amulet of rancour':{d:'endgame',s:'Colosseum'},
'torva platebody':{d:'endgame',s:'Nex'},'torva platelegs':{d:'endgame',s:'Nex'},'ferocious gloves':{d:'hard',s:'Hydra (95 slay)'},
'primordial boots':{d:'hard',s:'Cerberus (91 slay)'},'ultor ring':{d:'endgame',s:'DT2 Vardorvis'},'scythe of vitur':{d:'endgame',s:'Theatre of Blood'},
"osmumten's fang":{d:'endgame',s:'Tombs of Amascut'},'avernic defender':{d:'endgame',s:'Theatre of Blood'},'soulreaper axe':{d:'endgame',s:'Leviathan DT2'},
'masori mask (f)':{d:'endgame',s:'Tombs of Amascut'},"dizana's quiver":{d:'endgame',s:'Colosseum'},'necklace of anguish':{d:'hard',s:'Zenyte + 89 Craft'},
'masori body (f)':{d:'endgame',s:'Tombs of Amascut'},'masori chaps (f)':{d:'endgame',s:'Tombs of Amascut'},'zaryte vambraces':{d:'endgame',s:'Nex'},
'pegasian boots':{d:'hard',s:'Cerberus (91 slay)'},'venator ring':{d:'endgame',s:'DT2 Leviathan'},'twisted bow':{d:'endgame',s:'Chambers of Xeric'},
'bow of faerdhinen':{d:'hard',s:'Corrupted Gauntlet'},'toxic blowpipe':{d:'medium',s:'Zulrah'},'ancestral hat':{d:'endgame',s:'Chambers of Xeric'},
'imbued saradomin cape':{d:'medium',s:'Mage Arena II'},'imbued zamorak cape':{d:'medium',s:'Mage Arena II'},'imbued guthix cape':{d:'medium',s:'Mage Arena II'},
'occult necklace':{d:'medium',s:'Smoke Devils (93 slay)'},'ancestral robe top':{d:'endgame',s:'Chambers of Xeric'},'ancestral robe bottom':{d:'endgame',s:'Chambers of Xeric'},
'tormented bracelet':{d:'hard',s:'Zenyte + 89 Craft'},'eternal boots':{d:'hard',s:'Cerberus (91 slay)'},'magus ring':{d:'endgame',s:'DT2 Duke'},
"tumeken's shadow":{d:'endgame',s:'Tombs of Amascut'},'sanguinesti staff':{d:'endgame',s:'Theatre of Blood'},
"elidinis' ward (f)":{d:'endgame',s:'Tombs of Amascut'},'harmonised nightmare staff':{d:'endgame',s:'Nightmare'},
'fire cape':{d:'medium',s:'Fight Caves'},'fighter torso':{d:'easy',s:'Barbarian Assault'},'dragon boots':{d:'easy',s:'Spiritual Mages'},
'barrows gloves':{d:'medium',s:'Recipe for Disaster'},'amulet of torture':{d:'hard',s:'Zenyte + 89 Craft'},'amulet of fury':{d:'medium',s:'Crafting'},
'bandos chestplate':{d:'hard',s:'General Graardor'},'bandos tassets':{d:'hard',s:'General Graardor'},'dragon defender':{d:'easy',s:'Warriors Guild'},
'abyssal whip':{d:'medium',s:'Abyssal Demons (85 slay)'},'trident of the swamp':{d:'medium',s:'Kraken (87 slay)'},
'armadyl chestplate':{d:'hard',s:"Kree'Arra"},'armadyl chainskirt':{d:'hard',s:"Kree'Arra"},
'berserker ring (i)':{d:'medium',s:'Dagannoth Rex + NMZ'},'dragon warhammer':{d:'hard',s:'Shamans (long grind)'},
};
const DIFF_ORDER = {easy:0,medium:1,hard:2,endgame:3};

// ============================================================
// SECTION: General Purpose Style Loadouts
// ============================================================
const STYLE_LOADOUTS = [
{id:'melee_train',name:'Melee Training',icon:'\u2694\uFE0F',category:'general',style:'melee',
usedFor:['General melee training','NMZ','Monster killing'],
bossTips:'Core setup for Bandos, Vardorvis, melee slayer. Swap in slayer helm for tasks.',
gear:{head:['Torva full helm','Neitiznot faceguard','Helm of neitiznot','Berserker helm'],cape:['Infernal cape','Fire cape','Mythical cape'],amulet:['Amulet of torture','Amulet of fury','Amulet of glory'],body:['Torva platebody','Bandos chestplate','Fighter torso','Obsidian platebody'],legs:['Torva platelegs','Bandos tassets','Obsidian platelegs','Dragon platelegs'],gloves:['Ferocious gloves','Barrows gloves','Dragon gloves','Rune gloves'],boots:['Primordial boots','Dragon boots','Rune boots'],ring:['Ultor ring','Berserker ring (i)','Berserker ring','Brimstone ring'],weapon:['Scythe of vitur',"Osmumten's fang",'Blade of saeldor','Abyssal whip','Dragon scimitar'],shield:['Avernic defender','Dragon defender','Rune defender']}},
{id:'range_train',name:'Ranged Training',icon:'\u{1F3F9}',category:'general',style:'ranged',
usedFor:['Ranged training','Safe-spotting','Chinning'],
bossTips:'Use for Zilyana, Kree\'arra, Hydra, Vorkath. Tbow/Bowfa swap for different bosses.',
gear:{head:['Masori mask (f)','Armadyl helmet','Blessed coif','Void ranger helm'],cape:["Dizana's quiver","Ava's assembler","Ava's accumulator"],amulet:['Necklace of anguish','Amulet of fury','Amulet of glory'],body:['Masori body (f)','Armadyl chestplate',"Blessed d'hide body","Black d'hide body"],legs:['Masori chaps (f)','Armadyl chainskirt',"Blessed d'hide chaps"],gloves:['Zaryte vambraces','Barrows gloves','Void gloves'],boots:['Pegasian boots',"Blessed d'hide boots"],ring:['Venator ring','Archers ring (i)','Archers ring'],weapon:['Twisted bow','Bow of faerdhinen','Toxic blowpipe','Magic shortbow (i)','Rune crossbow'],shield:['Twisted buckler','Dragonfire ward','Book of law']}},
{id:'magic_burst',name:'Magic Bursting/Barraging',icon:'\u{1F52E}',category:'general',style:'magic',
usedFor:['Burst/barrage slayer','Magic training','Multi-target'],
bossTips:'Essential for Dust Devils, Nechryaels, Smoke Devils in Catacombs. Also used at Kraken, Zulrah.',
gear:{head:['Ancestral hat',"Ahrim's hood",'Mystic hat'],cape:['Imbued god cape','God cape','Magic cape'],amulet:['Occult necklace','Amulet of fury','Amulet of glory'],body:['Ancestral robe top',"Ahrim's robetop",'Mystic robe top','Proselyte hauberk'],legs:['Ancestral robe bottom',"Ahrim's robeskirt",'Mystic robe bottom','Proselyte cuisse'],gloves:['Tormented bracelet','Barrows gloves'],boots:['Eternal boots','Mystic boots'],ring:['Magus ring','Seers ring (i)','Seers ring'],weapon:['Kodai wand',"Tumeken's shadow",'Master wand','Ancient staff','Trident of the swamp'],shield:["Elidinis' ward (f)",'Arcane spirit shield','Book of darkness']}},
{id:'prayer_afk',name:'Prayer / AFK Melee',icon:'\u2728',category:'general',style:'melee',
usedFor:['AFK melee with protection prayers','Catacombs training','Prayer preservation'],
bossTips:'Used in Catacombs for blood shard farming. Proselyte saves prayer. Use for tasks like Hellhounds, Bloodvelds.',
gear:{head:['Slayer helmet (i)','Proselyte sallet'],cape:['Fire cape','Ardougne cloak 4'],amulet:['Amulet of fury','Holy symbol'],body:['Proselyte hauberk','Monk robe top'],legs:['Proselyte cuisse','Monk robe bottom'],gloves:['Barrows gloves'],boots:['Dragon boots','Climbing boots'],ring:['Berserker ring (i)','Ring of the gods'],weapon:['Abyssal whip','Dragon scimitar'],shield:['Dragon defender']}},
{id:'slayer_melee',name:'Slayer Melee',icon:'\u{1F480}',category:'slayer',style:'melee',
usedFor:['Melee slayer tasks','Abyssal Demons','Gargoyles','Greater Demons'],
bossTips:'Slayer helm is mandatory for on-task DPS bonus. Use Arclight vs demons. Cerberus, Sire, Grotesque Guardians.',
gear:{head:['Slayer helmet (i)'],cape:['Infernal cape','Fire cape'],amulet:['Amulet of torture','Amulet of fury'],body:['Bandos chestplate','Fighter torso','Proselyte hauberk'],legs:['Bandos tassets','Proselyte cuisse'],gloves:['Ferocious gloves','Barrows gloves'],boots:['Primordial boots','Dragon boots'],ring:['Ultor ring','Berserker ring (i)'],weapon:["Osmumten's fang",'Abyssal whip','Arclight','Dragon scimitar'],shield:['Avernic defender','Dragon defender']}},
{id:'slayer_range',name:'Slayer Ranged',icon:'\u{1F3AF}',category:'slayer',style:'ranged',
usedFor:['Ranged slayer tasks','Hydra','Vorkath on task'],
bossTips:'Essential for Hydra (95 slay). DHL/DHCB for dragons. Bowfa works everywhere.',
gear:{head:['Slayer helmet (i)'],cape:["Dizana's quiver","Ava's assembler"],amulet:['Necklace of anguish','Amulet of fury'],body:['Masori body (f)','Armadyl chestplate',"Blessed d'hide body"],legs:['Masori chaps (f)','Armadyl chainskirt'],gloves:['Zaryte vambraces','Barrows gloves'],boots:['Pegasian boots'],ring:['Venator ring','Archers ring (i)'],weapon:['Twisted bow','Bow of faerdhinen','Toxic blowpipe','Dragon hunter crossbow','Rune crossbow'],shield:['Twisted buckler']}},
{id:'slayer_magic',name:'Slayer Magic / Burst',icon:'\u{1F4A5}',category:'slayer',style:'magic',
usedFor:['Burst/barrage tasks (Dust Devils, Nechs, Smoke Devils)','Kraken'],
bossTips:'Catacombs multi-combat for barrage efficiency. Also used at Kraken (87 slay), Thermonuclear Smoke Devil (93 slay).',
gear:{head:['Slayer helmet (i)'],cape:['Imbued god cape'],amulet:['Occult necklace','Amulet of fury'],body:['Ancestral robe top','Proselyte hauberk'],legs:['Ancestral robe bottom','Proselyte cuisse'],gloves:['Tormented bracelet','Barrows gloves'],boots:['Eternal boots'],ring:['Magus ring','Seers ring (i)'],weapon:['Kodai wand','Master wand','Ancient staff','Trident of the swamp'],shield:["Elidinis' ward (f)",'Book of darkness']}},
{id:'tank_def',name:'Tank / Defensive',icon:'\u{1F6E1}\uFE0F',category:'bossing',style:'melee',
usedFor:['GWD tanking','Learning new bosses','High-damage situations'],
bossTips:'Used when learning GWD, Corp tanking, or any fight where survival matters more than DPS.',
gear:{head:['Justiciar faceguard','Torag helm','Verac helm'],cape:['Infernal cape','Fire cape'],amulet:['Amulet of fury','Amulet of defence'],body:['Justiciar chestguard','Torag platebody','Bandos chestplate'],legs:['Justiciar legguards','Torag platelegs','Bandos tassets'],gloves:['Barrows gloves'],boots:['Primordial boots','Dragon boots'],ring:['Ring of suffering (i)','Berserker ring (i)'],weapon:['Abyssal whip','Dragon scimitar'],shield:['Elysian spirit shield','Dragon defender','Crystal shield']}},
{id:'hybrid',name:'Hybrid / Switches',icon:'\u{1F500}',category:'bossing',style:'hybrid',
usedFor:['Raids','Zulrah','Multi-style bosses'],
bossTips:'Core for CoX, ToB, ToA. Zulrah requires mage+range switches. Practice with fewer switches first.',
gear:{head:['Torva full helm','Ancestral hat','Masori mask (f)'],cape:['Infernal cape','Imbued god cape',"Ava's assembler"],amulet:['Amulet of torture','Occult necklace','Necklace of anguish'],body:['Torva platebody','Ancestral robe top','Masori body (f)'],legs:['Torva platelegs','Ancestral robe bottom','Masori chaps (f)'],gloves:['Ferocious gloves','Tormented bracelet','Zaryte vambraces'],boots:['Primordial boots','Eternal boots','Pegasian boots'],ring:['Ultor ring','Magus ring','Venator ring'],weapon:["Osmumten's fang","Tumeken's shadow",'Twisted bow'],shield:['Avernic defender',"Elidinis' ward (f)"]}},
{id:'cannon',name:'Cannon Setup',icon:'\u{1F4A3}',category:'utility',style:'ranged',
usedFor:['Cannon slayer tasks','Multi-combat training','Dagannoths','Kalphites'],
bossTips:'Cannon speeds up many slayer tasks. Use with ranged gear for max efficiency. Bring lots of cannonballs.',
gear:{head:['Slayer helmet (i)'],cape:["Ava's assembler","Ava's accumulator"],amulet:['Necklace of anguish','Amulet of fury'],body:["Blessed d'hide body",'Armadyl chestplate'],legs:["Blessed d'hide chaps",'Armadyl chainskirt'],gloves:['Barrows gloves'],boots:['Pegasian boots',"Blessed d'hide boots"],ring:['Archers ring (i)'],weapon:['Toxic blowpipe','Bow of faerdhinen','Magic shortbow (i)','Rune crossbow'],shield:['Book of law']}},
{id:'boss_tank',name:'Boss Tanking',icon:'\u{1F9CA}',category:'bossing',style:'melee',
usedFor:['GWD tanking role','Corp','Learning bosses with high damage'],
bossTips:'Use at Bandos (tank role), Corp (spectral), DT2 bosses. Blood fury sustain for Vardorvis.',
gear:{head:['Justiciar faceguard','Torag helm'],cape:['Infernal cape','Fire cape'],amulet:['Amulet of blood fury','Amulet of fury'],body:['Justiciar chestguard','Bandos chestplate'],legs:['Justiciar legguards','Bandos tassets'],gloves:['Barrows gloves','Ferocious gloves'],boots:['Primordial boots','Dragon boots'],ring:['Ring of suffering (i)','Berserker ring (i)'],weapon:['Dragon warhammer',"Osmumten's fang",'Abyssal whip'],shield:['Spectral spirit shield','Elysian spirit shield','Dragon defender']}},
{id:'pvm_general',name:'PvM General Purpose',icon:'\u{1F3AE}',category:'general',style:'melee',
usedFor:['General bossing','When unsure what to wear','Balanced offense & defense'],
bossTips:'Good starting point for any boss. Adjust individual pieces based on specific boss weaknesses.',
gear:{head:['Neitiznot faceguard','Helm of neitiznot','Berserker helm'],cape:['Fire cape','Mythical cape'],amulet:['Amulet of fury','Amulet of glory'],body:['Bandos chestplate','Fighter torso','Obsidian platebody'],legs:['Bandos tassets','Obsidian platelegs','Dragon platelegs'],gloves:['Barrows gloves','Dragon gloves'],boots:['Dragon boots','Rune boots'],ring:['Berserker ring (i)','Berserker ring','Brimstone ring'],weapon:['Abyssal whip','Dragon scimitar'],shield:['Dragon defender','Rune defender']}},
];

// ============================================================
// SECTION: Ironman Quest Guide Data
// ============================================================
const IRONMAN_QUESTS = [
{priority:'essential',label:'Essential Quests',quests:[
{name:'Waterfall Quest',unlocks:'Instant 30 Attack & Strength',reqs:{},reward:['Gold bar']},
{name:'Tree Gnome Village',unlocks:'Spirit tree teleports',reqs:{},reward:[]},
{name:'The Grand Tree',unlocks:'Grand Tree teleport, gnome gliders',reqs:{agility:25},reward:[]},
{name:'Fairy Tale Part II',unlocks:'Fairy ring teleport network',reqs:{thieving:40,farming:49,herblore:57},reward:[]},
{name:'Monkey Madness I',unlocks:'Dragon scimitar',reqs:{},reward:['dragon scimitar']},
{name:'Underground Pass',unlocks:"Iban's Staff (strong magic weapon)",reqs:{agility:25,ranged:25},reward:["iban's staff"]},
{name:'Desert Treasure I',unlocks:'Ancient Magicks (Ice Barrage!)',reqs:{magic:50,firemaking:50,slayer:10,thieving:53},reward:['ancient staff']},
{name:'Recipe for Disaster',unlocks:'Barrows gloves - BIS gloves',reqs:{cooking:70,agility:48,mining:40,smithing:40,herblore:25,fishing:53,crafting:40},reward:['barrows gloves']},
{name:'Animal Magnetism',unlocks:"Ava's devices (ammo retrieval)",reqs:{ranged:30,woodcutting:35,slayer:18,crafting:19},reward:["ava's accumulator"]},
{name:'Dragon Slayer II',unlocks:'Vorkath boss, Mythical cape',reqs:{agility:60,mining:68,smithing:70,magic:75,construction:50,hitpoints:50,thieving:60,crafting:62},reward:['mythical cape']},
]},
{priority:'important',label:'Important Quests',quests:[
{name:'Bone Voyage',unlocks:'Fossil Island, Ammonite Crabs, birdhouses',reqs:{},reward:[]},
{name:'Regicide',unlocks:'Zulrah access, crystal equipment',reqs:{agility:56,crafting:10},reward:[]},
{name:'Fremennik Exiles',unlocks:'Neitiznot faceguard, Basilisk Knights',reqs:{crafting:65,slayer:60,fishing:60,runecraft:55,smithing:60},reward:['neitiznot faceguard']},
{name:'Song of the Elves',unlocks:'Zalcano, Gauntlet, Prif city',reqs:{agility:70,construction:70,farming:70,herblore:70,hunter:70,mining:70,smithing:70,woodcutting:70},reward:[]},
{name:'A Taste of Hope',unlocks:'Theatre of Blood access',reqs:{crafting:48,agility:45,attack:40,herblore:40,slayer:38},reward:[]},
{name:'Sins of the Father',unlocks:'Hallowed Sepulchre, Darkmeyer',reqs:{woodcutting:62,fletching:60,crafting:56,agility:52,slayer:50,magic:49,attack:50},reward:[]},
{name:'Kings Ransom',unlocks:'Piety prayer (Knight Waves after)',reqs:{magic:45,defence:65},reward:[]},
{name:'Lunar Diplomacy',unlocks:'Lunar spellbook (NPC Contact, Vengeance)',reqs:{crafting:61,defence:40,firemaking:49,magic:65,mining:60,woodcutting:55},reward:[]},
{name:'Dream Mentor',unlocks:'More Lunar spells',reqs:{combat:85},reward:[]},
{name:'Desert Treasure II',unlocks:'DT2 bosses (rings), Ancient rings',reqs:{magic:75,firemaking:75,thieving:62,herblore:62,runecraft:60,construction:60},reward:[]},
]},
{priority:'nice',label:'Nice to Have',quests:[
{name:'The Feud',unlocks:'Blackjacking for thieving XP',reqs:{thieving:30},reward:[]},
{name:'Priest in Peril',unlocks:'Morytania access, Barrows',reqs:{},reward:[]},
{name:'Horror from the Deep',unlocks:'God books (prayer bonus)',reqs:{agility:35},reward:[]},
{name:'Lost City',unlocks:'Zanaris, dragon weapons',reqs:{crafting:31,woodcutting:36},reward:[]},
{name:'Cabin Fever',unlocks:'Crafting guild teleport upgrade',reqs:{agility:42,crafting:45,smithing:50,ranged:40},reward:[]},
{name:'Rum Deal',unlocks:'Holy wrench (prayer bonus)',reqs:{crafting:42,fishing:50,farming:40,prayer:47,slayer:42},reward:['holy wrench']},
{name:'Eagles Peak',unlocks:'Eagle transport system, box traps',reqs:{hunter:27},reward:[]},
{name:'My Arm\'s Big Adventure',unlocks:'Disease-free herb patch on troll roof',reqs:{farming:29,woodcutting:10},reward:[]},
{name:'Making Friends with My Arm',unlocks:'Fire/salt mine, disease-free allotment',reqs:{mining:72,firemaking:66,agility:68,construction:35},reward:[]},
{name:'Monkey Madness II',unlocks:'Demonic gorillas (zenyte), heavy ballista',reqs:{slayer:69,crafting:70,hunter:60,agility:55,thieving:55,firemaking:60},reward:[]},
]},
];

// ============================================================
// SECTION: Achievement Diary Data
// ============================================================
const DIARIES = {
'Ardougne':{easy:{skills:{thieving:5},reward:'Cloak 1 - monastery TP'},medium:{skills:{thieving:38,agility:39,strength:38},reward:'Cloak 2 - better TP, thieving bonus'},hard:{skills:{thieving:72,construction:50,farming:70,magic:66,smithing:68,prayer:42,cooking:53},reward:'Cloak 3 - noted drops'},elite:{skills:{thieving:82,agility:90,cooking:91,farming:85,fletching:69,herblore:72,magic:94,smithing:91,crafting:35},reward:'Cloak 4 - unlimited TP, noted drops, best thieving cape perk'}},
'Desert':{easy:{skills:{hunter:5},reward:'Desert amulet 1'},medium:{skills:{magic:39,ranged:37,hunter:47,woodcutting:35,herblore:36},reward:'Desert amulet 2 - Nardah TP'},hard:{skills:{agility:70,thieving:65,magic:68,mining:60,smithing:68,construction:55,crafting:61,prayer:52},reward:'Desert amulet 3 - Kalphite shortcut'},elite:{skills:{magic:94,prayer:85,construction:78,agility:70,thieving:91},reward:'Desert amulet 4 - unlimited Nardah TP, KQ shortcut'}},
'Falador':{easy:{skills:{mining:10,agility:5},reward:'Falador shield 1'},medium:{skills:{agility:42,firemaking:49,mining:40,slayer:32,thieving:40,strength:37},reward:'Falador shield 2 - prayer recharge'},hard:{skills:{agility:59,defence:50,farming:52,herblore:52,mining:60,prayer:70,runecraft:56,slayer:72,strength:58,thieving:58,woodcutting:71},reward:'Falador shield 3 - giant mole locator'},elite:{skills:{agility:80,farming:91,herblore:81,mining:89,prayer:70,runecraft:88,slayer:88,thieving:75,woodcutting:75},reward:'Falador shield 4 - full prayer recharge'}},
'Fremennik':{easy:{skills:{crafting:23,hunter:11},reward:'Fremennik sea boots 1'},medium:{skills:{construction:37,hunter:35,mining:40,slayer:47,smithing:50,thieving:42},reward:'Boots 2 - Peer the Seer bank'},hard:{skills:{agility:70,construction:50,crafting:65,defence:70,herblore:66,hunter:55,mining:70,smithing:60,thieving:75,woodcutting:56},reward:'Boots 3 - noted DK bones'},elite:{skills:{crafting:80,runecraft:82,slayer:83,agility:80,mining:82,smithing:90,woodcutting:85},reward:'Boots 4 - noted DK bones + teleport'}},
'Kandarin':{easy:{skills:{agility:20,fishing:16},reward:'Kandarin headgear 1'},medium:{skills:{agility:36,cooking:43,farming:26,fishing:46,fletching:50,magic:45,mining:30,strength:22,thieving:47},reward:'Headgear 2 - coal trucks bonus'},hard:{skills:{agility:60,construction:50,crafting:65,firemaking:65,fishing:70,fletching:70,magic:56,mining:60,prayer:70,smithing:75,thieving:53,woodcutting:60},reward:'Headgear 3 - Seers TP, bolt enchanting bonus'},elite:{skills:{agility:85,cooking:80,crafting:85,farming:79,firemaking:85,fishing:76,fletching:90,herblore:86,magic:87,prayer:75,smithing:90,thieving:79},reward:'Headgear 4 - 15% more marks at Seers, bolt enchant bonus'}},
'Karamja':{easy:{skills:{agility:15,mining:40},reward:'Karamja gloves 1 - agility course'},medium:{skills:{agility:12,cooking:16,farming:27,fishing:65,mining:40,woodcutting:50},reward:'Gloves 2 - trading sticks'},hard:{skills:{agility:53,cooking:53,mining:52,ranged:42,runecraft:44,smithing:50,strength:50,thieving:50,woodcutting:34},reward:'Gloves 3 - underground gems'},elite:{skills:{agility:53,cooking:53,farming:72,fishing:65,herblore:87,mining:52,ranged:42,runecraft:91,smithing:50,strength:50,thieving:50,woodcutting:34},reward:'Gloves 4 - unlimited Shilo TP'}},
'Kourend':{easy:{skills:{mining:15,thieving:25},reward:'Kourend favour certificate'},medium:{skills:{agility:49,crafting:30,farming:45,firemaking:50,fishing:43,hunter:53,mining:42,smithing:40,woodcutting:50},reward:'Rada blessing 2'},hard:{skills:{agility:60,cooking:60,crafting:55,farming:74,fishing:60,hunter:60,magic:66,mining:65,prayer:50,slayer:62,smithing:70,thieving:49,woodcutting:60},reward:'Rada blessing 3'},elite:{skills:{agility:80,cooking:84,crafting:75,farming:85,fishing:78,hunter:80,magic:90,mining:86,prayer:77,runecraft:77,slayer:95,smithing:90,thieving:64,woodcutting:90},reward:'Rada blessing 4 - ash sanctifier'}},
'Lumbridge':{easy:{skills:{agility:10,fishing:15,mining:15,runecraft:5,slayer:7},reward:'Explorer ring 1 - run energy'},medium:{skills:{agility:20,crafting:38,fishing:30,hunter:50,magic:31,mining:40,runecraft:23,slayer:7,smithing:36,woodcutting:36},reward:'Explorer ring 2 - cabbage TP'},hard:{skills:{agility:46,crafting:70,farming:63,firemaking:65,magic:70,mining:63,prayer:52,runecraft:59,slayer:41,smithing:68,strength:50,thieving:53,woodcutting:57},reward:'Explorer ring 3 - fairy ring without staff'},elite:{skills:{agility:70,crafting:78,farming:75,firemaking:75,magic:75,mining:68,prayer:70,runecraft:76,slayer:69,smithing:88,strength:70,thieving:78,woodcutting:75},reward:'Explorer ring 4 - 30 free alchs/day, blockhouse TP'}},
'Morytania':{easy:{skills:{cooking:12,crafting:15,slayer:15},reward:'Morytania legs 1'},medium:{skills:{agility:42,cooking:40,herblore:22,hunter:29,magic:50,mining:42,slayer:42,smithing:50,woodcutting:45},reward:'Legs 2 - robin boost'},hard:{skills:{agility:71,construction:50,crafting:50,defence:70,firemaking:50,herblore:58,magic:66,mining:55,prayer:70,slayer:58,smithing:50,thieving:42,woodcutting:50},reward:'Legs 3 - barrows runes, double fungi'},elite:{skills:{agility:71,construction:70,crafting:84,defence:70,firemaking:80,fishing:96,herblore:58,magic:83,mining:70,prayer:70,slayer:58,smithing:70,thieving:42,woodcutting:50},reward:'Legs 4 - 50% more Barrows runes, Harmony Island TP'}},
'Varrock':{easy:{skills:{agility:13,crafting:8,mining:15,runecraft:9,thieving:5},reward:'Varrock armor 1 - mining bonus'},medium:{skills:{agility:30,cooking:35,crafting:36,farming:30,firemaking:40,herblore:10,hunter:33,magic:25,thieving:25},reward:'Armor 2 - Varrock TP to GE'},hard:{skills:{agility:51,construction:50,cooking:68,farming:68,firemaking:60,herblore:52,hunter:66,magic:54,prayer:52,thieving:53,woodcutting:60},reward:'Armor 3 - 2x skull sceptre charges'},elite:{skills:{cooking:95,firemaking:95,herblore:90,magic:86,prayer:78,runecraft:78,thieving:78,woodcutting:75},reward:'Armor 4 - 10% more Varrock GE stock, noted battlesaves'}},
'Western':{easy:{skills:{fishing:30,hunter:9,mining:15},reward:'Western banner 1'},medium:{skills:{agility:37,cooking:42,farming:45,firemaking:35,fishing:46,hunter:31,mining:40,ranged:30,woodcutting:35},reward:'Banner 2 - crystal saw'},hard:{skills:{agility:56,construction:65,cooking:70,farming:68,firemaking:50,fishing:62,fletching:5,hunter:69,magic:64,mining:70,smithing:75,thieving:75,woodcutting:50},reward:'Banner 3 - Zulrah res, enhanced crystal key'},elite:{skills:{agility:85,attack:42,cooking:70,farming:85,firemaking:50,fishing:62,fletching:5,herblore:76,hunter:80,magic:64,mining:70,prayer:77,ranged:70,slayer:93,smithing:75,thieving:85,woodcutting:50},reward:'Banner 4 - unlimited Zulrah res, unlimited crystal key bonus'}},
'Wilderness':{easy:{skills:{agility:15,magic:21,mining:15},reward:'Wilderness sword 1'},medium:{skills:{agility:60,magic:60,mining:55,slayer:50,strength:60,thieving:40,woodcutting:61},reward:'Sword 2 - free access to resource area'},hard:{skills:{agility:64,cooking:70,fishing:53,hunter:56,magic:66,mining:75,slayer:68,smithing:75,thieving:75},reward:'Sword 3 - noted drops'},elite:{skills:{agility:60,cooking:90,fishing:85,magic:96,mining:85,slayer:83,smithing:90,strength:60,thieving:84,woodcutting:75},reward:'Sword 4 - unlimited Fountain of Rune charges'}},
};

// ============================================================
// SECTION: Unified Item Matching
// ============================================================
const ItemMatcher = {
    normalize(name) {
        return name.toLowerCase().trim();
    },
    normalizeBase(name) {
        return name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
    },
    bankHasItem(bankData, itemName) {
        if (!bankData) return false;
        const lower = this.normalize(itemName);
        const base = this.normalizeBase(itemName);
        return Object.keys(bankData).some(key => {
            if (key === lower) return true;
            if (this.normalizeBase(key) === base && base.length > 3) return true;
            return false;
        });
    },
    bankHasAny(bankData, names) {
        if (!bankData) return false;
        return names.some(n => this.bankHasItem(bankData, n));
    },
    findBestOwned(bankData, rankedItems) {
        if (!bankData) return { item: rankedItems[0], owned: false };
        const items = Array.isArray(rankedItems) ? rankedItems : [rankedItems];
        for (const item of items) {
            if (this.bankHasItem(bankData, item)) {
                return { item, owned: true };
            }
        }
        return { item: items[0], owned: false };
    }
};

// ============================================================
// SECTION: State Management (localStorage)
// ============================================================
let state = { history: [], currentPlayer: null, bankData: null, version: 2 };

// Get bank data for the current player (stored per-character in history)
function getCurrentBankData() {
    if (!state.currentPlayer) return null;
    const entry = state.history.find(h => h.username.toLowerCase() === state.currentPlayer.username.toLowerCase() && h.mode === state.currentPlayer.mode);
    return entry?.bankData || null;
}

// Set bank data for the current player
function setCurrentBankData(items) {
    if (!state.currentPlayer) {
        showToast('Look up a character first before importing bank data', true);
        return false;
    }
    const idx = state.history.findIndex(h => h.username.toLowerCase() === state.currentPlayer.username.toLowerCase() && h.mode === state.currentPlayer.mode);
    if (idx >= 0) {
        state.history[idx].bankData = items;
    }
    state.bankData = items; // keep global ref for convenience
    return true;
}

// Sync global bankData to current character's bank
function syncBankToCurrentPlayer() {
    state.bankData = getCurrentBankData();
    updateBankDataDisplay();
}

function updateBankDataDisplay() {
    const textarea = document.getElementById('bank-data-input');
    if (state.bankData) {
        textarea.value = '\u2713 Bank data loaded (' + Object.keys(state.bankData).length + ' items) for ' + (state.currentPlayer?.username || 'unknown');
    } else {
        textarea.value = '';
    }
}

function loadState() {
    // Migration: check URL hash first (one-time)
    const hash = window.location.hash.slice(1);
    if (hash) {
        try {
            const decoded = JSON.parse(decodeURIComponent(atob(hash)));
            state = { ...state, ...decoded };
            saveState();
            window.location.hash = '';
            showToast('Data migrated from URL to local storage');
        } catch (e) { console.warn('Hash migration failed:', e); }
    }
    // Load from localStorage
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            state = { ...state, ...parsed };
        }
    } catch (e) { console.error('Failed to load state:', e); }
    // Migration v1->v2: move global bankData into current player's history entry
    if (state.bankData && state.currentPlayer && state.version < 2) {
        const idx = state.history.findIndex(h => h.username.toLowerCase() === state.currentPlayer.username.toLowerCase() && h.mode === state.currentPlayer.mode);
        if (idx >= 0 && !state.history[idx].bankData) {
            state.history[idx].bankData = state.bankData;
        }
        state.version = 2;
        saveState();
    }

    renderHistory();
    syncBankToCurrentPlayer();
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.error('Save failed:', e);
        showToast('Storage full - consider clearing old data', true);
    }
}

// ============================================================
// SECTION: Hiscores API (JSON endpoint with CORS fallback)
// ============================================================
async function fetchWithProxy(targetUrl) {
    for (const proxyFn of CORS_PROXIES) {
        try {
            const proxyUrl = proxyFn(targetUrl);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);
            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeout);
            if (response.ok) return response;
        } catch (e) {
            console.warn('Proxy failed, trying next...', e.message);
        }
    }
    throw new Error('All proxies failed. Try again in a moment.');
}

async function fetchPlayer(username, mode) {
    const endpoint = HISCORES_ENDPOINTS[mode] || HISCORES_ENDPOINTS.ironman;

    // Try JSON endpoint first
    try {
        const jsonUrl = `https://secure.runescape.com/m=${endpoint}/index_lite.json?player=${encodeURIComponent(username)}`;
        const response = await fetchWithProxy(jsonUrl);
        const contentType = response.headers.get('content-type') || '';
        const text = await response.text();

        if (contentType.includes('json') || text.trim().startsWith('{')) {
            const json = JSON.parse(text);
            return parseJsonHiscores(json);
        }
        // If proxy returned non-JSON, fall through to CSV
    } catch (e) {
        console.warn('JSON endpoint failed, trying CSV:', e.message);
    }

    // Fallback: CSV endpoint
    const csvUrl = `https://secure.runescape.com/m=${endpoint}/index_lite.ws?player=${encodeURIComponent(username)}`;
    const response = await fetchWithProxy(csvUrl);
    const text = await response.text();
    if (!text || text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('Player not found');
    }
    return parseCsvHiscores(text);
}

function parseJsonHiscores(json) {
    const data = { skills: {}, bosses: {}, activities: {} };

    if (json.skills) {
        for (const s of json.skills) {
            const id = SKILL_NAME_MAP[s.name.toLowerCase()] || s.name.toLowerCase().replace(/\s+/g, '');
            data.skills[id] = { rank: s.rank, level: s.level, xp: s.xp };
        }
    }

    if (json.activities) {
        for (const a of json.activities) {
            const name = a.name;
            const score = a.score || a.rank || 0;
            if (score > 0 && BOSS_NAME_SET.has(name.toLowerCase())) {
                data.bosses[name] = { rank: a.rank, kc: score };
            } else {
                data.activities[name] = { rank: a.rank, score: score };
            }
        }
    }

    return data;
}

function parseCsvHiscores(csv) {
    const lines = csv.trim().split('\n');
    const data = { skills: {}, bosses: {}, activities: {} };

    // Skills: lines 0-24 (25 entries, format: rank,level,xp)
    SKILLS.forEach((skill, i) => {
        if (lines[i]) {
            const [rank, level, xp] = lines[i].split(',').map(Number);
            data.skills[skill.id] = { rank, level, xp };
        }
    });

    // Activities: lines 25-43 (19 entries, format: rank,score)
    // Bosses: lines 44+ (69 entries, format: rank,kc)
    const BOSS_START = 44;
    BOSSES.forEach((boss, i) => {
        const lineIndex = BOSS_START + i;
        if (lines[lineIndex]) {
            const [rank, kc] = lines[lineIndex].split(',').map(Number);
            if (kc > 0) {
                data.bosses[boss] = { rank, kc };
            }
        }
    });

    return data;
}

// ============================================================
// SECTION: Utility Functions
// ============================================================
function calculateCombat(skills) {
    const a = skills.attack?.level || 1, s = skills.strength?.level || 1;
    const d = skills.defence?.level || 1, h = skills.hitpoints?.level || 10;
    const p = skills.prayer?.level || 1, r = skills.ranged?.level || 1;
    const m = skills.magic?.level || 1;
    const base = 0.25 * (d + h + Math.floor(p / 2));
    return Math.floor(base + Math.max(0.325 * (a + s), 0.325 * (Math.floor(r / 2) + r), 0.325 * (Math.floor(m / 2) + m)));
}

function formatNumber(num) {
    if (!num && num !== 0) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
}

function getTimeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast show' + (isError ? ' error' : '');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// SECTION: Player Lookup & History
// ============================================================
async function lookupPlayer() {
    const username = document.getElementById('username-input').value.trim();
    const mode = document.getElementById('game-mode').value;
    if (!username) { showToast('Enter a character name', true); return; }

    const btn = document.getElementById('lookup-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px"></span> Loading...';

    try {
        const data = await fetchPlayer(username, mode);
        const idx = state.history.findIndex(h => h.username.toLowerCase() === username.toLowerCase() && h.mode === mode);
        const existingBank = idx >= 0 ? state.history[idx].bankData || null : null;

        state.currentPlayer = { username, mode, data, timestamp: Date.now(), bankData: existingBank };

        if (idx >= 0) state.history[idx] = state.currentPlayer;
        else { state.history.unshift(state.currentPlayer); if (state.history.length > 10) state.history.pop(); }

        syncBankToCurrentPlayer();

        saveState();
        renderPlayer(state.currentPlayer);
        renderHistory();
        showToast('Loaded ' + username + '!');
    } catch (error) {
        showToast(error.message, true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '\u{1F50D} Lookup';
    }
}

function renderPlayer(player) {
    const { data } = player;
    document.getElementById('total-level').textContent = data.skills.overall?.level || '--';
    document.getElementById('combat-level').textContent = calculateCombat(data.skills);
    document.getElementById('total-xp').textContent = formatNumber(data.skills.overall?.xp || 0);
    const maxed = SKILLS.filter(s => s.id !== 'overall' && data.skills[s.id]?.level >= 99).length;
    document.getElementById('maxed-skills').textContent = maxed + '/24';
    const totalKC = Object.values(data.bosses).reduce((sum, b) => sum + (b.kc || 0), 0);
    document.getElementById('total-boss-kc').textContent = formatNumber(totalKC);
    renderSkills(data.skills);
    renderBosses();
    renderProgress();
    renderQuestGuide();
    renderDiaryGuide();
    if (state.bankData) renderBIS();
}

function renderSkills(skills) {
    const grid = document.getElementById('skills-grid');
    grid.innerHTML = SKILLS.filter(s => s.id !== 'overall').map(skill => {
        const d = skills[skill.id] || { level: 1, xp: 0 };
        const rec = d.level < 99 ? getSkillRec(skill.id, d.level) : null;
        const recClass = rec ? ' train-' + rec.priority : '';
        let recHTML = '';
        if (rec) {
            recHTML = '<div class="skill-rec"><span class="skill-rec-target ' + rec.priority + '">\u2192 ' + rec.target + '</span> ' + rec.reason + '</div>';
        }
        return '<div class="skill-item ' + (d.level >= 99 ? 'maxed' : '') + recClass + '">' +
            '<div class="skill-icon">' + skill.icon + '</div>' +
            '<div class="skill-info"><div class="skill-name">' + skill.name + '</div>' +
            '<div class="skill-level">' + d.level + '</div>' +
            '<div class="skill-xp">' + formatNumber(d.xp) + ' XP</div>' + recHTML + '</div></div>';
    }).join('');
}

function renderBosses() {
    const grid = document.getElementById('bosses-grid');
    if (!state.currentPlayer) { grid.innerHTML = '<div class="no-data" style="grid-column:1/-1"><div class="no-data-icon">\u{1F479}</div><p>Search for a character to view bosses</p></div>'; return; }
    const bossData = state.currentPlayer.data.bosses || {};
    const filter = document.getElementById('boss-filter')?.value || 'all';
    const search = (document.getElementById('boss-search')?.value || '').toLowerCase();
    let bossList = BOSSES.map(name => {
        const kc = bossData[name]?.kc || 0;
        const meta = BOSS_METADATA[name] || {};
        const status = getBossStatus(name);
        return { name, kc, meta, status };
    });
    if (search) bossList = bossList.filter(b => b.name.toLowerCase().includes(search));
    if (filter === 'ready') bossList = bossList.filter(b => b.status.status === 'should_chase' || b.status.status === 'ready');
    else if (filter === 'should_chase') bossList = bossList.filter(b => b.status.status === 'should_chase');
    else if (filter === 'not_worth') bossList = bossList.filter(b => b.status.status === 'not_worth' || b.status.status === 'skip' || b.status.status === 'not_ready');
    else if (filter === 'with_kc') bossList = bossList.filter(b => b.kc > 0);
    bossList.sort((a, b) => { if (a.kc > 0 && b.kc === 0) return -1; if (b.kc > 0 && a.kc === 0) return 1; const prio = {high:0,medium:1,low:2,skip:3}; return (prio[a.meta.priority]||3) - (prio[b.meta.priority]||3); });
    if (!bossList.length) { grid.innerHTML = '<div class="no-data" style="grid-column:1/-1"><div class="no-data-icon">\u{1F479}</div><p>No bosses match filter</p></div>'; return; }
    grid.innerHTML = bossList.map(b => {
        const badgeMap = {should_chase:'chase',ready:'ready',not_worth:'wait',skip:'skip-badge',not_ready:'wait',unknown:'wait'};
        const badgeCls = badgeMap[b.status.status] || 'wait';
        return '<div class="boss-item ' + b.status.cssClass + '">' +
            '<div class="boss-top-row"><span class="boss-name">' + b.name + (b.kc > 0 ? ' <span class="boss-kc">' + formatNumber(b.kc) + ' KC</span>' : '') + '</span>' +
            '<span class="boss-badge ' + badgeCls + '">' + b.status.label + '</span></div>' +
            (b.meta.desc ? '<div class="boss-desc">' + b.meta.desc + '</div>' : '') +
            (b.meta.drops ? '<div class="boss-drops">\u{1F4B0} ' + b.meta.drops.slice(0,3).join(', ') + '</div>' : '') +
            '</div>';
    }).join('');
}

function renderHistory() {
    const list = document.getElementById('history-list');
    if (!state.history.length) {
        list.innerHTML = '<div class="empty-state"><p>No characters yet</p><p style="font-size:.8rem;margin-top:4px">Search for a character to begin</p></div>';
        return;
    }
    const modeLabels = { main: 'Main', ironman: 'Iron', hardcore_ironman: 'HCIM', ultimate: 'UIM', deadman: 'DMM' };
    list.innerHTML = state.history.map((p, i) => {
        const active = state.currentPlayer?.username === p.username && state.currentPlayer?.mode === p.mode;
        const bankCount = p.bankData ? Object.keys(p.bankData).length : 0;
        const bankBadge = bankCount > 0 ? ' <span style="font-size:.65rem;padding:1px 5px;border-radius:3px;background:var(--accent-bronze);color:var(--bg-dark);font-family:JetBrains Mono,monospace">' + bankCount + ' items</span>' : '';
        return '<div class="history-item ' + (active ? 'active' : '') + '" onclick="loadFromHistory(' + i + ')">' +
            '<div class="history-name">' + p.username + ' <span class="history-mode">' + (modeLabels[p.mode] || p.mode) + '</span>' + bankBadge + '</div>' +
            '<div class="history-meta">Total: ' + (p.data.skills.overall?.level || '--') + ' \u2022 ' + getTimeAgo(p.timestamp) + '</div>' +
            '<div class="history-actions" onclick="event.stopPropagation()">' +
            '<button class="history-btn refresh" onclick="refreshPlayer(' + i + ')">\u{1F504} Update</button>' +
            '<button class="history-btn delete" onclick="deleteFromHistory(' + i + ')">\u{1F5D1}\uFE0F</button></div></div>';
    }).join('');
}

function loadFromHistory(i) {
    state.currentPlayer = state.history[i];
    syncBankToCurrentPlayer();
    document.getElementById('username-input').value = state.currentPlayer.username;
    document.getElementById('game-mode').value = state.currentPlayer.mode;
    renderPlayer(state.currentPlayer);
    renderHistory();
    renderBIS(); renderBankItems(); renderLoadouts(); renderSlayerTasks();
}

async function refreshPlayer(i) {
    document.getElementById('username-input').value = state.history[i].username;
    document.getElementById('game-mode').value = state.history[i].mode;
    await lookupPlayer();
}

function deleteFromHistory(i) {
    state.history.splice(i, 1);
    if (state.history.length > 0) {
        state.currentPlayer = state.history[0];
        syncBankToCurrentPlayer();
        renderPlayer(state.currentPlayer);
    } else {
        state.currentPlayer = null;
        state.bankData = null;
        updateBankDataDisplay();
        resetDisplay();
    }
    saveState(); renderHistory(); showToast('Removed');
}

function clearHistory() {
    state.history = []; state.currentPlayer = null; state.bankData = null;
    saveState(); renderHistory(); resetDisplay(); updateBankDataDisplay(); showToast('History cleared');
}

function resetDisplay() {
    ['total-level','combat-level','total-xp','maxed-skills','total-boss-kc'].forEach(id => {
        document.getElementById(id).textContent = '--';
    });
    document.getElementById('skills-grid').innerHTML = '<div class="no-data"><div class="no-data-icon">\u{1F4CA}</div><p>Search for a character to view skills</p></div>';
    document.getElementById('bosses-grid').innerHTML = '<div class="no-data"><div class="no-data-icon">\u{1F479}</div><p>Search for a character to view boss killcounts</p></div>';
}

// ============================================================
// SECTION: Bank Data Import
// ============================================================
function importBankData() {
    const input = document.getElementById('bank-data-input').value.trim();
    if (!input) { showToast('Paste bank data first', true); return; }

    const items = {};
    try {
        const lines = input.split('\n').filter(l => l.trim());
        if (!lines.length) { showToast('No data found', true); return; }

        const first = lines[0];
        const isTab = first.includes('\t');
        const isComma = !isTab && first.includes(',');

        if (isTab || isComma) {
            const delim = isTab ? '\t' : ',';
            const lowerFirst = first.toLowerCase();
            const hasHeader = lowerFirst.includes('item') || lowerFirst.includes('name') || lowerFirst.includes('quantity');
            const start = hasHeader ? 1 : 0;

            for (let i = start; i < lines.length; i++) {
                const parts = isComma ? parseCSVLine(lines[i]) : lines[i].split('\t');
                if (parts.length >= 3 && !isNaN(parseInt(parts[0].trim()))) {
                    const name = parts[1].trim().replace(/^["']|["']$/g, '');
                    const qty = parseInt(parts[2].trim().replace(/[",]/g, '')) || 1;
                    if (name) items[name.toLowerCase()] = { name, quantity: qty, itemId: parseInt(parts[0]) };
                } else if (parts.length >= 2) {
                    const name = parts[0].trim().replace(/^["']|["']$/g, '');
                    const qty = parseInt(parts[1].trim().replace(/[",]/g, '')) || 1;
                    if (name) items[name.toLowerCase()] = { name, quantity: qty };
                } else if (parts.length === 1) {
                    const name = parts[0].trim();
                    if (name) items[name.toLowerCase()] = { name, quantity: 1 };
                }
            }
        } else {
            try {
                const parsed = JSON.parse(input);
                if (Array.isArray(parsed)) parsed.forEach(it => { const n = it.name||it.itemName||it.item; if(n) items[n.toLowerCase()] = { name: n, quantity: it.quantity||it.qty||1 }; });
                else if (parsed.items) parsed.items.forEach(it => { const n = it.name||it.itemName||it.item; if(n) items[n.toLowerCase()] = { name: n, quantity: it.quantity||it.qty||1 }; });
            } catch { lines.forEach(l => { const t = l.trim(); if(t) items[t.toLowerCase()] = { name: t, quantity: 1 }; }); }
        }

        if (!Object.keys(items).length) { showToast('No items parsed', true); return; }

        if (!setCurrentBankData(items)) return;
        saveState();
        updateBankDataDisplay();
        renderProgress(); renderBIS(); renderBankItems(); renderLoadouts(); renderSlayerTasks();
        showToast('Imported ' + Object.keys(items).length + ' items for ' + (state.currentPlayer?.username || 'unknown') + '!');
    } catch (e) { showToast('Import failed: ' + e.message, true); }
}

function parseCSVLine(line) {
    const result = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQ = !inQ;
        else if (line[i] === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
        else cur += line[i];
    }
    result.push(cur.trim());
    return result;
}

// ============================================================
// SECTION: BIS Tracker Rendering
// ============================================================
function ownsItem(item) {
    return ItemMatcher.bankHasAny(state.bankData, item.aliases || [item.name.toLowerCase()]);
}

function renderBIS() {
    const container = document.getElementById('bis-container');
    const sortMode = document.getElementById('bis-sort')?.value || 'style';
    if (!state.bankData) { container.innerHTML = '<div class="no-data"><div class="no-data-icon">\u2694\uFE0F</div><p>Import bank data to track BIS gear</p></div>'; return; }

    let allItems = [];
    for (const [key, cat] of Object.entries(BIS_GEAR)) {
        for (const item of cat.items) {
            const has = ownsItem(item);
            const diff = ITEM_DIFFICULTY[item.name.toLowerCase()] || {d:'medium',s:'Unknown'};
            allItems.push({ ...item, category: key, categoryName: cat.name, categoryIcon: cat.icon, owned: has, diff: diff });
        }
    }

    function renderItem(it) {
        const diffBadge = '<span class="bis-difficulty ' + it.diff.d + '">' + it.diff.d + '</span>';
        return '<div class="bis-item ' + (it.owned ? 'owned' : '') + '"><div class="bis-checkbox">\u2713</div>' +
            '<div class="bis-item-info"><div class="bis-item-slot">' + it.slot + diffBadge + '</div><div class="bis-item-name">' + it.name + '</div>' +
            '<span class="bis-source">' + it.diff.s + '</span></div></div>';
    }

    if (sortMode === 'style') {
        container.innerHTML = Object.entries(BIS_GEAR).map(([key, cat]) => {
            const items = allItems.filter(i => i.category === key);
            const owned = items.filter(i => i.owned).length;
            return '<div class="bis-category"><div class="bis-category-header"><span class="bis-category-icon">' + cat.icon + '</span>' +
                '<span class="bis-category-title">' + cat.name + ' BIS</span><span class="bis-progress">' + owned + '/' + items.length + '</span></div>' +
                '<div class="bis-grid">' + items.map(renderItem).join('') + '</div></div>';
        }).join('');
    } else if (sortMode === 'slot') {
        const bySlot = {};
        allItems.forEach(it => { if (!bySlot[it.slot]) bySlot[it.slot] = []; bySlot[it.slot].push(it); });
        container.innerHTML = Object.entries(bySlot).map(([slot, items]) => {
            const owned = items.filter(i => i.owned).length;
            return '<div class="bis-category"><div class="bis-category-header"><span class="bis-category-title">' + slot + '</span><span class="bis-progress">' + owned + '/' + items.length + '</span></div>' +
                '<div class="bis-grid">' + items.map(renderItem).join('') + '</div></div>';
        }).join('');
    } else if (sortMode === 'next') {
        const unowned = allItems.filter(i => !i.owned);
        const phase = getAccountPhase().phase;
        const phaseIdx = PROGRESSION_PHASES.findIndex(p => p.id === phase);
        unowned.sort((a, b) => (DIFF_ORDER[a.diff.d]||2) - (DIFF_ORDER[b.diff.d]||2));
        container.innerHTML = '<div class="bis-category"><div class="bis-category-header"><span class="bis-category-title">\u{1F3AF} Go For Next (' + unowned.length + ' remaining)</span></div>' +
            '<div class="bis-grid">' + (unowned.length ? unowned.map(renderItem).join('') : '<div class="no-data" style="grid-column:1/-1">All BIS items obtained! \u{1F451}</div>') + '</div></div>';
    } else if (sortMode === 'easiest') {
        const unowned = allItems.filter(i => !i.owned);
        unowned.sort((a, b) => (DIFF_ORDER[a.diff.d]||2) - (DIFF_ORDER[b.diff.d]||2));
        const groups = {easy:[],medium:[],hard:[],endgame:[]};
        unowned.forEach(i => { if (groups[i.diff.d]) groups[i.diff.d].push(i); else groups.medium.push(i); });
        container.innerHTML = Object.entries(groups).filter(([_,items]) => items.length > 0).map(([diff, items]) => {
            return '<div class="bis-category"><div class="bis-category-header"><span class="bis-difficulty ' + diff + '" style="font-size:.8rem;padding:4px 10px">' + diff + '</span>' +
                '<span class="bis-category-title">' + items.length + ' items</span></div>' +
                '<div class="bis-grid">' + items.map(renderItem).join('') + '</div></div>';
        }).join('');
    }
}

// ============================================================
// SECTION: Progression Milestones
// ============================================================
const PROGRESSION_PHASES = [
    { id:'early', name:'Early Game', badge:'early', description:'Foundation building - quests, basic gear, transportation',
      milestones: [
        { id:'waterfall', name:'Waterfall Quest', desc:'Instant 30 Attack & Strength', check:'skill', skill:'attack', level:30 },
        { id:'fairy_rings', name:'Fairy Rings', desc:'Essential teleportation', check:'skill', skill:'farming', level:1 },
        { id:'graceful', name:'Full Graceful', desc:'Run energy restoration', check:'bank', items:['graceful hood','graceful top','graceful legs'] },
        { id:'fire_cape', name:'Fire Cape', desc:'BIS melee cape until Infernal', check:'bank', items:['fire cape'] },
        { id:'dragon_scim', name:'Dragon Scimitar', desc:'Best early melee weapon', check:'bank', items:['dragon scimitar'] },
        { id:'fighter_torso', name:'Fighter Torso', desc:'Free +4 strength body', check:'bank', items:['fighter torso'] },
        { id:'iban_staff', name:"Iban's Staff", desc:'Strong magic weapon for Barrows', check:'bank', items:["iban's staff","iban's staff (u)"] },
        { id:'mage_arena', name:'God Cape', desc:'Mage Arena for BIS magic cape', check:'bank', items:['saradomin cape','zamorak cape','guthix cape'] },
        { id:'ardy_cloak', name:'Ardougne Cloak', desc:'Free teleport near fairy ring', check:'bank', items:['ardougne cloak 1','ardougne cloak 2','ardougne cloak 3','ardougne cloak 4'] },
        { id:'seed_box', name:'Seed Box', desc:'Essential for farm runs', check:'bank', items:['seed box'] }
    ]},
    { id:'mid_early', name:'Mid-Early Game', badge:'mid', description:'Recipe for Disaster & Slayer foundation',
      milestones: [
        { id:'barrows_gloves', name:'Barrows Gloves', desc:'BIS gloves - huge milestone!', check:'bank', items:['barrows gloves'] },
        { id:'slayer_helm', name:'Slayer Helmet (i)', desc:'Essential for efficient slayer', check:'bank', items:['slayer helmet (i)','slayer helmet'] },
        { id:'herb_sack', name:'Herb Sack', desc:'Saves bank trips on slayer', check:'bank', items:['herb sack'] },
        { id:'rune_pouch', name:'Rune Pouch', desc:'Holds 3 rune types', check:'bank', items:['rune pouch'] },
        { id:'whip', name:'Abyssal Whip', desc:'85 Slayer - first major weapon', check:'bank', items:['abyssal whip'] },
        { id:'trident', name:'Trident', desc:'87 Slayer - unlocks Zulrah, Kraken', check:'bank', items:['trident of the seas','trident of the swamp'] },
        { id:'occult', name:'Occult Necklace', desc:'93 Slayer - BIS mage neck', check:'bank', items:['occult necklace'] },
        { id:'black_mask', name:'Black Mask', desc:'Cave Horrors - base for slayer helm', check:'bank', items:['black mask','black mask (i)'] },
        { id:'cannon', name:'Dwarf Multicannon', desc:'Speeds up slayer significantly', check:'bank', items:['cannon barrels','dwarf cannon set'] },
        { id:'quest_cape', name:'Quest Point Cape', desc:'All quests complete', check:'skill', skill:'overall', level:2000 }
    ]},
    { id:'mid', name:'Mid Game', badge:'mid', description:'Bossing begins - GWD, Zulrah, Barrows',
      milestones: [
        { id:'zenyte', name:'Zenyte Jewelry', desc:'Torture/Anguish/Tormented', check:'bank', items:['amulet of torture','necklace of anguish','tormented bracelet'] },
        { id:'blowpipe', name:'Toxic Blowpipe', desc:'Zulrah - top tier ranged', check:'bank', items:['toxic blowpipe'] },
        { id:'serp_helm', name:'Serpentine Helm', desc:'Zulrah - venom immunity', check:'bank', items:['serpentine helm'] },
        { id:'bandos', name:'Bandos Armor', desc:'GWD - BCP + Tassets', check:'bank', items:['bandos chestplate','bandos tassets'] },
        { id:'armadyl', name:'Armadyl Armor', desc:'GWD - BIS range until Masori', check:'bank', items:['armadyl chestplate','armadyl chainskirt'] },
        { id:'dwh', name:'Dragon Warhammer', desc:'Essential spec weapon', check:'bank', items:['dragon warhammer'] },
        { id:'dragon_boots', name:'Dragon Boots', desc:'Cheap str bonus boots', check:'bank', items:['dragon boots'] },
        { id:'berserker_ring', name:'Berserker Ring (i)', desc:'BIS melee ring until Ultor', check:'bank', items:['berserker ring (i)','berserker ring'] },
        { id:'archers_ring', name:'Archers Ring (i)', desc:'BIS range ring until Venator', check:'bank', items:['archers ring (i)','archers ring'] },
        { id:'seers_ring', name:'Seers Ring (i)', desc:'BIS mage ring until Magus', check:'bank', items:['seers ring (i)','seers ring'] }
    ]},
    { id:'late', name:'Late Game', badge:'late', description:'High-level slayer & Gauntlet grind',
      milestones: [
        { id:'hydra_leather', name:'Ferocious Gloves', desc:'95 Slayer - Hydra leather', check:'bank', items:['ferocious gloves'] },
        { id:'dhl', name:'Dragon Hunter Lance', desc:'95 Slayer - Hydra claw', check:'bank', items:['dragon hunter lance'] },
        { id:'bowfa', name:'Bow of Faerdhinen', desc:'Corrupted Gauntlet - game-changer', check:'bank', items:['bow of faerdhinen'] },
        { id:'crystal_armor', name:'Crystal Armor', desc:'Gauntlet - pairs with Bowfa', check:'bank', items:['crystal helm','crystal body','crystal legs'] },
        { id:'prims', name:'Primordial Boots', desc:'91 Slayer - Cerberus', check:'bank', items:['primordial boots'] },
        { id:'pegs', name:'Pegasian Boots', desc:'91 Slayer - Cerberus', check:'bank', items:['pegasian boots'] },
        { id:'eternals', name:'Eternal Boots', desc:'91 Slayer - Cerberus', check:'bank', items:['eternal boots'] },
        { id:'kodai', name:'Kodai Wand', desc:'Nightmare - BIS burst/barrage', check:'bank', items:['kodai wand'] },
        { id:'imbued_cape', name:'Imbued God Cape', desc:'Mage Arena II - BIS mage cape', check:'bank', items:['imbued saradomin cape','imbued zamorak cape','imbued guthix cape'] },
        { id:'assembler', name:"Ava's Assembler", desc:'Vorkath head - BIS range cape', check:'bank', items:["ava's assembler"] }
    ]},
    { id:'endgame', name:'End Game', badge:'endgame', description:'Raids, ToA, and ultimate goals',
      milestones: [
        { id:'tbow', name:'Twisted Bow', desc:'CoX - best ranged weapon', check:'bank', items:['twisted bow'] },
        { id:'scythe', name:'Scythe of Vitur', desc:'ToB - best melee weapon', check:'bank', items:['scythe of vitur'] },
        { id:'shadow', name:"Tumeken's Shadow", desc:'ToA - best magic weapon', check:'bank', items:["tumeken's shadow"] },
        { id:'fang', name:"Osmumten's Fang", desc:'ToA - incredible stab weapon', check:'bank', items:["osmumten's fang"] },
        { id:'masori', name:'Masori Armor', desc:'ToA - BIS ranged armor', check:'bank', items:['masori mask (f)','masori body (f)','masori chaps (f)'] },
        { id:'ancestral', name:'Ancestral Robes', desc:'CoX - BIS mage armor', check:'bank', items:['ancestral hat','ancestral robe top','ancestral robe bottom'] },
        { id:'torva', name:'Torva Armor', desc:'Nex - BIS melee armor', check:'bank', items:['torva full helm','torva platebody','torva platelegs'] },
        { id:'infernal', name:'Infernal Cape', desc:'The Inferno - ultimate melee cape', check:'bank', items:['infernal cape'] },
        { id:'dt2_rings', name:'DT2 Rings', desc:'Ultor/Venator/Magus', check:'bank', items:['ultor ring','venator ring','magus ring'] },
        { id:'quiver', name:"Dizana's Quiver", desc:'Colosseum - BIS range cape', check:'bank', items:["dizana's quiver"] }
    ]}
];

function isMilestoneComplete(m) {
    if (m.check === 'bank') {
        if (ItemMatcher.bankHasAny(state.bankData, m.items)) return true;
        for (const item of m.items) {
            const upgrades = getAllUpgrades(item);
            if (upgrades.length && ItemMatcher.bankHasAny(state.bankData, upgrades)) return true;
        }
        return false;
    }
    if (m.check === 'skill') {
        const s = state.currentPlayer?.data?.skills?.[m.skill];
        return s && s.level >= m.level;
    }
    if (m.check === 'boss_kc') {
        const kc = state.currentPlayer?.data?.bosses?.[m.boss]?.kc || 0;
        return kc >= (m.minKC || 1);
    }
    return false;
}

function getAccountPhase() {
    let phase = 'early', completed = 0, total = 0;
    for (const p of PROGRESSION_PHASES) {
        const pc = p.milestones.filter(m => isMilestoneComplete(m)).length;
        total += p.milestones.length; completed += pc;
        if (pc / p.milestones.length >= 0.6) {
            const idx = PROGRESSION_PHASES.indexOf(p);
            if (idx < PROGRESSION_PHASES.length - 1) phase = PROGRESSION_PHASES[idx + 1].id;
        }
    }
    return { phase, completed, total };
}

function getNextGoals() {
    const goals = [], { phase } = getAccountPhase();
    const ci = PROGRESSION_PHASES.findIndex(p => p.id === phase);
    for (let i = Math.max(0, ci - 1); i <= ci && i < PROGRESSION_PHASES.length; i++) {
        for (const m of PROGRESSION_PHASES[i].milestones) {
            if (!isMilestoneComplete(m) && goals.length < 5) goals.push({ ...m, phase: PROGRESSION_PHASES[i].name, priority: i < ci ? 'high' : 'medium' });
        }
    }
    if (goals.length < 5 && ci < PROGRESSION_PHASES.length - 1) {
        for (const m of PROGRESSION_PHASES[ci + 1].milestones) {
            if (!isMilestoneComplete(m) && goals.length < 5) goals.push({ ...m, phase: PROGRESSION_PHASES[ci + 1].name, priority: 'low' });
        }
    }
    return goals;
}

function renderProgress() {
    const c = document.getElementById('progress-container');
    if (!state.bankData && !state.currentPlayer) { c.innerHTML = '<div class="no-data"><div class="no-data-icon">\u{1F3AF}</div><p>Lookup your character & import bank data to see progression</p></div>'; return; }

    const { phase, completed, total } = getAccountPhase();
    const phaseName = PROGRESSION_PHASES.find(p => p.id === phase)?.name || 'Early Game';
    const nextGoals = getNextGoals();
    let h = '';

    h += '<div class="account-phase-indicator"><div class="phase-label">Current Progress Phase</div><div class="phase-name">' + phaseName + '</div>' +
         '<div style="margin-top:8px;font-size:.85rem;color:var(--text-secondary)">' + completed + '/' + total + ' milestones (' + Math.round(completed/total*100) + '%)</div></div>';

    if (nextGoals.length) {
        h += '<div class="whats-next"><div class="whats-next-header"><span style="font-size:1.5rem">\u{1F3AF}</span><span class="whats-next-title">What To Do Next</span></div><div class="whats-next-grid">';
        h += nextGoals.map(g => '<div class="next-goal"><div class="next-goal-priority ' + g.priority + '">' + g.priority + ' priority</div><div class="next-goal-name">' + g.name + '</div><div class="next-goal-reason">' + g.desc + '</div></div>').join('');
        h += '</div></div>';
    }

    h += PROGRESSION_PHASES.map(p => {
        const cc = p.milestones.filter(m => isMilestoneComplete(m)).length;
        const pct = Math.round(cc / p.milestones.length * 100);
        const isCur = p.id === phase;
        return '<div class="progress-phase ' + (isCur ? 'current expanded' : '') + '" onclick="this.classList.toggle(\'expanded\')">' +
            '<div class="progress-phase-header"><div class="progress-phase-title"><span class="phase-badge ' + p.badge + '">' + p.badge + '</span><span>' + p.name + '</span>' +
            (isCur ? '<span style="color:var(--accent-gold);font-size:.8rem">\u2190 You are here</span>' : '') + '</div>' +
            '<div class="phase-progress"><div class="phase-progress-bar"><div class="phase-progress-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="phase-progress-text">' + cc + '/' + p.milestones.length + '</span><span style="color:var(--text-muted)">\u25BC</span></div></div>' +
            '<div class="progress-phase-body"><p style="color:var(--text-secondary);margin-bottom:12px;font-size:.9rem">' + p.description + '</p>' +
            '<div class="milestone-grid">' + p.milestones.map(m => {
                const done = isMilestoneComplete(m);
                const rec = !done && nextGoals.some(g => g.id === m.id);
                return '<div class="milestone-item ' + (done ? 'completed' : '') + ' ' + (rec ? 'recommended' : '') + '">' +
                    '<div class="milestone-check">' + (done ? '\u2713' : rec ? '!' : '') + '</div>' +
                    '<div class="milestone-content"><div class="milestone-name">' + m.name + '</div><div class="milestone-desc">' + m.desc + '</div></div></div>';
            }).join('') + '</div></div></div>';
    }).join('');

    c.innerHTML = h;
}

function renderLoadouts() {
    const container = document.getElementById('loadouts-container');
    const filter = document.getElementById('activity-filter').value;
    if (!state.bankData) { container.innerHTML = '<div class="no-data"><div class="no-data-icon">\u{1F392}</div><p>Import bank data to generate optimized loadouts</p></div>'; return; }

    let acts = STYLE_LOADOUTS;
    if (filter !== 'all') acts = acts.filter(a => a.category === filter);

    container.innerHTML = acts.map(a => {
        const slots = Object.entries(a.gear);
        let owned = 0;
        const gearHTML = slots.map(([slot, items]) => {
            const arr = Array.isArray(items) ? items : [items];
            const meta = arr[0];
            const best = ItemMatcher.findBestOwned(state.bankData, arr);
            if (best.owned) owned++;
            const hasBIS = best.owned && best.item.toLowerCase() === meta.toLowerCase();
            return '<div class="gear-row"><span class="gear-row-slot">' + slot + '</span>' +
                '<span class="gear-row-item ' + (hasBIS ? 'bis has' : 'bis') + '">' + meta + '</span>' +
                '<span class="gear-row-item ' + (best.owned ? 'has' : 'missing') + '">' + (best.owned ? best.item + (hasBIS ? ' \u2713' : '') : 'None owned') + '</span></div>';
        }).join('');

        const pct = Math.round(owned / slots.length * 100);
        const fc = pct < 40 ? 'low' : pct < 70 ? 'medium' : 'high';
        const usedForHTML = a.usedFor ? '<div class="loadout-used-for">' + a.usedFor.map(u => '<span class="loadout-used-tag">' + u + '</span>').join('') + '</div>' : '';
        const tipsHTML = a.bossTips ? '<div class="loadout-boss-tips">\u{1F3AF} ' + a.bossTips + '</div>' : '';
        return '<div class="loadout-card" onclick="this.classList.toggle(\'expanded\')"><div class="loadout-header"><div class="loadout-title"><span class="loadout-icon">' + a.icon + '</span><span>' + a.name + '</span></div>' +
            '<div style="display:flex;align-items:center;gap:12px"><div class="loadout-tags"><span class="loadout-tag ' + a.style + '">' + a.style + '</span></div>' +
            '<div class="loadout-completeness"><div class="completeness-bar"><div class="completeness-fill ' + fc + '" style="width:' + pct + '%"></div></div><span>' + owned + '/' + slots.length + '</span></div>' +
            '<span class="loadout-expand-icon">\u25BC</span></div></div>' +
            '<div class="loadout-body"><div class="gear-comparison-header"><span></span><span class="gear-column-header meta">Meta BIS</span><span class="gear-column-header yours">Your Gear</span></div>' +
            '<div class="gear-slots">' + gearHTML + '</div>' + usedForHTML + tipsHTML + '</div></div>';
    }).join('');
}

// ============================================================
// SECTION: Slayer Tasks
// ============================================================
const SLAYER_TASKS = [
    { name:'Abyssal Demons', level:85, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Abyssal whip','Arclight'], body:['Bandos chestplate','Fighter torso'], legs:['Bandos tassets','Proselyte cuisse'], boots:['Primordial boots','Dragon boots'], gloves:['Ferocious gloves','Barrows gloves'] }, tip:'Catacombs for totems. Arclight effective (demons). Burst with barrage in multi.' },
    { name:'Alchemical Hydra', level:95, style:'ranged', gear:{ head:'Slayer helmet (i)', weapon:['Twisted bow','Dragon hunter crossbow','Bow of faerdhinen'], body:['Masori body (f)','Armadyl chestplate'], legs:['Masori chaps (f)','Armadyl chainskirt'], boots:['Pegasian boots'], gloves:['Zaryte vambraces','Barrows gloves'] }, tip:'Phases: Green\u2192Blue\u2192Red\u2192Black. Tbow is BIS. Bring antidote++.' },
    { name:'Black Demons', level:1, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Arclight',"Osmumten's fang",'Abyssal whip'], body:['Bandos chestplate','Fighter torso'], legs:['Bandos tassets'], boots:['Primordial boots','Dragon boots'], gloves:['Ferocious gloves','Barrows gloves'] }, tip:'Demonic Gorillas count! Great for zenyte shards. Arclight BIS for regular.' },
    { name:'Bloodvelds', level:50, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Abyssal whip','Leaf-bladed battleaxe'], body:['Proselyte hauberk','Bandos chestplate'], legs:['Proselyte cuisse','Bandos tassets'], boots:['Dragon boots'], gloves:['Barrows gloves'] }, tip:'Pray melee in Catacombs for AFK. Mutated bloodvelds give more XP.' },
    { name:'Cave Krakens', level:87, style:'magic', gear:{ head:'Slayer helmet (i)', weapon:['Trident of the swamp','Sanguinesti staff',"Tumeken's shadow"], body:['Ancestral robe top',"Ahrim's robetop"], legs:['Ancestral robe bottom',"Ahrim's robeskirt"], boots:['Eternal boots'], gloves:['Tormented bracelet','Barrows gloves'] }, tip:'Boss for Kraken tentacle + trident. Very AFK.' },
    { name:'Cerberus', level:91, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Arclight','Abyssal bludgeon',"Inquisitor's mace"], body:['Bandos chestplate','Torva platebody'], legs:['Bandos tassets','Torva platelegs'], boots:['Primordial boots'], gloves:['Ferocious gloves'], shield:['Spectral spirit shield'] }, tip:'Arclight BIS (demon). Spectral reduces ghost prayer drain. Drops 3 crystals.' },
    { name:'Dust Devils', level:65, style:'magic', gear:{ head:'Slayer helmet (i)', weapon:['Kodai wand','Master wand','Ancient staff'], body:['Ancestral robe top','Proselyte hauberk'], legs:['Ancestral robe bottom','Proselyte cuisse'], boots:['Eternal boots'], gloves:['Tormented bracelet'] }, tip:'Burst/barrage in Catacombs. Great XP.' },
    { name:'Gargoyles', level:75, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Abyssal bludgeon','Abyssal whip'], body:['Bandos chestplate'], legs:['Bandos tassets'], boots:['Primordial boots'], gloves:['Ferocious gloves'] }, tip:'Grotesque Guardians boss! Granite hammer auto-finishes. Very AFK, good GP.' },
    { name:'Greater Demons', level:1, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Arclight',"Osmumten's fang",'Abyssal whip'], body:['Bandos chestplate'], legs:['Bandos tassets'], boots:['Primordial boots'], gloves:['Ferocious gloves'] }, tip:"K'ril Tsutsaroth counts! Arclight BIS. Catacombs for totems." },
    { name:'Hellhounds', level:1, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Abyssal whip','Abyssal bludgeon'], body:['Proselyte hauberk','Bandos chestplate'], legs:['Proselyte cuisse','Bandos tassets'], boots:['Dragon boots'], gloves:['Barrows gloves'] }, tip:'Cerberus counts (91 slayer)! Catacombs for totems. AFK with pray melee.' },
    { name:'Nechryael', level:80, style:'magic', gear:{ head:'Slayer helmet (i)', weapon:['Kodai wand','Master wand','Arclight'], body:['Ancestral robe top','Proselyte hauberk'], legs:['Ancestral robe bottom','Proselyte cuisse'], boots:['Eternal boots'], gloves:['Tormented bracelet'] }, tip:'Burst in Catacombs (greater nechryael). Death spawns heal with blood barrage.' },
    { name:'Smoke Devils', level:93, style:'magic', gear:{ head:'Slayer helmet (i)', weapon:['Kodai wand',"Tumeken's shadow",'Master wand'], body:['Ancestral robe top'], legs:['Ancestral robe bottom'], boots:['Eternal boots'], gloves:['Tormented bracelet'] }, tip:'Thermonuclear boss! Burst/barrage for fast XP. Boss drops occult necklace.' },
    { name:'Wyrms', level:62, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Dragon hunter lance',"Osmumten's fang",'Abyssal whip'], body:['Bandos chestplate'], legs:['Bandos tassets'], boots:['Primordial boots'], gloves:['Ferocious gloves'] }, tip:'DHL is BIS. Karuulm dungeon (boots of stone/brimstone).' },
    { name:'Drakes', level:84, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Dragon hunter lance',"Osmumten's fang",'Abyssal whip'], body:['Bandos chestplate'], legs:['Bandos tassets'], boots:['Primordial boots'], gloves:['Ferocious gloves'], shield:['Dragonfire shield'] }, tip:'DHL is BIS. Protect from missiles. Drops drake claw/tooth for boots.' },
    { name:'Dagannoth', level:1, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Abyssal whip','Dragon scimitar'], body:['Bandos chestplate'], legs:['Bandos tassets'], boots:['Dragon boots'], gloves:['Barrows gloves'] }, tip:'DKs count and are profitable! Lighthouse dagannoths for fast task.' },
    { name:'Kurask', level:70, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Leaf-bladed battleaxe','Leaf-bladed sword'], body:['Bandos chestplate','Fighter torso'], legs:['Bandos tassets'], boots:['Dragon boots'], gloves:['Barrows gloves'] }, tip:'Leaf-bladed weapon required! Battleaxe is BIS. Decent herb drops.' },
    { name:'TzHaar', level:1, style:'melee', gear:{ head:'Slayer helmet (i)', weapon:['Abyssal whip',"Osmumten's fang"], body:['Obsidian platebody','Bandos chestplate'], legs:['Obsidian platelegs','Bandos tassets'], boots:['Primordial boots'], gloves:['Ferocious gloves'] }, tip:'Fight Caves/Inferno count! Obsidian armor + berserker necklace for TzHaar.' }
];

function getNextUpgrade(bankData, rankedItems) {
    const best = ItemMatcher.findBestOwned(bankData, rankedItems);
    if (!best.owned) return rankedItems[rankedItems.length - 1];
    const idx = rankedItems.findIndex(i => i.toLowerCase() === best.item.toLowerCase());
    if (idx <= 0) return null;
    return rankedItems[idx - 1];
}

function renderSlayerTasks(filter) {
    const c = document.getElementById('slayer-container');
    if (!state.bankData) { c.innerHTML = '<div class="no-data"><div class="no-data-icon">\u{1F480}</div><p>Import bank data to see slayer loadouts</p></div>'; return; }

    let tasks = SLAYER_TASKS;
    if (filter) { const f = filter.toLowerCase(); tasks = tasks.filter(t => t.name.toLowerCase().includes(f) || t.tip.toLowerCase().includes(f)); }
    tasks = [...tasks].sort((a, b) => a.level - b.level);

    c.innerHTML = '<div class="slayer-grid">' + tasks.map(t => {
        const entries = Object.entries(t.gear);
        let owned = 0;
        const gearHTML = entries.map(([slot, items]) => {
            const arr = Array.isArray(items) ? items : [items];
            const meta = arr[0];
            const best = ItemMatcher.findBestOwned(state.bankData, arr);
            if (best.owned) owned++;
            const hasBIS = best.owned && best.item.toLowerCase() === meta.toLowerCase();
            const next = getNextUpgrade(state.bankData, arr);
            const nextHTML = next ? '<span class="gear-row-item upgrade">\u2192 ' + next + '</span>' : '<span class="gear-row-item bis-achieved">\u2713 BIS</span>';
            return '<div class="gear-row three-col"><span class="gear-row-slot">' + slot + '</span>' +
                '<span class="gear-row-item ' + (hasBIS ? 'bis has' : 'bis') + '">' + meta + '</span>' +
                '<span class="gear-row-item ' + (best.owned ? 'has' : 'missing') + '">' + (best.owned ? best.item + (hasBIS ? ' \u2713' : '') : '\u2014') + '</span>' +
                nextHTML + '</div>';
        }).join('');

        const pct = Math.round(owned / entries.length * 100);
        const fc = pct < 40 ? 'low' : pct < 70 ? 'medium' : 'high';
        const si = t.style === 'melee' ? '\u2694\uFE0F' : t.style === 'ranged' ? '\u{1F3F9}' : '\u{1F52E}';

        return '<div class="slayer-card" onclick="this.classList.toggle(\'expanded\')"><div class="slayer-header"><div class="slayer-name">' + si + ' ' + t.name + ' <span class="slayer-level">Lvl ' + t.level + '</span></div>' +
            '<div style="display:flex;align-items:center;gap:8px"><div class="loadout-completeness" style="min-width:80px"><div class="completeness-bar"><div class="completeness-fill ' + fc + '" style="width:' + pct + '%"></div></div><span>' + owned + '/' + entries.length + '</span></div><span>\u25BC</span></div></div>' +
            '<div class="slayer-body"><div class="gear-comparison-header three-col slayer-gear-header"><span></span><span class="gear-column-header meta">Meta BIS</span><span class="gear-column-header yours">Your Gear</span><span class="gear-column-header upgrade">Next Up</span></div>' +
            gearHTML + '<div class="slayer-tip">\u{1F4A1} ' + t.tip + '</div></div></div>';
    }).join('') + '</div>';
}

function filterSlayerTasks() { renderSlayerTasks(document.getElementById('slayer-search').value.trim()); }

// ============================================================
// SECTION: Bank Query
// ============================================================
function searchBank() { renderBankItems(document.getElementById('bank-search').value.trim().toLowerCase()); }

function renderBankItems(filter) {
    const grid = document.getElementById('bank-items-grid');
    if (!state.bankData) { grid.innerHTML = '<div class="no-data" style="grid-column:1/-1"><div class="no-data-icon">\u{1F3E6}</div><p>Import bank data to search</p></div>'; return; }

    let items = Object.values(state.bankData);
    if (filter) items = items.filter(it => it.name.toLowerCase().includes(filter));
    if (!items.length) { grid.innerHTML = '<div class="no-data" style="grid-column:1/-1"><div class="no-data-icon">\u{1F50D}</div><p>No items matching "' + (filter||'') + '"</p></div>'; return; }

    items.sort((a, b) => b.quantity - a.quantity);
    const isBIS = (name) => {
        const l = name.toLowerCase();
        return Object.values(BIS_GEAR).some(cat => cat.items.some(it => it.aliases.some(a => l.includes(a) || a.includes(l))));
    };

    grid.innerHTML = items.slice(0, 100).map(it =>
        '<div class="bank-item ' + (isBIS(it.name) ? 'highlight' : '') + '"><div class="bank-item-icon">' + itemImgHTML(it.name, 36) + '</div><div class="bank-item-info"><div class="bank-item-name" title="' + it.name + '">' + it.name + '</div><div class="bank-item-qty">x' + formatNumber(it.quantity) + '</div></div></div>'
    ).join('');
}

// ============================================================
// SECTION: Quest Guide
// ============================================================
function estimateQuestStatus(quest) {
    const skills = state.currentPlayer?.data?.skills || {};
    if (quest.reward && quest.reward.length) {
        for (const item of quest.reward) {
            if (item && ItemMatcher.bankHasItem(state.bankData, item)) return 'completed';
            const ups = getAllUpgrades(item);
            if (ups.length && ItemMatcher.bankHasAny(state.bankData, ups)) return 'completed';
        }
    }
    let meetsReqs = true;
    for (const [skill, level] of Object.entries(quest.reqs || {})) {
        if ((skills[skill]?.level || 1) < level) meetsReqs = false;
    }
    return meetsReqs ? 'ready' : 'not_ready';
}

function renderQuestGuide() {
    const c = document.getElementById('quests-container');
    if (!state.currentPlayer) { c.innerHTML = '<div class="no-data"><div class="no-data-icon">\u{1F4DC}</div><p>Lookup your character to see quest recommendations</p></div>'; return; }
    const skills = state.currentPlayer.data.skills || {};
    c.innerHTML = IRONMAN_QUESTS.map(group => {
        return '<div class="quest-group"><div class="quest-group-header">' +
            (group.priority === 'essential' ? '\u2B50' : group.priority === 'important' ? '\u{1F4A1}' : '\u{1F4CC}') +
            ' ' + group.label + '</div><div class="quest-grid">' +
            group.quests.map(q => {
                const status = estimateQuestStatus(q);
                const statusLabel = status === 'completed' ? 'Done' : status === 'ready' ? 'Ready' : 'Locked';
                const statusCls = status === 'completed' ? 'done' : status === 'ready' ? 'can-do' : 'locked';
                const reqHTML = Object.entries(q.reqs || {}).map(([skill, level]) => {
                    const has = (skills[skill]?.level || 1) >= level;
                    return '<span class="quest-req ' + (has ? 'met' : 'unmet') + '">' + skill.charAt(0).toUpperCase() + skill.slice(1) + ' ' + level + '</span>';
                }).join(' ');
                return '<div class="quest-item ' + status + '"><div class="quest-name">' + q.name + ' <span class="quest-status ' + statusCls + '">' + statusLabel + '</span></div>' +
                    '<div class="quest-unlocks">\u{1F513} ' + q.unlocks + '</div>' +
                    (reqHTML ? '<div class="quest-reqs">' + reqHTML + '</div>' : '') + '</div>';
            }).join('') + '</div></div>';
    }).join('');
}

// ============================================================
// SECTION: Diary Guide
// ============================================================
function renderDiaryGuide() {
    const c = document.getElementById('diaries-container');
    if (!state.currentPlayer) { c.innerHTML = '<div class="no-data"><div class="no-data-icon">\u{1F4CB}</div><p>Lookup your character to see diary progress</p></div>'; return; }
    const skills = state.currentPlayer.data.skills || {};
    c.innerHTML = Object.entries(DIARIES).map(([area, tiers]) => {
        let totalReqs = 0, metReqs = 0;
        Object.values(tiers).forEach(tier => {
            Object.entries(tier.skills).forEach(([s, l]) => { totalReqs++; if ((skills[s]?.level || 1) >= l) metReqs++; });
        });
        const pct = totalReqs ? Math.round(metReqs / totalReqs * 100) : 0;
        return '<div class="diary-area" onclick="this.classList.toggle(\'expanded\')"><div class="diary-area-header"><span class="diary-area-name">' + area + '</span>' +
            '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:.85rem;color:var(--text-secondary)">' + pct + '%</span><span>\u25BC</span></div></div>' +
            '<div class="diary-area-body">' + ['easy','medium','hard','elite'].map(tier => {
                if (!tiers[tier]) return '';
                const t = tiers[tier];
                const reqsHTML = Object.entries(t.skills).map(([skill, level]) => {
                    const cur = skills[skill]?.level || 1;
                    const cls = cur >= level ? 'met' : cur >= level - 5 ? 'close' : 'far';
                    return '<span class="diary-req ' + cls + '">' + skill.charAt(0).toUpperCase() + skill.slice(1) + ' ' + level + '</span>';
                }).join('');
                const tierMet = Object.entries(t.skills).filter(([s, l]) => (skills[s]?.level || 1) >= l).length;
                const tierTotal = Object.keys(t.skills).length;
                return '<div class="diary-tier"><div class="diary-tier-header"><span class="diary-tier-name ' + tier + '-tier">' + tier.charAt(0).toUpperCase() + tier.slice(1) + '</span>' +
                    '<span style="font-size:.8rem;color:var(--text-secondary)">' + tierMet + '/' + tierTotal + '</span></div>' +
                    '<div class="diary-reward">\u{1F3C6} ' + t.reward + '</div>' +
                    '<div class="diary-reqs">' + reqsHTML + '</div></div>';
            }).join('') + '</div></div>';
    }).join('');
}

// ============================================================
// SECTION: Wiki Search
// ============================================================
let wikiHistory = [];
let wikiDebounce = null;

function loadWikiHistory() {
    try { wikiHistory = JSON.parse(localStorage.getItem('osrs-wiki-history') || '[]'); } catch(e) { wikiHistory = []; }
}

function saveWikiHistory() {
    try { localStorage.setItem('osrs-wiki-history', JSON.stringify(wikiHistory.slice(0, 10))); } catch(e) {}
}

function renderWikiQuickLinks() {
    const el = document.getElementById('wiki-quick-links');
    if (!el) return;
    const links = ['Ironman guide','Quest experience rewards','Boss strategies','Slayer training','Money making guide','Equipment tables','Achievement Diary','Optimal quest guide'];
    el.innerHTML = links.map(l => '<span class="wiki-quick-link" onclick="wikiLoadPage(\'' + l.replace(/'/g, "\\'") + '\')">' + l + '</span>').join('');
}

function renderWikiHistory() {
    const el = document.getElementById('wiki-recent');
    const list = document.getElementById('wiki-recent-list');
    if (!el || !list) return;
    if (!wikiHistory.length) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    list.innerHTML = wikiHistory.map(h => '<span class="wiki-recent-item" onclick="wikiLoadPage(\'' + h.replace(/'/g, "\\'") + '\')">' + h + '</span>').join('');
}

async function wikiSearch(query) {
    query = query || document.getElementById('wiki-search-input')?.value?.trim();
    if (!query) return;
    document.getElementById('wiki-suggestions').classList.remove('active');
    document.getElementById('wiki-results').innerHTML = '<div class="wiki-loading"><span class="spinner" style="display:inline-block;width:24px;height:24px;border-width:2px"></span> Searching...</div>';
    try {
        const resp = await fetch('https://oldschool.runescape.wiki/api.php?action=opensearch&search=' + encodeURIComponent(query) + '&limit=10&format=json&origin=*');
        if (!resp.ok) throw new Error('Search failed');
        const data = await resp.json();
        const titles = data[1] || [];
        if (!titles.length) { document.getElementById('wiki-results').innerHTML = '<div class="no-data"><p>No results found for "' + query + '"</p></div>'; return; }
        if (titles.length === 1) { wikiLoadPage(titles[0]); return; }
        document.getElementById('wiki-results').innerHTML = '<h3>Search Results for "' + query + '"</h3>' +
            titles.map(t => '<div class="wiki-suggestion" onclick="wikiLoadPage(\'' + t.replace(/'/g, "\\'") + '\')" style="padding:10px;margin:4px 0;background:var(--bg-secondary);border-radius:6px;cursor:pointer">' + t + '</div>').join('');
    } catch (e) { document.getElementById('wiki-results').innerHTML = '<div class="no-data"><p>Search failed: ' + e.message + '</p></div>'; }
}

async function wikiLoadPage(title) {
    document.getElementById('wiki-search-input').value = title;
    document.getElementById('wiki-suggestions').classList.remove('active');
    document.getElementById('wiki-results').innerHTML = '<div class="wiki-loading"><span class="spinner" style="display:inline-block;width:24px;height:24px;border-width:2px"></span> Loading ' + title + '...</div>';
    if (!wikiHistory.includes(title)) { wikiHistory.unshift(title); saveWikiHistory(); renderWikiHistory(); }
    try {
        const resp = await fetch('https://oldschool.runescape.wiki/api.php?action=parse&page=' + encodeURIComponent(title) + '&prop=text&format=json&origin=*');
        if (!resp.ok) throw new Error('Page not found');
        const data = await resp.json();
        if (data.error) throw new Error(data.error.info || 'Page not found');
        let html = data.parse.text['*'];
        html = wikiCleanHTML(html);
        document.getElementById('wiki-results').innerHTML = '<h2>' + title + '</h2><div style="font-size:.85rem">' + html + '</div>';
    } catch (e) { document.getElementById('wiki-results').innerHTML = '<div class="no-data"><p>Failed to load: ' + e.message + '</p></div>'; }
}

function wikiCleanHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    div.querySelectorAll('.mw-editsection,.navbox,.catlinks,#toc,.noprint,.mw-empty-elt,.printfooter,style,script,.mbox-small,.ambox').forEach(el => el.remove());
    div.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('/w/')) a.setAttribute('href', 'https://oldschool.runescape.wiki' + href);
        a.setAttribute('target', '_blank');
    });
    div.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && src.startsWith('/')) img.setAttribute('src', 'https://oldschool.runescape.wiki' + src);
    });
    return div.innerHTML;
}

function wikiSuggest() {
    const input = document.getElementById('wiki-search-input')?.value?.trim();
    const sugEl = document.getElementById('wiki-suggestions');
    if (!input || input.length < 2) { sugEl.classList.remove('active'); return; }
    clearTimeout(wikiDebounce);
    wikiDebounce = setTimeout(async () => {
        try {
            const resp = await fetch('https://oldschool.runescape.wiki/api.php?action=opensearch&search=' + encodeURIComponent(input) + '&limit=6&format=json&origin=*');
            const data = await resp.json();
            const titles = data[1] || [];
            if (titles.length) {
                sugEl.innerHTML = titles.map(t => '<div class="wiki-suggestion" onclick="wikiLoadPage(\'' + t.replace(/'/g, "\\'") + '\')">' + t + '</div>').join('');
                sugEl.classList.add('active');
            } else { sugEl.classList.remove('active'); }
        } catch(e) { sugEl.classList.remove('active'); }
    }, 300);
}

// ============================================================
// SECTION: Wiki Chat Sidebar
// ============================================================
let chatMessages = [];
let chatMode = null; // null = auto-detect, or 'item','monster','drops','quest','price','compare'
let chatOpen = false;

function loadChatHistory() {
    try { chatMessages = JSON.parse(localStorage.getItem('osrs-chat-history') || '[]'); } catch(e) { chatMessages = []; }
}

function saveChatHistory() {
    if (chatMessages.length > 100) chatMessages = chatMessages.slice(-100);
    try { localStorage.setItem('osrs-chat-history', JSON.stringify(chatMessages)); } catch(e) {}
}

function toggleChat() {
    chatOpen = !chatOpen;
    document.getElementById('chat-sidebar').classList.toggle('open', chatOpen);
    document.getElementById('chat-toggle').classList.toggle('has-panel-open', chatOpen);
    if (chatOpen) {
        renderAllChatMessages();
        setTimeout(() => document.getElementById('chat-input').focus(), 350);
    }
}

function clearChat() {
    chatMessages = [];
    chatMode = null;
    saveChatHistory();
    updateChipHighlight();
    renderAllChatMessages();
}

function setChatMode(mode) {
    const input = document.getElementById('chat-input');
    if (chatMode === mode) { chatMode = null; input.placeholder = 'Ask about anything in OSRS...'; }
    else {
        chatMode = mode;
        const hints = { item: 'Enter item name (e.g. Abyssal whip)...', monster: 'Enter monster name (e.g. Vorkath)...', drops: 'Enter monster name for drop table...', quest: 'Enter quest name (e.g. Dragon Slayer II)...', price: 'Enter item name for GE price...', compare: 'Enter: item1 vs item2 (e.g. whip vs scimitar)...' };
        input.placeholder = hints[mode] || 'Ask about anything in OSRS...';
    }
    updateChipHighlight();
    document.getElementById('chat-input').focus();
}

function updateChipHighlight() {
    document.querySelectorAll('.chat-chip').forEach(c => c.classList.toggle('active', c.dataset.mode === chatMode));
}

function renderAllChatMessages() {
    const el = document.getElementById('chat-messages');
    if (!chatMessages.length) {
        el.innerHTML = '<div class="chat-welcome"><div class="chat-welcome-icon">📖</div><h3>OSRS Wiki Chat</h3><p>Ask me anything about Old School RuneScape!</p><div class="chat-welcome-tips"><strong>Try asking:</strong><br>• "Abyssal whip" — item stats<br>• "Vorkath drops" — drop tables<br>• "Dragon Slayer II" — quest info<br>• "whip vs saeldor" — compare items<br>• "dragon bones price" — GE prices<br><br>Or use the chips above to set a lookup mode!</div></div>';
        return;
    }
    el.innerHTML = chatMessages.map(m => {
        if (m.role === 'user') return '<div class="chat-bubble user">' + escChat(m.text) + '</div>';
        if (m.role === 'system') return '<div class="chat-bubble system">' + escChat(m.text) + '</div>';
        return '<div class="chat-bubble assistant">' + m.html + '</div>';
    }).join('');
    el.scrollTop = el.scrollHeight;
}

function addChatMessage(role, text, html) {
    chatMessages.push({ role, text: text || '', html: html || escChat(text || '') });
    saveChatHistory();
    renderAllChatMessages();
}

function showChatLoading() {
    const el = document.getElementById('chat-messages');
    el.insertAdjacentHTML('beforeend', '<div class="chat-bubble assistant" id="chat-loading-bubble"><div class="chat-loading"><div class="chat-dots"><span></span><span></span><span></span></div> Looking up...</div></div>');
    el.scrollTop = el.scrollHeight;
}

function removeChatLoading() {
    document.getElementById('chat-loading-bubble')?.remove();
}

function escChat(s) {
    const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

function chatCard(title, icon, rows) {
    let html = '<div class="chat-card"><div class="chat-card-header">' + icon + ' ' + escChat(title) + '</div><div class="chat-card-body">';
    for (const [k, v] of rows) {
        if (v) html += '<div class="chat-card-row"><span class="chat-card-key">' + escChat(k) + '</span><span class="chat-card-val">' + escChat(v) + '</span></div>';
    }
    html += '</div></div>';
    return html;
}

function chatCompareTable(item1, item2, data1, data2) {
    const allKeys = [...new Set([...Object.keys(data1), ...Object.keys(data2)])].filter(k => !k.startsWith('version') && (data1[k] || data2[k]));
    let html = '<div class="chat-card"><div class="chat-card-header">⚖️ ' + escChat(item1) + ' vs ' + escChat(item2) + '</div><div class="chat-card-body"><table class="chat-compare-table"><tr><th>Stat</th><th>' + escChat(item1) + '</th><th>' + escChat(item2) + '</th></tr>';
    for (const k of allKeys) {
        html += '<tr><td style="text-align:left;color:var(--text-secondary)">' + escChat(k) + '</td><td>' + escChat(data1[k] || '-') + '</td><td>' + escChat(data2[k] || '-') + '</td></tr>';
    }
    html += '</table></div></div>';
    return html;
}

function parseChatIntent(text) {
    const lower = text.toLowerCase().trim();
    // Compare detection
    if (chatMode === 'compare' || /\bvs\.?\b|\bversus\b|\bcompare\b/.test(lower)) {
        const parts = lower.replace(/compare\s+/i, '').split(/\s+vs\.?\s+|\s+versus\s+/);
        if (parts.length >= 2) return { intent: 'compare', item1: parts[0].trim(), item2: parts[1].trim() };
    }
    // Explicit mode overrides
    if (chatMode === 'item') return { intent: 'item', query: text.trim() };
    if (chatMode === 'monster') return { intent: 'monster', query: text.trim() };
    if (chatMode === 'drops') return { intent: 'drops', query: text.replace(/\b(drops?|drop\s*table|loot)\b/gi, '').trim() || text.trim() };
    if (chatMode === 'quest') return { intent: 'quest', query: text.trim() };
    if (chatMode === 'price') return { intent: 'price', query: text.trim() };
    // Auto-detect from keywords
    if (/\b(drop\s*table|drops?|loot\s*table)\b/i.test(lower)) return { intent: 'drops', query: lower.replace(/\b(drop\s*table|drops?|loot\s*table|what are|show me|get|from)\b/gi, '').trim() };
    if (/\b(price|ge price|worth|cost|how much)\b/i.test(lower)) return { intent: 'price', query: lower.replace(/\b(price|ge price|worth|cost|how much|is|the|of|a|an|does|whats?|what'?s?)\b/gi, '').trim() };
    if (/\b(quest|requirements|quest guide)\b/i.test(lower)) return { intent: 'quest', query: lower.replace(/\b(quest|requirements|quest guide|what are|for|the|show me|tell me about)\b/gi, '').trim() };
    if (/\b(monster|boss|npc|kill|combat level|hitpoints|hp)\b/i.test(lower)) return { intent: 'monster', query: lower.replace(/\b(monster|boss|npc|kill|info|about|stats|for|the|show me|tell me|what is|what's)\b/gi, '').trim() };
    if (/\b(item|stats|equip|weapon|armou?r|slot|bonus|what is|what's)\b/i.test(lower)) return { intent: 'item', query: lower.replace(/\b(item|stats|equip|weapon|armou?r|info|about|for|the|show me|tell me|what is|what's)\b/gi, '').trim() };
    // Fallback: search
    return { intent: 'search', query: text.trim() };
}

async function wikiApiFetch(params) {
    params.format = 'json';
    params.origin = '*';
    const qs = new URLSearchParams(params).toString();
    const resp = await fetch('https://oldschool.runescape.wiki/api.php?' + qs);
    if (!resp.ok) throw new Error('Wiki API request failed');
    return resp.json();
}

function parseInfobox(wikitext, type) {
    const patterns = {
        item: /\{\{[Ii]nfobox [Ii]tem([\s\S]*?)\n\}\}/,
        monster: /\{\{[Ii]nfobox [Mm]onster([\s\S]*?)\n\}\}/,
        quest: /\{\{[Ii]nfobox [Qq]uest([\s\S]*?)\n\}\}/,
        bonuses: /\{\{[Ii]nfobox [Bb]onuses([\s\S]*?)\n\}\}/
    };
    const regex = patterns[type] || patterns.item;
    const match = wikitext.match(regex);
    if (!match) {
        // Try bonuses as fallback for items
        if (type === 'item') {
            const bm = wikitext.match(patterns.bonuses);
            if (bm) return parseInfoboxText(bm[1]);
        }
        return null;
    }
    return parseInfoboxText(match[1]);
}

function parseInfoboxText(text) {
    const info = {};
    for (const line of text.split('\n')) {
        const trimmed = line.trim();
        if (trimmed.startsWith('|') && trimmed.includes('=')) {
            const parts = trimmed.substring(1).split('=');
            const key = parts[0].trim();
            let val = parts.slice(1).join('=').trim();
            // Clean wiki markup
            val = val.replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2');
            val = val.replace(/\{\{[^}]*\}\}/g, '').trim();
            if (val && key && !key.startsWith('version') && !key.startsWith('image') && !key.startsWith('icon')) {
                info[key] = val;
            }
        }
    }
    return info;
}

async function chatItemLookup(name) {
    const data = await wikiApiFetch({ action: 'parse', page: name, prop: 'wikitext', section: '0' });
    if (data.error) throw new Error('Page not found');
    const wikitext = data.parse?.wikitext?.['*'] || '';
    const info = parseInfobox(wikitext, 'item');
    if (!info || !Object.keys(info).length) {
        // Might have found the page but no infobox, give a summary
        const clean = wikitext.replace(/\{\{[^}]*\}\}/g, '').replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2').replace(/<[^>]+>/g, '').trim();
        const summary = clean.substring(0, 300);
        return '<strong>' + escChat(name) + '</strong><br><br>' + escChat(summary) + (clean.length > 300 ? '...' : '') + '<br><br><em style="color:var(--text-muted);font-size:.75rem">No item infobox found — this may not be an equipment item.</em>';
    }
    const keyStats = ['name','members','tradeable','quest','weight','examine','astab','aslash','acrush','amagic','arange','dstab','dslash','dcrush','dmagic','drange','str','rstr','mdmg','prayer','aspeed','slot'];
    const nice = { astab:'Stab Atk',aslash:'Slash Atk',acrush:'Crush Atk',amagic:'Magic Atk',arange:'Range Atk',dstab:'Stab Def',dslash:'Slash Def',dcrush:'Crush Def',dmagic:'Magic Def',drange:'Range Def',str:'Strength',rstr:'Ranged Str',mdmg:'Magic Dmg',prayer:'Prayer',aspeed:'Atk Speed',slot:'Slot' };
    const rows = [];
    for (const k of keyStats) { if (info[k]) rows.push([nice[k] || k, info[k]]); }
    // Add any remaining keys not already shown
    for (const [k, v] of Object.entries(info)) { if (!keyStats.includes(k) && rows.length < 20) rows.push([k, v]); }
    return chatCard(data.parse.title || name, '🗡️', rows);
}

async function chatMonsterLookup(name) {
    const data = await wikiApiFetch({ action: 'parse', page: name, prop: 'wikitext', section: '0' });
    if (data.error) throw new Error('Page not found');
    const wikitext = data.parse?.wikitext?.['*'] || '';
    const info = parseInfobox(wikitext, 'monster');
    if (!info || !Object.keys(info).length) throw new Error('No monster infobox found for "' + name + '"');
    const keyStats = ['name','combat','hitpoints','att','str','def','mage','range','attbns','strbns','amagic','mbns','arange','rngbns','dstab','dslash','dcrush','dmagic','drange','immunepoison','immunevenom','slaylvl','slayxp','maxhit','aggressive','poisonous'];
    const nice = { combat:'Combat Level',hitpoints:'Hitpoints',att:'Attack',str:'Strength',def:'Defence',mage:'Magic',range:'Ranged',attbns:'Atk Bonus',strbns:'Str Bonus',amagic:'Magic Atk',mbns:'Magic Str',arange:'Range Atk',rngbns:'Range Str',dstab:'Stab Def',dslash:'Slash Def',dcrush:'Crush Def',dmagic:'Magic Def',drange:'Range Def',immunepoison:'Immune Poison',immunevenom:'Immune Venom',slaylvl:'Slayer Lvl',slayxp:'Slayer XP',maxhit:'Max Hit',aggressive:'Aggressive',poisonous:'Poisonous' };
    const rows = [];
    for (const k of keyStats) { if (info[k]) rows.push([nice[k] || k, info[k]]); }
    for (const [k, v] of Object.entries(info)) { if (!keyStats.includes(k) && rows.length < 22) rows.push([k, v]); }
    return chatCard(data.parse.title || name, '👹', rows);
}

async function chatQuestLookup(name) {
    const data = await wikiApiFetch({ action: 'parse', page: name, prop: 'wikitext', section: '0' });
    if (data.error) throw new Error('Page not found');
    const wikitext = data.parse?.wikitext?.['*'] || '';
    const info = parseInfobox(wikitext, 'quest');
    if (!info || !Object.keys(info).length) throw new Error('No quest infobox found for "' + name + '"');
    const rows = Object.entries(info).slice(0, 18);
    return chatCard(data.parse.title || name, '📜', rows);
}

async function chatPriceLookup(name) {
    // Try Module:Exchange for price data
    try {
        const data = await wikiApiFetch({ action: 'parse', page: 'Module:Exchange/' + name, prop: 'wikitext' });
        const wikitext = data.parse?.wikitext?.['*'] || '';
        if (wikitext) {
            const info = {};
            for (const line of wikitext.split('\n')) {
                if (line.includes('=') && !line.trim().startsWith('--')) {
                    const parts = line.split('=');
                    const key = parts[0].trim().replace(/[\[\]'" ]/g, '');
                    const val = parts.slice(1).join('=').trim().replace(/[,']/g, '').trim();
                    if (key && val) info[key] = val;
                }
            }
            const rows = [];
            if (info.itemId) rows.push(['Item ID', info.itemId]);
            if (info.price) rows.push(['Price', Number(info.price).toLocaleString() + ' gp']);
            if (info.last) rows.push(['Last Updated', info.last]);
            if (info.volume) rows.push(['Daily Volume', Number(info.volume).toLocaleString()]);
            if (info.limit) rows.push(['Buy Limit', info.limit]);
            if (rows.length) return chatCard(data.parse.title?.replace('Module:Exchange/', '') || name, '💰', rows);
        }
    } catch(e) {}
    return '<em style="color:var(--text-muted)">No GE price data found for "' + escChat(name) + '". It may not be tradeable.</em>';
}

async function chatDropTable(name) {
    // Get page sections first
    const secData = await wikiApiFetch({ action: 'parse', page: name, prop: 'sections' });
    if (secData.error) throw new Error('Page not found');
    const sections = secData.parse?.sections || [];
    const dropSections = sections.filter(s => /drop/i.test(s.line));
    if (!dropSections.length) throw new Error('No drops section found for "' + name + '"');

    let html = '<div class="chat-card"><div class="chat-card-header">💎 Drops: ' + escChat(secData.parse.title || name) + '</div><div class="chat-card-body" style="max-height:350px;overflow-y:auto;font-size:.75rem">';
    const startIdx = parseInt(dropSections[0].index);
    let fetched = 0;
    for (const s of sections) {
        const idx = parseInt(s.index);
        if (idx >= startIdx && idx <= startIdx + 12 && fetched < 8) {
            fetched++;
            const secResp = await wikiApiFetch({ action: 'parse', page: name, prop: 'wikitext', section: idx });
            const wt = secResp.parse?.wikitext?.['*'] || '';
            if (wt) {
                html += '<div style="margin:6px 0"><strong style="color:var(--accent-gold);font-size:.78rem">' + escChat(s.line) + '</strong>';
                // Parse drop table entries from {{DropsLine}} templates
                const dropLines = wt.matchAll(/\{\{[Dd]rops[Ll]ine\|([^}]*)\}\}/g);
                let items = [];
                for (const dm of dropLines) {
                    const params = {};
                    for (const part of dm[1].split('|')) {
                        const eq = part.indexOf('=');
                        if (eq >= 0) params[part.substring(0, eq).trim().toLowerCase()] = part.substring(eq + 1).trim();
                    }
                    const itemName = params.name || params.item || '';
                    const qty = params.quantity || params.numb || '1';
                    const rarity = params.rarity || '';
                    if (itemName) items.push({ name: itemName, qty, rarity });
                }
                if (items.length) {
                    html += '<table style="width:100%;border-collapse:collapse;margin:4px 0">';
                    for (const it of items) {
                        const rarColor = it.rarity.match(/always/i) ? 'var(--success)' : it.rarity.match(/common/i) ? '#8bc34a' : it.rarity.match(/uncommon/i) ? 'var(--warning)' : it.rarity.match(/rare/i) ? 'var(--danger)' : 'var(--text-muted)';
                        html += '<tr style="border-bottom:1px solid rgba(61,53,45,.4)"><td style="padding:2px 4px;cursor:pointer" onclick="sendChatLookup(\'' + it.name.replace(/'/g, "\\'") + '\')">' + escChat(it.name) + '</td><td style="padding:2px 4px;text-align:center;font-family:\'JetBrains Mono\',monospace;font-size:.7rem">' + escChat(it.qty) + '</td><td style="padding:2px 4px;text-align:right;color:' + rarColor + ';font-size:.7rem">' + escChat(it.rarity) + '</td></tr>';
                    }
                    html += '</table>';
                } else {
                    // Just clean and show text
                    let cleaned = wt.replace(/^=+.*?=+\s*$/gm, '').replace(/\{\{[^}]*\}\}/g, '').replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2').trim();
                    if (cleaned) html += '<div style="color:var(--text-secondary)">' + escChat(cleaned.substring(0, 200)) + '</div>';
                }
                html += '</div>';
            }
        }
    }
    html += '</div></div>';
    return html;
}

async function chatCompareItems(item1, item2) {
    const [d1, d2] = await Promise.all([
        wikiApiFetch({ action: 'parse', page: item1, prop: 'wikitext', section: '0' }),
        wikiApiFetch({ action: 'parse', page: item2, prop: 'wikitext', section: '0' })
    ]);
    if (d1.error) throw new Error('Could not find "' + item1 + '"');
    if (d2.error) throw new Error('Could not find "' + item2 + '"');
    const info1 = parseInfobox(d1.parse?.wikitext?.['*'] || '', 'item') || {};
    const info2 = parseInfobox(d2.parse?.wikitext?.['*'] || '', 'item') || {};
    if (!Object.keys(info1).length && !Object.keys(info2).length) throw new Error('No infobox data found for either item.');
    return chatCompareTable(d1.parse.title || item1, d2.parse.title || item2, info1, info2);
}

async function chatSearchFallback(query) {
    const data = await wikiApiFetch({ action: 'opensearch', search: query, limit: '8' });
    const titles = data[1] || [];
    if (!titles.length) return '<em style="color:var(--text-muted)">No results found for "' + escChat(query) + '".</em>';
    let html = '<strong>Search results:</strong><br>';
    for (const t of titles) {
        html += '<div class="chat-result-item" onclick="sendChatLookup(\'' + t.replace(/'/g, "\\'") + '\')">' + escChat(t) + '</div>';
    }
    html += '<div style="font-size:.7rem;color:var(--text-muted);margin-top:6px">Click a result to look it up, or use a chip to specify lookup type.</div>';
    return html;
}

// Helper: clicking a result in chat triggers a new lookup
function sendChatLookup(name) {
    document.getElementById('chat-input').value = name;
    sendChatMessage();
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    addChatMessage('user', text);
    showChatLoading();

    const intent = parseChatIntent(text);

    try {
        let html = '';
        // Try the detected intent, with search fallback on page-not-found
        if (intent.intent === 'compare') {
            html = await chatCompareItems(intent.item1, intent.item2);
        } else if (intent.intent === 'item') {
            try { html = await chatItemLookup(intent.query); }
            catch(e) { html = await chatSearchFallback(intent.query); }
        } else if (intent.intent === 'monster') {
            try { html = await chatMonsterLookup(intent.query); }
            catch(e) { html = await chatSearchFallback(intent.query); }
        } else if (intent.intent === 'drops') {
            try { html = await chatDropTable(intent.query); }
            catch(e) { html = await chatSearchFallback(intent.query); }
        } else if (intent.intent === 'quest') {
            try { html = await chatQuestLookup(intent.query); }
            catch(e) { html = await chatSearchFallback(intent.query); }
        } else if (intent.intent === 'price') {
            html = await chatPriceLookup(intent.query);
        } else {
            html = await chatSearchFallback(intent.query);
        }

        removeChatLoading();
        chatMessages.push({ role: 'assistant', text: '', html });
        saveChatHistory();
        renderAllChatMessages();
    } catch(e) {
        removeChatLoading();
        addChatMessage('assistant', '', '<em style="color:var(--danger)">Error: ' + escChat(e.message) + '</em><br><div style="font-size:.75rem;color:var(--text-muted);margin-top:4px">Try searching with different terms or use a chip to specify lookup type.</div>');
    }
}

// ============================================================
// SECTION: Tab Management & Event Handlers
// ============================================================
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + '-section').classList.add('active');
    });
});

document.getElementById('lookup-btn').addEventListener('click', lookupPlayer);
document.getElementById('username-input').addEventListener('keypress', e => { if (e.key === 'Enter') lookupPlayer(); });
document.getElementById('bank-search').addEventListener('keypress', e => { if (e.key === 'Enter') searchBank(); });
document.getElementById('wiki-search-input').addEventListener('keypress', e => { if (e.key === 'Enter') wikiSearch(); });
document.getElementById('wiki-search-input').addEventListener('input', wikiSuggest);
document.addEventListener('click', e => { if (!e.target.closest('.wiki-search-bar')) document.getElementById('wiki-suggestions').classList.remove('active'); });
document.getElementById('chat-input').addEventListener('keypress', e => { if (e.key === 'Enter') sendChatMessage(); });

// ============================================================
// SECTION: Initialization
// ============================================================
loadState();
loadChatHistory();
loadWikiHistory();
loadItemMapping();
renderWikiQuickLinks();
renderWikiHistory();
if (state.currentPlayer) {
    document.getElementById('username-input').value = state.currentPlayer.username;
    document.getElementById('game-mode').value = state.currentPlayer.mode;
    renderPlayer(state.currentPlayer);
}
if (state.bankData || state.currentPlayer) renderProgress();
if (state.currentPlayer) { renderQuestGuide(); renderDiaryGuide(); }
if (state.bankData) { renderBIS(); renderBankItems(); renderLoadouts(); renderSlayerTasks(); }

