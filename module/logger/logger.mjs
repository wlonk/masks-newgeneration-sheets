export class Logger {
    static MODULE_ID = null;

    static LOG_LEVEL = {
        Debug: 0,
        Log: 1,
        Info: 2,
        Warn: 3,
        Error: 4
    }

    static log(force, logLevel, ...args) {
        const shouldLog = force || game.modules.get('_dev-mode')?.api?.getPackageDebugValue(Logger.MODULE_ID);

        if (shouldLog) {
            switch (logLevel) {
                case Logger.LOG_LEVEL.Error:
                    console.error(Logger.MODULE_ID, '|', ...args);
                    break;
                case Logger.LOG_LEVEL.Warn:
                    console.warn(Logger.MODULE_ID, '|', ...args);
                    break;
                case Logger.LOG_LEVEL.Info:
                    console.info(Logger.MODULE_ID, '|', ...args);
                    break;
                case Logger.LOG_LEVEL.Debug:
                default:
                    console.debug(Logger.MODULE_ID, '|', ...args);
                    break;
            }
        }
    }

    static error(...args) {
        if (ui.notifications) { ui.notifications.error(args[0]); }
        Logger.log(true, Logger.LOG_LEVEL.Error, ...args);
    }

    static warn(...args) {
        if (ui.notifications) { ui.notifications.warn(args[0]); }
        Logger.log(true, Logger.LOG_LEVEL.Warn, ...args);
    }

    static info(...args) {
        if (ui.notifications) { ui.notifications.info(args[0]); }
        Logger.log(true, Logger.LOG_LEVEL.Info, ...args);
    }

    static debug(...args) {
        Logger.log(false, Logger.LOG_LEVEL.Debug, ...args);
    }
}