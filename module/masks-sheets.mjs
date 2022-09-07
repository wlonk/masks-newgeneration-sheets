import { MasksPbtASheet } from "./masks-character-sheet.mjs";
import { MasksPbtANPCSheet} from "./masks-npc-sheet.mjs";
import { Logger } from "./logger/logger.mjs";
import { AboutDialog } from "./about/about-dialog.mjs";

/*Enable Debug Module */
Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(MasksPbtaSheets.MODULEID);
});

Hooks.once("init", () => {
    /* Setup Logger and About Dialog */
    Logger.MODULE_ID = AboutDialog.MODULE_ID = MasksPbtaSheets.MODULEID;
    AboutDialog.TRANSLATION_KEY = "MASKS-SHEETS";
    
    AboutDialog.TITLE = game.i18n.localize("MASKS-SHEETS.ABOUT.Title");
    MasksPbtaSheets.FOUNDRY_VERSION = game.version ?? game.data.version;

    Actors.registerSheet("pbta", MasksPbtASheet, {
        types: ["character"],
        makeDefault: true
    });
    Actors.registerSheet("pbta", MasksPbtANPCSheet, {
        types: ["npc"],
        makeDefault: true
    });

    game.settings.registerMenu("masks-newgeneration-sheets", "about-dialog", {
        name: game.i18n.localize("MASKS-SHEETS.ABOUT.About"),
        label: game.i18n.localize("MASKS-SHEETS.ABOUT.Title"),
        restricted: false,
        icon: 'fas fa-wrench',
        type: AboutDialog
    });

    return MasksPbtaSheets.preloadHandlebarTemplates();
});

export class MasksPbtaSheets {
    static MODULEID="masks-newgeneration-sheets";
    static FOUNDRY_VERSION = 0;

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