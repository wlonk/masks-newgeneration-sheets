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

    return MasksPbtaSheets.preloadHandlebarTemplates();
});

export class MasksPbtaSheets {
    static MODULEID="masks-newgeneration-sheets";

    static log(force, ...args) {
        const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(REGIONS.ID);

        if (shouldLog) {
            console.log(REGIONS.ID, '|', ...args);
        }
    }

    static async preloadHandlebarTemplates() {
        const templates = [
            'modules/masks-newgeneration-sheets/templates/actor-sheet.hbs',
            'modules/masks-newgeneration-sheets/templates/actor-sheet-limited.hbs',
            'modules/masks-newgeneration-sheets/templates/masks-custom-resource-dialog.hbs',
            'modules/masks-newgeneration-sheets/templates/partials/custom-resource-partial.hbs'
        ];

        return loadTemplates(templates);
    }
}