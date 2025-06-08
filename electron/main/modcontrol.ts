import {Profile, ModEntry} from "../../types/profile"
import { loadConfig, cfgfolder } from "./config"
import path from 'path'
import fs from 'fs-extra'
import { check } from "../utils"

export function prepareModList(profile: Profile, profileId: string) {
    let modConfig: { [key: string]: ModEntry } = loadConfig(null, "modconfig_"+profileId)
    let mods = profile.minecraft.mods;
    if (mods == null) return null;
    let enabledModList: string[] = [];
    function addMod(mod: ModEntry) {
        if (typeof mod.file == "string") {
            if (!mod.file.startsWith("mods/"))
                enabledModList.push(mod.file.replaceAll("/", path.sep))
        } else if (mod.file instanceof Array) {
            enabledModList.concat(mod.file.filter(value => !value.startsWith("mods/")).map((value) => value.replaceAll("/", path.sep)))
        }
    }
    for (let modName in mods) {
        let mod = mods[modName]
        if (!mod.optional) {
            if (mod.enabled) {
                addMod(mod);
            }
            continue;
        }
        if (modConfig == null) continue;
        let modCfg = modConfig[modName];
        if (modCfg == null) continue;
        if (modCfg.enabled) {
            addMod(mod);
        }
    }
    const modlocation = path.resolve(cfgfolder, ".modlist")
    fs.ensureFileSync(modlocation)
    if (check(modlocation, fs.constants.W_OK)) {
        fs.writeFileSync(modlocation, enabledModList.join("\n"),'utf-8')
    } else console.error("failed to write modlist")
    if (enabledModList.length > 0) return true;
    return false;
}