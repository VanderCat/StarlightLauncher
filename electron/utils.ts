import fs from 'fs-extra'

export async function asyncForEach(array: Array<any>, callback:(v:any, i:number, arr:any[]) => Promise<any>) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

export function check(path:string, type:number) {
    let passed = false
    try {
        fs.accessSync(path, type);
        passed = true
    } 
    finally {
        return passed
    }
}