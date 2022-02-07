import { MasksPbtASheet } from "./masks-character-sheet.mjs";
import { MasksPbtANPCSheet} from "./masks-npc-sheet.mjs";

/*Enable Debug Module */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MasksPbtaSheets.MODULEID);
});

Hooks.once("init", () => {
    Actors.registerSheet("pbta", MasksPbtASheet, {
        types: ["character"],
        makeDefault: true
    });
    Actors.registerSheet("pbta", MasksPbtANPCSheet, {
        types: ["npc"],
        makeDefault: true
    })

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

    static masksNumberFormat(dataObj, dataLocation, options) {
        const dec = options.hash['decimals'] ?? 0;
        const sign = options.hash['sign'] || false;
        value = parseFloat(dataObj[dataLocation]).toFixed(dec);
        if (sign ) return ( value >= 0 ) ? "+"+value : value;
        return value;
      }
}