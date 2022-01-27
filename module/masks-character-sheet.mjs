import { PbtaActorSheet } from "../../../systems/pbta/module/actor/actor-sheet.js";
import { PbtaRolls } from "../../../systems/pbta/module/rolls.js";
import { MasksPbtaSheets } from "./masks-sheets.mjs";
import { MasksCustomResourceDialog } from "./masks-custom-resource-dialog.mjs";

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
        html.find('[data-influence-action]').on('click', this._onInfluenceAction.bind(this));
        html.find('.resource-masks').on('click', this._onResourcesClick.bind(this));
        html.find('.custom-create').on('click', this._onCustomResourceCreate.bind(this));
    }

    async _onResourcesClick(event) {
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;
        const attr = clickedElement.data().attr;

        let updateValue = getProperty(this.actor.data, attr);
        if (action === 'increase') { updateValue++; } else { updateValue--; }

        await this.actor.update({[attr]: updateValue});
    }

    async _onInfluenceCreate(event) {
        event.preventDefault();

        let item = {
            "id": foundry.utils.randomID(),
            "name": "",
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

    async _onInfluenceAction(event) {
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().influenceAction;
        let influenceID = $(clickedElement.parents("[data-influence-id]")[0]).data().influenceId;
        let influences = this.actor.getFlag(MasksPbtaSheets.MODULEID, "influences");
        let influence = influences.find(i => i.id === influenceID);

        if (influence.locked && /lock|roll/.exec(action) === null) {
            return;
        }

        switch (action) {
            case "roll":
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
                break;
            case "hasInfluenceOver":
                influence.hasInfluenceOver = !influence.hasInfluenceOver;
                break;
            case "haveInfluenceOver":
                influence.haveInfluenceOver = !influence.haveInfluenceOver;
                break;
            case "lock":
                influence.locked = !influence.locked;
                break;
            case "delete":
                influences = influences.filter(i => i.id !== influence.id);
                break;
            default:
                break;
        }

        await this.actor.setFlag(MasksPbtaSheets.MODULEID, "influences", influences);
    }

    async _onCustomResourceCreate(event) {
        event.preventDefault();
        
        //Popup for custom resource defintion.  Requires a NAME (unique) and TYPE, which defines how it looks.
        let dialog = new MasksCustomResourceDialog(this.actor);
        dialog.render(true);
    }
}
