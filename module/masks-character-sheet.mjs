import { PbtaActorSheet } from "../../../systems/pbta/module/actor/actor-sheet.js";

export class MasksPbtASheet extends PbtaActorSheet {
    get template() {
        //Decision making based on permission level, for now one sheet
        return "modules/masks-newgeneration-unofficial/templates/actor-sheet.hbs";
    }

    static get defaultOptions() {
        let options = {};
        return mergeObject(super.defaultOptions, options);
    }

    async getData() {
        const data = await super.getData();

        return data;
    }
}

Actors.registerSheet("pbta", MasksPbtASheet, {
	types: ["character"],
	makeDefault: true
});