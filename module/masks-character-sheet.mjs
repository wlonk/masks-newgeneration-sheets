import { PbtaActorSheet } from "../../../systems/pbta/module/actor/actor-sheet.js";
import { PbtaRolls } from "../../../systems/pbta/module/rolls.js";
import { MasksPbtaSheets } from "./masks-sheets.mjs";
import { MasksCustomResourceDialog } from "./masks-custom-resource-dialog.mjs";

export class MasksPbtASheet extends PbtaActorSheet {
    constructor(data, context) {
        super(data, context);

        this.labelShiftDown = "none";
        this.labelShiftUp = "none";
    }

    get template() {
        //Decision making based on permission level
        let sheetTemplate = "modules/masks-newgeneration-sheets/templates/actor-sheet.hbs";
        if (!this.isOwner && !this.isEditable) {
            //observer, or limited?
            if (this.actor.permission === CONST.DOCUMENT_PERMISSION_LEVELS.LIMITED) {
                sheetTemplate = "modules/masks-newgeneration-sheets/templates/actor-sheet-limited.hbs";
            }
        }
        return sheetTemplate;
    }

    static get defaultOptions() {
        let options = {
            classes: ["pbta", "sheet", "actor", "masks"]
        };
        return mergeObject(super.defaultOptions, options);
    }

    async getData() {
        const data = await super.getData();

        data.isObserver = this.actor.permission === CONST.DOCUMENT_PERMISSION_LEVELS.OBSERVER;
        data.influences = this.actor.getFlag(MasksPbtaSheets.MODULEID, "influences");
        if (!data.influences) { this.actor.setFlag(MasksPbtaSheets.MODULEID, "influences", []); data.influences = []; }
        data.customResources = this.actor.data.data.resources.custom;
        if (data.customResources) {
            for (let [key, val] of Object.entries(data.customResources)) {
                data.customResources[key].attrName = `data.resources.custom.${key}`;
                data.customResources[key].attrValue = `data.resources.custom.${key}.value`;
            }
        }
        data.labelShiftDown = this.labelShiftDown;
        data.labelShiftUp = this.labelShiftUp;

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.find('.influence-create').on('click', this._onInfluenceCreate.bind(this));
        html.find('.influence--name').on('change', this._onInfluenceEdit.bind(this));
        html.find('[data-influence-action]').on('click', this._onInfluenceAction.bind(this));
        html.find('.resource-masks').on('click', this._onResourcesClick.bind(this));
        html.find(".custom-control").on('click', this._onCustomResourceAction.bind(this));
        html.find('.masks-shift').on('change', this._onLabelShiftChange.bind(this));
        html.find('.masks-shift-roll').on('click', this._onLabelShiftClick.bind(this));
    }

    async _onResourcesClick(event) {
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;
        const attrValue = clickedElement.data().attr;
        const attrMax = attrValue.replace(".value", ".max");
        const max = getProperty(this.actor.data, attrMax);

        let updateValue = getProperty(this.actor.data, attrValue);
        if (action === 'increase') { updateValue++; } else { updateValue--; }

        if (max && max !== 0 && updateValue > max) { updateValue = max; }

        await this.actor.update({[attrValue]: updateValue});
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

    async _onCustomResourceAction(event) {
        event.preventDefault();

        if (!this.isEditable) { return; }

        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;
        const id = clickedElement.parents('[data-id]')?.data()?.id;
        let dialog = null;

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
                let resourceName = this.actor.data.data.resources.custom[id].name;
                dialog = new Dialog({
                    title: game.i18n.localize("MASKS-SHEETS.DIALOG.Confirm-Delete"),
                    content: `${game.i18n.localize("MASKS-SHEETS.DIALOG.Confirm-Text")} <b>${resourceName}</b>.`,
                    buttons: {
                        yes: {
                            label: game.i18n.localize("MASKS-SHEETS.Confirm"),
                            callback: async (html) => {
                                let propName = `data.resources.custom.-=${id}`;
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

    async _onLabelShiftChange(event) {
        event.preventDefault();

        if (!this.isEditable) { return; }

        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;
        
        switch (action) {
            case "shift-down":
                this.labelShiftDown = clickedElement.val();
                break;
            case "shift-up":
                this.labelShiftUp = clickedElement.val();
                break;
            default:
                break;
        }
    }

    async _onLabelShiftClick(event) {
        event.preventDefault();

        let statUp = this.actor.data.data.stats[this.labelShiftUp];
        let statDown = this.actor.data.data.stats[this.labelShiftDown];
        if (!statUp && !statDown) { return; }
        let statUpdate = {};
        let performShift = true;

        let content = `<h2 class="cell__title">${this.actor.name} ${game.i18n.localize('MASKS-SHEETS.Label-Shifts')}</h2>`;
        if (statUp) {
            content += `<b style="color: darkred">${statUp.label} ${game.i18n.localize('MASKS-SHEETS.Shifts-Up')}</b><br/>`;
            statUp.value++;

            statUpdate[`data.stats.${this.labelShiftUp}.value`] = statUp.value;
        }
        if (statDown) {
            content += `<b style="color: red">${statDown.label} ${game.i18n.localize('MASKS-SHEETS.Shifts-Down')}</b>`;
            statDown.value--;

            statUpdate[`data.stats.${this.labelShiftDown}.value`] = statDown.value;
        }

        if (statUp?.value > 3 || statDown?.value < -3) {
            performShift = false;
            if (statUp) { statUp.value--; }
            if (statDown) { statDown.value++; }
            content = `<h2 class="cell__title">${this.actor.name} ${game.i18n.localize('MASKS-SHEETS.Label-Shifts')}</h2><p>${game.i18n.localize('MASKS-SHEETS.Label-Shift-Failed')}</p>`;
        }

        await ChatMessage.create({
            author: game.userId,
            content: content,
            speaker: ChatMessage.getSpeaker({actor: this.actor}),
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });

        this.labelShiftUp = this.labelShiftDown = 'none';
        if (performShift) { await this.actor.update(statUpdate); } else { this.render(false); }
    }
}
