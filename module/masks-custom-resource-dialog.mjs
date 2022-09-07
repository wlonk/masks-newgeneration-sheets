import { MasksPbtaSheets } from "./masks-sheets.mjs";

export class MasksCustomResourceDialog extends FormApplication {
    #dataPath = "data.data";
    #shortPath = "data";

    constructor(object, options) {
        super(object, options);

        if (isNewerVersion(MasksPbtaSheets.FOUNDRY_VERSION, "10")) { this.#dataPath = this.#shortPath = "system"; }

        this.actor = object?.actor;
        this.resourceID = object?.id;

        this.resourceName = "";
        this.resourceType = "tracker";
        this.resourceLimit = 5;
        this.resourceTypes = {
            "tracker": "MASKS-SHEETS.CUSTOM-RESOURCES.Tracker",
            "numeric": "MASKS-SHEETS.CUSTOM-RESOURCES.Numeric",
            "text": "MASKS-SHEETS.CUSTOM-RESOURCES.Text",
            "toggle": "MASKS-SHEETS.CUSTOM-RESOURCES.Toggle",
            "condition": "MASKS-SHEETS.CUSTOM-RESOURCES.Condition"
        }

        if (this.actor?.type !== 'npc') {
            this.resourceTypes["stat"] = "MASKS-SHEETS.CUSTOM-RESOURCES.Stat";
        }

        if (this.resourceID) {
            this.resourceName = this.actor[this.#dataPath].resources.custom[this.resourceID].name;
            this.resourceLimit = this.actor[this.#dataPath].resources.custom[this.resourceID].max;
            this.resourceType = this.actor[this.#dataPath].resources.custom[this.resourceID].resourceType;
        }

        this.showResourceLimit = (this.resourceType === "tracker" || this.resourceType === "numeric");
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;

        const overrides = {
            closeOnSubmit: false,
            height: "auto",
            width: 350,
            id: 'masksCustomResourceDialog',
            submitOnChange: true,
            template: 'modules/masks-newgeneration-sheets/templates/masks-custom-resource-dialog.hbs',
        };

        return foundry.utils.mergeObject(defaults, overrides);
    }

    get title() {
        if (this.resourceID) {
            return game.i18n.localize("MASKS-SHEETS.Edit-Custom-Resource");
        }

        return game.i18n.localize("MASKS-SHEETS.Create-Custom-Resource");
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.on('click', '[data-action]', this._handleButtonClick.bind(this));
    }

    getData(options) {
        return {
            resourceName: this.resourceName,
            resourceTypes: this.resourceTypes,
            resourceLimit: this.resourceLimit,
            resourceType: this.resourceType,
            showResourceLimit: this.showResourceLimit,
            disabled: this.resourceID !== null
        }
    }

    async _updateObject(event, formData) {
        if (formData["custom-resource-name"]) { this.resourceName = formData["custom-resource-name"]; }
        if (formData["custom-resource-type"]) { this.resourceType = formData["custom-resource-type"]; }
        if (formData["custom-resource-limit"]) { this.resourceLimit = formData["custom-resource-limit"]; }

        if (this.resourceType === "tracker" && this.resourceLimit === 0) {
            this.resourceLimit = 5;
        }

        this.showResourceLimit = (this.resourceType === "tracker" || this.resourceType === "numeric");

        this.render(false);
    }

    async _handleButtonClick(event) {
        const clickedElement = $(event.currentTarget);
        const action = clickedElement.data().action;

        switch (action) {
            case "cancel":
                this.close();
                break;
            case "submit":
                this.validateSubmission();
                break;
            default:
                break;
        }
    }

    async validateSubmission() {
        let validName = false;
        let validLimit = true;

        this.resourceName = this.resourceName.trim();

        let custom = {};
        if (this.actor.type === "npc") {
            if (!this.actor[this.#dataPath].details.custom) {
                this.actor[this.#dataPath].details.custom = {};
            }

            custom = this.actor[this.#dataPath].details.custom;
        } else {
            if (!this.actor[this.#dataPath].resources.custom) {
                this.actor[this.#dataPath].resources.custom = {};
            }

            custom = this.actor[this.#dataPath].resources.custom;
        }

        validName = this.resourceName.length > 0;

        if (!validName) {
            ui.notifications.warn(game.i18n.localize("MASKS-SHEETS.WARNINGS.Invalid-Name"));
            return;
        }

        if (this.resourceType === "numeric" || this.resourceType === "tracker") {
            if (this.resourceLimit < 0) { validLimit = false; }
            if (this.resourceType == "tracker" && this.resourceLimit < 2) { validLimit = false; }
        }

        if (!validLimit) {
            ui.notifications.warn(game.i18n.localize("MASKS-SHEETS.WARNINGS.Invalid-Limit"));
            return;
        }

        let defaultValue = null;
        let steps = null;
        let customID = this.resourceID ?? foundry.utils.randomID();

        if (!this.resourceID) {
            switch (this.resourceType) {
                case "tracker":
                    defaultValue = 0;
                    steps = [];
                    for (let i = 0; i < this.resourceLimit; i++) { steps.push(false); }
                    break;
                case "text":
                    defaultValue = "";
                    break;
                case "toggle":
                case "condition":
                    defaultValue = false;
                    break;
                default:
                    defaultValue = 0;
            }
        } else {
            defaultValue = custom[this.resourceID].value;
            let currentSteps = custom[this.resourceID].steps;
            if (this.resourceLimit != currentSteps.length) {
                steps = [];
                for (let i = 0; i < this.resourceLimit; i++) {
                    steps.push(i < currentSteps.length ? currentSteps[i] : false);
                }
            } else {
                steps = custom[this.resourceID].steps;
            }
        }

        let newResource = {
            name: this.resourceName,
            resourceType: this.resourceType,
            max: this.resourceLimit,
            steps: steps,
            value: defaultValue,
            secondaryValue: false
        }

        custom[customID] = newResource;

        let update = {};
 
        if (this.actor.type === "npc") {
            update[`${this.#shortPath}.details.custom`] = custom;
        } else {
            update[`${this.#shortPath}.resources.custom`] = custom;
        }

        await this.actor.update(update);

        this.close();
    }
}