export class AboutDialog extends FormApplication {
    static MODULE_ID = "";
    static TRANSLATION_KEY = "";
    static TITLE = "";

    #version = 0;

    constructor(object, options) {
        super(object, options);

        this.#version = game.modules.get(AboutDialog.MODULE_ID).version ?? game.modules.get(AboutDialog.MODULE_ID).data.version;
    }

    static get defaultOptions() {
        const defaults = super.defaultOptions;

        const overrides = {
            id: `${AboutDialog.MODULE_ID}AboutDialog`,
            closeOnSubmit: false,
            height: "auto",
            width: 550,
            submitOnChange: true,
            template: `modules/${AboutDialog.MODULE_ID}/module/about/about-dialog.hbs`,
            title: AboutDialog.TITLE,
        };

        return foundry.utils.mergeObject(defaults, overrides);
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

    getData(options) {
        return {
            "created_by": game.i18n.localize(`${AboutDialog.TRANSLATION_KEY}.ABOUT.Created-By`),
            "live_support": game.i18n.localize(`${AboutDialog.TRANSLATION_KEY}.ABOUT.Live-Support`),
            "module_title": game.modules.get(AboutDialog.MODULE_ID).title,
            "project_page": game.i18n.localize(`${AboutDialog.TRANSLATION_KEY}.ABOUT.Project-Page`),
            "support_creator": game.i18n.localize(`${AboutDialog.TRANSLATION_KEY}.ABOUT.Support-Creator`),
            "url": game.modules.get(AboutDialog.MODULE_ID).url,
            "version": this.#version,
            "wiki": game.i18n.localize(`${AboutDialog.TRANSLATION_KEY}.ABOUT.Wiki`)
        };
    }
}