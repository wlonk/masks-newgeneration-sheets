import { MasksPbtASheet } from "./masks-character-sheet.mjs";

/*Enable Debug Module */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MasksPbtaSheets.MODULEID);
});

Hooks.once("init", () => {
    Actors.registerSheet("pbta", MasksPbtASheet, {
        types: ["character"],
        makeDefault: true
    });
});

export class MasksPbtaSheets {
    static MODULEID="masks-newgeneration-sheets";
}