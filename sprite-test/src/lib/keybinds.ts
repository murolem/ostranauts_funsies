// todo: split into keybind key (set of values from mapping below) and event key (can be anything (?))
export type HotkeyKey = keyof typeof keyToKeyCodeMap;
export type HotkeyKeyCode = number;
export type HotkeyAction = (keys: string[], keyCodes: HotkeyKeyCode[]) => void;

/** 
 * Maps keys (characters) to key codes (codes corresponding to keys on a keyboard). 
 * One keyboard key can map to many different characters (lowercase, uppercase; different languages).
 * So to make that key trigger a keybind (say "B"), we need to listen to that key code instead of that key.
 * 
 * This mapping is just that - it maps numbers, english chars and some more to keycodes under these keys.
 * */
const keyToKeyCodeMap = {
    "Tab": 9,
    "Clear": 12,
    "Shift": 16,
    "Control": 17,
    "AltGraph": 18,
    "Alt": 18,
    "CapsLock": 20,
    "Escape": 27,
    "PageUp": 33,
    "PageDown": 34,
    "End": 35,
    "Home": 36,
    "ArrowLeft": 37,
    "ArrowUp": 38,
    "ArrowRight": 39,
    "ArrowDown": 40,
    "Insert": 45,
    "Delete": 46,
    "0": 48,
    "=": 48,
    "1": 49,
    "!": 49,
    "2": 50,
    "\"": 50,
    "3": 51,
    "§": 51,
    "4": 52,
    "$": 52,
    "5": 53,
    "%": 53,
    "6": 54,
    "&": 54,
    "7": 55,
    "/": 55,
    "8": 56,
    "(": 56,
    "9": 57,
    ")": 57,
    "a": 65,
    "A": 65,
    "b": 66,
    "B": 66,
    "c": 67,
    "C": 67,
    "d": 68,
    "D": 68,
    "e": 69,
    "E": 69,
    "f": 70,
    "F": 70,
    "g": 71,
    "G": 71,
    "h": 72,
    "H": 72,
    "i": 73,
    "I": 73,
    "j": 74,
    "J": 74,
    "k": 75,
    "K": 75,
    "l": 76,
    "L": 76,
    "m": 77,
    "M": 77,
    "n": 78,
    "N": 78,
    "o": 79,
    "O": 79,
    "p": 80,
    "P": 80,
    "Q": 81,
    "r": 82,
    "R": 82,
    "s": 83,
    "S": 83,
    "t": 84,
    "T": 84,
    "u": 85,
    "U": 85,
    "v": 86,
    "V": 86,
    "w": 87,
    "W": 87,
    "x": 88,
    "X": 88,
    "y": 89,
    "Y": 89,
    "z": 90,
    "Z": 90,
    "Meta": 92,
    "F1": 112,
    "F2": 113,
    "Ü": 186,
    "+": 187,
    "*": 187,
    ",": 188,
    ";": 188,
    "-": 189,
    "_": 189,
    ".": 190,
    ":": 190,
    "#": 191,
    "'": 191,
    "Ö": 192,
    "?": 219,
    "°": 220,
    "Ä": 222
} satisfies Record<string, number>;

const keybinds: {
    keys: HotkeyKey[],
    keyCodes: HotkeyKeyCode[],
    action: HotkeyAction
}[] = [];

const downKeys: {
    key: string,
    keyCode: HotkeyKeyCode
}[] = [];

function lookupKeycode(key: HotkeyKey): HotkeyKeyCode {
    return keyToKeyCodeMap[key];
}

window.addEventListener('keyup', e => {
    // mark key is up
    const matchingDownKeyIndex = downKeys.findIndex(entry => entry.keyCode === e.keyCode);
    if (matchingDownKeyIndex !== -1)
        downKeys.splice(matchingDownKeyIndex, 1);
})

window.addEventListener('keydown', e => {
    // mark key is down
    const matchingDownKeyIndex = downKeys.findIndex(entry => entry.keyCode === e.keyCode);
    if (matchingDownKeyIndex === -1)
        downKeys.push({
            key: e.key,
            keyCode: e.keyCode
        });

    // check for keybinds
    // todo: support multiple keys at once
    const matchingKeybind = keybinds.find(kb => kb.keyCodes.includes(e.keyCode))
    if (matchingKeybind)
        matchingKeybind.action([e.key], [e.keyCode]);
});

// ==============

// todo: support multiple keys at once
export function registerKeybind(key: HotkeyKey, action: HotkeyAction): void {
    keybinds.push({
        keys: [key],
        keyCodes: [key].map(lookupKeycode),
        action
    });
}
