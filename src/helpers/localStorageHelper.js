import fs from 'fs';
import { generateId } from './generateId.js';

const namePath = "agent.name";
const idPath = "agent.guid";

export function loadName(name = null){
    try {
        return fs.readFileSync(namePath, "utf8")
    } catch (error) {
        if(name == null)
            name = generateId()

        fs.writeFileSync(namePath, name, "utf8")

        return name
    }
}

export function loadGuid(guid = null){
    try {
        return fs.readFileSync(idPath, "utf8")
    } catch (error) {
        if(guid == null)
            return null

        fs.writeFileSync(idPath, guid, "utf8")

        return guid
    }
}