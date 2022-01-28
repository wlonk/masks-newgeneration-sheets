export class MasksCustomResourceDialog extends FormApplication {
    constructor(object, options) {
        super(object, options);

        this.actor = object?.actor;
        this.resourceID = object?.id;

        this.resourceName = "";
        this.resourceType = "tracker";
        this.resourceLimit = 5;
        this.resourceTypes = {
            "tracker": "MASKS-SHEETS.CUSTOM-RESOURCES.Tracker",
            "numeric": "MASKS-SHEETS.CUSTOM-RESOURCES.Numeric",
            "text": "MASKS-SHEETS.CUSTOM-RESOURCES.Text",
            "toggle": "MASKS-SHEETS.CUSTOM-RESOURCES.Toggle"
        }

        if (this.resourceID) {
            this.resourceName = this.actor.data.data.resources.custom[this.resourceID].name;
            this.resourceLimit = this.actor.data.data.resources.custom[this.resourceID].max;
            this.resourceType = this.actor.data.data.resources.custom[this.resourceID].resourceType;
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
            title: game.i18n.localize("MASKS-SHEETS.Create-Custom-Resource")
        };

        return foundry.utils.mergeObject(defaults, overrides);
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

        console.log(this);

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

        this.resourceName = this.resourceName.trim();

        if (!this.actor.data.data.resources.custom) {
            this.actor.data.data.resources.custom = {};
        }

        validName = this.resourceName.length > 0;

        if (!validName) {
            ui.notifications.warn("Custom Resource Name is required.");
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
                    defaultValue = false;
                    break;
                default:
                    defaultValue = 0;
            }
        } else {
            defaultValue = this.actor.data.data.resources.custom[this.resourceID].value;
            let currentSteps = this.actor.data.data.resources.custom[this.resourceID].steps;
            if (this.resourceLimit != currentSteps.length) {
                steps = [];
                for (let i = 0; i < this.resourceLimit; i++) {
                    steps.push(i < currentSteps.length ? currentSteps[i] : false);
                }
            } else {
                steps = this.actor.data.data.resources.custom[this.resourceID].steps;
            }
        }

        let newResource = {
            name: this.resourceName,
            resourceType: this.resourceType,
            max: this.resourceLimit,
            steps: steps,
            value: defaultValue
        }

        this.actor.data.data.resources.custom[customID] = newResource;

        await this.actor.update({ "data.resources.custom": this.actor.data.data.resources.custom });

        this.close();
    }
}