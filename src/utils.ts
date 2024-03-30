export async function asyncForEach(array: Array<any>, callback:(v:any, i:number, arr:any[]) => Promise<any>) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

export async function asyncForEachParallel(array: Array<any>, callback:(v:any, i:number, arr:any[]) => Promise<any>) {
    const funcs = []
    for (let index = 0; index < array.length; index++) {
        funcs.push(callback(array[index], index, array));
    }
    return Promise.allSettled(funcs)
}