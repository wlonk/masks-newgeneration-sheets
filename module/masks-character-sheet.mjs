import { PbtaActorSheet } from "../../../systems/pbta/module/actor/actor-sheet.js";
import { PbtaRolls } from "../../../systems/pbta/module/rolls.js";
import { MasksPbtaSheets } from "./masks-sheets.mjs";

export class MasksPbtASheet extends PbtaActorSheet {
    get template() {
        //Decision making based on permission level, for now one sheet
        return "modules/masks-newgeneration-sheets/templates/actor-sheet.hbs";
    }

    static get defaultOptions() {
        let options = {
            classes: ["pbta", "sheet", "actor", "masks"]
        };
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
        html.find('.influence-icon').on('click', this._onInfluenceRoll.bind(this));
    }

    async _onInfluenceCreate(event) {
        event.preventDefault();

        let item = {
            "id": foundry.utils.randomID(),
            "name": "Person Name",
            "hasInfluenceOver": false,
            "haveInfluenceOver": false,
            "locked": false
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

        await this.actor.setFlag(MasksPbtaSheets.MODULEID, "influences", influences);
    }

    async _onInfluenceRoll(event) {
        let influenceID = $($(event.target).parents("[data-influence-id]")[0]).data().influenceId;
        let influences = this.actor.getFlag(MasksPbtaSheets.MODULEID, "influences");
        let influence = influences.find(i => i.id === influenceID);

        const pack = game.packs.get("masks-newgeneration-unofficial.moves-revised");
        const influenceData = (await pack.getDocument("cKdLivE2qMEVFPXt")).data;

        let rollData = {
            name: influenceData.name.replace("?", influence.name),
            type: "move",
            img: influenceData.img,
            data: {
                name: '',
                description: influenceData.data.description,
                img: influenceData.data.img,
                rollType: ''
            }
        }

        //create chat message
        PbtaRolls.rollMove({actor: this.actor, data: rollData});

        influence.active = false;
        await this.actor.setFlag(MasksPbtaSheets.MODULEID, "influences", influences);
    }
}
