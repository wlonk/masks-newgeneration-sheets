export class MasksCustomResourceDialog extends FormApplication {
    constructor (object, options) {
        super(object, options);

        this.actor = object;
        this.resourceName = "";
        this.resourceType = "tracker";
        this.resourceLimit = 5;
        this.showResourceLimit = true;
        this.resourceTypes = {
            "tracker": "MASKS-SHEETS.CUSTOM-RESOURCES.Tracker",
            "numeric": "MASKS-SHEETS.CUSTOM-RESOURCES.Numeric",
            "text": "MASKS-SHEETS.CUSTOM-RESOURCES.Text",
            "toggle": "MASKS-SHEETS.CUSTOM-RESOURCES.Toggle"
        }
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
            showResourceLimit: this.showResourceLimit
        }
    }

    async _updateObject(event, formData) {
        this.resourceName = formData["custom-resource-name"];
        this.resourceType = formData["custom-resource-type"];
        this.resourceLimit = formData["custom-resource-limit"];

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

        this.resourceName = this.resourceName.trim();

        if (!this.actor.data.data.resources.custom) {
            this.actor.data.data.resources.custom = {};
        }

        let existingResource = Object.keys(this.actor.data.data.resources.custom);

        validName = (this.resourceName.length > 0 && !existingResource.find(c => c === this.resourceName));

        if (!validName) {
            ui.notifications.warn("Custom Resource Name is required and must be unique.");
            return;
        }

        let defaultValue = null;
        let steps = null;

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

        let newResource = {
            name: this.resourceName,
            resourceType: this.resourceType,
            max: this.resourceLimit,
            steps: steps,
            value: defaultValue
        }

        this.actor.data.data.resources.custom[foundry.utils.randomID()] = newResource;

        await this.actor.update({"data.resources.custom": this.actor.data.data.resources.custom});

        this.close();
    }
}