export interface Profile {
    /**
     * This is main file for setting up a instance for Starlight Launcher. It should have
     * notation how and what to launch, like minecraft version and so on. Keep in mind it is
     * public information and in theory anyone can acces this file.
     */
    minecraft: InstanceSettings;
    [property: string]: any;
}

/**
 * This is main file for setting up a instance for Starlight Launcher. It should have
 * notation how and what to launch, like minecraft version and so on. Keep in mind it is
 * public information and in theory anyone can acces this file.
 */
export interface InstanceSettings {
    /**
     * I think there's some arguments that necessary to launch the game on certain platforms,
     * see defaultProfile and change it your own risk.
     */
    arguments: CustomLaunchArguments;
    assets:    string;
    /**
     * A list of minecraft libraries including client. You can just write `libraries` and it
     * will scan entire folder though i can't recomend this as some minecraft libraries are OS
     * dependent and you need to enforce rules for it.
     */
    classpath: Array<ElementWithARule | string>;
    /**
     * launcher will always check files in this folder and delete any extra file (e.g. for
     * security reasons or auto remove old files)
     */
    forceCheck?: string[];
    /**
     * Should be set up as in server config. E.G. Java17
     */
    java: string;
    /**
     * A class to launch minecraft with. Also you will need to make sure you use modloader class
     * and not vanilla. check https://wiki.vg/Launching_the_game#Main_class for more info
     */
    mainclass: any;
    /**
     * A list of mods. Use the fancy name of mod as a key
     */
    mods?: { [key: string]: ModEntry };
    /**
     * This is used to launch minecraft from updates folder.
     *
     * e.g. if we have `name: 1.12.2` launcher will try to launch a minecraft from folder
     * `updates/1.12.2`
     */
    name: string;
    /**
     * launcher will not check this folder when redownloading
     */
    skipCheck?: string[];
    /**
     * A fancy looking name that may be drawn in launcher
     */
    title?: string;
    /**
     * Minecraft version to launch. I don't know what will hapen if you misconfigure it.
     */
    version: string;
    [property: string]: any;
}

/**
 * I think there's some arguments that necessary to launch the game on certain platforms,
 * see defaultProfile and change it your own risk.
 */
export interface CustomLaunchArguments {
    /**
     * I'm not entirely sure why would you add something here.
     */
    client?: Array<ElementWithARule | string>;
    /**
     * Where the magic really happen. You may use rule syntax or plain string. Keep in mind
     * description of `arguments` object
     */
    jvm?: Array<ElementWithARule | string>;
    [property: string]: any;
}

export interface ElementWithARule {
    rules?: Rule[];
    [property: string]: any;
}

export interface Rule {
    action:     Action;
    conditions: Conditions;
    [property: string]: any;
}

export enum Action {
    Disable = "disable",
    Enable = "enable",
}

export interface Conditions {
    arch?:    string;
    os?:      string;
    version?: string;
    [property: string]: any;
}

/**
 * A mod that will be added to minecraft instance. It will be configurable in menu if
 * specified.
 */
export interface ModEntry {
    /**
     * Name of the parent mod(s). When enabling a mod every mod it conflicts with should be
     * disabled or a user should no be able to save.
     */
    conflictsWith?: string[] | string;
    /**
     * Name of the parent mod(s)
     */
    dependsOn?: string[] | string;
    /**
     * Optional.
     * Will be seen in Mod configuration screen. Supports Markdown
     */
    description?: string;
    /**
     * Whether mod enabled or disabled by default
     */
    enabled?: boolean;
    /**
     * Path to mod file. If not begins with mods/ then it can be made optional and will be
     * passed in --fabric.addMods argument. (FIXME: is anything like this possible in forge?)
     */
    file?: string[] | string;
    /**
     * [EXPEREMENTAL] Make look of your mod list fancier with indentations (Mainly for visualy
     * marking dependecies)
     */
    indent?: number;
    /**
     * Whether user can disable this mod or not
     */
    optional?: boolean;
    rules?:    Rule[];
    /**
     * Whether user can see this mod on configuration screen or not. Obviously optional will be
     * ignored
     */
    visible?: boolean;
    [property: string]: any;
}
