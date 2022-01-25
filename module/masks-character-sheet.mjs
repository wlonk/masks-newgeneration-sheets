import { PbtaActorSheet } from "../../../systems/pbta/module/actor/actor-sheet.js";
import { MasksPbtaSheets } from "./masks-sheets.mjs";

export class MasksPbtASheet extends PbtaActorSheet {
    get template() {
        //Decision making based on permission level, for now one sheet
        return "modules/masks-newgeneration-sheets/templates/actor-sheet.hbs";
    }

    static get defaultOptions() {
        let options = {};
        return mergeObject(super.defaultOptions, options);
    }

    async getData() {
        const data = await super.getData();

        data.influences = this.actor.getFlag(MasksPbtaSheets.MODULEID, "influences");
        if (!data.influences) { this.actor.setFlag(MasksPbtaSheets.MODULEID, "influences", []); data.influences = []; }

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.influence-create').on('click', this._onInfluenceCreate.bind(this));
        html.find('.influence--name').on('change', this._onInfluenceEdit.bind(this));
    }

    async _onInfluenceCreate(event) {
        event.preventDefault();

        let item = {
            "id": foundry.utils.randomID(),
            "name": "Person Name",
            "active": true
        }

        let influences = this.actor.getFlag(MasksPbtaSheets.MODULEID, "influences");
        influences.push(item);
        await this.actor.setFlag(MasksPbtaSheets.MODULEID, "influences", influences);
    }

    async _onInfluenceEdit(event) {
        let influenceID = $($(event.target).parents("[data-influence-id]")[0]).data().influenceId;
        let influences = this.actor.getFlag(MasksPbtaSheets.MODULEID, "influences");
        let influence = influences.find(i => i.id === influenceID);
        influence.name = event.target.value;

        console.log(influenceID, event.target.value, influences, influence);

        await this.actor.setFlag(MasksPbtaSheets.MODULEID, "influences", influences);
    }

    async _onInfluenceRoll(event) {
        const pack = game.packs.get("masks-newgeneration-unofficial.moves-revised");
        const desc = (await await pack.getDocument("cKdLivE2qMEVFPXt")).data.data.description;

        console.log(desc);
    }
}
