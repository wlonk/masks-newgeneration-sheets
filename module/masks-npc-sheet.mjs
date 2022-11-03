import { PbtaActorNpcSheet } from "../../../systems/pbta/module/actor/actor-npc-sheet.js";
import { PbtaRolls } from "../../../systems/pbta/module/rolls.js";
import { MasksPbtaSheets } from "./masks-sheets.mjs";
import { MasksCustomResourceDialog } from "./masks-custom-resource-dialog.mjs";

export class MasksPbtANPCSheet extends PbtaActorNpcSheet {
    #dataPath = "data.data";
    #shortPath = "data";

    constructor(data, context) {
        super(data, context);

        if (isNewerVersion(MasksPbtaSheets.FOUNDRY_VERSION, "10")) { this.#dataPath = this.#shortPath = "system"; }
    }

    get template() {
        //Decision making based on permission level
        let versionDirectory = isNewerVersion(MasksPbtaSheets.FOUNDRY_VERSION, "10") ? "templates" : "templates/v9";
        let sheetTemplate = `modules/masks-newgeneration-sheets/${versionDirectory}/npc-sheet.hbs`;
        return sheetTemplate;
    }

    static get defaultOptions() {
        let options = {
            classes: ["pbta", "sheet", "actor", "npc", "masks"],
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "moves" }],
            scrollY: [".window-content"],
        };
        return mergeObject(super.defaultOptions, options);
    }

    async getData() {
        const data = await super.getData();

        const actorDataPath = isNewerVersion(MasksPbtaSheets.FOUNDRY_VERSION, "10") ? this.actor[this.#dataPath] : this.actor.data[this.#shortPath];

        data.isObserver = this.actor.permission === CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER;
        data.influences = this.actor.getFlag(MasksPbtaSheets.MODULEID, "influences");
        if (!data.influences && this.isEditable) { this.actor.setFlag(MasksPbtaSheets.MODULEID, "influences", []); data.influences = []; }
        data.customResources = actorDataPath.details.custom;
        data.customConditions = {};

        if (data.customResources) {
            for (let [key, val] of Object.entries(data.customResources)) {
                data.customResources[key].attrName = `${this.#shortPath}.details.custom.${key}`;
                data.customResources[key].attrValue = `${this.#shortPath}.details.custom.${key}.value`;

                if (val.resourceType === "condition") {
                    data.customConditions[key] = {
                        label: val.name,
                        value: val.value,
                        translation: val.name,
                        attrName: `${this.#shortPath}.details.custom.${key}`,
                        attrValue: `${this.#shortPath}.details.custom.${key}.value`
                    };
                }
            }
        }

        //Dynamic localization fields
        for (let key of Object.keys(data[this.#shortPath].attrLeft.conditions.options)) {
            data[this.#shortPath].attrLeft.conditions.options[key].translation = game.i18n.localize(`MASKS-SHEETS.CONDITIONS.${data[this.#shortPath].attrLeft.conditions.options[key].label}`);
        }
        for (let key of Object.keys(data[this.#shortPath].stats)) {
            data[this.#shortPath].stats[key].translation = game.i18n.localize(`MASKS-SHEETS.STATS.${key}`);
        }

        //Add misc items into "Other" category
        let miscItems = this.actor.items.filter(i => i.type !== "npcMove" && i.type !== "equipment");
        if (miscItems) {
            data.moves["PBTA_OTHER"] = data.moves["PBTA_OTHER"].concat(miscItems);
        }

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        if (!this.isEditable) { return; }
        
        html.find('.influence-create').on('click', this._onInfluenceCreate.bind(this));
        html.find('.influence--name').on('change', this._onInfluenceEdit.bind(this));
        html.find('[data-influence-action]').on('click', this._onInfluenceAction.bind(this));
        html.find('.resource-masks').on('click', this._onResourcesClick.bind(this));
        html.find(".custom-control").on('click', this._onCustomResourceAction.bind(this));
    }

    async _onResourcesClick(event) {
        if (!this.isEditable) { return; }
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;
        const attrValue = clickedElement.data().attr;
        const attrMax = attrValue.replace(".value", ".max");
        const max = getProperty(this.actor[this.#shortPath], attrMax);

        let updateValue = getProperty(this.actor[this.#shortPath], attrValue);
        if (action === 'increase') { updateValue++; } else { updateValue--; }

        if (max && max !== 0 && updateValue > max) { updateValue = max; }

        await this.actor.update({[attrValue]: updateValue});
    }

    async _onInfluenceCreate(event) {
        event.preventDefault();
        if (!this.isEditable) { return; }

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
        if (!this.isEditable) { return; }
        let influenceID = $($(event.target).parents("[data-influence-id]")[0]).data().influenceId;
        let influences = this.actor.getFlag(MasksPbtaSheets.MODULEID, "influences");
        let influence = influences.find(i => i.id === influenceID);
        influence.name = event.target.value;

        await this.actor.setFlag(MasksPbtaSheets.MODULEID, "influences", influences);
    }

    async _onInfluenceAction(event) {
        event.preventDefault();
        if (!this.isEditable) { return; }

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
                    img: influenceData.img
                }

                rollData[this.#shortPath] = {
                    name: '',
                    description: influenceData.data.description,
                    img: influenceData.data.img,
                    rollType: ''
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

    async _onCustomResourceAction(event) {
        event.preventDefault();
        if (!this.isEditable) { return; }

        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;
        const id = clickedElement.parents('[data-id]')?.data()?.id;
        let dialog = null;
        const actorDataPath = isNewerVersion(MasksPbtaSheets.FOUNDRY_VERSION, "10") ? this.actor[this.#dataPath] : this.actor.data[this.#shortPath];

        switch (action) {
            case "create":
                dialog = new MasksCustomResourceDialog({actor: this.actor, id: null});
                dialog.render(true);
                break;
            case "edit":
                dialog = new MasksCustomResourceDialog({actor: this.actor, id: id});
                dialog.render(true);
                break;
            case "delete":
                let resourceName = actorDataPath.details.custom[id].name;
                dialog = new Dialog({
                    title: game.i18n.localize("MASKS-SHEETS.DIALOG.Confirm-Delete"),
                    content: `${game.i18n.localize("MASKS-SHEETS.DIALOG.Confirm-Text")} <b>${resourceName}</b>.`,
                    buttons: {
                        yes: {
                            label: game.i18n.localize("MASKS-SHEETS.Confirm"),
                            callback: async (html) => {
                                let propName = `${this.#shortPath}.details.custom.-=${id}`;
                                await this.actor.update({[propName]: null});
                            }
                        },
                        no: {
                            icon: "<i class='fas fa-times'></i>",
                            label: game.i18n.localize("MASKS-SHEETS.Cancel")
                        }
                    },
                    default: "yes"
                }).render(true);
                break;
            default:
                break;
        }
    }
}